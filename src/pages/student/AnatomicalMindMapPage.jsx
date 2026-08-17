import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import {
  A26Button,
  A26Field,
  A26IconButton,
  A26Modal,
  A26Sidebar,
  A26Surface,
  A26Toolbar
} from "../../components/aeternum-26";
import LineIcon from "../../components/icons/LineIcon";
import { useLanguage } from "../../context/LanguageContext";
import { useAtlasAITutorSession } from "../../context/AtlasAITutorSessionContext";
import { generateAuthenticatedMindMap } from "../../services/ai/mindMapGenerationService";
import "../../styles/A26MindMap.css";

const COLORS = ["#4fd8c9", "#a78bfa", "#e8836f", "#e9b872", "#7fd99a", "#e895c2"];

const DEFAULT_OUTLINE = `Sistema Cardiovascular
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
  Estenose Válvular Aórtica & Insuficiência Cardíaca`;

function parseOutline(text) {
  const rawLines = text.split("\n").map((l) => l.replace(/\r$/, "").replace(/\t/g, " "));
  const lines = [];
  rawLines.forEach((line) => {
    if (line.trim().length === 0) return;

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

// Canvas Text Width Measurement to fit dynamic text length with 100% precision
const measurementCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
const measurementCtx = measurementCanvas ? measurementCanvas.getContext("2d") : null;

function estimateWidth(text, depth = 1) {
  if (measurementCtx) {
    measurementCtx.font = depth === 0 ? "700 14px 'Space Grotesk', 'Inter', sans-serif" : "500 12.5px 'Inter', sans-serif";
    const measured = measurementCtx.measureText(text).width;
    return Math.max(90, Math.ceil(measured) + (depth === 0 ? 48 : 34));
  }
  return Math.max(90, Math.ceil(text.length * (depth === 0 ? 9.5 : 8.2)) + (depth === 0 ? 48 : 34));
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
  const { t } = useLanguage();
  const [outlineText, setOutlineText] = useState(DEFAULT_OUTLINE);
  const [isOutlineEditorOpen, setIsOutlineEditorOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== "undefined" && window.innerWidth <= 880);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [generationNotice, setGenerationNotice] = useState("");
  const [activeNode, setActiveNode] = useState(null);
  const { sendMessage, openTutor, connectionMode } = useAtlasAITutorSession();

  const svgRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const gZoomRef = useRef(null);
  const gLinksRef = useRef(null);
  const gNodesRef = useRef(null);
  const zoomBehaviorRef = useRef(null);
  const rootDataRef = useRef(null);
  const nodeIdSeqRef = useRef(0);

  const fitToView = (duration = 450) => {
    if (!gZoomRef.current || !svgRef.current) return;
    try {
      const bounds = gZoomRef.current.node().getBBox();
      const svgEl = svgRef.current;
      const rect = svgEl.getBoundingClientRect();
      const W = rect.width || svgEl.clientWidth || 900;
      const H = rect.height || svgEl.clientHeight || 650;
      if (bounds.width === 0 || bounds.height === 0) return;

      const padding = 60;
      const scale = Math.min(1.4, Math.max(0.35, 0.88 / Math.max((bounds.width + padding * 2) / W, (bounds.height + padding * 2) / H)));
      const tx = W / 2 - scale * (bounds.x + bounds.width / 2);
      const ty = H / 2 - scale * (bounds.y + bounds.height / 2);

      d3.select(svgEl)
        .transition()
        .duration(duration)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    } catch (e) {
      console.warn("fitToView calc", e);
    }
  };

  // Re-fit view smoothly when sidebar collapses or expands
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToView(350);
    }, 320);
    return () => clearTimeout(timer);
  }, [sidebarCollapsed]);

  // Re-fit view when entering or exiting full screen mode
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToView(350);
    }, 150);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Escape key listener to exit full screen mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // ResizeObserver on canvas container element to keep view perfectly centered on window resize
  useEffect(() => {
    if (!canvasWrapRef.current) return;
    const observer = new ResizeObserver(() => {
      fitToView(150);
    });
    observer.observe(canvasWrapRef.current);
    return () => observer.disconnect();
  }, []);

  const updateTree = (source) => {
    if (!rootDataRef.current || !gZoomRef.current) return;
    const duration = 320;
    const dx = 56;
    const dy = 340;

    const treeLayout = d3.tree().nodeSize([dx, dy]);

    const root = rootDataRef.current;
    const nodes = root.descendants().reverse();
    const links = root.links();

    treeLayout(root);
    root.each((d) => { d.y = d.depth * dy; });

    const transition = gZoomRef.current.transition().duration(duration);

    const calcLinkPath = (d) => {
      const sourceX = d.source.y + (d.source.depth === 0 ? d.source.w / 2 : d.source.w);
      const sourceY = d.source.x;
      const targetX = d.target.y - 6;
      const targetY = d.target.x;
      const mx = (sourceX + targetX) / 2;
      return `M ${sourceX},${sourceY} C ${mx},${sourceY} ${mx},${targetY} ${targetX},${targetY}`;
    };

    /* ---- Links ---- */
    const link = gLinksRef.current.selectAll("path.link").data(links, (d) => d.target.id);

    const linkEnter = link
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("stroke", (d) => d.target.color || "#4fd8c9")
      .attr("d", () => {
        const o = { x: source.x0 ?? 0, y: source.y0 ?? 0, depth: source.depth, w: source.w };
        return calcLinkPath({ source: o, target: o });
      });

    link
      .merge(linkEnter)
      .transition(transition)
      .attr("d", calcLinkPath)
      .attr("stroke", (d) => d.target.color || "#4fd8c9");

    link
      .exit()
      .transition(transition)
      .remove()
      .attr("d", () => {
        const o = { x: source.x, y: source.y, depth: source.depth, w: source.w };
        return calcLinkPath({ source: o, target: o });
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
      .attr("y", -17)
      .attr("width", (d) => (d.depth === 0 ? d.w : d.w + 12))
      .attr("height", 34)
      .attr("rx", 10)
      .attr("fill", (d) =>
        d.depth === 0
          ? `color-mix(in srgb, ${d.color} 28%, rgba(10,16,20,0.9))`
          : `color-mix(in srgb, ${d.color} 16%, rgba(10,16,20,0.8))`
      )
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", (d) => (d.depth === 0 ? 2 : 1.4))
      .attr("stroke-opacity", (d) => (d.depth === 0 ? 0.9 : 0.6));

    nodeEnter
      .append("text")
      .attr("class", "node-label")
      .attr("x", (d) => (d.depth === 0 ? 0 : 10))
      .attr("y", 1)
      .attr("text-anchor", (d) => (d.depth === 0 ? "middle" : "start"))
      .attr("font-size", (d) => (d.depth === 0 ? 14 : 12.5))
      .attr("font-weight", (d) => (d.depth === 0 ? 700 : 500))
      .text((d) => d.data.name);

    // Fold indicator group for collapsed nodes
    const foldGroup = nodeEnter
      .append("g")
      .attr("class", "fold-indicator")
      .attr("transform", (d) => `translate(${d.depth === 0 ? d.w / 2 + 12 : d.w + 16},0)`)
      .style("display", (d) => (d._children ? null : "none"));

    foldGroup.append("circle").attr("class", "fold-dot").attr("r", 9).attr("stroke", (d) => d.color);
    foldGroup.append("text").attr("class", "fold-count").text((d) => (d._children ? countDescendants(d._children) : ""));

    const nodeUpdate = node
      .merge(nodeEnter)
      .transition(transition)
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1);

    nodeUpdate.select(".node-box").attr("width", (d) => (d.depth === 0 ? d.w : d.w + 12));

    nodeUpdate.select(".fold-indicator")
      .attr("transform", (d) => `translate(${d.depth === 0 ? d.w / 2 + 12 : d.w + 16},0)`)
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
      d.w = estimateWidth(d.data.name, d.depth);
    });

    r.color = "#4fd8c9";
    (r.children || []).forEach((child, i) => assignColors(child, COLORS[i % COLORS.length]));

    rootDataRef.current = r;
    updateTree(r);
    setTimeout(() => fitToView(450), 120);
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

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setGenerationError("");
    setGenerationNotice("");

    try {
      const result = await generateAuthenticatedMindMap({
        topic: aiPrompt,
        sendTutorMessage: sendMessage
      });
      setOutlineText(result.outline);
      setGenerationNotice("Mapa gerado pelo Tutor IA e vinculado ao seu histórico autenticado.");
    } catch (error) {
      setGenerationError(error?.message || "Não foi possível gerar o mapa com o Tutor IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExplainNode = () => {
    if (!activeNode?.data?.name) return;
    openTutor({
      prompt: `Explique o nó anatômico “${activeNode.data.name}” no contexto do mapa “${rootDataRef.current?.data?.name || "Mapa mental anatômico"}”. Relacione estrutura, função e uma aplicação clínica, sem abrir painéis legados.`,
      context: {
        source: "mind-map",
        route: "/mind-map",
        sectionTitle: activeNode.data.name,
        sectionQuestion: "Explicar nó selecionado no mapa mental",
        availableActions: []
      },
      contextLabel: `Mapa mental · ${activeNode.data.name}`
    });
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
    setTimeout(() => fitToView(450), 340);
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
    setTimeout(() => fitToView(450), 340);
  };

  // Ultra-High Resolution 2x Retina PNG Export Engine
  const handleExportPNG = () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const bounds = gZoomRef.current ? gZoomRef.current.node().getBBox() : { width: svgEl.clientWidth, height: svgEl.clientHeight };

    const svgClone = svgEl.cloneNode(true);
    const margin = 80;
    const exportWidth = Math.max(1600, Math.ceil(bounds.width + margin * 2));
    const exportHeight = Math.max(1000, Math.ceil(bounds.height + margin * 2));

    // Reset zoom transform on SVG clone to center bounds cleanly
    const zoomGroup = svgClone.querySelector(".zoom-group");
    if (zoomGroup) {
      const tx = margin - bounds.x;
      const ty = margin - bounds.y;
      zoomGroup.setAttribute("transform", `translate(${tx}, ${ty}) scale(1)`);
    }

    svgClone.setAttribute("width", exportWidth);
    svgClone.setAttribute("height", exportHeight);
    svgClone.setAttribute("viewBox", `0 0 ${exportWidth} ${exportHeight}`);
    svgClone.style.background = "#05080a";

    // Embed Google Fonts & explicit SVG styling in clone header
    const styleElem = document.createElement("style");
    styleElem.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&family=Inter:wght@500;600;700&family=JetBrains+Mono:wght@500&display=swap');
      .link { fill: none; stroke-width: 2.2px; opacity: 0.8; }
      .node-box { stroke-width: 1.6px; }
      .node-label { font-family: 'Inter', sans-serif; fill: #ffffff; dominant-baseline: middle; }
      .node-root .node-label { font-family: 'Space Grotesk', sans-serif; font-weight: 700; fill: #ffffff; }
      .fold-dot { fill: rgba(5,8,10,0.95); stroke-width: 1.6px; }
      .fold-count { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; fill: #ffffff; text-anchor: middle; dominant-baseline: middle; }
    `;
    svgClone.insertBefore(styleElem, svgClone.firstChild);

    // Resolve node colors to explicit dark fills so canvas drawImage rasterization is ultra crisp
    const nodes = svgClone.querySelectorAll(".node");
    nodes.forEach((n) => {
      const box = n.querySelector(".node-box");
      if (box) {
        const strokeColor = box.getAttribute("stroke") || "#4fd8c9";
        const isRoot = n.classList.contains("node-root");
        box.setAttribute("fill", isRoot ? "#0d2626" : "#0d161a");
        box.setAttribute("stroke", strokeColor);
        box.setAttribute("stroke-width", isRoot ? "2.5" : "1.6");
      }
    });

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const scaleFactor = 2; // 2x High-DPI Retina
      const canvas = document.createElement("canvas");
      canvas.width = exportWidth * scaleFactor;
      canvas.height = exportHeight * scaleFactor;
      const ctx = canvas.getContext("2d");

      ctx.scale(scaleFactor, scaleFactor);
      ctx.fillStyle = "#05080a";
      ctx.fillRect(0, 0, exportWidth, exportHeight);
      ctx.drawImage(img, 0, 0, exportWidth, exportHeight);

      const pngURL = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = pngURL;
      link.download = `mapa-mental-aeternum-atlas.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobURL);
    };
    img.src = blobURL;
  };

  // PDF Print Export
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className={`a26-mindmap-page fade-in-up ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${isFullscreen ? "is-fullscreen" : ""}`}>
      <A26Sidebar label={t("mindMap.title", { defaultValue: "Editor do mapa mental" })} className={`mindmap-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="mindmap-sidebar-head">
          <p className="mindmap-eyebrow">{t("mindMap.eyebrow", { defaultValue: "Atlas de raciocínio · Tutor autenticado" })}</p>
          <h1>{t("mindMap.title", { defaultValue: "Mapa Mental" })}</h1>
          <p>{t("mindMap.subtitle", { defaultValue: "Transforme um tema anatômico em relações visuais editáveis sem perder o controle do esboço." })}</p>
        </div>

        <A26Surface material="clear" tone="teal" className="mindmap-ai-composer">
          <div className="mindmap-ai-composer__status">
            <span className={`mindmap-status-dot is-${connectionMode || "offline"}`} aria-hidden="true" />
            <span>{connectionMode === "online" ? t("mindMap.tutorOnline", { defaultValue: "Tutor IA autenticado" }) : t("mindMap.tutorOffline", { defaultValue: "Tutor IA requer conexão" })}</span>
          </div>
          <A26Field
            label={t("mindMap.topicLabel", { defaultValue: "Tema anatômico" })}
            placeholder={t("mindMap.topicPlaceholder", { defaultValue: "Esboço IA (ex: Sistema Renal...)" })}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isGenerating) void handleGenerateAI();
            }}
            error={generationError}
            hint={!generationError ? t("mindMap.topicHint", { defaultValue: "A geração fica vinculada ao histórico seguro do Tutor IA." }) : undefined}
          />
          <A26Button
            variant="primary"
            icon={<LineIcon name="spark" className="h-5 w-5" />}
            onClick={() => void handleGenerateAI()}
            disabled={isGenerating || aiPrompt.trim().length < 3}
            loading={isGenerating}
          >
            {isGenerating ? t("mindMap.structuring", { defaultValue: "Estruturando" }) : t("mindMap.generateButton", { defaultValue: "Gerar com Tutor IA" })}
          </A26Button>
          {generationNotice ? <p className="mindmap-generation-notice" role="status">{generationNotice}</p> : null}
        </A26Surface>

        <div className="mindmap-outline-box">
          <div className="mindmap-outline-heading">
            <div>
              <strong id="mindmap-outline-label">{t("mindMap.editableStructure", { defaultValue: "Estrutura editável" })}</strong>
              <span>{t("mindMap.compactPreview", { defaultValue: "Prévia compacta do esboço" })}</span>
            </div>
            <A26Button
              variant="secondary"
              className="mindmap-outline-expand"
              icon={<LineIcon name="fullscreen" className="h-4 w-4" />}
              aria-haspopup="dialog"
              aria-expanded={isOutlineEditorOpen}
              onClick={() => setIsOutlineEditorOpen(true)}
            >
              {t("mindMap.expandButton", { defaultValue: "Ampliar" })}
            </A26Button>
          </div>
          <textarea
            className="a26-field__control"
            aria-labelledby="mindmap-outline-label"
            aria-describedby="mindmap-outline-hint"
            spellCheck="false"
            value={outlineText}
            onChange={(e) => setOutlineText(e.target.value)}
          />
          <small id="mindmap-outline-hint" className="a26-field__hint">
            {t("mindMap.outlineHint", { defaultValue: "Um espaço adicional representa um novo nível hierárquico." })}
          </small>
        </div>

        <div className="mindmap-sidebar-actions">
          <A26Button variant="primary" icon={<LineIcon name="layers" className="h-5 w-5" />} onClick={renderFromOutline}>
            {t("mindMap.renderMap", { defaultValue: "Renderizar mapa" })}
          </A26Button>
          <div className="mindmap-btn-row">
            <A26Button variant="secondary" onClick={handleExpandAll}>
              {t("mindMap.expandAll", { defaultValue: "Expandir tudo" })}
            </A26Button>
            <A26Button variant="secondary" onClick={handleCollapseAll}>
              {t("mindMap.collapseAll", { defaultValue: "Recolher tudo" })}
            </A26Button>
          </div>
        </div>
      </A26Sidebar>

      <A26Surface as="main" material="regular" tone="teal" className="mindmap-canvas-wrap" ref={canvasWrapRef}>
        <A26Toolbar label={t("mindMap.title", { defaultValue: "Ferramentas do mapa mental" })} className="mindmap-topbar">
          <div className="topbar-left-group">
            <A26IconButton
              label={sidebarCollapsed ? t("mindMap.showEditor", { defaultValue: "Mostrar editor" }) : t("mindMap.hideEditor", { defaultValue: "Ocultar editor" })}
              icon="menu"
              onClick={() => setSidebarCollapsed((v) => !v)}
            />
            <div className="topbar-export-group">
              <A26Button variant="secondary" onClick={handleExportPNG} title={t("mindMap.exportPng", { defaultValue: "Imagem (PNG)" })} className="topbar-export-btn">
                <span className="export-btn-full">{t("mindMap.exportPng", { defaultValue: "Imagem (PNG)" })}</span>
                <span className="export-btn-short">PNG</span>
              </A26Button>
              <A26Button variant="secondary" onClick={handleExportPDF} title={t("mindMap.exportPdf", { defaultValue: "Exportar PDF" })} className="topbar-export-btn">
                <span className="export-btn-full">{t("mindMap.exportPdf", { defaultValue: "Exportar PDF" })}</span>
                <span className="export-btn-short">PDF</span>
              </A26Button>
            </div>
          </div>

          <div className="zoom-controls">
            <A26Button variant="liquid" aria-label="Aproximar zoom"
              onClick={() => d3.select(svgRef.current).transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 1.3)}
            >
              +
            </A26Button>
            <A26Button variant="liquid" aria-label="Afastar zoom"
              onClick={() => d3.select(svgRef.current).transition().duration(200).call(zoomBehaviorRef.current.scaleBy, 1 / 1.3)}
            >
              −
            </A26Button>
            <A26IconButton label={t("mindMap.centerView", { defaultValue: "Centralizar vista" })} icon="reset" onClick={() => fitToView(450)} />
            <A26IconButton
              label={isFullscreen ? t("mindMap.exitFullscreen", { defaultValue: "Sair da tela cheia" }) : t("mindMap.enterFullscreen", { defaultValue: "Usar tela cheia" })}
              icon="fullscreen"
              className={isFullscreen ? "active-fullscreen" : ""}
              onClick={() => setIsFullscreen((prev) => !prev)}
            />
          </div>
        </A26Toolbar>

        <div className="mindmap-canvas-stage">
          <svg id="canvas" ref={svgRef} role="img" aria-label="Mapa mental anatômico interativo" />
        </div>

        <div className="mindmap-hint">
          {isFullscreen ? t("mindMap.fullscreenExitHint", { defaultValue: "Pressione Esc para sair da tela cheia · " }) : ""}{t("mindMap.canvasHint", { defaultValue: "arraste para mover · roda do mouse para zoom · clique num nó para recolher/expandir os filhos" })}
        </div>

        {activeNode ? (
          <A26Surface as="aside" material="substantial" tone="teal" className="mindmap-node-drawer fade-in-up">
            <div className="mindmap-node-drawer__head">
              <span>{t("mindMap.selectedNode", { defaultValue: "Nó selecionado" })}</span>
              <A26IconButton label={t("mindMap.closeNodeDetails", { defaultValue: "Fechar detalhes do nó" })} icon="close" onClick={() => setActiveNode(null)} />
            </div>
            <h3>{activeNode.data.name}</h3>
            <p className="mindmap-node-meta">
              {t("mindMap.level", { defaultValue: "Nível" })} {activeNode.depth} · {activeNode.children ? t("mindMap.directChildren", { count: activeNode.children.length, defaultValue: `${activeNode.children.length} filhos diretos` }) : activeNode._children ? t("mindMap.collapsedChildren", { count: countDescendants(activeNode._children), defaultValue: `${countDescendants(activeNode._children)} filhos recolhidos` }) : t("mindMap.leafNode", { defaultValue: "Nó folha" })}
            </p>

            <div className="mindmap-node-actions">
              <A26Button variant="primary" icon={<LineIcon name="spark" className="h-5 w-5" />} onClick={handleExplainNode}>
                {t("mindMap.explainWithAi", { defaultValue: "Explicar com Tutor IA" })}
              </A26Button>
              <A26Button variant="secondary" icon={<LineIcon name="layers" className="h-5 w-5" />} onClick={() => navigate("/models")}>
                {t("mindMap.explore3dModels", { defaultValue: "Explorar modelos 3D" })}
              </A26Button>
              <A26Button variant="secondary" onClick={() => navigate("/flashcards")}>
                {t("mindMap.practiceFlashcards", { defaultValue: "Praticar com flashcards" })}
              </A26Button>
              <A26Button variant="secondary" onClick={() => navigate("/quizzes")}>
                {t("mindMap.openQuizzes", { defaultValue: "Abrir simulados" })}
              </A26Button>
            </div>
          </A26Surface>
        ) : null}
      </A26Surface>

      <A26Modal
        open={isOutlineEditorOpen}
        title={t("mindMap.editorModalTitle", { defaultValue: "Estrutura editável" })}
        description={t("mindMap.editorModalDescription", { defaultValue: "Edite o esboço hierárquico com mais espaço. As alterações permanecem sincronizadas com a prévia lateral." })}
        className="mindmap-editor-modal"
        closeLabel={t("mindMap.finishEditing", { defaultValue: "Fechar editor ampliado" })}
        onClose={() => setIsOutlineEditorOpen(false)}
        actions={(
          <>
            <A26Button variant="secondary" onClick={() => setIsOutlineEditorOpen(false)}>
              {t("mindMap.finishEditing", { defaultValue: "Concluir edição" })}
            </A26Button>
            <A26Button
              variant="primary"
              icon={<LineIcon name="layers" className="h-5 w-5" />}
              onClick={() => {
                renderFromOutline();
                setIsOutlineEditorOpen(false);
              }}
            >
              {t("mindMap.applyAndRender", { defaultValue: "Aplicar e renderizar" })}
            </A26Button>
          </>
        )}
      >
        <div className="mindmap-expanded-editor">
          <A26Field
            as="textarea"
            label={t("mindMap.hierarchicalOutline", { defaultValue: "Esboço hierárquico" })}
            hint={t("mindMap.hierarchicalOutlineHint", { defaultValue: "Use um espaço adicional no início da linha para criar cada novo nível hierárquico." })}
            spellCheck="false"
            value={outlineText}
            onChange={(e) => setOutlineText(e.target.value)}
          />
        </div>
      </A26Modal>
    </div>
  );
}
