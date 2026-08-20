import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../context/LanguageContext";
import { aeternumVitaVoiceService, getTutorForLanguage } from "../../services/voice/aeternumVitaVoiceService";
import { generateDynamicVoiceResponse } from "../../services/voice/aeternumVoiceBrain";
import { atlasAITutorService } from "../../features/atlas-viewer/ai/atlasAITutorService";
import LineIcon from "../icons/LineIcon";
import "./AeternumSiriScreenOverlay.css";

/**
 * Aeternum 26.1 Apple Intelligence Screen Glow & Aeternum Vita Voice Multi-Tutor
 * High-Fidelity Single-Engine Audio Architecture with Clean Turn-Taking
 * Personas: Eduardo 🇧🇷, Antonia 🇪🇸, Ariana 🇺🇸, Fabian 🇩🇪
 */
export default function AeternumSiriScreenOverlay({
  active = false,
  state = "idle",
  context = {},
  onDeactivate
}) {
  const { language } = useLanguage();
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const opacityRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  const [activeTutor, setActiveTutor] = useState(() => getTutorForLanguage(language));
  const [voiceStatus, setVoiceStatus] = useState("idle"); // 'listening' | 'thinking' | 'speaking'
  const [userSubtitle, setUserSubtitle] = useState("");
  const [tutorSubtitle, setTutorSubtitle] = useState("");

  // Update tutor if language changes
  useEffect(() => {
    setActiveTutor(getTutorForLanguage(language));
  }, [language]);

  // Handle Voice Session Lifecycle
  useEffect(() => {
    if (!active) {
      aeternumVitaVoiceService.stopSession();
      setVoiceStatus("idle");
      setUserSubtitle("");
      setTutorSubtitle("");
      return;
    }

    const tutor = getTutorForLanguage(language);
    setActiveTutor(tutor);
    setUserSubtitle("");
    setTutorSubtitle(tutor.greeting);

    // Start Unified Multi-Tutor Voice Engine with Dynamic Turn-Taking
    aeternumVitaVoiceService.startSession({
      language,
      onStatusChange: ({ status, text }) => {
        setVoiceStatus(status);
        if (text) setTutorSubtitle(text);
      },
      onTranscript: ({ text, isFinal }) => {
        if (text) setUserSubtitle(text);
      },
      onTutorReply: async (userQuestion, currentTutor) => {
        const handleTurn = async (questionText, tutor) => {
          const cleanQ = String(questionText || "").trim();
          if (!cleanQ || aeternumVitaVoiceService.isAcousticEcho(cleanQ)) return;

          setVoiceStatus("thinking");
          try {
            let apiReply = "";
            const streamContext = {
              ...context,
              source: "voice",
              mode: "voice",
              tutorPromptDirective: tutor.promptDirective,
              language
            };

            try {
              const result = await atlasAITutorService.processMessageStream(
                cleanQ,
                streamContext,
                ({ text }) => {
                  if (text && !text.includes("indisponível") && !text.includes("autenticada")) {
                    const cleanChunk = aeternumVitaVoiceService.cleanTextForSpeech(text);
                    apiReply = cleanChunk;
                    setTutorSubtitle(cleanChunk);
                  }
                }
              );

              if (result?.text && !result.text.includes("indisponível") && !result.text.includes("autenticada")) {
                apiReply = aeternumVitaVoiceService.cleanTextForSpeech(result.text);
              }
            } catch (apiErr) {
              console.warn("Remote API notice, using live neural voice brain:", apiErr);
            }

            const rawFinalReply =
              (apiReply && !apiReply.includes("indisponível") && !apiReply.includes("autenticada"))
                ? apiReply
                : await generateDynamicVoiceResponse(cleanQ, streamContext, language);

            const finalReply = aeternumVitaVoiceService.cleanTextForSpeech(rawFinalReply);
            setTutorSubtitle(finalReply);
            setVoiceStatus("speaking");
            await aeternumVitaVoiceService.speak(
              finalReply,
              tutor,
              () => setVoiceStatus("speaking"),
              () => {
                setVoiceStatus("listening");
                aeternumVitaVoiceService.startListening(
                  tutor,
                  (interim) => {
                    const text = typeof interim === "string" ? interim : interim.text;
                    if (text) setUserSubtitle(text);
                  },
                  (finalSpeech) => {
                    const nextText = typeof finalSpeech === "string" ? finalSpeech : finalSpeech.text;
                    if (nextText && nextText.trim()) {
                      setUserSubtitle(nextText);
                      handleTurn(nextText, tutor);
                    }
                  }
                );
              }
            );
          } catch (err) {
            console.warn("Voice AI processing notice:", err);
            setVoiceStatus("listening");
            aeternumVitaVoiceService.startListening(
              tutor,
              (interim) => {
                const text = typeof interim === "string" ? interim : interim.text;
                if (text) setUserSubtitle(text);
              },
              (finalSpeech) => {
                const nextText = typeof finalSpeech === "string" ? finalSpeech : finalSpeech.text;
                if (nextText && nextText.trim()) {
                  setUserSubtitle(nextText);
                  handleTurn(nextText, tutor);
                }
              }
            );
          }
        };

        handleTurn(userQuestion, currentTutor);
      },
      onError: (err) => {
        console.warn("Voice session error:", err);
      }
    });

    return () => {
      aeternumVitaVoiceService.stopSession();
    };
  }, [active, language]);

  // Render Apple Intelligence Soft-Diffusion Border (Calibrated, Elegant & Non-Intrusive)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };

    resize();
    window.addEventListener("resize", resize);

    const drawRoundedRect = (context2d, x, y, width, height, radius) => {
      context2d.beginPath();
      context2d.moveTo(x + radius, y);
      context2d.lineTo(x + width - radius, y);
      context2d.quadraticCurveTo(x + width, y, x + width, y + radius);
      context2d.lineTo(x + width, y + height - radius);
      context2d.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      context2d.lineTo(x + radius, y + height);
      context2d.quadraticCurveTo(x, y + height, x, y + height - radius);
      context2d.lineTo(x, y + radius);
      context2d.quadraticCurveTo(x, y, x + radius, y);
      context2d.closePath();
    };

    const render = () => {
      if (!isRunning) return;

      const targetOpacity = active ? 1.0 : 0.0;
      opacityRef.current += (targetOpacity - opacityRef.current) * 0.12;

      const currentOpacity = opacityRef.current;

      if (currentOpacity > 0.003) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        const t = (Date.now() - startTimeRef.current) * 0.001;
        const phase = t * (voiceStatus === "thinking" ? 0.9 : voiceStatus === "speaking" ? 0.7 : 0.45);

        const angleDeg = Math.sin(phase * 0.9) * 90 + 180;
        const angleRad = (angleDeg * Math.PI) / 180;

        // Calibrated Liquid Glass Palette: Soft Teal, Azure, Cyan, Opalescent Violet
        const baseHues = [174, 192, 215, 245, 270, 190, 174];
        const colors = baseHues.map((baseHue, i) => {
          const shift = Math.sin(phase * 0.6 + (i / 7.0) * Math.PI * 2) * 8;
          const hue = (baseHue + shift + 360) % 360;
          const sat = 52 + 8 * Math.sin(phase * 0.4 + i);
          const light = 62 + 4 * Math.sin(phase * 0.3 + i * 0.6);
          return `hsla(${hue}, ${sat}%, ${light}%, 0.45)`;
        });

        let gradient;
        if (ctx.createConicGradient) {
          gradient = ctx.createConicGradient(angleRad, cx, cy);
          colors.forEach((c, idx) => {
            gradient.addColorStop(idx / (colors.length - 1), c);
          });
          gradient.addColorStop(1, colors[0]);
        } else {
          gradient = ctx.createLinearGradient(0, 0, w, h);
          colors.forEach((c, idx) => {
            gradient.addColorStop(idx / (colors.length - 1), c);
          });
        }

        const margin = 2 * dpr;
        const cornerRadius = Math.max(16 * dpr, Math.min(w, h) * 0.032);
        const rw = w - margin * 2;
        const rh = h - margin * 2;

        ctx.strokeStyle = gradient;

        // Layer 3: Ambient Soft Bloom (Subtle, non-glaring)
        ctx.save();
        ctx.filter = `blur(${20 * dpr}px)`;
        ctx.lineWidth = 14 * dpr;
        ctx.globalAlpha = (0.08 + 0.03 * Math.sin(phase * 0.7)) * currentOpacity;
        drawRoundedRect(ctx, margin, margin, rw, rh, cornerRadius);
        ctx.stroke();
        ctx.restore();

        // Layer 2: Secondary Caustic Diffusion
        ctx.save();
        ctx.filter = `blur(${8 * dpr}px)`;
        ctx.lineWidth = 6 * dpr;
        ctx.globalAlpha = (0.14 + 0.04 * Math.sin(phase * 0.9)) * currentOpacity;
        drawRoundedRect(ctx, margin, margin, rw, rh, cornerRadius);
        ctx.stroke();
        ctx.restore();

        // Layer 1: Primary Crisp Inner Luminescent Edge
        ctx.save();
        ctx.filter = `blur(${3 * dpr}px)`;
        ctx.lineWidth = 2 * dpr;
        ctx.globalAlpha = (0.22 + 0.05 * Math.sin(phase * 1.1)) * currentOpacity;
        drawRoundedRect(ctx, margin, margin, rw, rh, cornerRadius);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      window.removeEventListener("resize", resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [active, voiceStatus]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`a26-siri-screen-overlay ${active ? "is-active" : ""}`}
      aria-hidden={!active}
    >
      <canvas ref={canvasRef} className="a26-siri-canvas" />

      {/* Aeternum Vita Multi-Tutor Liquid Glass Voice HUD */}
      {active && (
        <div className="a26-voice-hud-container" onClick={(e) => e.stopPropagation()}>
          <div className="a26-voice-hud-card">
            <div className="a26-voice-hud-header">
              <div className="a26-voice-tutor-badge">
                <span
                  className="a26-voice-tutor-flag-pill"
                  style={{ background: activeTutor.badgeGradient }}
                  aria-label={activeTutor.country}
                >
                  {activeTutor.countryCode}
                </span>
                <div className="a26-voice-tutor-info">
                  <strong className="a26-voice-tutor-name">{activeTutor.name}</strong>
                  <small className="a26-voice-tutor-role">{activeTutor.role}</small>
                </div>
              </div>

              <div className="a26-voice-status-indicator">
                <span className={`a26-voice-status-dot ${voiceStatus}`} />
                <span className="a26-voice-status-label">
                  {voiceStatus === "listening"
                    ? "Ouvindo você…"
                    : voiceStatus === "thinking"
                    ? "Analisando pergunta…"
                    : "Falando…"}
                </span>
              </div>

              <button
                type="button"
                className="a26-voice-hud-close"
                onClick={onDeactivate}
                title="Encerrar Modo de Voz (ESC)"
                aria-label="Encerrar sessão de voz"
              >
                <LineIcon name="close" className="w-4 h-4" />
              </button>
            </div>

            {/* Live Subtitle Transcript */}
            <div className="a26-voice-transcript-area">
              {userSubtitle ? (
                <div className="a26-voice-bubble user">
                  <span className="a26-voice-bubble-label">Você:</span>
                  <p className="a26-voice-bubble-text">{userSubtitle}</p>
                </div>
              ) : null}

              {tutorSubtitle ? (
                <div className="a26-voice-bubble tutor">
                  <span className="a26-voice-bubble-label">{activeTutor.name}:</span>
                  <p className="a26-voice-bubble-text">{tutorSubtitle}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
