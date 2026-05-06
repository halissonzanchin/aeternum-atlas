# Aeternum Atlas

**Aeternum Atlas** é uma plataforma acadêmica personalizada para acervo anatômico 3D institucional. O MVP foi construído em React/Vite para demonstrar uma experiência SaaS B2B educacional com áreas separadas para aluno, professor, administração institucional e super admin.

> O foco do produto é permitir que cada instituição opere sua própria biblioteca anatômica 3D privada, com modelos, conteúdos complementares, progresso acadêmico, analytics e base para relatórios institucionais.

## Funcionalidades

- Home pública institucional com suporte multilíngue.
- Área do aluno com dashboard acadêmico, modelos 3D, atlas anatômico, agenda de estudo, favoritos e progresso.
- Viewer 3D integrado ao Sketchfab Viewer API para o modelo do coração.
- Área do professor com turmas, alunos, guias de estudo, aulas, anotações anatômicas e relatórios acadêmicos.
- Área administrativa com KPIs institucionais, alunos, analytics globais, faturamento estimado e relatórios.
- Super admin com visão executiva da operação institucional.
- Internacionalização em português, espanhol, inglês e alemão.
- Dados mockados e persistência local via `localStorage`, preparando a evolução para backend real.

## Stack

- React 18
- Vite 5
- JavaScript/JSX
- CSS modular por componentes
- TypeScript configurado para validação incremental
- Sketchfab Viewer API
- Netlify-ready SPA routing

## Requisitos

- Node.js 18.14 ou superior
- npm
- Git

## Rodar Localmente

```bash
npm install
npm run dev
```

Depois acesse:

```txt
http://localhost:5173/
```

## Scripts

```bash
npm run dev
npm run typecheck
npm run build
npm run preview
```

## Estrutura Principal

```txt
src/
  components/
  context/
  data/
  hooks/
  i18n/
  layouts/
  pages/
  services/
  styles/
  utils/
```

## Deploy no Netlify

O projeto está preparado para deploy como SPA no Netlify.

Build command:

```txt
npm run build
```

Publish directory:

```txt
dist
```

O arquivo `netlify.toml` inclui redirect para `index.html`, garantindo que rotas client-side como `/dashboard`, `/teacher/dashboard`, `/super-admin` e `/viewer/coracao-humano-superficial` funcionem após reload.

## Variáveis de Ambiente

O MVP atual não exige variáveis de ambiente obrigatórias.

Quando houver backend real, use apenas variáveis públicas com prefixo `VITE_` no frontend. Segredos de API não devem ser expostos no cliente.

## Política de Git

Arquivos que não devem ir para o GitHub:

- `node_modules/`
- `dist/`
- `.env*`
- `.netlify/`
- logs e caches locais

## Roadmap Técnico

- Conectar autenticação real por role.
- Persistir dados em backend institucional.
- Substituir mocks por APIs.
- Expandir biblioteca anatômica por instituição.
- Exportar relatórios PDF/CSV com dados reais.
- Integrar observabilidade e analytics de produção.
