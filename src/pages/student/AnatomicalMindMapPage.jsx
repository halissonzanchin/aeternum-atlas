import React, { useEffect, useRef, useState, useMemo } from "react";
import MindElixir from "mind-elixir";
import { A26Button, A26Card } from "../../components/aeternum-26";
import LineIcon from "../../components/icons/LineIcon";
import "../../styles/A26MindMap.css";

const ANATOMICAL_PRESETS = [
  {
    id: "cardio",
    label: "🫀 Sistema Cardiovascular",
    modelPath: "/viewer/coracao-edicao-morgue",
    markdown: `# 🫀 Sistema Cardiovascular
## ❤️ Coração & Câmaras Musculares
- Ventrículo Esquerdo (Miocárdio Espesso para circulação sistêmica)
- Ventrículo Direito (Bombeamento para circulação pulmonar)
- Válvulas Atrioventriculares (Mitral e Tricúspide)
- Válvulas Semilunares (Aórtica e Pulmonar)
## 🩸 Grandes Vasos & Irrigação
- Artéria Aorta (Arco Aórtico, Ramos Coronários, Torácica e Abdominal)
- Veias Cavas Superior e Inferior (Retorno venoso sistêmico)
- Artérias Coronárias (Direita e Interventricular Anterior)
## 🏥 Correlações Clínicas
- Infarto Agudo do Miocárdio (IAM por oclusão de coronária)
- Angina de Peito & Isquemia Miocárdica
- Estenose Válvular Aórtica & Insuficiência Cardiaca`
  },
  {
    id: "femur",
    label: "🦴 Fémur & Osteologia do Membro Inferior",
    modelPath: "/viewer/corte-sagital-cranio-humano-superficial",
    markdown: `# 🦴 Fémur & Osteologia do Membro Inferior
## 📍 Epífise Proximal
- Cabeça do Fémur (Fóvea capitis e articulação coxofemoral)
- Colo do Fémur (Zona de sustentação de carga biomecânica)
- Trocânter Maior e Menor (Inserções do Glúteo Médio e Iliopsoas)
## 🦴 Diáfise & Corpo Femural
- Linha Áspera (Inserção dos adutores e quadríceps)
- Tuberosidade Glútea
- Face Poplítea Posterior
## 🦶 Epífise Distal & Joelho
- Côndilos Medial e Lateral (Articulação fêmoro-tibial)
- Fossa Intercondilar (Inserção dos Ligamentos Cruzados LCA/LCP)
## 🏥 Traumatologia & Lesões
- Fratura de Colo Femural (Risco elevado de Necrose Avascular)
- Artroplastia Total de Quadril (Prótese metálica/cerâmica)`
  },
  {
    id: "snc",
    label: "🧠 Sistema Nervoso Central",
    modelPath: "/viewer/corte-sagital-cranio-humano-superficial",
    markdown: `# 🧠 Sistema Nervoso Central
## 🔮 Encéfalo & Telencéfalo
- Córtex Cerebral (Giro Pré-Central Motor e Pós-Central Somatosensorial)
- Núcleos da Base (Caudado, Putamen e Globo Pálido)
- Sistema Límbico (Hipocampo e Amígdala - Memória e Emoção)
## 🪵 Tronco Encefálico & Medula
- Mesencéfalo, Ponte e Bulbo (Centros respiratórios e de pares cranianos)
- Cerebelo (Coordenação motora e equilíbrio)
- Medula Espinhal (Vias Corticoespinais e Espinotalâmicas)
## 🏥 Neurologia Clínica
- Acidente Vascular Cerebral (AVC Isquêmico da Artéria Cerebral Média)
- Neuralgia do Trigêmeo & Neuropatias Cranianas`
  },
  {
    id: "respiratorio",
    label: "🫁 Aparelho Respiratório",
    modelPath: "/viewer/coracao-edicao-morgue",
    markdown: `# 🫁 Aparelho Respiratório
## 🌬️ Vias Condução Aérea
- Laringe e Cartilagem Cricoide
- Traqueia & Carina (Bifurcação traqueal)
- Brônquios Principais Direito e Esquerdo
## 🫁 Parênquima Pulmonar
- Lobos Pulmonares (3 à direita, 2 à esquerda)
- Alvéolos & Barreira Hemato-Gasosa
- Pleura Visceral e Parietal (Cavidade pleural)
## 🏥 Pneumologia Clínica
- Pneumotórax (Ar na cavidade pleural com colapso pulmonar)
- Enfisema Pulmonar & DPOC`
  }
];

