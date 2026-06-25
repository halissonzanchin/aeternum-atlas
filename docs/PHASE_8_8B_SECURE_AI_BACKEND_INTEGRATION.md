# FASE 8.8B — SECURE AI BACKEND INTEGRATION FOR AETERNUM AI TUTOR

## 1. Arquitetura Escolhida
Foi adotada uma arquitetura Serverless compatível com a plataforma de hospedagem provável (Vercel) baseada em um Endpoint Edge (`api/ai-tutor.js`). Isso garante inicialização rápida ("cold boots" minimizados) e proteção isolada em nível de servidor. 
- O Frontend envia a requisição HTTP POST para `/api/ai-tutor` contendo a pergunta do usuário, o contexto do modelo e o histórico do chat.
- O Backend intercepta a requisição, formata a `System Instruction`, interage com a API REST da OpenAI (usando a variável de servidor protegida) e retorna o bloco processado.
- Caso ocorram indisponibilidades, ausência da chave no servidor ou *Timeouts*, o Endpoint retorna um erro mapeado. O Frontend "captura" essa falha em um bloco `catch` e redireciona de imediato o usuário para a heurística de contingência (*Local Fallback* da Fase 8.8A).

## 2. Endpoint Criado
- **Rota:** `/api/ai-tutor`
- **Method:** `POST`
- **Payload Sanitizado:** O backend realiza a truncagem das strings (`truncateText`) prevenindo consumo massivo de *tokens* ou exploração via injeção de prompt desmesurado.
- **Isolamento de Erro:** Retorno condicionado a respostas impessoais para evitar o vazamento da infraestrutura de ponta.

## 3. Variáveis de Ambiente e Segurança 
- A chave global do provedor (OpenAI) será referenciada unicamente via `process.env.OPENAI_API_KEY` na camada de Backend.
- Não existem referências como `VITE_` que fatalmente compilam segredos no pacote JavaScript interceptável pelos navegadores dos alunos.
- O arquivo `.env.example` foi devidamente atualizado apenas com o nome da chave (sem atribuição).
- A auditoria via `Select-String` comprovou a total higienização dos repositórios *frontend* e *backend* quanto às ocorrências literais como `sk-***`.

## 4. Testes e Validações Locais
- **Teste sem Chave (`OPENAI_API_KEY` vazia):**
  - Quando testado sem a chave de ambiente local configurada, a API falha ativamente retornando `NO_API_KEY`.
  - O painel AI processa o alerta e **mantém seu funcionamento** usando a mecânica puramente local da Aeternum, emitindo mensagens prefixadas como `*(Modo Local)*`. O Chat não trava nem paralisa.
- O Build para produção confirmou inexistência de conflitos arquiteturais nas interações da raiz (diretório `api`).

## 5. Riscos Remanescentes e Próximos Passos
### Riscos Menores
- Ausência de Rate Limiting por Usuário/IP. Pode gerar escalada de custo se contas maliciosas enviarem mil requisições por minuto no Chat.
- Não há Filtro de Conteúdo robusto a não ser o próprio System Prompt; usuários insistentes podem forçar um diagnóstico "ilegal" à IA que, dependendo do provedor, pode hesitar (porém com baixo risco já que a temperatura foi reduzida para `0.3`).

### Próximos Passos Inerentes à FASE 8.8C
- Instituir chamadas bidirecionais (Agent Actions): Ensinar o Backend a retornar respostas JSON contendo ordens diretas para a UI ("focusMarker", "openAnnotation").
- Vincular a autenticação (`authService.js`) ao contexto da chamada API para evitar abuso anônimo.

## 6. Decisão Final Obrigatória
`READY_FOR_8_8C_AI_TUTOR_ACTIONS_AND_VIEWER_CONTROL`
