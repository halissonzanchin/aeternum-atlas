# FASE 8.18A — HYBRID SKETCHFAB EMBED VIEWER FALLBACK INSIDE ATLAS VIEWER LAYOUT

## 1. Motivo da Fase
Esta fase foi desenhada para integrar o motor externo do Sketchfab como uma camada de *fallback* temporário dentro do ecossistema principal do Aeternum Atlas, sem destruir a identidade visual estabelecida e nem impactar o funcionamento do novo Atlas Native Engine. O alvo primordial desta abordagem híbrida é prover acesso imediato a alguns assets do CMS enquanto a otimização GLB RealityScan é testada.

## 2. Erro Corrigido
Durante os trabalhos prévios, o Vite acusou a ausência/falha na resolução da biblioteca `react-router-dom` ao usar `useSearchParams` no `ViewerPage.jsx` (`[plugin:vite:import-analysis] Failed to resolve import "react-router-dom" from "src/features/viewer/ViewerPage.jsx"`). Para estancar o erro sem adicionar novas dependências, o importe foi completamente removido e substituído por uma consulta nativa usando `window.location.search` dentro de um `useMemo` otimizado:
```javascript
  const requestedEngine = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("engine");
  }, []);
```

## 3. Integração do Componente Sketchfab
O componente `SketchfabApiViewer` foi inspecionado e validado. Ele **não** utiliza técnicas perigosas como `dangerouslySetInnerHTML`, nem constrói conteúdo baseando-se em `srcDoc`, `blob:` ou vetores inseguros de Javascript explícito. Em vez disso, ele injeta um `iframe` seguro ocupando o centro da tela (`absolute inset-0`).

## 4. Preservação do Layout Fixo
A exigência mais rígida foi acatada com sucesso: o layout não é sobrescrito ou re-renderizado agressivamente. O fluxo de injeção acontece diretamente no interior da casca `AtlasViewerShell`, preservando as seguintes seções estáticas:
* Topbar superior.
* Sidebar lateral esquerda.
* Toolbar inferior de ferramentas.
* Orbe/botão inferior de suporte.

## 5. Alvo Exclusivo (Cranial Model)
A injeção do engine "hybrid" com embedUrl do Sketchfab (`0145e302fd94453c8f7fb2817e45060e`) foi habilitada **unicamente** no modelo *Corte Sagital do Crânio Humano — Modelo Superficial 3D*.
- **Slug afetado:** `corte-sagital-cranio-humano-superficial`
- **Condição:** Os modelos de reprodução feminina (`corte-sagital-sistema-reprodutor-feminino`) e coração (`coracao-edicao-morgue`) seguem atrelados estritamente ao Atlas Engine (GLB).

## 6. Rotas Testadas & Comportamentos

| Rota / Engine Target | Comportamento Esperado | Resultado Validado |
| :--- | :--- | :--- |
| `...?engine=sketchfab` (Crânio) | Troca o centro pelo iframe do Sketchfab. Desativa Marcadores e Realismo. Topbar exibe badge Laranja de Aviso Temporário. | OK |
| `...?engine=native` (Crânio) | Força o uso do RealityScan GLB nativo. Reativa as opções da Toolbar Inferior e badge da Topbar. | OK |
| `.../corte-sagital-sistema-reprodutor-feminino` | Permanece inalterado no fluxo 3D Nativo (GLB). | OK |
| `.../coracao-edicao-morgue` | Permanece inalterado no fluxo 3D Nativo (GLB). | OK |
| `/models` e `/student/home` | Navegação íntegra pelo catálogo original. | OK |

## 7. Status do Build
O build de produção do Vite rodou integralmente, sem falhas de referências ou pacotes:
`✓ 1033 modules transformed... ✓ built in 8.53s`

## 8. Limitações
Por causa da arquitetura de isolamento do iFrame do Sketchfab, as interações de "Realismo/LOD" e "Marcadores Visuais Atlas" perdem efeito. Para evitar que os usuários acionem botões mortos, a interface provê estados desabilitados (`cursor-not-allowed`) acompanhados de tooltips esclarecedores nessas condições.

## 9. Decisão Final

**READY_FOR_8_18B_SKETCHFAB_NATIVE_ENGINE_TOGGLE_AND_CMS_CONFIGURATION**
