/* eslint-disable no-unused-vars -- o parser ESLint atual não contabiliza identificadores usados apenas em JSX */
import { useState } from "react";
import LineIcon from "../../components/icons/LineIcon";
import {
  A26Button,
  A26Card,
  A26DataDisclosure,
  A26EmptyState,
  A26ErrorState,
  A26Field,
  A26IconButton,
  A26LiquidLens,
  A26LoadingState,
  A26Metric,
  A26Modal,
  A26Popover,
  A26SegmentedControl,
  A26Sidebar,
  A26Surface,
  A26TabBar,
  A26Toolbar,
  A26TutorSurface
} from "../../components/aeternum-26";
import "./A26FoundationPlayground.css";

const materials = [
  {
    id: "clear",
    title: "Clear",
    use: "Chips, controles sobre imagem e toolbars compactas.",
    blur: "12 px"
  },
  {
    id: "regular",
    title: "Regular",
    use: "Navegação, menus e painéis flutuantes.",
    blur: "20 px"
  },
  {
    id: "substantial",
    title: "Substantial",
    use: "Modal, Tutor aberto e foco crítico.",
    blur: "28 px"
  },
  {
    id: "opaque",
    title: "Opaque",
    use: "Cards persistentes, tabelas e conteúdo denso.",
    blur: "zero"
  }
];

