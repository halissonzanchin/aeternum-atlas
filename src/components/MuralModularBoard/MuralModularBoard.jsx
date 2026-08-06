import React, { useEffect, useRef, useState, useMemo } from "react";
import { A26Button } from "../aeternum-26";
import LineIcon from "../icons/LineIcon";
import "./MuralModularBoard.css";

const COLS = 7;
const ROWS = 4;
const TOTAL_CELLS = COLS * ROWS;
const LOCAL_STORAGE_KEY = "aeternum-mural-notes-v1";
const COLOR_KEYS = ["cyan", "amber", "coral", "violet", "mint"];

// Frame Config for the 300-image Planetario loop
const FRAME_CONFIG = {
  folder: "/images/planetario/",
  prefix: "ezgif-frame-",
  extension: ".jpg",
  firstFrame: 1,
  frameCount: 300,
  padding: 3,
  fps: 24
};

// Deterministic cell type hash function (Math.sin pseudo-hash)
function getCellGlassType(index) {
  const hash = Math.sin((index + 1) * 12.9898) * 43758.5453;
  return hash - Math.floor(hash) > 0.45 ? "clear" : "smoke";
}

// Generate blueprint coordinate (e.g. A1, B2...)
function getCoordLabel(index) {
  const colLetter = String.fromCharCode(65 + (index % COLS));
  const rowNum = Math.floor(index / COLS) + 1;
  return `${colLetter}${rowNum}`;
}

