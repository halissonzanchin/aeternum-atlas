# ATLAS CADAVERIC SCAN VIEWER: VISÃO DE ARQUITETURA

## 1. Mudança de Rota e Visão Correta
A Aeternum Atlas abandona oficialmente a tentativa de replicar visualizadores de "anatomia sintética em camadas" (como o *Complete Anatomy* ou *BioDigital*), onde o corpo humano é dividido artificialmente por sistemas (esquelético, muscular, nervoso) compostos por milhares de *meshes* separadas.

O foco singular, definitivo e principal do **Atlas Native Viewer** é operar como um **Visualizador de Scans Cadavéricos**. 
Os professores e curadores farão upload de modelos anatômicos reais (peças de cadáveres escaneadas via fotogrametria ou scanner 3D de alta precisão). Esses modelos vêm como uma malha única (ou blocos unificados) com foco hiper-realista em textura fotográfica e não em segmentação em camadas de sistemas corporais.

## 2. Diferença Crítica na Arquitetura
| Anatomia Sintética (Antiga Rota) | Scan Cadavérico Real (Atlas Engine) |
| :--- | :--- |
| Milhares de meshes independentes. | Malha unificada (Fotogrametria densa). |
| Foco em "Ocultar Músculo", "Isolar Osso". | Foco em "Orbitar peça e Ler Textura Real". |
| Iluminação genérica de estúdio (plástico/sintético). | PBR e iluminação que valorize o Specular/Roughness de tecidos biológicos reais. |
| Marcadores apontam para uma "Peça" específica. | Marcadores (`Annotations`) apontam para uma coordenada espacial e vetorial X,Y,Z exata no bloco escaneado. |

## 3. Substituição do Sketchfab
A Aeternum Atlas substitui plataformas como o Sketchfab oferecendo um motor desenhado não para entretenimento, mas para **ensino médico profundo**.
Recursos que o Atlas precisa garantir como equivalentes ou superiores ao Sketchfab:
- **Órbita Impecável:** O *OrbitControls/CameraControls* não pode prender, dar soluços ou perder a centralização, independentemente de onde o modelo esteja no mundo 3D.
- **Auto-Framing Perfeito:** O modelo cadavérico deve preencher a tela harmoniosamente ao abrir a aba.
- **Interatividade Educacional Direta:** Criação de pontos de ancoragem (Pinos) que não apenas exibem Tooltips minúsculos, mas abrem gavetas ricas de texto, imagem e vídeo didático na plataforma.
- **Cinemática Suave:** Ao clicar num Pino, o visualizador deve orquestrar a câmera (*Fly-to*) recriando a lente exata e o ângulo que o professor via no momento em que criou o marcador.
- **Streaming de Asset:** Capacidade de puxar modelos massivos sem a tela piscar (através de Draco, Meshopt e LOD).

## 4. Priorização Descartada (Pausada)
O módulo de **Structure Isolation Engine** (FASE 8.4F antiga), que propunha o desenvolvimento de `hideStructure()`, `isolateStructure()` ou controle de transparência (Opacidade) individual por osso/músculo, está oficialmente cancelado da rodada técnica imediata.
*Justificativa:* Scans cadavéricos não possuem essas subdivisões nativamente. Todo o esforço de processamento deve ser canalizado para **Performance de Textura, Câmera e Pinos Educacionais**. O isolamento só voltará à pauta no futuro distante caso a curadoria adicione acervos sintéticos.

## 5. Checklist Sketchfab-like (Core)
- [ ] Rotação Orbital Suave
- [ ] Zoom Progressivo e Pan Controlado
- [ ] Auto-fit do modelo na câmera (`<Bounds fit>`)
- [ ] Centralização automática (`<Center>`)
- [ ] Botão de Reset View
- [ ] Modo Fullscreen Integrado
- [ ] Marcador (Pino) dinâmico e estético (Distant-factor scaling)
- [ ] Pino perfeitamente clicável (`three-mesh-bvh` aplicado)
- [ ] **Fly-to Camera**: Câmera "voa" até o marcador e o alinha no centro (Próxima Fase)
- [ ] Painel lateral de informação anatômica imersivo
- [ ] Loading progress/spinner elegante (Suspense)
- [ ] Fallback Visual de erro sem quebrar a UI
- [ ] Renderização PBR de Textura Realista (Normals, Roughness)
- [ ] Iluminação limpa com Sombras Opcionais e Exposição ajustável