export default function A26FoundationPlayground() {
  const [segment, setSegment] = useState("visão");
  const [modalOpen, setModalOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <section className="a26-playground" data-testid="a26-foundation-playground">
      <A26Surface material="regular" tone="teal" className="a26-playground__hero">
        <div>
          <span className="a26-kicker">Fundação Visual · Fase 2</span>
          <h1>Aeternum 26</h1>
          <p>
            Um sistema material único para hierarquia, legibilidade, resposta
            óptica e degradação responsável.
          </p>
        </div>
        <span className="a26-playground__status">
          <span aria-hidden="true" />
          Contrato ativo
        </span>
      </A26Surface>

      <A26Toolbar label="Ações da fundação" className="a26-playground__toolbar">
        <A26Button variant="primary" icon={<LineIcon name="spark" className="h-4 w-4" />}>
          Ação primária
        </A26Button>
        <A26Button variant="secondary">Secundária</A26Button>
        <A26Button variant="ghost">Transparente</A26Button>
        <A26IconButton label="Abrir opções" icon="settings" onClick={() => setPopoverOpen(value => !value)} />
        <div className="a26-playground__popover-anchor">
          <A26Popover open={popoverOpen} label="Opções da fundação" onClose={() => setPopoverOpen(false)}>
            <span className="a26-kicker">Popover regular</span>
            <h2>Contexto preservado</h2>
            <p>O material flutua acima do conteúdo sem se tornar uma nova página.</p>
          </A26Popover>
        </div>
      </A26Toolbar>

      <section className="a26-playground__section" aria-labelledby="a26-materials-title">
        <header className="a26-playground__section-header">
          <div>
            <span className="a26-kicker">Sistema material</span>
            <h2 id="a26-materials-title">Quatro materiais. Uma hierarquia.</h2>
          </div>
          <code>data-a26-material</code>
        </header>
        <div className="a26-playground__materials">
          {materials.map(material => (
            <A26Surface
              key={material.id}
              material={material.id}
              interactive
              className="a26-playground__material"
            >
              <span className="a26-playground__material-index">0{materials.indexOf(material) + 1}</span>
              <h3>{material.title}</h3>
              <p>{material.use}</p>
              <small>{material.blur} de blur nominal</small>
            </A26Surface>
          ))}
        </div>
      </section>

      <section className="a26-playground__section" aria-labelledby="a26-controls-title">
        <header className="a26-playground__section-header">
          <div>
            <span className="a26-kicker">Controles e estados</span>
            <h2 id="a26-controls-title">Interação legível e tátil</h2>
          </div>
          <span>Alvos mínimos de 44 × 44 px</span>
        </header>

        <div className="a26-playground__two-column">
          <A26Card>
            <h3>Controles</h3>
            <A26SegmentedControl
              label="Densidade da demonstração"
              value={segment}
              onChange={setSegment}
              options={[
                { value: "visão", label: "Visão" },
                { value: "detalhe", label: "Detalhe" },
                { value: "dados", label: "Dados" }
              ]}
            />
            <div className="a26-playground__button-row">
              <A26Button variant="primary">Ativo</A26Button>
              <A26Button variant="secondary">Padrão</A26Button>
              <A26Button variant="secondary" loading>Carregando</A26Button>
              <A26Button variant="secondary" disabled>Desabilitado</A26Button>
              <A26Button variant="danger">Crítico</A26Button>
            </div>
            <div className="a26-playground__fields">
              <A26Field
                label="Buscar conteúdo anatômico"
                placeholder="Nome, região ou sistema"
                hint="A busca mantém contexto e filtros."
              />
              <A26Field
                label="Campo com validação"
                defaultValue="Contrato incompleto"
                error="Informe uma origem institucional válida."
              />
            </div>
            <A26Button variant="secondary" onClick={() => setModalOpen(true)}>
              Abrir modal substantial
            </A26Button>
          </A26Card>

          <div className="a26-playground__states">
            <A26LoadingState
              title="Validando fonte"
              text="Nenhuma métrica será exibida antes da confirmação."
            />
            <A26EmptyState
              title="Sem registros"
              text="A consulta terminou sem dados para o escopo atual."
              action={<A26Button variant="secondary">Revisar filtros</A26Button>}
            />
            <A26ErrorState
              title="Fonte indisponível"
              text="O conteúdo existente foi preservado. Tente novamente."
              action={<A26Button variant="danger">Tentar novamente</A26Button>}
            />
          </div>
        </div>
      </section>

      <section className="a26-playground__section" aria-labelledby="a26-data-title">
        <header className="a26-playground__section-header">
          <div>
            <span className="a26-kicker">Conteúdo persistente</span>
            <h2 id="a26-data-title">Dados permanecem opacos</h2>
          </div>
          <span>Zero blur em leitura densa</span>
        </header>
        <div className="a26-playground__metrics">
          <A26Metric label="Modelos institucionais" value="—" detail="Fonte ainda não conectada" />
          <A26Metric label="Referências locais" value="3" detail="Origem identificada" tone="teal" />
          <A26Metric label="Contraste" value="AA" detail="Texto e controles essenciais" trend="Gate aprovado" tone="gold" />
        </div>
        <A26DataDisclosure summary="Origem e atualização dos dados" meta="Contrato de verdade">
          Valores ausentes usam “—”. Zero é reservado para contagens confirmadas,
          e nenhuma telemetria é convertida em disponibilidade sem eventos reais.
        </A26DataDisclosure>
      </section>

      <section className="a26-playground__section" aria-labelledby="a26-navigation-title">
        <header className="a26-playground__section-header">
          <div>
            <span className="a26-kicker">Navegação adaptativa</span>
            <h2 id="a26-navigation-title">Sidebar, toolbar e tab bar</h2>
          </div>
          <span>Regular para estrutura, Clear para ação</span>
        </header>
        <div className="a26-playground__navigation-samples">
          <A26Sidebar label="Demonstração de navegação lateral">
            <span className="a26-kicker">Navegação estrutural</span>
            <A26Button variant="secondary">Visão geral</A26Button>
            <A26Button variant="ghost">Componentes</A26Button>
            <A26Button variant="ghost">Acessibilidade</A26Button>
          </A26Sidebar>
          <A26TabBar label="Demonstração de navegação inferior">
            <A26Button variant="secondary">Visão geral</A26Button>
            <A26Button variant="ghost">Componentes</A26Button>
            <A26Button variant="ghost">Acessibilidade</A26Button>
            <A26Button variant="ghost">Performance</A26Button>
          </A26TabBar>
        </div>
      </section>

      <section className="a26-playground__section" aria-labelledby="a26-tutor-title">
        <header className="a26-playground__section-header">
          <div>
            <span className="a26-kicker">Entidade compartilhada</span>
            <h2 id="a26-tutor-title">Tutor Atlas AI & Lente Física</h2>
          </div>
          <span>Substantial somente quando aberto</span>
        </header>
        <A26TutorSurface
          state="thinking"
          actions={
            <>
              <A26Button variant="primary">Explicar contexto</A26Button>
              <A26Button variant="secondary">Criar revisão</A26Button>
            </>
          }
        >
          <A26LiquidLens magnification={2.1} distortion={0.55}>
            <p>
              A superfície concentra a assistência ativa e a lente física de refração
              óptica de cristal sem adicionar blur aos cartões de conteúdo internos.
            </p>
          </A26LiquidLens>
        </A26TutorSurface>
      </section>

      <A26Modal
        open={modalOpen}
        title="Modal substantial"
        description="A profundidade é reservada para uma decisão que exige foco."
        onClose={() => setModalOpen(false)}
        actions={
          <>
            <A26Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</A26Button>
            <A26Button variant="primary" onClick={() => setModalOpen(false)}>Confirmar</A26Button>
          </>
        }
      >
        <A26Field label="Nome da configuração" defaultValue="Fundação Aeternum 26" />
      </A26Modal>
    </section>
  );
}
