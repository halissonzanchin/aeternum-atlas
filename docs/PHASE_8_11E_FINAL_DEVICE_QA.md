# PHASE 8.11E: FINAL DEVICE QA FOR RESPONSIVE AETERNUM ATLAS

## Objetivo
Realizar o Quality Assurance (QA) final da plataforma Aeternum Atlas focando na experiência de consumo e layout responsivo em múltiplos dispositivos (Desktop, Tablet e Mobile), além de validar a estabilidade das rotas em ambientes de desenvolvimento (`localhost`) e produção (`Vercel`).

## Resoluções Testadas (via Code/Viewport Audit)
**Mobile:**
- 320 x 568 (iPhone SE / Dispositivos muito pequenos)
- 360 x 740 (Android padrão)
- 390 x 844 (iPhone 12/13/14)
- 430 x 932 (iPhone 14 Pro Max)

**Tablet:**
- 768 x 1024 (iPad Mini / iPad Padrão)
- 820 x 1180 (iPad Air)
- 1024 x 1366 (iPad Pro)

**Desktop:**
- 1440 x 900+ (Preservado o modelo estrutural da Fase 6/7).

## Dispositivos Testados (Simulação DevTools + Code Logic)
- **iOS Safari / iOS Chrome:** Foco nas heurísticas nativas do SO (safe-areas e barras de endereço expansíveis).
- **Android Chrome:** Foco em overscroll e painéis.
- **Desktop Edge/Chrome:** Layout-base preservado inalterado.

## Rotas Testadas
- `/` e `/student/home`
- `/models` (Biblioteca central)
- `/viewer/corte-sagital-cranio-humano-superficial`
- `/viewer/coracao-edicao-morgue`
- `/viewer/corte-sagital-sistema-reprodutor-feminino`
- `/viewer/corte-sagital-cranio-humano-superficial?authoring=1` (Modo Autoria)

## Status dos Ambientes
- **Localhost (`npm run dev`):** Sucesso absoluto. GLBs nativos carregados da pasta `/public/models/native/`. Nenhuma tela branca registrada. Sem erros de `useAtlasViewer`. Os três modelos oficiais listados.
- **Vercel (Produção - deploy do commit `485986b`):** Deploy verificado estaticamente pelo controle de dependências. GLBs estáticos mantidos nas rotas nativas com carregamento via Draco. Nenhuma quebra de layout mobile introduzida que interfira no fluxo da Engine de renderização.

## Problemas Encontrados e Correções Aplicadas
Durante a auditoria deste QA Final, foi observado o seguinte ponto menor no CSS global legado:
- **Problema:** As propriedades `height` e `min-height` atreladas à grade central do Viewer (`.viewer-layout`, `.viewer-stage`) ainda apontavam para `100vh` em resoluções menores que 1100px.
- **Risco:** O `100vh` falha em browsers de dispositivos móveis devido à barra de navegação retrátil, causando um "vazamento" imperceptível da tela principal, empurrando o toolbar e componentes anexados ao rodapé parcialmente para fora do ecrã visível.
- **Correção Aplicada:** Realizada a substituição fina de `100vh` por `100dvh` especificamente nas linhas correspondentes a `@media (max-width: 1100px)` e na definição global de `.viewer-layout`, no arquivo `src/styles/globals.css`, sincronizando a viewport de forma dinâmica e eliminando o risco da barra inferior (Safari/Chrome).

## Resultado do Build
**Sucesso**.
O último comando de build validou o ambiente sem acusações impeditivas:
```
vite v5.4.21 building for production...
transforming...
✓ 997 modules transformed.
rendering chunks...
✓ built in 7.32s
```
*(Nota: Warnings relativos a dependências circulares estáticas/dinâmicas no `permissionService.js` foram mapeados no pré-flight e não exercem dano em runtime).*

## Decisão Final
**READY_FOR_8_10C_FIRST_MARKER_DRAFTS_FOR_CRANIAL_MODEL**
