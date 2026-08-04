# Aeternum 26 — relatório de conclusão da Fase 2

Data: 2026-07-29  
Estado: **CONCLUÍDA**

## Resultado

A Fundação Visual Aeternum 26 foi implementada como um sistema isolado,
testável e progressivamente adotável. A fase não migrou páginas inteiras:
estabeleceu os contratos visuais e técnicos que as próximas fases devem usar.

## Entregas concluídas

### Sistema material

- namespace semântico completo `--a26-*`;
- materiais `clear`, `regular`, `substantial` e `opaque`;
- profundidade, cor, tipografia, espaçamento, movimento e z-index
  centralizados;
- degradação para reduced motion, reduced transparency e increased contrast;
- fallback opaco quando `backdrop-filter` não é suportado;
- proteção contra blur aninhado.

### Primitivas oficiais

Foram implementadas e demonstradas:

- `A26Surface`;
- `A26Button` e `A26IconButton`;
- `A26Toolbar`, `A26Sidebar` e `A26TabBar`;
- `A26Card` e `A26Metric`;
- `A26Field` e `A26SegmentedControl`;
- `A26Modal` e `A26Popover`;
- `A26EmptyState`, `A26LoadingState` e `A26ErrorState`;
- `A26DataDisclosure`;
- `A26TutorSurface`.

O modal inclui foco inicial, ciclo de Tab, fechamento com Escape e retorno ao
controle de origem.

### Playground e acesso

O playground oficial foi integrado à navegação da Superadministração em:

`/super-admin/aeternum-26-foundation`

Ele demonstra os quatro materiais, estados de controles, erro, loading, vazio,
dados densos, disclosure, navegação adaptativa, modal e Tutor IA.

### Compatibilidade e governança

- `AeternumGlassSurface` passou a declarar contrato de adapter A26;
- `Card` legado passou a material opaco, sem blur;
- o backdrop do `Modal` legado deixou de adicionar uma camada de blur;
- `npm run test:a26-glass` bloqueia qualquer aumento de `backdrop-filter`
  fora da fundação oficial;
- baseline legado atual: 155 declarações diretas;
- novas declarações diretas fora da fundação: zero.

## Evidência automatizada

| Gate | Resultado |
|---|---|
| contratos de rota e fundação | 13/13 aprovados |
| materiais e primitives | aprovado |
| contraste dos pares essenciais | WCAG AA |
| ausência de `!important` na fundação | aprovado |
| proteção de blur aninhado | aprovado |
| reduced motion/transparency | aprovado |
| TypeScript | aprovado |
| build de produção | aprovado |
| lint | zero erros; 598 avisos legados |
| `git diff --check` | aprovado |

O build continua informando passivos anteriores: asset `/assets/noise.png`
resolvido apenas em runtime, imports mistos que impedem parte do code splitting
e bundle principal acima de 500 kB. Eles não foram introduzidos pela Fundação
A26 e serão tratados na fase de migração e performance.

## Certificação visual real

A interface autenticada foi testada na rota oficial:

| Formato | Viewport | Overflow global | Controles abaixo de 44 px | Blur ativo na viewport | Blur aninhado ativo |
|---|---:|---:|---:|---:|---:|
| desktop | 1280 × 720 | 0 px | 0 de 27 | 2 | 0 |
| notebook | 1366 × 768 | 0 px | 0 de 27 | 2 | 0 |
| tablet | 768 × 1024 | 0 px | 0 de 27 | 4 | 0 |
| celular | 390 × 844 | 0 px | 0 de 27 | 2 | 0 |

O orçamento aprovado é de até seis superfícies com blur real em
desktop/notebook e quatro em tablet/celular.

Durante a certificação foi corrigida a quebra indevida do título “Aeternum” e
a compressão vertical dos rótulos da toolbar no celular.

O histórico do tab continha quatro erros anteriores de `model_access_logs`,
originados no Viewer antes da abertura do playground. Nenhum erro novo foi
registrado pela Fundação A26 durante a certificação.

## Débito encaminhado

No shell administrativo de tablet e celular ainda coexistem a navegação do
layout global e as tabs internas do módulo. Isso não pertence às primitives
da Fundação e está encaminhado para a **Fase 3 — shell, navegação e acesso**,
cujo objetivo é migrar a moldura compartilhada e eliminar essa duplicidade.

## Gate de saída

- quatro viewports aprovadas;
- contraste AA aprovado;
- 44 × 44 px aprovado;
- reduced motion e transparency implementados e contratados;
- primitives sem `!important`;
- documentação de composição publicada;
- barreira automática contra novo blur direto ativa.

**Decisão: Fase 2 concluída. A Fase 3 pode ser iniciada.**
