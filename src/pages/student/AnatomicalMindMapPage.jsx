import React, { useState, useMemo, useEffect, useRef } from "react";
import { A26Button, A26Card, A26Surface } from "../../components/aeternum-26";
import LineIcon from "../../components/icons/LineIcon";
import "../../styles/A26MindMap.css";

const PRESET_MINDMAPS = [
  {
    id: "cardio",
    label: "🫀 Sistema Cardiovascular",
    rootNode: {
      id: "root-cardio",
      title: "Sistema Cardiovascular",
      tag: "ROOT",
      tagColor: "root",
      body: "Bomba muscular central e rede vascular encarregada do transporte de oxigênio, nutrientes e escórias metabólicas.",
      modelPath: "/viewer/coracao-edicao-morgue",
      x: 420,
      y: 280
    },
    groups: [
      { id: "g1", title: "Coração & Câmaras", color: "cyan", x: 60, y: 50, w: 320, h: 260 },
      { id: "g2", title: "Grandes Vasos", color: "amber", x: 740, y: 50, w: 320, h: 260 },
      { id: "g3", title: "Correlações Clínicas", color: "mint", x: 400, y: 440, w: 360, h: 220 }
    ],
    nodes: [
      {
        id: "c1",
        title: "Átrios e Ventrículos",
        tag: "Estrutura",
        tagColor: "structure",
        body: "4 câmaras musculares. O ventrículo esquerdo possui miocárdio mais espesso para suportar a circulação sistêmica.",
        groupId: "g1",
        x: 90,
        y: 110,
        connectTo: "root-cardio"
      },
      {
        id: "c2",
        title: "Válvula Mitral e Tricúspide",
        tag: "Estrutura",
        tagColor: "structure",
        body: "Valvopatias atrioventriculares que impedem o refluxo sanguíneo durante a sístole ventricular.",
        groupId: "g1",
        x: 90,
        y: 210,
        connectTo: "c1"
      },
      {
        id: "v1",
        title: "Artéria Aorta",
        tag: "Vasos",
        tagColor: "concept",
        body: "Principal tronco arterial emergente do ventrículo esquerdo. Ramifica-se em arco aórtico, aorta torácica e abdominal.",
        groupId: "g2",
        x: 770,
        y: 110,
        connectTo: "root-cardio"
      },
      {
        id: "v2",
        title: "Veias Cavas e Pulmonares",
        tag: "Vasos",
        tagColor: "concept",
        body: "Retorno venoso sistêmico (cava sup/inf para o átrio direito) e sangue oxigenado pulmonar (4 veias pulmonares para o átrio esquerdo).",
        groupId: "g2",
        x: 770,
        y: 210,
        connectTo: "v1"
      },
      {
        id: "cl1",
        title: "Infarto Agudo do Miocárdio (IAM)",
        tag: "Patologia",
        tagColor: "clinical",
        body: "Oclusão de uma artéria coronária por trombo ateroesclerótico, gerando isquemia e necrose do tecido miocárdico.",
        groupId: "g3",
        x: 430,
        y: 490,
        connectTo: "root-cardio"
      }
    ]
  },
  {
    id: "femur",
    label: "🦴 Fémur & Osteologia",
    rootNode: {
      id: "root-femur",
      title: "Fémur (Osso da Coxa)",
      tag: "ROOT",
      tagColor: "root",
      body: "Maior e mais resistente osso longo do esqueleto humano, sustentando forças biomecânicas de locomoção e carga.",
      modelPath: "/viewer/corte-sagital-cranio-humano-superficial",
      x: 420,
      y: 280
    },
    groups: [
      { id: "gf1", title: "Epífise Proximal", color: "amber", x: 60, y: 50, w: 320, h: 260 },
      { id: "gf2", title: "Diáfise & Epífise Distal", color: "cyan", x: 740, y: 50, w: 320, h: 260 },
      { id: "gf3", title: "Traumatologia & Fraturas", color: "mint", x: 400, y: 440, w: 360, h: 220 }
    ],
    nodes: [
      {
        id: "fn1",
        title: "Cabeça do Fémur e Fóvea",
        tag: "Anatomia",
        tagColor: "structure",
        body: "Articula-se com o acetábulo do osso do quadril. A fóvea capitis dá inserção ao ligamento da cabeça do fémur.",
        groupId: "gf1",
        x: 90,
        y: 110,
        connectTo: "root-femur"
      },
      {
        id: "fn2",
        title: "Trocânter Maior e Menor",
        tag: "Anatomia",
        tagColor: "structure",
        body: "Salientes ósseas para inserção dos músculos glúteo médio, mínimo e iliopsoas.",
        groupId: "gf1",
        x: 90,
        y: 210,
        connectTo: "fn1"
      },
      {
        id: "fn3",
        title: "Linha Áspera",
        tag: "Diáfise",
        tagColor: "concept",
        body: "Crista posterior robusta na diáfise femural para inserção dos adutores da coxa.",
        groupId: "gf2",
        x: 770,
        y: 110,
        connectTo: "root-femur"
      },
      {
        id: "fcl1",
        title: "Fratura do Colo Femural",
        tag: "Trauma",
        tagColor: "clinical",
        body: "Comum em idosos com osteoporose. Elevado risco de osteonecrose avascular por lesão das artérias retinaculares.",
        groupId: "gf3",
        x: 430,
        y: 490,
        connectTo: "root-femur"
      }
    ]
  },
  {
    id: "snc",
    label: "🧠 Sistema Nervoso Central",
    rootNode: {
      id: "root-snc",
      title: "Sistema Nervoso Central",
      tag: "ROOT",
      tagColor: "root",
      body: "Composto pelo encéfalo e medula espinhal, responsável pela integração sensorial, controle motor e cognição.",
      modelPath: "/viewer/corte-sagital-cranio-humano-superficial",
      x: 420,
      y: 280
    },
    groups: [
      { id: "gn1", title: "Telencéfalo", color: "violet", x: 60, y: 50, w: 320, h: 260 },
      { id: "gn2", title: "Tronco & Cerebelo", color: "cyan", x: 740, y: 50, w: 320, h: 260 },
      { id: "gn3", title: "Clínica Neurológica", color: "mint", x: 400, y: 440, w: 360, h: 220 }
    ],
    nodes: [
      {
        id: "sn1",
        title: "Córtex Cerebral & Sulcos",
        tag: "Cérebro",
        tagColor: "structure",
        body: "Giro pré-central (córtex motor primário) e giro pós-central (somatosensorial primário).",
        groupId: "gn1",
        x: 90,
        y: 110,
        connectTo: "root-snc"
      },
      {
        id: "sn2",
        title: "Mesencéfalo, Ponte e Bulbo",
        tag: "Tronco",
        tagColor: "concept",
        body: "Contêm núcleos dos pares cranianos e centros vitais respiratório e cardiorrespiratório.",
        groupId: "gn2",
        x: 770,
        y: 110,
        connectTo: "root-snc"
      },
      {
        id: "sncl1",
        title: "Acidente Vascular Cerebral (AVC)",
        tag: "Isquemia",
        tagColor: "clinical",
        body: "Interrupção do fluxo na artéria cerebral média gerando hemiparesia contralateral e afasia.",
        groupId: "gn3",
        x: 430,
        y: 490,
        connectTo: "root-snc"
      }
    ]
  }
];

