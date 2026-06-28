# FASE 8.17C — SECURE STATIC LESSON DECK EMBEDDING PLAN

## 1. Diagnóstico do Deck Gerado (MIRA Lab)
A auditoria sobre o `index.html` gerado pelo MIRA Lab (`aeternum-lesson-cranial-sagittal-prototype`) aponta as seguintes características:
- **Scripts Inline e Módulos JavaScript:** O deck faz uso intensivo de `<script type="module">` e scripts inline para inicialização de bibliotecas (Lucide, AOS, Three.js).
- **Importação Dinâmica e GLB:** Utiliza o `GLTFLoader` nativo do Three.js para o modelo `.glb`, o que acarreta a restrição de CORS, exigindo que o arquivo seja obrigatoriamente servido via HTTP/HTTPS, e não por protocolo estático `file://`.
- **CSS e Vendors:** Utiliza Tailwind via CDN script (`tailwind.js`), injetando CSS dinamicamente.
- **Isolamento Mandatório:** Se este HTML for injetado diretamente em um componente React (ex: usando `dangerouslySetInnerHTML`), ocorrerá **Global CSS Leakage** (Tailwind do deck sobrescrevendo estilos do App Shell) e **conflito de ciclo de vida do DOM** (React vs Three.js/AOS).

## 2. Arquitetura Proposta de Publicação de Decks
A arquitetura assegura isolamento total entre a autoria estática e o ecossistema reativo da Aeternum.

1. **MIRA Lab Externo (Autoria):** Ambiente local isolado, gerador do código estático, focado unicamente na concepção educacional.
2. **Pipeline de Exportação:** Scripts CI/CD que extraem o `index.html` e a pasta `assets/`, sanitizam se necessário, e computam checksum (SHA-256) dos artefatos.
3. **Storage Estático (Isolado):** Os decks validados são copiados para um bucket Supabase Storage (`/lessons/...`) ou CDN estático dedicado. O Domínio principal do App React **NÃO** expõe esses arquivos diretamente, minimizando risco de cross-origin exploitation se o deck for comprometido.
4. **Manifesto de Aulas:** Base de dados que gerencia a versão, status (Draft/Published) e metadados de cada deck (JSON estrito).
5. **Aeternum Lesson Player:** Componente React contêiner, desprovido de lógica de DOM do deck. Sua única responsabilidade é renderizar um `<iframe>` restrito apontando para a URL isolada da CDN.

## 3. Política Sandbox do Iframe
Para anular o risco inerente a dependências de terceiros no deck, o iframe será instanciado com o atributo `sandbox` restritivo:
```html
<iframe sandbox="allow-scripts" src="..."></iframe>
```
**O que é negado:**
- `allow-same-origin`: Iframe opera com origem nula (`"null"`), isolando acesso a `localStorage`, `cookies` e context session da Aeternum.
- `allow-top-navigation`: Previne phishing (deck forçando redirecionamento da tab mãe).
- `allow-forms`, `allow-popups`, `allow-modals`: Proibido input de credenciais ou spans maliciosos.

## 4. Content Security Policy (CSP) Específica para Decks
Os decks renderizados devem estar envelopados sob Headers HTTP (via bucket rules ou metatag HTML) estritos:
- `default-src 'none'`
- `script-src 'self' 'unsafe-inline' https://unpkg.com`: *Nota técnica* - o MIRA exige `unsafe-inline` e importação do three via CDN, então esta exceção deve ser tratada **exclusivamente no domínio da CDN das lessons**, blindando a Aeternum.
- `style-src 'self' 'unsafe-inline'`
- `img-src 'self' data:`
- `connect-src 'self'` (para carregar o modelo .glb do mesmo host).
- `frame-ancestors 'self' https://app.aeternumatlas.com`: Garante que só o ecossistema Aeternum pode embutir (anti-clickjacking).

## 5. Manifesto de Lessons
Registro estruturado na base de dados para governança da biblioteca de aulas.
```json
{
  "lessonId": "cranial-sagittal-intro-v1",
  "title": "Corte Sagital do Crânio Humano",
  "slug": "corte-sagital-cranio-humano-aula-interativa",
  "deckUrl": "https://cdn.aeternumatlas.com/lessons/cranial-sagittal/v1/index.html",
  "thumbnailUrl": "https://cdn.aeternumatlas.com/lessons/cranial-sagittal/v1/thumb.webp",
  "subject": "Anatomia Humana",
  "modelSlug": "corte-sagital-cranio-humano-superficial",
  "version": "1.0.0",
  "checksum": "sha256-abc123xyz...",
  "status": "published",
  "visibility": "student",
  "sandboxPolicy": "allow-scripts",
  "requiresHttp": true,
  "usesGlb": true,
  "assetBudgetMb": 18
}
```

## 6. Orçamento de Assets (Asset Budget)
Para preservar a experiência de Microlearning, impõe-se restrições de payload aos decks gerados:
- **Limite Global (MVP):** `25 MB` max.
- **Limite Global (Premium Desktop):** `50 MB` max.
- **3D Assets:** Proibido uso de models "Source" ou "High Quality". Obrigatório o uso das instâncias `*realityscan-performance.glb` (< 15 MB).
- **Mídia Visual:** Imagens em AVIF/WebP. Sem MP4/vídeos locais volumosos em aulas de 2 MB HTML.

## 7. Comunicação Iframe Segura (postMessage)
Se o deck precisar reportar progresso para o Aeternum LMS:
- **Iframe para App (Child -> Parent):**
  - Eventos autorizados: `lesson.ready`, `lesson.progress`, `lesson.completed`, `lesson.error`.
- **App para Iframe (Parent -> Child):**
  - Eventos autorizados: `lesson.pause`, `lesson.resume`, `lesson.setTheme`, `lesson.goToSlide`.
- **Mitigações Rígidas:** O React App deverá validar o parâmetro `origin` no `messageEvent`. Nenhum Payload HTML ou string arbitrária que fuja do schema estrito deve ser avaliada (apenas Enums previstos). Sessão e JWT nunca trafegarão por postMessage.

## 8. Governança Editorial
O fluxo de vida do deck compreende os estados:
1. `draft`: Construído no MIRA e submetido.
2. `technical_review`: Inspeção das restrições de HTML, CSS, CSP e limits de budget (MB).
3. `anatomical_review`: Médico validador confere o embasamento do conteúdo.
4. `security_review`: Garantia formal que nulo código obfusco está embarcado.
5. `published`: Asset ativado no Supabase, status liberado na biblioteca final.
6. `archived`: Conteúdo descontinuado.

## 9. Rotas e Componentes Futuros (Documentação)
Prepara-se o terreno para a implementação (fora do escopo atual):
- **Rotas:**
  - `/lessons` (Portal público das aulas)
  - `/lessons/:lessonSlug` (Player Fullscreen)
  - `/admin/lessons` (Gestão de status e envio)
- **Componentes React Essenciais:**
  - `LessonLibraryPage`: Showcase das aulas com thumbs.
  - `LessonPlayerPage`: Skeleton loading e Header contextual de aula.
  - `LessonIframeSandbox`: O core isolation wrapper.

## 10. Decisão Final
A estratégia apresentada neutraliza o vetor de superfície de ataque vindo do HTML bruto sem perder a rica dinâmica e imersão que o protótipo gerou com seus assets estáticos.

**Decisão Mandatória:**
`READY_FOR_8_17D_LESSON_PLAYER_SANDBOX_PROTOTYPE`
