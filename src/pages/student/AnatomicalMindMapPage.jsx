import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { A26Button } from "../../components/aeternum-26";
import "../../styles/A26MindMap.css";

const COLORS = ["#4fd8c9", "#a78bfa", "#e8836f", "#e9b872", "#7fd99a", "#e895c2"];

const ANATOMICAL_OUTLINE_PRESETS = [
  {
    id: "cardio",
    label: "🫀 Sistema Cardiovascular",
    modelPath: "/viewer/coracao-edicao-morgue",
    text: `Sistema Cardiovascular
 Sistema Nervoso Autónomo Cardiaco
  Nó Sinoatrial (Marcapasso Natural)
  Nó Atrioventricular & Feixe de His
  Fibras de Purkinje & Condução Ventricular
 Coração & Câmaras Musculares
  Átrio Direito & Esquerdo
  Ventrículo Esquerdo (Miocárdio de Carga Sistêmica)
  Ventrículo Direito (Circulação Pulmonar)
  Válvulas Atrioventriculares (Mitral e Tricúspide)
 Grandes Vasos & Irrigação
  Artéria Aorta (Arco Aórtico, Torácica e Abdominal)
  Veias Cavas Superior e Inferior
  Artérias Coronárias Esquerda e Direita
 Correlações Clínicas & Patologias
  Infarto Agudo do Miocárdio (IAM por Oclusão Coronária)
  Angina de Peito & Isquemia Miocárdica
  Estenose Válvular Aórtica & Insuficiência Cardíaca`
  },
  {
    id: "snc",
    label: "🧠 Sistema Nervoso Central",
    modelPath: "/viewer/corte-sagital-cranio-humano-superficial",
    text: `Sistema Nervoso
 Sistema Nervoso Central
  Encéfalo
   Cérebro (Giro Pré e Pós-Central)
   Núcleos da Base (Caudado e Putamen)
   Sistema Límbico (Hipocampo e Amígdala)
   Cerebelo (Coordenação e Equilíbrio)
   Tronco Encefálico (Mesencéfalo, Ponte e Bulbo)
  Medula Espinhal
   Vias Motoras Corticoespinais
   Vias Sensoriais Espinotalâmicas
 Sistema Nervoso Periférico
  Nervos Cranianos (I ao XII Pares)
  Nervos Espinhais
  Sistema Nervoso Autônomo
   Simpático (Toracolombar)
   Parassimpático (Craniossacral)
 Neuroclínica & AVC
  AVC Isquêmico da Artéria Cerebral Média
  Neuralgia do Trigêmeo`
  },
  {
    id: "femur",
    label: "🦴 Fémur & Osteologia",
    modelPath: "/viewer/corte-sagital-cranio-humano-superficial",
    text: `Osteologia do Fémur
 Epífise Proximal
  Cabeça do Fémur & Fóvea Capitis
  Colo do Fémur (Carga Biomecânica)
  Trocânter Maior (Inserção do Glúteo Médio)
  Trocânter Menor (Inserção do Iliopsoas)
 Diáfise & Corpo Femural
  Linha Áspera (Inserção dos Adutores)
  Tuberosidade Glútea
 Epífise Distal & Joelho
  Côndilos Medial e Lateral
  Fossa Intercondilar (Inserção do LCA e LCP)
 Traumatologia & Cirurgia
  Fratura de Colo Femural (Risco de Necrose Avascular)
  Artroplastia Total de Quadril`
  },
  {
    id: "respiratorio",
    label: "🫁 Aparelho Respiratório",
    modelPath: "/viewer/coracao-edicao-morgue",
    text: `Aparelho Respiratório
 Vias Aéreas Condução
  Laringe & Cartilagem Cricoide
  Traqueia & Carina Traqueal
  Brônquios Principais Direito e Esquerdo
 Parênquima Pulmonar
  Lobos Pulmonares (3 Direitos, 2 Esquerdos)
  Alvéolos & Barreira Hemato-Gasosa
  Cavidade Pleural (Pleura Visceral e Parietal)
 Fisiologia & Clínica
  Ventilação Pulmonar & Troca de Gases
  Pneumotórax (Colapso por Ar Pleural)
  Enfisema Pulmonar & DPOC`
  }
];

