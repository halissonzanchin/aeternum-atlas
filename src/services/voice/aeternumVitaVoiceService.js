/**
 * Aeternum Vita Voice AI — Multi-Tutor Voice Engine
 * Humanized Persona Architecture (Specification 26.1):
 * - Eduardo 🇧🇷 (Mentor Sênior, Sábio & Acolhedor - Barítono Encorpado)
 * - Antonia 🇪🇸 (Mentora Empática & Expressiva - Deepgram Aura-2 Direct)
 * - Ariana 🇺🇸 (Mentora Dinâmica & Inspiradora - Deepgram Aura-2 Direct)
 * - Fabian 🇩🇪 (Mentor Acadêmico & Preciso - Deepgram Aura-2 Direct)
 */

import { VITA_VOICE_CONFIG } from "./aeternumVitaConfig";

export const AETERNUM_VITA_TUTORS = {
  pt: {
    id: "eduardo",
    name: "Eduardo",
    countryCode: "BR",
    country: "Brasil",
    langCode: "pt-BR",
    gender: "masculino",
    role: "Mentor Sênior em Português",
    badgeGradient: "linear-gradient(135deg, #009c3b 0%, #ffdf00 50%, #002776 100%)",
    greeting: "Olá! Seja muito bem-vindo ao Aeternum Atlas. Eu sou o Eduardo, seu mentor de anatomia. Como posso guiar seus estudos hoje?",
    promptDirective: "Você é o Eduardo, mentor sênior e acolhedor de anatomia do Aeternum Atlas. Responda em Português do Brasil com postura de sábio conselheiro, paciência inabalável e calor humano. Use exatamente UMA ou DUAS frases faladas concisas (máximo 140 caracteres), insira vírgulas estratégicas para pausas respiratórias, escreva números por extenso e termine SEMPRE com apenas UMA pergunta aberta e curta. NUNCA use Markdown ou emojis."
  },
  es: {
    id: "antonia",
    name: "Antonia",
    countryCode: "ES",
    country: "Argentina / España",
    langCode: "es-ES",
    gender: "femenino",
    deepgramModel: "aura-2-antonia-es",
    role: "Mentora Empática en Español",
    badgeGradient: "linear-gradient(135deg, #aa151b 0%, #f1bf00 50%, #aa151b 100%)",
    greeting: "¡Hola! Te doy una cálida bienvenida a Aeternum Atlas. Soy Antonia, tu mentora en español. ¿Qué estructura anatómica deseas explorar hoy?",
    promptDirective: "Eres Antonia, mentora empática, dinámica y cálida de Aeternum Atlas. Responde en español nativo con entusiasmo genuino y proximidad. Usa exactamente UNA o DOS frases habladas concisas (máximo 140 caracteres), pausas respiratorias con comas, números por extenso y concluye SIEMPRE con UNA sola pregunta abierta y corta. NUNCA uses Markdown ni emojis."
  },
  en: {
    id: "ariana",
    name: "Ariana",
    countryCode: "US",
    country: "United States",
    langCode: "en-US",
    gender: "female",
    deepgramModel: "aura-2-thalia-en",
    role: "Dynamic English Mentor",
    badgeGradient: "linear-gradient(135deg, #0a3161 0%, #ffffff 50%, #b31942 100%)",
    greeting: "Hello and welcome to Aeternum Atlas! I am Ariana, your anatomy mentor. How can I guide your journey today?",
    promptDirective: "You are Ariana, dynamic and inspiring anatomy mentor of Aeternum Atlas. Respond in natural native American English with growth mindset energy and clear articulation. Use exactly ONE or TWO concise spoken sentences (max 140 chars), commas for micro-breathing, write numbers in full words, and ALWAYS close with exactly ONE short open question. NEVER use Markdown or emojis."
  },
  de: {
    id: "fabian",
    name: "Fabian",
    countryCode: "DE",
    country: "Deutschland",
    langCode: "de-DE",
    gender: "männlich",
    deepgramModel: "aura-2-fabian-de",
    role: "Strukturierter Deutscher Mentor",
    badgeGradient: "linear-gradient(135deg, #000000 0%, #dd0000 50%, #ffce00 100%)",
    greeting: "Hallo und herzlich willkommen bei Aeternum Atlas! Ich bin Fabian, dein Anatomie-Mentor. Wie kann ich dir heute helfen?",
    promptDirective: "Du bist Fabian, akademischer und strukturierter Anatomie-Mentor von Aeternum Atlas. Antworte auf natürlichem Hochdeutsch mit logischer Klarheit, Ruhe und Respekt. Verwende genau EINEN oder ZWEI prägnante gesprochene Sätze (max. 140 Zeichen), Kommas für Atempausen, Zahlen ausgeschrieben und schließe IMMER mit genau EINER kurzen offenen Frage ab. NIEMALS Markdown oder Emojis."
  }
};

