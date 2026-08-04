# Aeternum 26 — Fase 0: baseline de estabilização

Data do baseline: 2026-07-29

Estado de encerramento: **CONCLUÍDA**

## Estado preservado

- Branch observada: `feature/hero-procedural-core`
- Commit base observado: `5d44285`
- Estado anterior à intervenção da Fase 0: 61 entradas modificadas ou não rastreadas
- Alterações preexistentes pertencem ao fluxo compartilhado do usuário e do Antigravity
- Nenhum commit, push, reset, checkout destrutivo ou consolidação automática foi executado

## Evidência que abriu a Fase 0

### Viewer 3D no desktop

O contêiner visual reservava 720 px, mas a cadeia interna apresentava:

- `.secure-content-guard__body`: 0 px
- `.aa-viewer-shell`: 0 px
- `.aa-sketchfab-stage`: 0 px
- `iframe` Sketchfab: 0 px

O mesmo Viewer apresentava altura funcional em viewport móvel. A diferença foi
associada à dependência de `height: 100%` em uma cadeia cujo tamanho desktop era
estabelecido por `min-height`.

### Correção delimitada

O guard de conteúdo passou a usar layout flexível, e o corpo protegido passou a
herdar a altura mínima disponível. A alteração preserva as camadas de segurança,
watermark e overlays.

Arquivo alterado:

- `src/components/security/SecureContentGuard.css`

## Validação após a correção

| Viewport | Guard | iframe | Modelo conectado | Overflow horizontal |
|---|---:|---:|---:|---:|
| Desktop 1536 × 864 | 1386 × 720 | 1386 × 720 | Sim | Não |
| Notebook 1366 × 768 | 1216 × 600 | 1216 × 600 | Sim | Não |
| Tablet 768 × 1024 | 705 × 696 | 705 × 696 | Sim | Não |
| Celular 390 × 844 | 344 × 523 | 344 × 523 | Sim | Não |

O modelo anatômico foi observado visualmente no desktop e no celular. Portanto,
esta validação não foi baseada apenas na existência do iframe.

## Regressão responsiva de encerramento

| Superfície | Desktop | Notebook | Tablet | Celular | Overflow horizontal | Alvos abaixo de 44 px |
|---|---:|---:|---:|---:|---:|---:|
| Home pública | Aprovado | Aprovado | Aprovado | Aprovado | 0 | 0 |
| Login | Aprovado | Aprovado | Aprovado | Aprovado | 0 | 0 |
| Cadastro | Aprovado | Aprovado | Aprovado | Aprovado | 0 | 0 |
| Painel do aluno | Aprovado | Aprovado | Aprovado | Aprovado | 0 | 0 |
| Modelos 3D | Aprovado | Aprovado | Aprovado | Aprovado | 0 | 0 |
| Viewer 3D | Aprovado | Aprovado | Aprovado | Aprovado | 0 | 0 |

O checkbox de consentimento do cadastro mantém o controle visual compacto, mas
está contido por um `label` clicável com altura mínima de 44 px.

### Correções ergonômicas delimitadas

- botões de idioma, navegação móvel e ações públicas: mínimo de 44 px
- etapas de resgate, trilhas e simulados do aluno: mínimo de 44 px
- busca e favoritos de Modelos 3D: área interativa mínima de 44 px
- abas, fechamento e ações secundárias do Viewer: mínimo de 44 px
- consentimento do cadastro: alvo clicável de 44 px

## Verificações técnicas

- `npm run build`: aprovado
- `npm run typecheck`: aprovado
- `npm run lint`: aprovado com 0 erros e 595 avisos de legado
- Configuração do ESLint atualizada para analisar JavaScript, JSX, TypeScript e TSX
- 14 erros reais revelados pelo novo gate foram corrigidos sem alterar os fluxos
  funcionais: chaves duplicadas, blocos silenciosos, condições constantes e
  tipagem do guard

Avisos não bloqueadores observados no build:

- `/assets/noise.png` permanece para resolução em runtime
- bundle principal acima de 2,5 MB antes de gzip
- SVG anatômico próximo de 3 MB
- imports estáticos e dinâmicos concorrentes impedem parte da divisão de chunks

Saída final do build:

- JavaScript principal: 2.498,46 kB; 694,40 kB gzip
- CSS principal: 518,58 kB; 94,24 kB gzip
- SVG anatômico principal: 2.993,66 kB; 1.168,88 kB gzip

## Gates desta fase

- Viewer visível em desktop, notebook, tablet e celular
- iframe com largura e altura maiores que zero após o carregamento
- ausência de overflow horizontal global
- controles essenciais utilizáveis sem sobreposição bloqueadora
- build de produção concluído
- nenhuma regressão de proteção de conteúdo observada
- certificação por papel separada de inferência estática

## Restrições conhecidas

- Professor, Coordenação, Reitoria, Administração e Superadministração foram
  autenticados e certificados após a criação das contas reais.
- Uma interface separada de administrador institucional permanece não
  verificada porque nenhuma conta específica desse papel foi provisionada.
- A presença do iframe não prova, sozinha, que o modelo terminou de renderizar.
  A aprovação exige estado visual observável e interação com o Viewer.
- A worktree compartilhada deve ser consolidada em conjunto antes de uma futura
  migração ampla do sistema visual.
