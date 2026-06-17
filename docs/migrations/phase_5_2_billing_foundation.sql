-- ==============================================================================
-- FASE 5.2B - BILLING FOUNDATION (AETERNUM ATLAS)
-- Data: 2026-06-17
-- Objetivo: Arquitetura Financeira B2B (Soft Block, True-Up, Snapshots)
-- ==============================================================================

-- 1. SUBSCRIPTION PLANS
-- Catálogo de pacotes e preços atemporais
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL, -- Starter, Professional, Enterprise
  price_per_seat decimal(10, 2) NOT NULL, -- Ex: 65.00
  tier_code varchar(50) UNIQUE NOT NULL, -- starter, pro, enterprise
  features jsonb DEFAULT '{}'::jsonb, -- Configurações de UI base
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. INSTITUTION SUBSCRIPTIONS
-- Vínculo matriz que atesta a "Conta" da faculdade.
CREATE TABLE IF NOT EXISTS institution_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  status varchar(50) DEFAULT 'active', -- active, past_due, canceled, suspended
  billing_cycle varchar(20) DEFAULT 'monthly', -- monthly, annual
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  licensed_students_count integer NOT NULL DEFAULT 0, -- Cota base assinada
  stripe_customer_id varchar(255),
  stripe_subscription_id varchar(255),
  asaas_customer_id varchar(255),
  asaas_subscription_id varchar(255),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criação de índice para otimizar busca de validação diária
CREATE INDEX IF NOT EXISTS idx_inst_subscriptions_status ON institution_subscriptions(institution_id, status);

-- 3. BILLING CYCLES
-- Cada ciclo vigente gera 1 registro. Usado para agrupar True-ups
CREATE TABLE IF NOT EXISTS billing_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES institution_subscriptions(id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status varchar(50) DEFAULT 'open', -- open, closed (fechado gera fatura)
  created_at timestamptz DEFAULT now()
);

-- 4. INVOICES
-- A Fatura ou Boleto físico a ser pago
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES institution_subscriptions(id),
  billing_cycle_id uuid REFERENCES billing_cycles(id),
  amount_due decimal(10, 2) NOT NULL,
  amount_paid decimal(10, 2) DEFAULT 0.00,
  status varchar(50) DEFAULT 'draft', -- draft, open, paid, uncollectible, void
  due_date timestamptz NOT NULL,
  paid_at timestamptz,
  invoice_url text, -- Link direto para visualização do PDF no Stripe/Asaas
  stripe_invoice_id varchar(255),
  asaas_invoice_id varchar(255),
  created_at timestamptz DEFAULT now()
);

-- 5. INVOICE ITEMS
-- Itens granulares da fatura (Ex: Licença Base + Licença Excedente)
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price decimal(10, 2) NOT NULL,
  total_price decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 6. BILLING SNAPSHOTS
-- Fotografia gerada na virada do ciclo para auditoria de ROI
CREATE TABLE IF NOT EXISTS billing_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  billing_cycle_id uuid REFERENCES billing_cycles(id),
  snapshot_date timestamptz DEFAULT now(),
  licensed_students_count integer NOT NULL,
  active_students_count integer NOT NULL,
  total_hours_studied decimal(10, 2),
  total_invoice_amount decimal(10, 2),
  created_at timestamptz DEFAULT now()
);

-- 7. LICENSE USAGE
-- Medidor diário para disparar os alertas de Soft Block
CREATE TABLE IF NOT EXISTS license_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  record_date date DEFAULT current_date,
  students_registered integer NOT NULL,
  licensed_quota integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 8. FEATURE FLAGS
-- Liberação cirúrgica de recursos B2B por faculdade
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid REFERENCES institutions(id) ON DELETE CASCADE,
  has_roi_dashboard boolean DEFAULT false,
  has_heatmap boolean DEFAULT false,
  has_api_access boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) E BLINDAGEM B2B
-- ==============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- POLICIES: subscription_plans (Catálogo)
-- ------------------------------------------------------------------------------
-- Super Admin e Institution Admin podem ver. (Leitura pública autenticada)
CREATE POLICY "SuperAdmin_ALL_SubscriptionPlans" ON subscription_plans
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_SubscriptionPlans" ON subscription_plans
FOR SELECT USING (auth.jwt()->>'role' = 'institution_admin');

-- ------------------------------------------------------------------------------
-- POLICIES: institution_subscriptions
-- ------------------------------------------------------------------------------
CREATE POLICY "SuperAdmin_ALL_InstitutionSubscriptions" ON institution_subscriptions
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_InstitutionSubscriptions" ON institution_subscriptions
FOR SELECT USING (
  auth.jwt()->>'role' = 'institution_admin' AND 
  institution_id = (auth.jwt()->>'institution_id')::uuid
);

-- ------------------------------------------------------------------------------
-- POLICIES: billing_cycles
-- ------------------------------------------------------------------------------
CREATE POLICY "SuperAdmin_ALL_BillingCycles" ON billing_cycles
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_BillingCycles" ON billing_cycles
FOR SELECT USING (
  auth.jwt()->>'role' = 'institution_admin' AND 
  subscription_id IN (
    SELECT id FROM institution_subscriptions WHERE institution_id = (auth.jwt()->>'institution_id')::uuid
  )
);

-- ------------------------------------------------------------------------------
-- POLICIES: invoices
-- ------------------------------------------------------------------------------
CREATE POLICY "SuperAdmin_ALL_Invoices" ON invoices
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_Invoices" ON invoices
FOR SELECT USING (
  auth.jwt()->>'role' = 'institution_admin' AND 
  institution_id = (auth.jwt()->>'institution_id')::uuid
);

-- ------------------------------------------------------------------------------
-- POLICIES: invoice_items
-- ------------------------------------------------------------------------------
CREATE POLICY "SuperAdmin_ALL_InvoiceItems" ON invoice_items
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_InvoiceItems" ON invoice_items
FOR SELECT USING (
  auth.jwt()->>'role' = 'institution_admin' AND 
  invoice_id IN (
    SELECT id FROM invoices WHERE institution_id = (auth.jwt()->>'institution_id')::uuid
  )
);

-- ------------------------------------------------------------------------------
-- POLICIES: billing_snapshots
-- ------------------------------------------------------------------------------
CREATE POLICY "SuperAdmin_ALL_BillingSnapshots" ON billing_snapshots
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_BillingSnapshots" ON billing_snapshots
FOR SELECT USING (
  auth.jwt()->>'role' = 'institution_admin' AND 
  institution_id = (auth.jwt()->>'institution_id')::uuid
);

-- ------------------------------------------------------------------------------
-- POLICIES: license_usage
-- ------------------------------------------------------------------------------
CREATE POLICY "SuperAdmin_ALL_LicenseUsage" ON license_usage
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_LicenseUsage" ON license_usage
FOR SELECT USING (
  auth.jwt()->>'role' = 'institution_admin' AND 
  institution_id = (auth.jwt()->>'institution_id')::uuid
);

-- ------------------------------------------------------------------------------
-- POLICIES: feature_flags
-- ------------------------------------------------------------------------------
CREATE POLICY "SuperAdmin_ALL_FeatureFlags" ON feature_flags
FOR ALL USING (auth.jwt()->>'role' = 'super_admin');

CREATE POLICY "InstAdmin_SELECT_FeatureFlags" ON feature_flags
FOR SELECT USING (
  auth.jwt()->>'role' = 'institution_admin' AND 
  institution_id = (auth.jwt()->>'institution_id')::uuid
);
