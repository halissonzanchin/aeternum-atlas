# Aeternum 26 — guia de composição da fundação visual

Data: 2026-07-29  
Escopo: Fundação Visual Aeternum 26, Fase 2

## Regra central

O vidro comunica hierarquia e interação. Ele não substitui o conteúdo. Toda
nova interface deve importar as primitivas de
`src/components/aeternum-26` e não criar `backdrop-filter`, raio, sombra ou
glow localmente.

## Materiais oficiais

| Material | Aplicação correta | Blur real | Persistência |
|---|---|---:|---|
| `clear` | chips, botões sobre imagem e controles compactos | 12 px | transitória |
| `regular` | toolbar, sidebar, tab bar e popover | 20 px | estrutural |
| `substantial` | modal e Tutor IA aberto | 28 px | somente durante foco |
| `opaque` | cards, métricas, formulários densos e tabelas | zero | persistente |

Em tablet e celular a escala de blur cai automaticamente. Com redução de
transparência, todos os materiais se tornam opacos.

## Limites de composição

- desktop e notebook: no máximo seis superfícies com blur real na viewport;
- tablet e celular: no máximo quatro;
- superfícies com blur nunca podem ser aninhadas;
- um card persistente sempre usa `A26Card` e material `opaque`;
- modal usa uma única superfície `substantial`; o backdrop apenas escurece;
- conteúdo interno do Tutor IA não adiciona uma segunda camada de blur;
- fundos e ilustrações podem usar gradientes, mas não simulam disponibilidade
  nem estado funcional.

O seletor de segurança
`[data-a26-blur="true"] [data-a26-blur="true"]` remove o blur da camada
interna caso uma composição incorreta escape para a interface.

## Primitivas

| Necessidade | Primitiva |
|---|---|
| recipiente material | `A26Surface` |
| ação textual | `A26Button` |
| ação apenas com ícone | `A26IconButton` |
| barra superior contextual | `A26Toolbar` |
| navegação lateral | `A26Sidebar` |
| navegação inferior/compacta | `A26TabBar` |
| conteúdo persistente | `A26Card` |
| indicador numérico | `A26Metric` |
| entrada de dados | `A26Field` |
| escolha entre poucos modos | `A26SegmentedControl` |
| decisão bloqueante | `A26Modal` |
| contexto transitório | `A26Popover` |
| ausência confirmada | `A26EmptyState` |
| operação em andamento | `A26LoadingState` |
| falha recuperável | `A26ErrorState` |
| origem e atualização de dado | `A26DataDisclosure` |
| conversa ativa com Atlas AI | `A26TutorSurface` |

## Estados e acessibilidade

- o alvo mínimo de toda ação é 44 × 44 px;
- foco usa `:focus-visible` e o token `--a26-shadow-focus`;
- botões possuem estados default, hover, active, disabled e loading;
- erro de campo usa `aria-invalid`, descrição vinculada e `role="alert"`;
- modal possui `role="dialog"`, `aria-modal`, foco inicial, retorno de foco,
  Escape e ciclo de Tab;
- popover fecha com Escape;
- reduced motion remove transições e animações não essenciais;
- reduced transparency torna materiais opacos;
- increased contrast fortalece bordas e foco.

## Tokens

Use exclusivamente o namespace semântico:

- `--a26-color-*`;
- `--a26-material-*`;
- `--a26-radius-*`;
- `--a26-shadow-*`;
- `--a26-space-*`;
- `--a26-motion-*`;
- `--a26-type-*`;
- `--a26-z-*`.

Tokens descrevem propósito, não valores visuais isolados. Uma tela não deve
codificar novamente a cor teal, o raio de card ou a intensidade do blur.

## Exemplo

```jsx
import {
  A26Button,
  A26Card,
  A26DataDisclosure,
  A26Toolbar
} from "../components/aeternum-26";

export function Example() {
  return (
    <>
      <A26Toolbar label="Ações">
        <A26Button variant="primary">Explorar</A26Button>
      </A26Toolbar>
      <A26Card>
        <h2>Conteúdo persistente</h2>
        <A26DataDisclosure summary="Origem dos dados">
          Fonte institucional validada.
        </A26DataDisclosure>
      </A26Card>
    </>
  );
}
```

## Legado e migração

`AeternumGlassSurface`, `Card` e `Modal` expõem temporariamente atributos
`data-a26-adapter`. Eles preservam compatibilidade durante as próximas fases,
mas não devem ser usados em telas novas. Uma redução de ocorrências antigas de
`backdrop-filter` é sempre permitida; um aumento falha em
`npm run test:a26-glass`.

O playground oficial está disponível apenas ao superadministrador em
`/super-admin/aeternum-26-foundation`.