export default function MuralModularBoard({ videoSrc = null }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Post-It state dictionary: { [cellIndex]: { title, content, color } }
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not load mural notes from localStorage:", e);
    }
    return {
      2: {
        title: "SISTEMA NERVOSO CENTRAL",
        content: "Revisar as conexões aferentes do tronco encefálico antes do próximo simulado anatômico.",
        color: "cyan"
      },
      3: {
        title: "VASCULARIZAÇÃO CAROTÍDEA",
        content: "Anotação sobre os ramos do polígono de Willis.",
        color: "amber"
      }
    };
  });

  const [draggedCellIndex, setDraggedCellIndex] = useState(null);
  const [dragOverCellIndex, setDragOverCellIndex] = useState(null);

  // Modals state
  const [editingIndex, setEditingIndex] = useState(null);
  const [readingIndex, setReadingIndex] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formColor, setFormColor] = useState("cyan");

  // Save to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn("Could not save mural notes to localStorage:", e);
    }
  }, [notes]);

  // Preload 300 images & Run Canvas RAF Delta-Time Loop
  useEffect(() => {
    let isMounted = true;
    let loadedCount = 0;
    const total = FRAME_CONFIG.frameCount;
    const loadedImages = new Array(total);

    // Preload loop
    for (let i = 0; i < total; i++) {
      const frameNum = (FRAME_CONFIG.firstFrame + i).toString().padStart(FRAME_CONFIG.padding, "0");
      const src = `${FRAME_CONFIG.folder}${FRAME_CONFIG.prefix}${frameNum}${FRAME_CONFIG.extension}`;
      const img = new Image();
      img.src = src;
      img.onload = () => {
        if (!isMounted) return;
        loadedCount++;
        if (loadedCount === total) {
          imagesRef.current = loadedImages;
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        if (!isMounted) return;
        loadedCount++;
        if (loadedCount === total) {
          imagesRef.current = loadedImages;
          setImagesLoaded(true);
        }
      };
      loadedImages[i] = img;
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // RAF Animation Loop with Delta-Time & drawCover scaling
  useEffect(() => {
    if (!imagesLoaded || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const container = containerRef.current;
    const images = imagesRef.current;
    const total = images.length;
    if (!total || !ctx) return;

    let animFrameId = null;
    let currentFrame = 0;
    let lastTs = performance.now();
    let accMs = 0;
    const frameIntervalMs = 1000 / FRAME_CONFIG.fps;

    // Helper: drawCover (emulates object-fit: cover on canvas)
    function drawCover(img) {
      if (!img || !img.complete || !img.naturalWidth) return;

      const cWidth = canvas.width;
      const cHeight = canvas.height;
      const iWidth = img.naturalWidth;
      const iHeight = img.naturalHeight;

      const scale = Math.max(cWidth / iWidth, cHeight / iHeight);
      const renderW = iWidth * scale;
      const renderH = iHeight * scale;
      const offsetX = (cWidth - renderW) / 2;
      const offsetY = (cHeight - renderH) / 2;

      ctx.clearRect(0, 0, cWidth, cHeight);
      ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    }

    function syncSize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      drawCover(images[currentFrame]);
    }

    syncSize();

    // ResizeObserver for zero-lag responsiveness
    const resizeObserver = new ResizeObserver(() => {
      syncSize();
    });
    resizeObserver.observe(container);

    // Delta-time RAF loop
    function loop(timestamp) {
      const dt = timestamp - lastTs;
      lastTs = timestamp;
      accMs += dt;

      if (accMs >= frameIntervalMs) {
        accMs = accMs % frameIntervalMs;
        currentFrame = (currentFrame + 1) % total;
        drawCover(images[currentFrame]);
      }

      animFrameId = requestAnimationFrame(loop);
    }

    animFrameId = requestAnimationFrame(loop);

    return () => {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
    };
  }, [imagesLoaded]);

  const activeNotesCount = useMemo(() => Object.keys(notes).length, [notes]);

  // Open Create/Edit modal
  function handleOpenCreate(index) {
    const existing = notes[index];
    setFormTitle(existing ? existing.title : "");
    setFormContent(existing ? existing.content : "");
    setFormColor(existing ? existing.color : "cyan");
    setEditingIndex(index);
    setReadingIndex(null);
  }

  function handleSaveNote() {
    if (editingIndex === null) return;
    if (!formTitle.trim() && !formContent.trim()) {
      handleDeleteNote(editingIndex);
      setEditingIndex(null);
      return;
    }

    setNotes(prev => ({
      ...prev,
      [editingIndex]: {
        title: formTitle.trim() || "Sem título",
        content: formContent.trim(),
        color: formColor
      }
    }));
    setEditingIndex(null);
  }

  function handleDeleteNote(index) {
    setNotes(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
    if (readingIndex === index) setReadingIndex(null);
    if (editingIndex === index) setEditingIndex(null);
  }

  // HTML5 Drag & Drop Swap Implementation
  function handleDragStart(e, index) {
    setDraggedCellIndex(index);
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverCellIndex !== index) {
      setDragOverCellIndex(index);
    }
  }

  function handleDragLeave(e, index) {
    if (dragOverCellIndex === index) {
      setDragOverCellIndex(null);
    }
  }

  function handleDrop(e, targetIndex) {
    e.preventDefault();
    setDragOverCellIndex(null);
    if (draggedCellIndex === null || draggedCellIndex === targetIndex) return;

    setNotes(prev => {
      const updated = { ...prev };
      const sourceNote = updated[draggedCellIndex];
      const targetNote = updated[targetIndex];

      if (sourceNote) {
        updated[targetIndex] = sourceNote;
      } else {
        delete updated[targetIndex];
      }

      if (targetNote) {
        updated[draggedCellIndex] = targetNote;
      } else {
        delete updated[draggedCellIndex];
      }

      return updated;
    });

    setDraggedCellIndex(null);
  }

  return (
    <div className="mural-board-wrapper fade-in-up">
      <div className="notes-board" ref={containerRef}>
        {/* Layer 0: Background Canvas (Planetario 300 frames loop) or Video */}
        {videoSrc ? (
          <video
            className="notes-board__video"
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
        ) : (
          <canvas ref={canvasRef} className="notes-board__canvas" />
        )}

        {/* Layer 1: Dark Glass Contrast Overlay */}
        <div className="notes-board__overlay" />

        {/* Board Header */}
        <header className="notes-board__header">
          <div className="notes-board__title-group">
            <LineIcon name="spark" className="h-5 w-5 text-agedGold" />
            <div>
              <p className="notes-board__eyebrow">ESTUDO AUTÔNOMO • ANOTAÇÕES DENSAS</p>
              <h3>Mural Modular de Estudo Anatômico</h3>
            </div>
          </div>
          <span className="notes-board__count-chip">
            {activeNotesCount} / {TOTAL_CELLS} NOTAS FIXADAS
          </span>
        </header>

        {/* Layer 3: Grid Mesh */}
        <div className="notes-board__grid">
          {Array.from({ length: TOTAL_CELLS }).map((_, index) => {
            const glassType = getCellGlassType(index);
            const coord = getCoordLabel(index);
            const note = notes[index];
            const isDragOver = dragOverCellIndex === index;

            return (
              <div
                key={index}
                className={`notes-board__cell ${isDragOver ? "is-drag-over" : ""}`}
                data-type={glassType}
                onDragOver={e => handleDragOver(e, index)}
                onDragLeave={e => handleDragLeave(e, index)}
                onDrop={e => handleDrop(e, index)}
              >
                {note ? (
                  <div
                    className="notes-board__postit"
                    data-color={note.color || "cyan"}
                    draggable
                    onDragStart={e => handleDragStart(e, index)}
                    onClick={() => setReadingIndex(index)}
                  >
                    <span className="notes-board__postit-bar" />
                    <div className="notes-board__postit-header">
                      <span className="notes-board__postit-title">{note.title}</span>
                      <button
                        type="button"
                        className="notes-board__postit-delete"
                        title="Excluir Nota"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteNote(index);
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <p className="notes-board__postit-content">{note.content}</p>
                    <span className="notes-board__coord" style={{ alignSelf: "flex-end", marginTop: "auto" }}>
                      {coord}
                    </span>
                  </div>
                ) : (
                  <div className="notes-board__cell-empty" onClick={() => handleOpenCreate(index)}>
                    <span className="notes-board__coord">{coord}</span>
                    <span className="notes-board__add-icon">+</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal 1: Create / Edit Note */}
      {editingIndex !== null ? (
        <div className="notes-board__modal-overlay" onClick={() => setEditingIndex(null)}>
          <div className="notes-board__modal" onClick={e => e.stopPropagation()}>
            <h4>{notes[editingIndex] ? "Editar Post-It" : `Novo Post-It [Bloco ${getCoordLabel(editingIndex)}]`}</h4>

            <div className="notes-board__field">
              <label>Título Curto</label>
              <input
                type="text"
                value={formTitle}
                placeholder="Ex: ORIGEM DO MÚSCULO BÍCEPS"
                onChange={e => setFormTitle(e.target.value)}
                maxLength={45}
                autoFocus
              />
            </div>

            <div className="notes-board__field">
              <label>Anotação / Resumo</label>
              <textarea
                rows={4}
                value={formContent}
                placeholder="Descreva detalhes anatômicos, pontos turísticos de revisão ou observações de simulado..."
                onChange={e => setFormContent(e.target.value)}
              />
            </div>

            <div className="notes-board__field">
              <label>Tonalidade do Vidro</label>
              <div className="notes-board__colors">
                {COLOR_KEYS.map(key => (
                  <button
                    key={key}
                    type="button"
                    className={`notes-board__color-btn ${formColor === key ? "is-selected" : ""}`}
                    data-color={key}
                    onClick={() => setFormColor(key)}
                  />
                ))}
              </div>
            </div>

            <div className="notes-board__modal-actions">
              <A26Button variant="ghost" onClick={() => setEditingIndex(null)}>
                Cancelar
              </A26Button>
              <A26Button variant="primary" onClick={handleSaveNote}>
                Salvar Nota
              </A26Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal 2: View Full Reading Note */}
      {readingIndex !== null && notes[readingIndex] ? (
        <div className="notes-board__modal-overlay" onClick={() => setReadingIndex(null)}>
          <div className="notes-board__modal" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="notes-board__eyebrow">
                BLOCO {getCoordLabel(readingIndex)} • POST-IT ACADÊMICO
              </span>
              <button
                type="button"
                className="text-textMuted hover:text-coral text-xl"
                onClick={() => setReadingIndex(null)}
              >
                ×
              </button>
            </div>

            <h4 style={{ color: "#eef3f4", fontSize: "1.4rem" }}>{notes[readingIndex].title}</h4>
            <p style={{ fontFamily: "Hanken Grotesk", fontSize: "0.95rem", lineHeight: "1.5", color: "#93a4aa" }}>
              {notes[readingIndex].content}
            </p>

            <div className="notes-board__modal-actions" style={{ justifyContent: "space-between" }}>
              <A26Button variant="ghost" onClick={() => handleDeleteNote(readingIndex)}>
                Excluir
              </A26Button>
              <div className="flex gap-2">
                <A26Button variant="liquid" onClick={() => handleOpenCreate(readingIndex)}>
                  Editar
                </A26Button>
                <A26Button variant="primary" onClick={() => setReadingIndex(null)}>
                  Fechar
                </A26Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
