# Phase: Demo UPE Presentation Mode

## Objetivo Concluído
As contas demo pré-aprovadas agora conseguem se autenticar usando o banco de dados real (Supabase Auth e public.users), mas renderizam de forma isolada os dados mockados ricos (UPE Mode) nos Dashboards, sem poluir, alterar ou interagir com os dados de produção.

## O que foi feito

1. **Gatekeeper Criado:**
   Implementamos a função isDemoPresentationAccount(email) em src/demo/upe/index.js que identifica as 5 contas de apresentação oficiais:
   - dmin@aeternumatlas.com
   - eitor@upe.edu.py
   - coordenador@upe.edu.py
   - professor@upe.edu.py
   - demo@upe.edu.py

2. **Bypass no Fluxo de Dashboard (Admin/SuperAdmin):**
   - Atualizamos loadInstitutionDashboardData em src/services/admin/institutionDashboardService.js.
   - Se o usuário pertencer ao array de contas demo, a função não consulta o banco de dados. Em vez disso, retorna a estrutura de payload formatada (uildDemoUpePayload) que replica a estrutura real mas utiliza as métricas de sucesso da UPE.

3. **Bypass nos Componentes de Perfil (Dashboard UPE):**
   - A função isUpeDemoMode() agora recebe o objeto user para cruzar o email autenticado com as contas demo.
   - Isso garante que os Dashboards já existentes da UPE (Rector, Coordinator, Professor, Student) continuem aparecendo.
   - Foram detectados componentes que chamavam funções inoperantes como useAuth e isso foi corrigido passando os objetos pelo App.jsx.

4. **Indicadores de UI:**
   - Para evitar confusão visual com o ambiente de Produção, as views Admin.jsx, SuperAdmin.jsx e GlobalAnalyticsPage.jsx interceptam dados da origem demo_upe e substituem o selo "Supabase real" por **"MODO APRESENTAÇÃO (DEMO UPE)"**.

## Validação
- O build de produção com Vite (
pm run build) passou com sucesso.
- As credenciais de apresentação e fluxo de login Supabase permanecem intactos.
- Os usuários que não possuírem esse e-mail continuarão a consumir dados reais pela service normal.