function parseOutline(text) {
  const rawLines = text.split("\n").map((l) => l.replace(/\r$/, "").replace(/\t/g, " "));
  const lines = [];
  rawLines.forEach((line) => {
    if (line.trim().length === 0) return;

    // Handle space indentation or markdown syntax (# or -)
    const mdHeader = line.match(/^(#{1,6})\s+(.*)/);
    const mdList = line.match(/^(\s*)(?:[-*+]|\d+\.)\s+(.*)/);

    if (mdHeader) {
      lines.push({ level: mdHeader[1].length - 1, text: mdHeader[2].trim() });
    } else if (mdList) {
      const indentLevel = Math.floor(mdList[1].length / 2) + 1;
      lines.push({ level: indentLevel, text: mdList[2].trim() });
    } else {
      const m = line.match(/^( *)(.*)$/);
      const level = m ? m[1].length : 0;
      const content = m ? m[2].trim() : line.trim();
      if (content) lines.push({ level, text: content });
    }
  });

  if (lines.length === 0) return { name: "Mapa Mental Anatômico", children: [], level: 0 };

  let root;
  let startIdx = 0;
  if (lines[0].level === 0) {
    root = { name: lines[0].text, children: [], level: 0 };
    startIdx = 1;
  } else {
    root = { name: "Mapa Mental Anatômico", children: [], level: 0 };
  }

  const stack = [root];
  for (let i = startIdx; i < lines.length; i++) {
    const { level, text } = lines[i];
    const depth = Math.max(level, 1);
    const node = { name: text, children: [], level: depth };
    while (stack.length > 1 && stack[stack.length - 1].level >= depth) stack.pop();
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  }

  return root;
}

function estimateWidth(text) {
  return Math.min(240, Math.max(50, text.length * 6.8 + 28));
}

function assignColors(node, color) {
  node.color = color;
  (node.children || node._children || []).forEach((c) => assignColors(c, color));
}

function countDescendants(children) {
  let n = 0;
  (function walk(arr) {
    if (!arr) return;
    arr.forEach((c) => {
      n++;
      if (c.children) walk(c.children);
      else if (c._children) walk(c._children);
    });
  })(children);
  return n;
}

export default function AnatomicalMindMapPage({ user, navigate }) {
  const [selectedPresetId, setSelectedPresetId] = useState("cardio");
  const [outlineText, setOutlineText] = useState(ANATOMICAL_OUTLINE_PRESETS[0].text);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeNode, setActiveNode] = useState(null);

  const svgRef = useRef(null);
  const gZoomRef = useRef(null);
  const gLinksRef = useRef(null);
  const gNodesRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const rootDataRef = useRef(null);
  const nodeIdSeqRef = useRef(0);

  const activePreset = ANATOMICAL_OUTLINE_PRESETS.find((p) => p.id === selectedPresetId) || ANATOMICAL_OUTLINE_PRESETS[0];

  const fitToView = () => {
    if (!gZoomRef.current || !svgRef.current) return;
    try {
      const bounds = gZoomRef.current.node().getBBox();
      const svgEl = svgRef.current;
      const W = svgEl.clientWidth || 900;
      const H = svgEl.clientHeight || 650;
      if (bounds.width === 0 || bounds.height === 0) return;

      const scale = Math.min(1.8, 0.88 / Math.max(bounds.width / W, bounds.height / H));
      const tx = W / 2 - scale * (bounds.x + bounds.width / 2);
      const ty = H / 2 - scale * (bounds.y + bounds.height / 2);

      d3.select(svgEl)
        .transition()
        .duration(400)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    } catch (e) {
      console.warn("fitToView calc", e);
    }
  };

  const updateTree = (source) => {
    if (!rootDataRef.current || !gZoomRef.current) return;
    const duration = 320;
    const dx = 32;
    const dy = 220;

    const treeLayout = d3.tree().nodeSize([dx, dy]);
    const diagonal = d3.linkHorizontal().x((d) => d.y).y((d) => d.x);

    const root = rootDataRef.current;
    const nodes = root.descendants().reverse();
    const links = root.links();

    treeLayout(root);
    root.each((d) => { d.y = d.depth * dy; });

    const transition = gZoomRef.current.transition().duration(duration);

    /* ---- Links ---- */
    const link = gLinksRef.current.selectAll("path.link").data(links, (d) => d.target.id);

    const linkEnter = link
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("stroke", (d) => d.target.color || "#4fd8c9")
      .attr("d", () => {
        const o = { x: source.x0 ?? 0, y: source.y0 ?? 0 };
        return diagonal({ source: o, target: o });
      });

    link
      .merge(linkEnter)
      .transition(transition)
      .attr("d", diagonal)
      .attr("stroke", (d) => d.target.color || "#4fd8c9");

    link
      .exit()
      .transition(transition)
      .remove()
      .attr("d", () => {
        const o = { x: source.x, y: source.y };
        return diagonal({ source: o, target: o });
      });

    /* ---- Nodes ---- */
    const node = gNodesRef.current.selectAll("g.node").data(nodes, (d) => d.id);

    const nodeEnter = node
      .enter()
      .append("g")
      .attr("class", (d) => "node" + (d.depth === 0 ? " node-root" : ""))
      .attr("transform", () => `translate(${source.y0 ?? 0},${source.x0 ?? 0})`)
      .attr("fill-opacity", 0)
      .on("click", (event, d) => {
        event.stopPropagation();
        setActiveNode(d);

        if (d.children || d._children) {
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          updateTree(d);
        }
      });

    nodeEnter
      .append("rect")
      .attr("class", "node-box")
      .attr("x", (d) => (d.depth === 0 ? -d.w / 2 : -6))
      .attr("y", -15)
      .attr("width", (d) => (d.depth === 0 ? d.w : d.w + 6))
      .attr("height", 30)
      .attr("rx", 9)
      .attr("fill", (d) =>
        d.depth === 0
          ? `color-mix(in srgb, ${d.color} 26%, rgba(10,14,16,0.85))`
          : `color-mix(in srgb, ${d.color} 14%, rgba(10,14,16,0.7))`
      )
      .attr("stroke", (d) => d.color)
      .attr("stroke-opacity", (d) => (d.depth === 0 ? 0.85 : 0.45));

    nodeEnter
      .append("text")
      .attr("class", "node-label")
      .attr("x", (d) => (d.depth === 0 ? 0 : 0))
      .attr("text-anchor", (d) => (d.depth === 0 ? "middle" : "start"))
      .attr("font-size", (d) => (d.depth === 0 ? 13.5 : 12))
      .text((d) => d.data.name);

    // Fold indicator group for collapsed nodes
    const foldGroup = nodeEnter
      .append("g")
      .attr("class", "fold-indicator")
      .attr("transform", (d) => `translate(${d.w + 6},0)`)
      .style("display", (d) => (d._children ? null : "none"));

    foldGroup.append("circle").attr("class", "fold-dot").attr("r", 8).attr("stroke", (d) => d.color);
    foldGroup.append("text").attr("class", "fold-count").text((d) => (d._children ? countDescendants(d._children) : ""));

    const nodeUpdate = node
      .merge(nodeEnter)
      .transition(transition)
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1);

    nodeUpdate.select(".fold-indicator")
      .attr("transform", (d) => `translate(${d.w + 6},0)`)
      .style("display", (d) => (d._children ? null : "none"));

    nodeUpdate.select(".fold-count").text((d) => (d._children ? countDescendants(d._children) : ""));

    node
      .exit()
      .transition(transition)
      .remove()
      .attr("transform", () => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0);

    root.eachBefore((d) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  };

  const renderFromOutline = () => {
    if (!svgRef.current) return;
    const data = parseOutline(outlineText);

    gLinksRef.current.selectAll("*").remove();
    gNodesRef.current.selectAll("*").remove();

    const r = d3.hierarchy(data);
    r.x0 = 0;
    r.y0 = 0;
    r.each((d) => {
      d.id = nodeIdSeqRef.current++;
      d.w = estimateWidth(d.data.name);
    });

    r.color = "#4fd8c9";
    (r.children || []).forEach((child, i) => assignColors(child, COLORS[i % COLORS.length]));

    rootDataRef.current = r;
    updateTree(r);
    setTimeout(fitToView, 60);
  };

  // Initialize D3 Canvas
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const gZoom = svg.append("g").attr("class", "zoom-group");
    const gLinks = gZoom.append("g").attr("class", "links-layer");
    const gNodes = gZoom.append("g").attr("class", "nodes-layer");

    gZoomRef.current = gZoom;
    gLinksRef.current = gLinks;
    gNodesRef.current = gNodes;

    const zoomBehavior = d3
      .zoom()
      .scaleExtent([0.25, 2.5])
      .on("zoom", (event) => {
        gZoom.attr("transform", event.transform);
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    renderFromOutline();
  }, []);

  // Re-render when outlineText changes (with 1s auto-debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      renderFromOutline();
    }, 1000);

    return () => clearTimeout(timer);
  }, [outlineText]);

  const handlePresetSelect = (preset) => {
    setSelectedPresetId(preset.id);
    setOutlineText(preset.text);
    setActiveNode(null);
  };

  const handleGenerateAI = () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const topic = aiPrompt.trim();
      const generatedText = `${topic}
 Anatomia & Fundamentos Estruturais
  Acidentes Anatômicos Principais de ${topic}
  Irrigação Arterial & Drenagem Venosa
  Inervação & Relações Sintópicas Adjacentes
 Topografia & Segmentação
  Segmentação Anterior e Posterior de ${topic}
  Fáscias de Revestimento & Bainhas Vasculares
 Correlações Clínicas & Casos de Prova
  Principais Patologias e Síndromes de ${topic}
  Achados de Imagem Radiológica (TC / RM)`;

      setOutlineText(generatedText);
      setSelectedPresetId("custom");
      setIsGenerating(false);
    }, 500);
  };

  const handleExpandAll = () => {
    if (!rootDataRef.current) return;
    const expand = (d) => {
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
      if (d.children) d.children.forEach(expand);
    };
    expand(rootDataRef.current);
    updateTree(rootDataRef.current);
    setTimeout(fitToView, 340);
  };

  const handleCollapseAll = () => {
    if (!rootDataRef.current) return;
    const collapse = (d) => {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    };
    (rootDataRef.current.children || []).forEach(collapse);
    updateTree(rootDataRef.current);
    setTimeout(fitToView, 340);
  };

  return (
    <div className="a26-mindmap-page fade-in-up">
      {/* Sidebar Outline Editor */}
      <aside className={`mindmap-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="mindmap-sidebar-head">
          <p className="mindmap-eyebrow">Motor · Estilo Obsidian Mindmap</p>
          <h1>Mapa Mental</h1>
          <p>
            Sem símbolos — só espaços. Primeira linha sem espaço = tema central. <b>1 espaço</b> = título, <b>2 espaços</b> = subtítulo, <b>3 espaços</b> = item de lista.
          </p>
        </div>

        {/* Preset Chips */}
        <div className="mindmap-preset-bar">
          {ANATOMICAL_OUTLINE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`mindmap-chip ${selectedPresetId === preset.id ? "is-active" : ""}`}
              onClick={() => handlePresetSelect(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* AI Generator Input */}
        <div className="px-5 pt-2">
          <div className="mindmap-ai-bar">
            <input
              type="text"
              className="mindmap-ai-input"
              placeholder="Gerar esboço com IA (ex: Sistema Renal...)"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerateAI()}
            />
            <A26Button variant="primary" className="btn-sm" onClick={handleGenerateAI} disabled={isGenerating}>
              {isGenerating ? "..." : "Gerar"}
            </A26Button>
          </div>
        </div>

        {/* Outline Textarea */}
        <div className="mindmap-outline-box">
          <label>Esboço (indentação por espaço)</label>
          <textarea
            className="mindmap-outline-input"
            spellCheck="false"
            value={outlineText}
            onChange={(e) => setOutlineText(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="mindmap-sidebar-actions">
          <A26Button variant="primary" onClick={renderFromOutline}>
            Renderizar mapa
          </A26Button>
          <div className="mindmap-btn-row">
            <A26Button variant="secondary" onClick={handleExpandAll}>
              Expandir tudo
            </A26Button>
            <A26Button variant="secondary" onClick={handleCollapseAll}>
              Recolher tudo
            </A26Button>
          </div>
        </div>
      </aside>

      {/* Main Canvas Container */}
      <main className="mindmap-canvas-wrap">
        {/* Topbar & Zoom Controls */}
        <div className="mindmap-topbar">
          <button
            className="toggle-sidebar-btn"
            onClick={() => setSidebarCollapsed((v) => !v)}
            title="Mostrar/ocultar painel"
          >
            ☰
          </button>
          <div className="zoom-controls">
            <button
              onClick={() => d3.select(svgRef.current).transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 1.3)}
              title="Aproximar"
            >
              +
            </button>
            <button
              onClick={() => d3.select(svgRef.current).transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 1 / 1.3)}
              title="Afastar"
            >
              −
            </button>
            <button onClick={fitToView} title="Centralizar">
              ⤢
            </button>
          </div>
        </div>

        {/* D3 SVG Canvas */}
        <svg id="canvas" ref={svgRef} />

        <div className="mindmap-hint">
          arraste para mover · roda do mouse para zoom · clique num nó para recolher/expandir os filhos · atualiza sozinho 1s depois de você parar de digitar
        </div>

        {/* Selected Node Clinical Drawer */}
        {activeNode ? (
          <aside className="mindmap-node-drawer fade-in-up">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                Nó Selecionado
              </span>
              <button
                className="text-slate-400 hover:text-white text-lg font-bold"
                onClick={() => setActiveNode(null)}
              >
                ×
              </button>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{activeNode.data.name}</h3>
            <p className="text-xs text-slate-400 mb-4">
              Nível {activeNode.depth} · {activeNode.children ? `${activeNode.children.length} filhos diretos` : activeNode._children ? `${countDescendants(activeNode._children)} filhos recolhidos` : "Nó folha"}
            </p>

            <div className="flex flex-col gap-2 pt-3 border-t border-slate-700/50">
              {activePreset.modelPath ? (
                <A26Button
                  variant="primary"
                  onClick={() => navigate(activePreset.modelPath)}
                >
                  🫀 Abrir Modelo 3D no Atlas
                </A26Button>
              ) : null}
              <A26Button variant="secondary" onClick={() => navigate("/flashcards")}>
                🎴 Praticar Flashcards Relacionados
              </A26Button>
              <A26Button variant="secondary" onClick={() => navigate("/quizzes")}>
                📝 Simulado deste Tópico
              </A26Button>
            </div>
          </aside>
        ) : null}
      </main>
    </div>
  );
}
