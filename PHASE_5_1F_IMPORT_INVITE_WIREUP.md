# IMPORT & INVITE WIRE-UP (Fase 5.1F)
**Integração do Importador CSV B2B com a Edge Function**

Este relatório finaliza o acoplamento sistêmico entre o Frontend (React) da Instituição e o Backend (Deno Edge Function), estabelecendo o fluxo corporativo definitivo para ingresso de alunos na Aeternum Atlas.

---

## 1. ARQUITETURA DO ACOPLAMENTO (WIRE-UP)

A etapa de ligação foi concluída através do desacoplamento de responsabilidades:
* **Frontend (AcademicImportPanel & ImportService):** Lê o CSV, monta os dados, insere os campi/cursos/turmas diretamente (via cliente comum do Supabase) e identifica os e-mails não cadastrados.
* **Cliente de Serviço Seguro (`invitationClientService.js`):** Uma nova classe cliente introduzida no front para agir como despachante. Ela agrupa os e-mails em *chunks* de 50 usuários e dispara as requisições `POST` de forma segura.
* **Backend (Edge Function):** Autentica a requisição via JWT, usa a `service_role` protegida, cadastra no Supabase Auth, manda e-mail e retorna sucesso.
* **Frontend (Retorno):** Com os IDs gerados, o importador retoma a execução e amarra (vincula) os novos alunos nas turmas recém-criadas.

---

## 2. SEGURANÇA E PROTEÇÃO IMPLEMENTADAS

1. **Nenhum Segredo Exposto:** O Frontend não acessou a `service_role` key em nenhum momento.
2. **Autorização JWT Strict:** O `invitationClientService` resgata o *Session Token* atual do administrador local (`supabase.auth.getSession()`) e injeta o `Bearer Token` no *header* HTTP para enviar à Edge Function.
3. **Isolamento Lógico (Multi-Tenant):** O Frontend passa o `institution_id` e a Edge Function checa se quem fez a chamada tem autoridade para este ID específico.

---

## 3. MECANISMOS DE PREVENÇÃO DE TIMEOUT E GARGALOS

Foi introduzido o conceito de **Chunking & Batching**:
A limitação arquitetural de 2.000 usuários não irá derrubar a Edge Function porque o `invitationClientService` varre o array de usuários importados e os divide em **blocos de 50**. Para 500 alunos, ocorrerão 10 requisições HTTP paralelas/assíncronas, driblando a restrição nativa de tempo e CPU da infraestrutura Deno.

---

## 4. SISTEMA DE FALLBACK

Caso a Edge Function esteja offline, sofra erro *500 Internal Server Error* ou a conexão da AWS oscile, a importação principal **não sofrerá quebra (Crash)**.
* Os alunos existentes continuarão sendo importados normalmente.
* A infraestrutura acadêmica inteira será criada.
* Os usuários inéditos que a Edge Function não alcançou gerarão erros graciosos listados na interface como *"Edge Function Fallback: Aluno não cadastrado."* ou *"Erro de Rede"*, permitindo que o admin baixe a planilha de falhas e re-tente posteriormente de forma idempotente.

---

## 5. ARQUIVOS AFETADOS

* `[NEW]` `src/services/academic/invitationClientService.js`
* `[MODIFIED]` `src/services/academic/academicImportService.js`
* `[MODIFIED]` `src/features/institution-admin/components/AcademicImportPanel.jsx`

---

## 6. CONCLUSÃO E DELIBERAÇÕES

O "Santo Graal" das plataformas SaaS B2B — O Onboarding Zero-Touch via Upload de Planilha — está codificado.

* **Chunks:** Lotes de 50 (Proteção Ativa).
* **Build Status:** Aprovado e compatível com a árvore principal.
* **Pronto para Deploy/Teste Real?** 🟢 SIM. O código Frontend está habilitado para testar e lidar com os retornos oficiais do Backend. A etapa crítica agora é realizar o *Push* e testar num ambiente de Homologação real para validar se o SMTP customizado será devidamente acionado pelo Supabase Auth.
