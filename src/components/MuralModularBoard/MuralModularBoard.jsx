import React, { useEffect, useRef, useState, useMemo } from "react";
import { A26Button } from "../aeternum-26";
import LineIcon from "../icons/LineIcon";
import "./MuralModularBoard.css";

const COLS = 7;
const ROWS = 4;
const TOTAL_CELLS = COLS * ROWS;
const LOCAL_STORAGE_KEY = "aeternum-mural-notes-v1";

const COLOR_KEYS = ["cyan", "amber", "coral", "violet", "mint"];

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
      <div className="notes-board">
        {/* Layer 0: Background Video or Fallback Canvas Gradient */}
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
          <div
            className="notes-board__video"
            style={{
              background: `radial-gradient(circle at 50% 40%, rgba(52, 206, 196, 0.22) 0%, rgba(15, 32, 37, 0.95) 75%), linear-gradient(135deg, #05080a 0%, #0a1216 100%)`
            }}
          />
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