export default function AnatomicalMindMapPage({ user, navigate }) {
  const [selectedMapId, setSelectedMapId] = useState("cardio");
  const [viewMode, setViewMode] = useState("canvas"); // 'canvas' or 'graph'
  const [activeNode, setActiveNode] = useState(null);
  const [customTopic, setCustomTopic] = useState("");
  const [customMap, setCustomMap] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeMap = useMemo(() => {
    if (customMap && selectedMapId === "custom") return customMap;
    return PRESET_MINDMAPS.find((m) => m.id === selectedMapId) || PRESET_MINDMAPS[0];
  }, [selectedMapId, customMap]);

  const allNodes = useMemo(() => {
    return [activeMap.rootNode, ...(activeMap.nodes || [])];
  }, [activeMap]);

  const canvasRef = useRef(null);

  const handleGenerateCustom = () => {
    if (!customTopic.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const topic = customTopic.trim();
      const generated = {
        id: "custom",
        label: `✨ ${topic}`,
        rootNode: {
          id: "root-custom",
          title: topic,
          tag: "ROOT AI",
          tagColor: "root",
          body: `Mapa Mental gerado por IA para o tópico "${topic}", amarrado de forma estrita às correlações anatômicas.`,
          modelPath: "/viewer/coracao-edicao-morgue",
          x: 420,
          y: 280
        },
        groups: [
          { id: "gc1", title: "Fundamentos & Estruturas", color: "cyan", x: 60, y: 50, w: 320, h: 260 },
          { id: "gc2", title: "Topografia & Relações", color: "amber", x: 740, y: 50, w: 320, h: 260 },
          { id: "gc3", title: "Aplicação Clínica & Casos", color: "mint", x: 400, y: 440, w: 360, h: 220 }
        ],
        nodes: [
          {
            id: "cn1",
            title: `Anatomia Descritiva de ${topic}`,
            tag: "Conceito",
            tagColor: "structure",
            body: `Detalhamento anatômico das margens, acidentes ósseos ou vásculo-nervosos de ${topic}.`,
            groupId: "gc1",
            x: 90,
            y: 110,
            connectTo: "root-custom"
          },
          {
            id: "cn2",
            title: `Relações Anatômicas de ${topic}`,
            tag: "Topografia",
            tagColor: "concept",
            body: `Estruturas adjacentes, fáscias de revestimento e irrigação arterial primária de ${topic}.`,
            groupId: "gc2",
            x: 770,
            y: 110,
            connectTo: "root-custom"
          },
          {
            id: "cn3",
            title: `Correlação Clínica & Provas`,
            tag: "Clínica",
            tagColor: "clinical",
            body: `Sinais semiológicos, radiologia e patologias mais cobradas em exames sobre ${topic}.`,
            groupId: "gc3",
            x: 430,
            y: 490,
            connectTo: "root-custom"
          }
        ]
      };

      setCustomMap(generated);
      setSelectedMapId("custom");
      setIsGenerating(false);
    }, 600);
  };

  // Render Graph View Constellation Canvas
  useEffect(() => {
    if (viewMode !== "graph" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;

    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    const nodesData = allNodes.map((n, i) => ({
      ...n,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      cx: 150 + (i % 4) * 200 + Math.random() * 40,
      cy: 120 + Math.floor(i / 4) * 160 + Math.random() * 40
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw Connection Lines
      nodesData.forEach((source) => {
        if (!source.connectTo) return;
        const target = nodesData.find((t) => t.id === source.connectTo);
        if (target) {
          ctx.beginPath();
          ctx.moveTo(source.cx, source.cy);
          ctx.lineTo(target.cx, target.cy);
          ctx.strokeStyle = "rgba(79, 216, 201, 0.25)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // Draw Nodes
      nodesData.forEach((node) => {
        const isRoot = node.id.startsWith("root");
        const radius = isRoot ? 16 : 9;

        // Node Glow
        ctx.beginPath();
        ctx.arc(node.cx, node.cy, radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = isRoot ? "rgba(79, 216, 201, 0.15)" : "rgba(233, 184, 114, 0.12)";
        ctx.fill();

        // Node Circle
        ctx.beginPath();
        ctx.arc(node.cx, node.cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = isRoot ? "#4fd8c9" : "#e9b872";
        ctx.shadowColor = isRoot ? "#4fd8c9" : "#e9b872";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Node Label
        ctx.font = isRoot ? "bold 13px Inter" : "11px Inter";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(node.title, node.cx + radius + 8, node.cy + 4);

        // Simple floating physics motion
        node.cx += node.vx;
        node.cy += node.vy;

        if (node.cx < 40 || node.cx > width - 40) node.vx *= -1;
        if (node.cy < 40 || node.cy > height - 40) node.vy *= -1;
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [viewMode, allNodes]);

  return (
    <section className="a26-mindmap-page fade-in-up">
      {/* Header */}
      <header className="mindmap-hero">
        <div className="mindmap-hero__content">
          <h1>Mapa Mental Anatômico & Teórico</h1>
          <p>Mapeamento visual de conexões, estruturas e correlações clínicas no estilo Obsidian Canvas.</p>
        </div>

        <div className="mindmap-hero__controls">
          <div className="segmented">
            <button
              className={viewMode === "canvas" ? "active" : ""}
              onClick={() => setViewMode("canvas")}
            >
              🎨 Obsidian Canvas
            </button>
            <button
              className={viewMode === "graph" ? "active" : ""}
              onClick={() => setViewMode("graph")}
            >
              🌌 Constelação (Graph)
            </button>
          </div>
        </div>
      </header>

      {/* Preset Selector */}
      <div className="mindmap-presets">
        {PRESET_MINDMAPS.map((map) => (
          <button
            key={map.id}
            className={`mindmap-preset-chip ${selectedMapId === map.id ? "is-active" : ""}`}
            onClick={() => {
              setSelectedMapId(map.id);
              setActiveNode(null);
            }}
          >
            {map.label}
          </button>
        ))}

        {customMap ? (
          <button
            className={`mindmap-preset-chip ${selectedMapId === "custom" ? "is-active" : ""}`}
            onClick={() => {
              setSelectedMapId("custom");
              setActiveNode(null);
            }}
          >
            {customMap.label}
          </button>
        ) : null}
      </div>

      {/* Generator Bar */}
      <div className="mindmap-generator-bar">
        <input
          type="text"
          className="mindmap-generator-input"
          placeholder="Digite qualquer assunto anatômico para gerar um Mapa Mental (ex: Aparelho Digestório, Sistema Renal...)"
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerateCustom()}
        />
        <A26Button
          variant="primary"
          onClick={handleGenerateCustom}
          disabled={isGenerating || !customTopic.trim()}
        >
          {isGenerating ? "Gerando..." : "Gerar Mapa Mental IA"}
        </A26Button>
      </div>

      {/* Viewport Canvas / Graph */}
      <div className="mindmap-viewport">
        <div className="mindmap-grid-bg" />

        {viewMode === "canvas" ? (
          <div
            className="mindmap-canvas-container"
            style={{ transform: `scale(${zoom})` }}
          >
            {/* SVG Bezier Connector Lines */}
            <svg className="mindmap-svg-layer">
              {allNodes.map((node) => {
                if (!node.connectTo) return null;
                const target = allNodes.find((t) => t.id === node.connectTo);
                if (!target) return null;

                const x1 = node.x + 130;
                const y1 = node.y + 40;
                const x2 = target.x + 130;
                const y2 = target.y + 40;

                const cx1 = x1 + (x2 - x1) * 0.5;
                const cy1 = y1;
                const cx2 = x1 + (x2 - x1) * 0.5;
                const cy2 = y2;

                const pathData = `M ${x1},${y1} C ${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;

                return (
                  <path
                    key={`link-${node.id}`}
                    d={pathData}
                    className="mindmap-path pulse"
                    stroke={node.id.startsWith("root") ? "#4fd8c9" : "rgba(79, 216, 201, 0.4)"}
                  />
                );
              })}
            </svg>

            {/* Obsidian Group Boxes */}
            {(activeMap.groups || []).map((g) => (
              <div
                key={g.id}
                className="obsidian-group-box"
                style={{
                  left: `${g.x}px`,
                  top: `${g.y}px`,
                  width: `${g.w}px`,
                  height: `${g.h}px`
                }}
              >
                <span className={`obsidian-group-label obsidian-group-label--${g.color}`}>
                  {g.title}
                </span>
              </div>
            ))}

            {/* Obsidian Node Cards */}
            {allNodes.map((node) => {
              const isRoot = node.id.startsWith("root");
              return (
                <div
                  key={node.id}
                  className={`obsidian-node-card ${isRoot ? "is-root" : ""}`}
                  style={{ left: `${node.x}px`, top: `${node.y}px` }}
                  onClick={() => setActiveNode(node)}
                >
                  <div className="obsidian-node-header">
                    <span className={`obsidian-node-tag obsidian-node-tag--${node.tagColor || "concept"}`}>
                      {node.tag}
                    </span>
                    {isRoot ? <LineIcon name="spark" /> : null}
                  </div>
                  <h3 className="obsidian-node-title">{node.title}</h3>
                  <p className="obsidian-node-body">{node.body}</p>

                  <div className="obsidian-node-actions">
                    {node.modelPath ? (
                      <A26Button
                        variant="secondary"
                        className="btn-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(node.modelPath);
                        }}
                      >
                        🫀 Abrir Modelo 3D
                      </A26Button>
                    ) : null}
                    <A26Button
                      variant="ghost"
                      className="btn-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveNode(node);
                      }}
                    >
                      Detalhes
                    </A26Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Graph View Constellation Canvas */
          <canvas ref={canvasRef} className="graph-view-canvas" />
        )}

        {/* Floating Zoom Controls Toolbar */}
        <div className="mindmap-floating-toolbar">
          <A26Button variant="ghost" onClick={() => setZoom((z) => Math.min(1.6, z + 0.15))}>
            + Zoom
          </A26Button>
          <A26Button variant="ghost" onClick={() => setZoom(1)}>
            100%
          </A26Button>
          <A26Button variant="ghost" onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}>
            - Zoom
          </A26Button>
        </div>

        {/* Detail Drawer */}
        {activeNode ? (
          <aside className="mindmap-detail-drawer fade-in-up">
            <div className="flex justify-between items-center mb-3">
              <span className={`obsidian-node-tag obsidian-node-tag--${activeNode.tagColor || "concept"}`}>
                {activeNode.tag}
              </span>
              <button
                className="text-slate-400 hover:text-white text-lg font-bold"
                onClick={() => setActiveNode(null)}
              >
                ×
              </button>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{activeNode.title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">{activeNode.body}</p>

            <div className="flex flex-col gap-2 pt-3 border-t border-slate-700/50">
              {activeNode.modelPath ? (
                <A26Button
                  variant="primary"
                  onClick={() => navigate(activeNode.modelPath)}
                >
                  🫀 Ver no Atlas Modelo 3D
                </A26Button>
              ) : null}
              <A26Button
                variant="secondary"
                onClick={() => navigate("/flashcards")}
              >
                🎴 Praticar Flashcards Relacionados
              </A26Button>
              <A26Button
                variant="secondary"
                onClick={() => navigate("/quizzes")}
              >
                📝 Fazer Simulado deste Tópico
              </A26Button>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
