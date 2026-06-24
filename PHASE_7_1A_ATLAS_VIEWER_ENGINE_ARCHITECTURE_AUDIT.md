# ATLAS VIEWER ENGINE ARCHITECTURE AUDIT (Fase 7.1A)
**Laudo de Migração 3D Engine (Sketchfab → WebGL Nativo)**

## 1. Auditoria do Viewer Atual (Sketchfab)
* **Como o Sketchfab é carregado:** Através do componente `ModelViewer.jsx` injetado por `ViewerSketchfab.jsx`, que encapsula a API de *Iframe* do Sketchfab para escutar cliques 3D e anotações.
* **Componentes de Controle:** O arquivo central é `ViewerPage.jsx` gerando o *ViewerContext*, orquestrando `useViewerModel`, `useViewerAnnotations` e o sistema de Quiz/Progresso.
* **Mecânica das Anotações e Quizzes:** Atualmente, o quiz pausa e escuta o evento `annotationSelect` disparado de dentro do Iframe do Sketchfab via `onAnnotationSelect` repassado ao React.

## 2. Estratégia de Coexistência (O Padrão Híbrido)
Para não quebrar os 150+ modelos existentes:
* Injetar no Supabase Database (Tabela `models`) uma coluna nova: `viewer_engine VARCHAR DEFAULT 'sketchfab'`.
* No `ViewerPage.jsx`, instanciar um roteador:
  ```jsx
  {model.viewer_engine === 'atlas' ? <ViewerAtlas3D /> : <ViewerSketchfab />}
  ```
* Modelos novos carregarão a Engine Nativa. Modelos antigos mantêm o iframe.

## 3. Dependências Necessárias (Não instaladas ainda)
* `three`: O motor matemático e de renderização WebGL base.
* `@react-three/fiber`: A ponte declarativa entre Three.js e React.
* `@react-three/drei`: Utilitários fundamentais (OrbitControls, Environment Maps, Loaders, HTML Overlays para criar os pins/anotações anatômicas flutuantes).

## 4. Estrutura de Arquivos Proposta
```text
src/features/atlas-viewer/
├── AtlasViewer.jsx        # (O Wrapper equivalente ao ViewerSketchfab atual)
├── AtlasScene.jsx         # (Canvas e Orquestração do R3F)
├── ModelLoader.jsx        # (useGLTF e instanciamento da malha 3D)
├── CameraControls.jsx     # (OrbitControls com limites de zoom/pan)
├── LightingRig.jsx        # (Iluminação clínica polarizada)
├── ViewerToolbar.jsx      # (Controles nativos de corte/camadas)
├── ViewerFallback.jsx     # (Loading de progresso e Tela de Erro WebGL)
└── hooks/useAtlasViewer.js
```

## 5. Formato de Modelo Recomendado
* **Formato Primário:** `.glb` (GL Transmission Format Binário) por carregar tudo (malha + textura) num arquivo único compacto.
* **Especificações Clínicas:** 
  - Limite de Polígonos: Máximo de 300.000 faces/triângulos (Decimated).
  - Tamanho em MB: Ideal < 15MB, máximo 35MB para redes móveis institucionais.
  - Texturas: "Baked" internamente na resolução 2K, utilizando compressão Draco se possível.

## 6. Armazenamento Cloud (Storage)
* **Recomendação Inicial:** *Supabase Storage*. Permite uso do RLS (Row Level Security) nativo da plataforma, proibindo o download direto de arquivos `.glb` por usuários não logados, protegendo a propriedade intelectual cadavérica da Aeternum contra pirataria.
* **Estratégia Futura (Enterprise):** *Cloudflare R2*. Quando o tráfego global for massivo, o R2 tira as taxas de *Egress* (Banda de Saída), gerando economia brutal em comparação à AWS S3.

## 7. Segurança de Permissões RLS (Supabase)
* **Aluno/Professor:** `SELECT` na bucket `atlas-models` validado por JWT.
* **Coordenador/Reitor:** `SELECT` e extração de metadados.
* **Admin Anatômico:** Permissão exclusiva de `INSERT/UPDATE` no painel de CMS (Fase 7.1F) para publicar o `.glb`.
* **Proteção de Cors:** O Supabase negará a renderização do GLB fora do domínio `aeternumatlas.com`.

## 8. Estratégia de Migração (Sketchfab → Atlas)
* **Passo 1:** Criar a infraestrutura e subir 1 modelo piloto (Ex: "Base do Crânio Native").
* **Passo 2:** Validar fluidez do framerate em iOS Safari e Chrome Desktop comparado ao iframe do Sketchfab.
* **Passo 3:** Reconstruir o parser de "Anotações" do Sketchfab API para marcações `Html` flutuantes do `@react-three/drei`.

## 9. MVP Técnico Definido (Fase 7.1B/C)
1. Canvas do React-Three-Fiber.
2. Renderização de um `.glb` salvo temporariamente na pasta `/public/models/`.
3. Controles puros (Rotacionar, Zoom).
4. Iluminação cirúrgica fria (Luz ambiente e pontual estática).
5. Tela de erro nativa caso WebGL não seja suportado pela GPU.

## 10. Riscos Principais
* **Vazamento de Memória (Memory Leak):** React Three Fiber requer destruição explícita (unmount) de geometrias para o navegador não travar na troca rápida entre modelos.
* **Incompatibilidade Mobile (Limites de Contexto WebGL):** Dispositivos móveis antigos não aguentam texturas 4K.

## 11. Roadmap Técnico (Próxima Fase)
* **FASE 7.1B:** Instalação limpa das dependências `three`, `@react-three/fiber`, e `@react-three/drei` e montagem do esqueleto local (Canvas Vazio + Orbit Controls), validando integração com o build do Vite.