export function getTutorForLanguage(language = "pt") {
  const code = String(language || "pt").toLowerCase().slice(0, 2);
  return AETERNUM_VITA_TUTORS[code] || AETERNUM_VITA_TUTORS.pt;
}

class AeternumVitaVoiceEngine {
  constructor() {
    this.activeSession = null;
    this.recognition = null;
    this.audioElement = null;
    this.audioCtx = null;
    this.synthesis = typeof window !== "undefined" ? window.speechSynthesis : null;
    this.silenceTimer = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.cachedVoices = [];

    if (this.synthesis) {
      const loadVoices = () => {
        this.cachedVoices = this.synthesis.getVoices() || [];
      };
      loadVoices();
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  unlockAudio() {
    try {
      if (typeof window !== "undefined") {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass && !this.audioCtx) {
          this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx && this.audioCtx.state === "suspended") {
          this.audioCtx.resume();
        }
      }
    } catch {}
  }

  cleanTextForSpeech(text) {
    return String(text || "")
      .replace(/\[ACTION:[^\]]+\]/g, "")
      .replace(/[*_#`~>]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * High-Definition Audio Synthesis via Deepgram Aura-2 Direct API & Neural Audio Pipeline
   */
  async speak(text, tutor, onStart, onEnd) {
    this.stopSpeaking();
    this.unlockAudio();

    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) {
      onEnd?.();
      return;
    }

    // 1. Deepgram Aura-2 Direct API (Antonia, Ariana, Fabian)
    if (tutor.deepgramModel && VITA_VOICE_CONFIG.deepgramApiKey) {
      try {
        const response = await fetch(
          `https://api.deepgram.com/v1/speak?model=${tutor.deepgramModel}&encoding=mp3`,
          {
            method: "POST",
            headers: {
              Authorization: `Token ${VITA_VOICE_CONFIG.deepgramApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: cleanText })
          }
        );

        if (response.ok) {
          const blob = await response.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          this.audioElement = audio;

          audio.onplay = () => {
            this.isSpeaking = true;
            onStart?.();
          };

          audio.onended = () => {
            this.isSpeaking = false;
            this.audioElement = null;
            URL.revokeObjectURL(audioUrl);
            onEnd?.();
          };

          audio.onerror = () => {
            this.isSpeaking = false;
            this.audioElement = null;
            URL.revokeObjectURL(audioUrl);
            this.speakFallback(cleanText, tutor, onStart, onEnd);
          };

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((playErr) => {
              console.warn("Audio autoplay notice:", playErr);
              this.speakFallback(cleanText, tutor, onStart, onEnd);
            });
          }
          return;
        }
      } catch (err) {
        console.warn("Deepgram Aura-2 direct API notice:", err);
      }
    }

    // 2. Direct Brazilian Portuguese Audio & Fallback (Eduardo pt-BR)
    this.speakFallback(cleanText, tutor, onStart, onEnd);
  }

  speakFallback(cleanText, tutor, onStart, onEnd) {
    if (!this.synthesis) {
      onEnd?.();
      return;
    }

    try {
      this.synthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = tutor.langCode; // pt-BR, es-ES, en-US, de-DE

      // Eduardo pt-BR: Warm, resonant, deep Brazilian baritone
      if (tutor.id === "eduardo") {
        utterance.rate = 0.96;
        utterance.pitch = 0.90;
      } else if (tutor.gender === "masculino" || tutor.gender === "männlich") {
        utterance.rate = 1.0;
        utterance.pitch = 0.95;
      } else {
        utterance.rate = 1.02;
        utterance.pitch = 1.04;
      }

      if (!this.cachedVoices.length) {
        this.cachedVoices = this.synthesis.getVoices() || [];
      }

      const langPrefix = tutor.langCode.slice(0, 2).toLowerCase();
      const isMale = tutor.gender === "masculino" || tutor.gender === "männlich";

      // Filter exclusively voices matching the tutor's exact language
      const matched = this.cachedVoices.filter((v) =>
        v.lang.toLowerCase().replace("_", "-").startsWith(langPrefix)
      );

      if (matched.length > 0) {
        const eduardoMatch = matched.find((v) =>
          /eduardo|daniel|fábio|fabio|antonio|antônio|felipe|ricardo|lucas|jorge|male|homem/i.test(v.name)
        );
        const premium = matched.find((v) => /natural|neural|google|microsoft/i.test(v.name));
        utterance.voice = (isMale ? eduardoMatch : null) || premium || matched[0];
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        onStart?.();
      };

      utterance.onended = () => {
        this.isSpeaking = false;
        onEnd?.();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        onEnd?.();
      };

      this.synthesis.speak(utterance);
    } catch (e) {
      console.warn("SpeechSynthesis notice:", e);
      this.isSpeaking = false;
      onEnd?.();
    }
  }

  stopSpeaking() {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch {}
      this.audioElement = null;
    }
    if (this.synthesis) {
      try {
        this.synthesis.cancel();
      } catch {}
    }
    this.isSpeaking = false;
  }

  async startListening(tutor, onInterimResult, onFinalResult, onError) {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      onError?.("Navegador não suporta captação de voz direta.");
      return;
    }

    try {
      this.stopListening();

      if (navigator?.mediaDevices?.getUserMedia) {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (permErr) {
          console.warn("Mic permission prompt:", permErr);
        }
      }

      const rec = new SpeechRecognition();
      rec.lang = tutor.langCode;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      let finalTranscript = "";

      rec.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += (finalTranscript ? " " : "") + piece;
          } else {
            interim += piece;
          }
        }

        const currentText = (finalTranscript + (interim ? " " + interim : "")).trim();
        onInterimResult?.(currentText);

        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        // Humanized conversational pause threshold: 1800ms allows the user to pause, breathe and finish thoughts
        if (currentText && currentText.length >= 2) {
          this.silenceTimer = setTimeout(() => {
            const fullSpeech = (finalTranscript + " " + interim).trim();
            if (fullSpeech && fullSpeech.length >= 2) {
              finalTranscript = "";
              this.stopListening();
              onFinalResult?.(fullSpeech);
            }
          }, 1800);
        }
      };

      rec.onerror = (event) => {
        if (event.error === "no-speech" || event.error === "aborted") return;
        console.warn("STT notice:", event.error);
        onError?.(event.error);
      };

      rec.onstart = () => {
        this.isListening = true;
      };

      rec.onend = () => {
        this.isListening = false;
        if (this.activeSession && !this.isSpeaking) {
          try {
            rec.start();
          } catch {}
        }
      };

      this.recognition = rec;
      rec.start();
    } catch (err) {
      console.warn("SpeechRecognition notice:", err);
      onError?.(err?.message || "Falha no microfone");
    }
  }

  stopListening() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }
    this.isListening = false;
  }

  /**
   * Starts session with introductory greeting and continuous turn-taking
   */
  startSession({
    language = "pt",
    onStatusChange,
    onTranscript,
    onTutorReply,
    onError
  }) {
    this.stopSession();
    this.unlockAudio();

    const tutor = getTutorForLanguage(language);
    this.activeSession = {
      tutor,
      language
    };

    onStatusChange?.({
      status: "speaking",
      tutor,
      text: tutor.greeting
    });

    this.speak(
      tutor.greeting,
      tutor,
      () => {
        onStatusChange?.({
          status: "speaking",
          tutor,
          text: tutor.greeting
        });
      },
      () => {
        if (!this.activeSession) return;
        onStatusChange?.({
          status: "listening",
          tutor,
          text: ""
        });

        this.startListening(
          tutor,
          (interim) => {
            onTranscript?.({ text: interim, isFinal: false });
          },
          (finalSpeech) => {
            onTranscript?.({ text: finalSpeech, isFinal: true });
            onTutorReply?.(finalSpeech, tutor);
          },
          onError
        );
      }
    );

    return tutor;
  }

  stopSession() {
    this.activeSession = null;
    this.stopListening();
    this.stopSpeaking();
  }
}

export const aeternumVitaVoiceService = new AeternumVitaVoiceEngine();
