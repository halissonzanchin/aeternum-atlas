-- ==============================================================================
-- FASE 5.3C/E - REVENUE CALCULATION RPC & HARDENING (AETERNUM ATLAS)
-- Data: 2026-06-17
-- Objetivo: Função Matemática Transacional (Motor de Receita PL/pgSQL)
-- ==============================================================================

-- 1. CONSTRAINTS DE PROTEÇÃO CONTRA RACE CONDITIONS
ALTER TABLE invoices ADD CONSTRAINT unique_invoice_per_cycle UNIQUE (institution_id, billing_cycle_id);
ALTER TABLE billing_snapshots ADD CONSTRAINT unique_snapshot_per_cycle UNIQUE (institution_id, billing_cycle_id);

-- 2. Criação do Tipo de Retorno para tipagem estrita no PostgreSQL/Supabase
DO $$ BEGIN
    CREATE TYPE invoice_calculation_result AS (
        invoice_id uuid,
        institution_id uuid,
        billing_cycle_id uuid,
        licensed_students integer,
        consumed_students integer,
        excess_students integer,
        total_amount numeric(10, 2),
        status varchar(50)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- STORED PROCEDURE (RPC): generate_monthly_invoice
-- ==============================================================================
CREATE OR REPLACE FUNCTION generate_monthly_invoice(
    p_institution_id uuid,
    p_billing_cycle_id uuid
)
RETURNS SETOF invoice_calculation_result
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios de administrador para cruzar todas as tabelas
SET search_path = public
AS $$
DECLARE
    v_invoice_id uuid;
    v_subscription_id uuid;
    v_licensed_students integer;
    v_consumed_students integer;
    v_excess_students integer;
    v_price_per_seat numeric(10, 2);
    v_base_amount numeric(10, 2);
    v_excess_amount numeric(10, 2);
    v_total_amount numeric(10, 2);
    v_existing_invoice_id uuid;
    v_existing_status varchar(50);
BEGIN
    -- 1. VERIFICAÇÃO DE IDEMPOTÊNCIA (Prevenção de Dupla Fatura)
    SELECT id, status INTO v_existing_invoice_id, v_existing_status
    FROM invoices
    WHERE institution_id = p_institution_id 
      AND billing_cycle_id = p_billing_cycle_id
    LIMIT 1;

    IF FOUND THEN
        -- Retorna os dados da fatura existente imediatamente, abortando nova criação.
        RETURN QUERY 
        SELECT 
            i.id,
            i.institution_id,
            i.billing_cycle_id,
            sub.licensed_students_count,
            (SELECT quantity FROM invoice_items WHERE invoice_id = i.id AND description ILIKE '%Base%' LIMIT 1) + 
            COALESCE((SELECT quantity FROM invoice_items WHERE invoice_id = i.id AND description ILIKE '%Excedente%' LIMIT 1), 0),
            COALESCE((SELECT quantity FROM invoice_items WHERE invoice_id = i.id AND description ILIKE '%Excedente%' LIMIT 1), 0),
            i.amount_due,
            i.status
        FROM invoices i
        JOIN institution_subscriptions sub ON i.subscription_id = sub.id
        WHERE i.id = v_existing_invoice_id;
        RETURN;
    END IF;

    -- 2. BUSCAR DADOS DO CONTRATO E VALOR DO PLANO
    SELECT sub.id, sub.licensed_students_count, plan.price_per_seat
    INTO v_subscription_id, v_licensed_students, v_price_per_seat
    FROM institution_subscriptions sub
    JOIN subscription_plans plan ON sub.plan_id = plan.id
    WHERE sub.institution_id = p_institution_id
      AND sub.status = 'active'
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assinatura ativa não encontrada para a instituição %', p_institution_id;
    END IF;

    -- 3. CÁLCULO DE ALUNOS CONSUMIDOS (A Fonte Oficial de Dados)
    SELECT COUNT(DISTINCT id)
    INTO v_consumed_students
    FROM users
    WHERE institution_id = p_institution_id
      AND role = 'student';

    -- 4. MATEMÁTICA DO SOFT BLOCK E TRUE-UP
    v_excess_students := GREATEST(0, v_consumed_students - v_licensed_students);
    v_base_amount := v_licensed_students * v_price_per_seat;
    v_excess_amount := v_excess_students * v_price_per_seat;
    v_total_amount := v_base_amount + v_excess_amount;

    -- Bloco de Try/Catch para tratar Unique Violation (Race Condition)
    BEGIN
        -- 5. CRIAR O SNAPSHOT MENSAL DE AUDITORIA
        INSERT INTO billing_snapshots (
            institution_id, billing_cycle_id, snapshot_date, 
            licensed_students_count, active_students_count, total_hours_studied, total_invoice_amount
        ) VALUES (
            p_institution_id, p_billing_cycle_id, now(),
            v_licensed_students, v_consumed_students, 0.00, v_total_amount
        );

        -- 6. CRIAR A INVOICE (DRAFT)
        INSERT INTO invoices (
            institution_id, subscription_id, billing_cycle_id, 
            amount_due, amount_paid, status, due_date
        ) VALUES (
            p_institution_id, v_subscription_id, p_billing_cycle_id,
            v_total_amount, 0.00, 'draft', (now() + interval '5 days')
        ) RETURNING id INTO v_invoice_id;

        -- 7. CRIAR OS ITENS DA INVOICE
        INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
        VALUES (
            v_invoice_id, 'Institutional License (Cota Base Contratada)', 
            v_licensed_students, v_price_per_seat, v_base_amount
        );

        IF v_excess_students > 0 THEN
            INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price)
            VALUES (
                v_invoice_id, 'Institutional License (Licenças Excedentes / True-Up)', 
                v_excess_students, v_price_per_seat, v_excess_amount
            );
        END IF;

        -- 8. RETORNAR RESULTADO ATÔMICO
        RETURN QUERY 
        SELECT 
            v_invoice_id,
            p_institution_id,
            p_billing_cycle_id,
            v_licensed_students,
            v_consumed_students,
            v_excess_students,
            v_total_amount,
            'draft'::varchar(50);
            
    EXCEPTION WHEN unique_violation THEN
        -- Race condition detectada! Outra thread inseriu antes de nós.
        -- Recuperamos a fatura que a outra thread criou e a retornamos intacta.
        SELECT id, status INTO v_existing_invoice_id, v_existing_status
        FROM invoices
        WHERE institution_id = p_institution_id 
          AND billing_cycle_id = p_billing_cycle_id
        LIMIT 1;
        
        RETURN QUERY 
        SELECT 
            i.id,
            i.institution_id,
            i.billing_cycle_id,
            sub.licensed_students_count,
            (SELECT quantity FROM invoice_items WHERE invoice_id = i.id AND description ILIKE '%Base%' LIMIT 1) + 
            COALESCE((SELECT quantity FROM invoice_items WHERE invoice_id = i.id AND description ILIKE '%Excedente%' LIMIT 1), 0),
            COALESCE((SELECT quantity FROM invoice_items WHERE invoice_id = i.id AND description ILIKE '%Excedente%' LIMIT 1), 0),
            i.amount_due,
            i.status
        FROM invoices i
        JOIN institution_subscriptions sub ON i.subscription_id = sub.id
        WHERE i.id = v_existing_invoice_id;
        RETURN;
    END;
END;
$$;
