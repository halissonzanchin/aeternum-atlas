# ATLAS VIEWER ENGINE: PREPARAÇÃO DE CMS E ROTEAMENTO (Fase 7.1D)
**Laudo de Modularização de Decodificadores e Mock Dinâmico**

## 1. Contexto Estrutural
O avanço para a Fase 7.1D cimentou a separação de responsabilidades na Engine WebGL. O *AtlasViewer.jsx* deixou de ser um renderizador monolítico rígido e assumiu o papel de **Roteador Tridimensional**. Ele agora recebe meta-dados e delega o processamento da malha para sub-decodificadores otimizados (Loaders).

## 2. Abstração de Loaders
Foram injetados dois módulos paralelos na pasta `/src/features/atlas-viewer/loaders/`:

### AtlasGLBLoader
Envelopa a mecânica primária do `useGLTF`. Os arquivos `.glb` (GL Transmission Format Binário) permanecem como o padrão platina da Aeternum, pois acoplam textura fotogramétrica e malha cadavérica em um único fluxo de bits eficiente. A limpeza de memória (`useGLTF.clear`) permanece alocada ao *unmount* dessa etapa.

### AtlasOBJLoader
Prepara a fundação para lidar com os arquivos abertos de ecocardiogramas ou tomografias `.obj`. A mecânica `useLoader(OBJLoader, url)` escaneia a malha e aplica, através do ciclo do `useMemo`, um material padrão clínico (*off-white* de rugosidade 0.6) a todos os nós filhos (`child.isMesh`), garantindo visibilidade mesmo sem textura atrelada no momento.

## 3. Parametrização Base do Motor
O núcleo (`AtlasViewer.jsx`) agora obedece ao contrato arquitetural orientado a React Props:
* `modelUrl` (O caminho ou Bucket S3).
* `modelFormat` (A flag decodificadora: 'glb' ou 'obj').
* `markers` (A árvore iterável de objetos de intersecção).

Um fallback assertivo (`UnsupportedFormatFallback`) intercepta arquivos corrompidos (Ex: `modelFormat === 'fbx'`) e emite um alerta UI bloqueante nativo, informando a falta de suporte pelo motor sem travar a thread.

## 4. Orquestração Supabase Híbrida (`ViewerPage.jsx`)
Foi instalado um bypass estratégico no contêiner principal para alinhar com as propriedades dinâmicas originárias do backend no futuro:
```jsx
<AtlasViewer 
  modelUrl={modelState.model.model_url || "/models/test-anatomy.glb"} 
  modelFormat={modelState.model.model_format || "glb"}
  markers={modelState.model.markers || atlasMarkersMock}
/>
```
Isso amarra o futuro CMS 3D ao motor sem forçar a migração de banco neste momento. Apenas peças declaradas como `viewer_engine === 'atlas'` sofrerão renderização sob esta via.

## 5. Saldo Operacional
A *Virtual DOM* foi compilada via Vite sem erros estruturais (`npm run build`). A infraestrutura WebGL nativa está agora adaptável e purgada de hardcodes monolíticos de URL, permitindo expansão fluída assim que o Painel do Administrador (CMS) despachar uploads de arquivos proprietários à nuvem de armazenamento.
