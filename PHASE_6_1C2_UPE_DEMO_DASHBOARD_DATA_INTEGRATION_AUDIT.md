# UPE DEMO DASHBOARD DATA INTEGRATION AUDIT (Fase 6.1C.2)
**Estratégia de Acoplamento do Mock de Dados aos Componentes React**

## 1. Mapeamento de Dashboards Impactados
O acoplamento cirúrgico será realizado em três páginas front-end, substituindo os objetos *hardcoded* estáticos da Fase 6.2 por interceptadores lógicos que lerão a camada `src/demo/upe`:
* `src/pages/rector/RectorDashboard.jsx`
* `src/pages/coordinator/CoordinatorDashboard.jsx`
* `src/features/dashboard/components/ProfessorDashboard.jsx`

## 2. Mapa de Consumo de Mocks
A importação dos módulos da UPE será segregada conforme o privilégio e foco do dashboard:

**RectorDashboard (Visão Financeira/Macro):**
* `upeRoiMetrics` (Horas digitais e Economia).
* `upeStudentsMetrics` (Volume total e ativos).
* `upeEngagementMetrics` (Crescimento mensal e retenção).

**CoordinatorDashboard (Visão Estratégica/Turmas):**
* `upeCourseMetrics` e `upeClassesMetrics` (Visão de disciplinas e turmas).
* `upeHeatmaps` (Mapa de reprovação anatômica matriz).
* `upeInterventionCenterAlerts` (Lista de Alertas da Coordenação).
* `upeStudentsMetrics` (Foco em Alunos em Risco).

**ProfessorDashboard (Visão Tática/Microgestão):**
* `upeClassesList` (Foco nas turmas daquele professor).
* `upeQuizzesMetrics` (Volume de simulados gerados e conclusão).
* `upeHeatmaps` (Mapa anatômico como alvo de ação didática).
* `upeRiskStudentsList` (Intervenção direta nos 5 alunos mais críticos).

## 3. Estratégia de Fallback Seguro
Em cada dashboard afetado, a integração será envolvida pelo *guard* de ambiente:
```javascript
import { isUpeDemoMode, upeStudentsMetrics } from "../../../demo/upe";

// Dentro do componente React:
const studentsData = isUpeDemoMode() ? upeStudentsMetrics : {
  // Fallback de Produção: Estado vazio, ou dados reais do Supabase (fetch)
  total: 0,
  active: 0
};
```
Isso garante que, caso a plataforma inicie no servidor de produção normal sem a variável `VITE_DEMO_MODE=upe`, a ilusão da UPE simplesmente não existe para o compilador.

## 4. Auditoria de Riscos
* **Dependência Circular:** Risco inexistente. A camada `src/demo/upe/` atua como *Leaf Node* (nó folha), não importando nada do projeto.
* **Vazamento em Produção:** Risco Baixo. A leitura de `import.meta.env` no Vite é estaticamente substituída durante o Build. Se `VITE_DEMO_MODE` for falso, o minificador fará *Tree Shaking* (corte de código morto) e o mock sequer entrará no bundle final.
* **Bundle Inflado:** Risco Baixo. O JSON gerado tem menos de 30kb brutos.
* **Impacto em Rotas e Viewer 3D:** Risco Inexistente. A lógica será restrita ao escopo fechado (Closure) dos componentes JSX.

## 5. Protocolo de Validação Pós-Implementação
Quando o acoplamento for autorizado, a validação exigirá:
1. Executar `npm run dev` com e sem `.env`.
2. Verificar se o Renderizador retorna dados da UPE quando ativado.
3. Certificar o isolamento do Banco (Network tab limpa de chamadas ao `api.supabase.co`).