function parseMarkdownToMindElixir(mdText, defaultTitle = "Mapa Mental") {
  const lines = mdText.split("\n").filter((l) => l.trim());
  let rootTitle = defaultTitle;
  const rootChildren = [];
  const stack = [{ level: 0, children: rootChildren }];

  lines.forEach((line) => {
    const raw = line.trimEnd();
    if (!raw.trim()) return;

    const headingMatch = raw.match(/^(#{1,6})\s+(.*)/);
    const listMatch = raw.match(/^(\s*)(?:[-*+]|\d+\.)\s+(.*)/);

    let level = 1;
    let text = raw.trim();

    if (headingMatch) {
      level = headingMatch[1].length;
      text = headingMatch[2].trim();
      if (level === 1) {
        rootTitle = text;
        return;
      }
    } else if (listMatch) {
      level = Math.floor(listMatch[1].length / 2) + 3;
      text = listMatch[2].trim();
    }

    const newNode = {
      id: "node_" + Math.random().toString(36).substring(2, 9),
      topic: text,
      children: []
    };

    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    stack[stack.length - 1].children.push(newNode);
    stack.push({ level, children: newNode.children });
  });

  return {
    nodeData: {
      id: "root_" + Math.random().toString(36).substring(2, 7),
      topic: rootTitle,
      children: rootChildren
    }
  };
}

export default function AnatomicalMindMapPage({ user, navigate }) {
  const [selectedPresetId, setSelectedPresetId] = useState("cardio");
  const [markdownText, setMarkdownText] = useState(ANATOMICAL_PRESETS[0].markdown);
  const [showEditor, setShowEditor] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const [layoutDirection, setLayoutDirection] = useState("SIDE"); // 'SIDE', 'RIGHT', 'LEFT'

  const containerRef = useRef(null);
  const mindInstanceRef = useRef(null);

  const activePreset = useMemo(() => {
    return ANATOMICAL_PRESETS.find((p) => p.id === selectedPresetId) || ANATOMICAL_PRESETS[0];
  }, [selectedPresetId]);

  // Initialize or re-render MindElixir
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean old instance DOM
    containerRef.current.innerHTML = "";

    const mindData = parseMarkdownToMindElixir(markdownText, activePreset.label);

    const dir =
      layoutDirection === "RIGHT"
        ? MindElixir.RIGHT
        : layoutDirection === "LEFT"
        ? MindElixir.LEFT
        : MindElixir.SIDE;

    const instance = new MindElixir({
      el: containerRef.current,
      direction: dir,
      editable: true,
      toolBar: true,
      keypress: true,
      selectionContainer: "body",
      theme: MindElixir.DARK_THEME
    });

    instance.init(mindData);
    mindInstanceRef.current = instance;

    // Listen to node selection events
    instance.bus.addListener("selectNode", (node) => {
      if (node && node.topic) {
        setActiveNode(node);
      }
    });

    return () => {
      try {
        if (containerRef.current) containerRef.current.innerHTML = "";
      } catch (e) {
        // cleanup silent
      }
    };
  }, [markdownText, layoutDirection, activePreset.label]);

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setMarkdownText(preset.markdown);
    setActiveNode(null);
  };

  const handleGenerateAI = () => {
    if (!customPrompt.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const topic = customPrompt.trim();
      const generatedMd = `# 🫀 ${topic} (Mapa Mental IA)
## 📌 Anatomia & Fundamentos Estruturais
- Acidentes Anatômicos Principais de ${topic}
- Irrigação Arterial & Drenagem Venosa Dedicada
- Inervação & Relações Sintópicas Adjacentes
## 🔍 Topografia & Ramos
- Segmentação Anterior e Posterior de ${topic}
- Fáscias de Revestimento e Bainhas Vasculares
## 🏥 Correlações Clínicas & Casos de Prova
- Principais Patologias e Síndromes Associadas a ${topic}
- Imagem Radiológica (TC / RM / Ultrassom) e Achados de Exame`;

      setMarkdownText(generatedMd);
      setSelectedPresetId("custom");
      setIsGenerating(false);
    }, 600);
  };

  const handleExportPNG = () => {
    if (mindInstanceRef.current && mindInstanceRef.current.exportPng) {
      mindInstanceRef.current.exportPng();
    } else {
      window.print();
    }
  };

  return (
    <section className="a26-mindmap-page fade-in-up">
      {/* Hero Header */}
      <header className="mindmap-hero">
        <div className="mindmap-hero__content">
          <h1>Mapa Mental Anatômico Obsidian (Engine Real)</h1>
          <p>Motor profissional HTML5/SVG Mind Elixir com nós interativos, atalhos de teclado e exportação.</p>
        </div>

        <div className="mindmap-hero__controls">
          <div className="segmented">
            <button
              className={layoutDirection === "SIDE" ? "active" : ""}
              onClick={() => setLayoutDirection("SIDE")}
            >
              ↔ Ambos os Lados
            </button>
            <button
              className={layoutDirection === "RIGHT" ? "active" : ""}
              onClick={() => setLayoutDirection("RIGHT")}
            >
              ➔ Direita
            </button>
          </div>

          <A26Button variant="secondary" onClick={() => setShowEditor((v) => !v)}>
            {showEditor ? "Fechar Editor Markdown" : "📝 Ver/Editar Markdown"}
          </A26Button>

          <A26Button variant="primary" onClick={handleExportPNG}>
            📷 Exportar Imagem
          </A26Button>
        </div>
      </header>

      {/* Preset Chips */}
      <div className="mindmap-presets">
        {ANATOMICAL_PRESETS.map((preset) => (
          <button
            key={preset.id}
            className={`mindmap-preset-chip ${selectedPresetId === preset.id ? "is-active" : ""}`}
            onClick={() => handleSelectPreset(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Generator Prompt Bar */}
      <div className="mindmap-generator-bar">
        <input
          type="text"
          className="mindmap-generator-input"
          placeholder="Digite qualquer conceito anatômico para gerar um Mapa Mental Obsidian (ex: Sistema Renal, Plexo Braquial...)"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerateAI()}
        />
        <A26Button
          variant="primary"
          onClick={handleGenerateAI}
          disabled={isGenerating || !customPrompt.trim()}
        >
          {isGenerating ? "Gerando..." : "Gerar com IA"}
        </A26Button>
      </div>

      {/* Optional Markdown Live Code Editor */}
      {showEditor ? (
        <div className="mindmap-markdown-drawer fade-in-up">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            Editar Código Markdown do Mapa Mental (Formato Obsidian Headers / Lists)
          </label>
          <textarea
            className="mindmap-markdown-textarea"
            value={markdownText}
            onChange={(e) => setMarkdownText(e.target.value)}
          />
        </div>
      ) : null}

      {/* Main Mind Elixir Viewport */}
      <div className="mindmap-viewport">
        <div ref={containerRef} className="mindmap-elixir-container" />

        {/* Selected Node Drawer */}
        {activeNode ? (
          <aside className="mindmap-detail-drawer fade-in-up">
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
            <h3 className="text-lg font-bold text-white mb-2">{activeNode.topic}</h3>
            <p className="text-xs text-slate-400 mb-4">
              Pressione <kbd className="px-1 bg-slate-800 rounded">Enter</kbd> para criar um nó filho, ou <kbd className="px-1 bg-slate-800 rounded">Tab</kbd> para subtema.
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
              <A26Button
                variant="secondary"
                onClick={() => navigate("/flashcards")}
              >
                🎴 Praticar Flashcards
              </A26Button>
              <A26Button
                variant="secondary"
                onClick={() => navigate("/quizzes")}
              >
                📝 Fazer Simulado Teórico
              </A26Button>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