## 6. Camera Fly-To Marker Engine (Fase 8.4G)
**Por que a câmera salva é essencial?**
Um marcador simples apenas exibe um texto estático quando clicado. Em modelos complexos de fotogrametria, a estrutura que o marcador aponta muitas vezes está "escondida" atrás de outras dobras cadavéricas, ou precisa ser vista de um ângulo microscópico específico.

O **Marcador Guiado** resolve isso. O fluxo agora obriga:
1. **Professor (Editor):** Encontra o melhor ângulo, o nível de zoom perfeito e a iluminação. Cria o pino e clica em *"Capturar Posição Atual"*. O sistema serializa a posição da lente, o alvo de órbita (`target`) e anexa no banco.
2. **Aluno (Viewer):** Ao clicar no Pino, o motor engatilha o algoritmo matemático `.setLookAt(...)` que interpola os vetores antigos para os vetores do professor, recriando exatamente a mesma cena óptica.
3. **Fallback Inteligente:** Se um marcador antigo do sistema foi criado sem a captura de lente, o motor detecta a caixa matemática do objeto (`BoundingBox`), extrai o centro do clique e empurra a câmera com segurança 30% para trás (`Safe Distance Offset`), impedindo que a lente atravesse o objeto cadavérico.
Isso sela o compromisso de replicar o ecossistema magnético do *Sketchfab* de forma nativa e ilimitada para o Atlas.

## 7. Photorealistic Cadaveric Scan Rendering (Fase 8.4H)
**O objetivo da fidelidade anatômica**
A Aeternum Atlas visa entregar escaneamentos fotorrealistas de peças anatômicas preservando o máximo da cor real, irregularidades, relevo e opacidade dos tecidos biológicos originários da fotogrametria. Modelos não devem se parecer com plástico, nem possuir a iluminação dramática ("cinematográfica") típica de jogos e filmes. A prioridade é a clareza didática: "Realismo Clínico".

**Iluminação e Presets de Renderização**
O ambiente foi purgado de luzes artificiais contrastantes, dando lugar a uma iluminação de estúdio médico suave:
- **Tone Mapping:** `ACESFilmicToneMapping` é utilizado nativamente no WebGL (`<Canvas>`) para calibrar as cores das texturas sRGB, prevenindo a saturação extrema nas áreas luminosas. A exposição é moderada (Preset: `clinical`), mantendo as regiões brancas claras, porém sem estourar os relevos (clipping).
- **Setup de Luzes Clínico:** Um conjunto tri-point minimalista com intensidade controlada: *Key Light* (frontal) difusa sem projeção de sombras duras que possam poluir o detalhamento anatômico; *Fill Light* suave; e uma *Rim Light* tênue apenas para gerar leitura do volume no fundo. O fundo é mantido em uma cor neutra profunda e profissional (ex: `#15181E`).
- **Device Pixel Ratio (DPR) Adaptativo:** O Canvas consulta o perfil de hardware (`detectAtlasDeviceProfile`) do usuário limitando a densidade de pixels no renderizador (`1.0` a `2.0`). Isso blinda GPUs medianas de notebooks de travarem frente aos milhões de triângulos anatômicos, mas libera a qualidade total para máquinas de pesquisa e clínicas que suportam DPR=2.

**Preservação e Anti-plástico das Texturas Físicas (PBR)**
Por defeito de exportadores GLB comuns (Blender, Cinema4D, Maya), materiais anatômicos acabam adotando valores espúrios de `metalness` ou `roughness` brilhoso/metálico, transformando peças de carne em cerâmica reluzente.
A função de blindagem de materiais `normalizeCadavericMaterial(material)` atua em tempo de carregamento no motor de render:
1. Fixa a `metalness` do material sempre em zero, garantindo que o tecido biológico responda apenas à luz difusa.
2. Aumenta a base de rugosidade (`roughness = 0.75`) para tecidos desregulados que vêm com `roughness < 0.4`, extinguindo o brilho plástico instantaneamente sem substituir, achatar ou estragar os originais mapas de cor e relevo (`normalMap`).

