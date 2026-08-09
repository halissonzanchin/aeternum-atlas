# Aeternum 26.1 — relatório de estabilização

Data de corte: 9 de agosto de 2026
Branch de estabilização: `codex/aeternum-26-1-stabilization`

## Resultado

A fase estabiliza o checkout autoritativo, remove fontes de dados demonstrativas ou locais que competiam com Supabase, consolida o Viewer em Sketchfab, torna a telemetria V2 append-only e deixa o Tutor IA e a Agenda dependentes de identidade real.

O checkout autoritativo é `C:\Users\halis\.gemini\antigravity\scratch\aeternum-atlas`. A aplicação validada nesta fase foi executada em `http://127.0.0.1:5174`. O processo existente em `localhost:5173` pertence a `D:\Aeternum Atlas - Plataforma` e não deve ser tratado como fonte do release.

## Gates aprovados

- TypeScript: aprovado.
- ESLint: zero erros; 317 avisos legados registrados como dívida técnica.
- Contratos funcionais: 67 de 67 aprovados.
- Contrato Liquid Glass: aprovado; baseline legado de 146 declarações, sem novas declarações diretas.
- Contratos P0 de identidade, telemetria, limpeza e IA: aprovados.
- Build Vite de produção: aprovado.
- Deno check da Edge Function `ai-tutor`: aprovado.
- Navegador: seis papéis autenticados e redirecionados para suas homes canônicas.

## Verdade remota do Supabase

Projeto: `hyivyrietgjdazgizafp`.

- 6 usuários em `auth.users` e 6 perfis em `public.users`.
- 6 perfis ativos, nenhum perfil órfão e nenhum usuário autenticado sem perfil.
- Papéis: um `student`, um `teacher`, um `coordinator`, um `rector`, um `admin` e um `super_admin`.
- Uma instituição: `Aeternum Atlas Oficial`.
- Dois modelos 3D autorizados no catálogo.
- 225 sessões de aprendizagem, 534 eventos e 1 resultado de simulado no instante do corte.
- `model_access_logs` está aposentada para escrita e não contém registros.
- Agenda: esquema real e RLS ativos; zero eventos persistidos no instante do corte.
- RAG: esquema vetorial privado e função de busca ativos; zero documentos ingeridos no instante do corte.
- Tutor IA: 4 conversas e 66 mensagens após o smoke test final.

Ausência de registros na Agenda e no RAG é apresentada como estado vazio, nunca preenchida com mocks.

## Telemetria V2

- Sessões de conta e de estudo no Viewer são separadas.
- Sessões e eventos são persistidos em ordem para respeitar a chave estrangeira.
- Eventos são inserções append-only; repetição por id é tratada como idempotência.
- Heartbeat, atividade, ociosidade e término são reconciliados.
- Logout encerra e aguarda a sincronização da sessão antes de invalidar o JWT.
- Eventos Sketchfab, marcações e resultados dos simulados alimentam as métricas reais.
- `model_access_logs` permanece apenas como estrutura histórica sem escrita do cliente.

## Tutor IA

- Modelo fixado em `gemini-2.5-flash`.
- Embeddings fixados em `gemini-embedding-2`, com dimensão 768.
- `GEMINI_API_KEY` permanece exclusivamente em segredo da Edge Function.
- O handler exige `Authorization: Bearer`, valida o token com `auth.getUser()` e deriva usuário, papel e instituição no servidor.
- A verificação JWT do gateway está desativada somente para permitir o preflight CORS sem `Authorization`; todo `POST` continua bloqueado sem JWT válido pelo próprio handler.
- Limite de taxa, limites de payload/histórico, políticas de segurança, persistência com RLS e auditoria estão ativos.
- Chamada anônima retorna HTTP 401. Chamada autenticada respondeu pelo Gemini e persistiu a conversa.
- A Edge Function `ai-tutor` v10 está ativa; o smoke test remoto registrou `OPTIONS 200` e `POST 200`.
- Sem trechos RAG recuperados, o Tutor é instruído a não inventar livros, páginas ou citações.

## Agenda

- `study_agenda_events` é a fonte canônica.
- Usuário, instituição e papel são derivados pela camada autorizada e protegidos por RLS.
- Criação e exclusão foram verificadas com uma conta estudantil; o registro de teste foi removido.
- A interface distingue sincronização remota, estado local e sincronização pendente.

## Resíduos removidos

- Datasets UPE e identidades de demonstração.
- Dashboards e serviços de analytics baseados em mocks.
- Importador acadêmico dependente de tabelas inexistentes.
- Tutor local simulado e grafo anatômico fictício.
- CMS local `atlas_cms_overrides` e seus formulários sem rota ativa.
- Registros locais `demo-heart-glb` sem consumidores.
- Escritas duplicadas em `model_access_logs`.
- Scripts e relatórios contendo credenciais de demonstração.

## Migrações aplicadas

- Camada operacional docente.
- Analytics e telemetria do Viewer.
- Telemetria V2 e hardening P0.
- Persistência do Tutor IA.
- Limpeza e reconciliação de identidade.
- Hardening de segurança.
- Base vetorial anatômica.
- Agenda sincronizada e hardening de grants.
- Backfill de resultados de simulados.
- Reconciliação automática de sessões por cron.

## Pendências não bloqueantes

- Reduzir os 317 avisos de lint e dividir o bundle principal de aproximadamente 1,18 MB.
- Ingerir material licenciado no RAG antes de anunciar cobertura bibliográfica.
- Ativar proteção contra senhas vazadas nas configurações de Auth do Supabase.
- Tratar recomendações históricas de performance do Supabase em uma fase própria, sem alterar RLS ou índices às cegas.
- Desativar ou arquivar, de forma explícita e separada, o servidor legado que ainda ocupa `localhost:5173`.

## Gate de release

O release somente pode ser promovido depois de: commit rastreável, CI verde, preview Vercel validado e smoke test da URL de produção. A promoção não transforma estados vazios em funcionalidades concluídas: Agenda sem eventos e RAG sem documentos continuam declarados como vazios.
