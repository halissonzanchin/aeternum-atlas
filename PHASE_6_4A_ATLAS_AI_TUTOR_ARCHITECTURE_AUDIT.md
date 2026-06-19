# ATLAS AI TUTOR ARCHITECTURE AUDIT (Fase 6.4A)
**Laudo de Arquitetura de Inteligência Artificial Institucional**

## 1. Visão Arquitetural Recomendada
O Atlas AI Tutor não é um chatbot genérico (wrapper do ChatGPT), mas um **Agente RAG Contextual (Retrieval-Augmented Generation)** cimentado na base de dados médica e hierárquica da Aeternum Atlas.

A arquitetura recomendada baseia-se em:
* **LLM Core:** OpenAI (GPT-4o-mini para uso de alunos de alto volume e baixo custo; GPT-4o para Coordenadores/Reitores onde o raciocínio profundo de heatmaps é crítico).
* **RAG Engine:** Embedding contextual através da API `text-embedding-3-small` da OpenAI, alimentando um **Banco de Dados Vetorial**.
* **Vector Store:** `pgvector` nativo no próprio Supabase. Isso garante que a latência seja mínima (os vetores moram ao lado do schema de RBAC), reduzindo custos com infraestrutura paralela como Pinecone.
* **Orquestração de Proxy:** Uma Supabase Edge Function ou proxy Deno intermediando todas as chamadas. Jamais chamaremos a OpenAI direto do Front-end. A Edge Function injetará o token de autenticação (JWT), validará a *Role* e anexará os parâmetros do Tenant (Instituição).

## 2. Estratégia de MVP (Produto Mínimo Viável) vs. Enterprise
### MVP Recomendado
* **Foco:** O Aluno no Viewer 3D.
* **Feature:** Botão "Explique esta estrutura". Quando o aluno seleciona um osso e clica no botão, a interface envia o ID da estrutura anatômica atual para o AI Tutor, que devolve uma explicação simplificada, clínica e cirúrgica com base nos manuais de anatomia já pré-processados na plataforma.
* **Contexto Passivo:** Sem conversação aberta longa. Perguntas de escopo estrito ("Gere 3 questões sobre essa estrutura").

### Visão Enterprise (Escalabilidade)
* Expansão dos *Prompts Dinâmicos* para Coordenadores. Ex: O coordenador clica no botão "Resumir este Heatmap". A Edge Function compila os dados agregados das piores notas, formata num prompt interno (System Message invisível ao usuário) e o GPT devolve um laudo executivo gerencial.

## 3. Componentes Necessários
* **Front-end (React/Vite):** 
  * `AtlasAIAvatar`: Componente UI flutuante ou integrado à Sidebar.
  * `ContextualPrompts`: Botões de atalho integrados ao Viewer 3D (ex: "Explicar", "Simular Questão").
* **Back-end (Supabase):** 
  * Edge Function `chat-completion`: Rota blindada JWT.
  * Extensão `pgvector` habilitada no Postgres.
  * Tabela `ai_embeddings` (estrutura_id, conteudo, embedding).
  * Tabela `ai_chat_history` (user_id, session_id, role, message).

## 4. Dados Necessários (Fontes de Conhecimento RAG)
O RAG do Atlas AI deve se nutrir de conhecimento esterilizado e oficial:
1. **Dicionário 3D Aeternum:** Descrições técnicas de todas as malhas poligonais mapeadas no Atlas (Origem, inserção, inervação, vascularização).
2. **Biblioteca de Simulados:** Banco de questões validadas por médicos.
3. **Métricas Pedagógicas (Meta-data):** Histórico do aluno para gerar a recomendação "Por que errei a Base do Crânio?".
4. *Restrição de Livros:* Nenhum conteúdo de terceiros (ex: Livro de Anatomia do Gray ou Moore) deve ser injetado no banco vetorial sem licença expressa, mitigando litígio autoral B2B.

## 5. Estratégia de Segurança e RBAC Contextual
O AI Tutor sofrerá restrições drásticas via *System Prompts* acoplados ao RLS do Supabase.
* **Para o Aluno:** O prompt interno forçará a IA a agir metodicamente de forma socrática. **Regra Ouro:** "A IA nunca expõe notas de outros alunos. A IA foca estritamente na anatomia e progressão pessoal."
* **Para o Professor:** O prompt recebe o escopo da turma atrelada ao `user_id`. A IA sugere táticas em cima do *Difficulty Map*.
* **Para o Coordenador:** A IA ingere metadados (Não DRE ou Billing). 
* **Para o Reitor:** Resumos de engajamento e ROI, ignorando qualquer dado financeiro sigiloso do servidor raiz (Stripe/pagamentos).
* **Alucinações (Hallucinations):** System Prompt imperativo: "Se a resposta não estiver no contexto fornecido pelas notas anatômicas (RAG), responda: *Não possuo dados institucionais suficientes sobre essa estrutura.* Não crie anatomia sintética."

## 6. Riscos Principais
* **Risco Comercial:** "API Abuse" (Abuso do Chatbot gerando despesas insustentáveis de OpenAI no faturamento da Aeternum). Solução: Rate limiting na Edge Function (ex: 20 interações diárias por aluno).
* **Risco Pedagógico:** Alucinação anatômica que ensine o cirurgião errado. Solução: Temperaturas nulas ou extremamente baixas (`temperature: 0.1`) no LLM e exclusividade do RAG.
* **Risco de Roteamento Dinâmico:** Os *Deep Links* construídos entre o Chatbot e o Viewer 3D precisam estar amarrados firmemente ao identificador WebGL da peça.

## 7. Estratégia de Custo
* Uso massivo do **GPT-4o-mini** (custo de frações de centavo por mil tokens).
* **Custo estimado por aluno (Mensal):** Baseado em um uso médio de 150 requests/mês, os gastos em API não deverão exceder U$ 0.10 a U$ 0.15 por aluno ativo. Instituições como a UPE, com 700 alunos, custariam cerca de U$ 100 mensais em cloud inferencial.

## 8. Próxima Fase Técnica
**FASE 6.4B — ATLAS AI TUTOR EDGE FUNCTION SKELETON.**
Construir o esqueleto do serviço backend no Supabase para lidar com a injeção OpenAI de forma segura (Apenas setup arquitetural da Edge Function ou Mock Local).