Essa abordagem assegura que o acervo visual se mantenha autêntico, estável e livre das idiossincrasias sintéticas que contaminam os visualizadores tradicionais.

## 8. Viewer UX Professional Edition (Fase 8.4I)
**A Experiência Definitiva do Aluno**
Para proteger a interface de curadoria (Editor Visual 3D) contra poluição de componentes de ensino, a interface final do aluno foi isolada em um "Wrapper" chamado `AtlasViewerShell.jsx`. O Shell envelopa o motor 3D bruto (`AtlasViewer.jsx`) e injeta painéis de navegação ergonômicos e funcionais de nível acadêmico.

**Componentes Principais da UX:**
- **Toolbar de Controle (`AtlasViewerToolbar`):** Flutua de forma não obstrutiva na parte inferior. Permite comutação rápida de `QualityToggle` (Performance/Balanceado/Clínico) acionando dinamicamente o DPR do WebGL; aciona `Fullscreen`; e realiza o `Reset View` nativo.
- **Gaveta de Pontos Anatômicos (`AtlasMarkerPanel`):** Um painel lateral recolhível (Drawer) listando as estruturas tagueadas na peça fotogramétrica. Cada card na gaveta pode acionar cinematicamente a lente 3D ("Fly-To Camera") sem engessar a sessão orbital do usuário.
- **Modos de Operação Dinâmicos:**
  - *Study Mode:* Abre automaticamente mini-painéis associados aos pinos em foco.
  - *Presentation Mode:* Limpa a interface para exibição em sala de aula ou projetor.

O Editor permanece rodando apenas o `AtlasViewer` isoladamente, permitindo que a equipe de administração posicione coordenadas, capture ângulos de lente e gere conhecimento num ambiente vazio e limpo, enquanto os estudantes aproveitam o ecossistema `AtlasViewerShell` ricamente construído.

## 9. Cadaveric Scan Upload QA Pipeline (Fase 8.4J)
**Barreira Administrativa de Entrada**
Para evitar que malhas pesadíssimas (OBJ/GLB) travem as turmas e os alunos nas pontas, todo novo arquivo 3D upado para a plataforma Atlas agora deve passar pelo `AtlasAssetQAPanel` situado dentro do Editor de Curadoria do CMS.
Ele levanta um laudo heurístico extraído do peso do arquivo e das limitações geométricas do formato (`.obj` ou `.glb`), gerando um `qaScore` e status final preventivo (`approved`, `needs_optimization` ou `rejected`). Isso impede que o administrador defina o ativo como "Publicado" caso o arquivo 3D ultrapasse a tolerância da VRAM permitida para Mobile WebGL.

## 10. Publication Gate (Fase 8.4K)
O CMS possui uma barreira heurística que impede a publicação indiscriminada de recursos anatômicos não-testados ou oriundos de scans brutos (`.obj`).
Apenas após aprovação de performance no `AtlasAssetQAPanel` (Fase 8.4J) é que o motor habilita a visualização client-side pelo aluno.

---

## VII. Cadaveric Scan Production Readiness (Fase 8.4L)
Todo o ecossistema WebGL nativo (`AtlasViewer`, Pipeline Draco, Upload Localizado, Publicação Bloqueada e Controles Orbitais Médicos) foi empacotado para uso contínuo em Produção.

### Classificação Estrutural: READY WITH WARNINGS
**Justificativa de Status:** A arquitetura do *Atlas Viewer Shell* foi consolidada, e a compilação local de dependências reage sem fatalidades.
- O Upload é dissociado da visualização, com uma antessala rigorosa (Gate).
- O *Editor Visual 3D* permite a inserção livre de marcações, dissociado da camada estética estudantil (`UX Professional`).
- **Warning:** Validações futuras em campo (Devices muito antigos / Dispositivos iOS de pouca RAM) devem ser catalogadas na *LOD Manager Foundation* para evitar *Context Loss* do WebGL durante a carga de scans de altíssima fidelidade.
