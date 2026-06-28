# FASE 8.13B — PREMIUM ANNOTATION MARKERS E CAMERA-AWARE SCALING

## Diagnóstico do Problema Anterior
No Viewer 3D e Editor do Super Admin, os marcadores de anotação (pins) tinham aspecto visual "rústico", exibindo letreiros gigantes diretamente no canvas 3D (ex: "1. Novo Marcador"), cobrindo de forma obstrutiva as peças anatômicas. A escala não reagia de forma fluida à aproximação da câmera (zoom in resultando em textos enormes ou ilegíveis) prejudicando a experiência de observação imersiva e a legibilidade de estruturas delicadas, sem a sensação profissional encontrada no Sketchfab ou visualizadores topo de gama.

## Arquivos Alterados
- `src/features/atlas-viewer/components/AtlasAnnotationMarkers.jsx`

## Arquitetura dos Novos Pins (Premium Markers)
- Foi extraído um subcomponente focado (`<MarkerItem>`) que empacota de forma limpa cada elemento individual, garantindo que efeitos de zoom, halo ou ativação aconteçam de forma encapsulada.
- O Pin foi completamente reestilizado (Identity: Aeternum): redondo, compacto, portando somente a numeração ou "D1" no caso de rascunhos. 
- Semelhante a ferramentas especializadas (como o Sketchfab), títulos gigantes foram removidos.
- Efeitos refinados de blur (*backdrop-blur-md*), halo (*glow shadow amber/teal*) e transições suaves (*hover:scale-110*) foram implementados sem comprometer a semântica ou usabilidade.

## Camera-Aware Scaling
- O pino agora sabe a que distância a câmera está dele, sem impactar o Framerate.
- O hook `useFrame` do `@react-three/fiber` monitora `camera.position.distanceTo(markerPos)` a cada *tick*.
- O fator de escala é calculado dinamicamente e interpolado via `style.transform` direto no DOM da `<div>`, poupando a engine de renders desnecessários no React.
- Foi adotada a lógica matemática de Clamp para limitar o tamanho mínimo (`0.65`) e máximo (`1.15`), permitindo que a numeração não fique minúscula caso a câmera afaste muito e o pino não ocupe metade da tela caso haja forte zoom-in em um detalhe clínico.

## Comportamento do Popover Premium
- A descrição que antes acompanhava os marcadores foi migrada para um modal flutuante com identidade *Glassmorphism* negra, opacidade ajustada e bordas de destaque. 
- Ele foi configurado de forma condicional para só instanciar quando o marcador for ativamente selecionado (`isSelected`).
- Nele constam título em destaque, a flag "DRAFT" (quando pertinente), categoria, além de áreas de rolagem personalizadas e *scrollbar* compacta para descrição anatômica extensa e nota clínica.
- Um truque de `pointer-events-auto` somado a `stopPropagation()` garantiu que o clique não "vaze" nem interfira com os OrbitControls nativos da cena 3D.

## Integração (Admin & Aluno)
- **Super Admin**: A função de "+ Adicionar" insere tranquilamente o "Novo Marcador", contudo, o nome "Novo Marcador" não transborda e polui a cena. Apenas uma representação visual limpa no pin, sendo que suas descrições continuam integradas ao Editor Lateral de marcadores.
- **Student Viewer (Aluno/Público)**: O Render Studio, Tutor IA, Quality Tiers, e simulações do Coração ou Crânio se manterão intocadas, porém as anotações visuais oferecerão navegação livre e imersiva.

## Testes & Responsividade
- O `useFrame` e transições funcionaram harmoniosamente em simulações desde 390x844 (Mobile, evitando saturação na tela e utilizando responsividade na largura do Popover `w-56 sm:w-64`) até ultra HDs.
- `npm run build` retornou sucesso na compilação sem falhas no módulo Vite/Rollup.

## Decisão Final
`READY_FOR_8_15A_SIMULATOR_PREMIUM_IOS_SIRI_UI_UPGRADE`
