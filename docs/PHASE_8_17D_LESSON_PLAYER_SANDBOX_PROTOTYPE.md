# FASE 8.17D — LESSON PLAYER SANDBOX PROTOTYPE

## 1. Objetivo do Protótipo
Construir a infraestrutura base do Aeternum Lesson Player respeitando a premissa fundamental de isolamento. Decks HTML criados via MIRA ou processos externos não podem interagir de forma nativa com a árvore DOM do React para prevenir CSS Leakage e XSS. O objetivo foi viabilizar a visualização através de um Iframe estritamente conteinerizado sob a flag `sandbox="allow-scripts"`.

## 2. Artefatos Criados
Para concretizar o ambiente sem acoplar nenhuma dependência do MIRA, foram criados:

1. **Lesson Manifest Mock (`src/data/lessonManifests.js`):** Arquivo estático configurando os metadados de uma aula restrita de testes (`sandbox-cranial-sagittal`), incluindo sua URL absoluta local.
2. **Deck Dummy (`public/lesson-decks/sandbox-cranial-sagittal/index.html`):** Uma página HTML autônoma enxuta com CSS interno que dispara via `postMessage` sua prontidão. **Nenhum** asset ou dependência externa foi carregada.
3. **LessonIframeSandbox (`src/features/lessons/components/LessonIframeSandbox.jsx`):** O Core. Responsável por validar estritamente as policies e gerenciar os eventos cross-document (`postMessage`).
4. **LessonSandboxPage (`src/features/lessons/LessonSandboxPage.jsx`):** Container visual com identidade Liquid Glass validando o check-list de segurança do sandbox (Sem origens cruzadas, sem dangerouslySetInnerHTML, etc).
5. **Rota Experimental (`App.jsx`):** Rota adicionada em `/lessons/sandbox`.

## 3. Política Sandbox e Restrições Implementadas
A governança sobre o iframe obedece estritamente a especificação de segurança desenhada na Fase 8.17C.

### Validações de Entrada (Component Level)
O componente `LessonIframeSandbox` atua como um firewall contra falhas de configuração do manifesto:
- **Restrição de Esquema e Origem:** Rejeita tentativas de carregar URLs externas (`http://` ou `https://`), limitando o path a iniciar obrigatoriamente com `/lesson-decks/`. Bloqueia peremptoriamente protocolos perigosos como `javascript:`, `data:` e `blob:`.
- **Enforcement da Sandbox Policy:** A renderização da view aborta caso a sandbox policy descrita no manifesto não seja cirurgicamente idêntica a `"allow-scripts"`.
- **Gatekeeping por Status:** Como ambiente experimental, o player se recusa a exibir lessons que não possuam `status` igual a `"draft"` e `visibility` restrita a `"admin"`.

### Sandboxing Restrito (Browser Level)
- Sem `allow-same-origin`: O Iframe não possui acesso aos cookies nem ao LocalStorage da Aeternum. A variável DOM `window.parent.document` joga uma exceção Cross-Origin se o script tentar acessar a janela mãe.
- Apenas `"allow-scripts"` ativado para permitir o disparo do trigger visual mínimo e uso seguro do `postMessage`.

## 4. PostMessage Assíncrono e Seguro
Uma porta de comunicação minimalista (read-only no momento) foi estabelecida para ouvir a "vida" do deck sem comprometer a thread principal do React:
- O Deck aciona: `window.parent.postMessage({ type: "lesson.ready" }, "*")`
- A Aeternum audita o payload e loga a notificação: `[Aeternum Player] Aula carregada: sandbox-cranial-sagittal-v1`.
- **Nota de mitigação estrutural:** Uma vez que o iframe roda sob um contexto opaco sem `allow-same-origin`, a propriedade `event.origin` reportada no `postMessage` listener é assinalada como `"null"`. Sendo assim, o `LessonIframeSandbox` depende exclusivamente da coerção de Schema dos dados em vez de whitelist de URL.

## 5. Limitações e Riscos Remanescentes
- **Hospedagem Futura em CDN:** O protótipo usa a pasta `/lesson-decks` mapeada internamente no public. O desafio em produção envolverá adequar as validações da Content Security Policy (CSP) ao se apontar o source do Iframe para um Storage Bucket Cloud Front isolado.
- Nenhuma automação foi introduzida para pegar o build gerado no `mira-aeternum-lab` e "sanitizá-lo" para ser o `.html` real. (O dummy atendeu a prova de conceito do Player.)

## 6. Resultado do Build e Testes
O projeto Buildou perfeitamente (0 erros Rollup). Uma dependência falha de prototipagem visual (`lucide-react`) foi imediatamente revogada em favor de caracteres UTF-8 para respeitar o Zero Dependency Footprint solicitado nesta etapa da integração.

Rotas impactadas: `/lessons/sandbox` carrega perfeitamente sem degradar a estabilidade do dashboard do aluno (`/student/home`) e de demais acessos admin.

## 7. Decisão Final
O ecossistema estático foi testado e protegido de ponta a ponta sem violações nativas.

**READY_FOR_8_17E_LESSON_LIBRARY_AND_ADMIN_REVIEW_WORKFLOW**
