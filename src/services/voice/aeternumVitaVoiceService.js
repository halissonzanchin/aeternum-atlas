/**
 * Aeternum Vita Voice AI — Multi-Tutor Voice Engine
 * Humanized Persona Architecture (Specification 26.1):
 * - Eduardo 🇧🇷 (Mentor Sênior, Sábio & Acolhedor - Barítono Encorpado)
 * - Antonia 🇪🇸 (Mentora Empática & Expressiva - Deepgram Aura-2 Direct)
 * - Ariana 🇺🇸 (Mentora Dinâmica & Inspiradora - Deepgram Aura-2 Direct)
 * - Fabian 🇩🇪 (Mentor Acadêmico & Preciso - Deepgram Aura-2 Direct)
 *
 * Full-Duplex Speaker Isolation Guard & Long-Echo Cancellation
 */

import { VITA_VOICE_CONFIG } from "./aeternumVitaConfig.js";
import { cerebroAeternumVita } from "../cerebro-vita/cerebroAeternumVita.js";

export const AETERNUM_VITA_TUTORS = {
  pt: {
    id: "eduardo",
    name: "Eduardo",
    countryCode: "BR",
    country: "Brasil",
    langCode: "pt-BR",
    gender: "masculino",
    cartesiaVoiceId: "a0e99841-438c-4a64-b679-ae501e7d6091", // Cartesia Sonic-3 Barítono Acolhedor Nativo
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
    promptDirective: "Eres Antonia, mentora empática, dinámica y cálida de Aeternum Atlas. Responde en español nativo con entusiasmo genuino y proximidad. Usa exactamente UNA o DOS frases habladas concisas (máximo 140 caracteres), pausas respiratorias con comas, números por extenso e concluye SIEMPRE con UNA sola pregunta abierta y corta. NUNCA uses Markdown ni emojis."
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
    this.mediaStream = null;
    this.audioElement = null;
    this.audioCtx = null;
    this.synthesis = typeof window !== "undefined" ? window.speechSynthesis : null;
    this.cachedVoices = [];
    this.isSpeaking = false;
    this.isListening = false;
    this.lastSpokenText = "";
    this.lastSpokenTime = 0;
    this.turnDebounceTimer = null;

    if (typeof window !== "undefined" && this.synthesis) {
      this.cachedVoices = this.synthesis.getVoices() || [];
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = () => {
          this.cachedVoices = this.synthesis.getVoices() || [];
        };
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

  oralizeTextForSpeech(text, lang = "pt") {
    let s = String(text || "");
    if (lang === "pt") {
      s = s
        .replace(/\b3D\b/gi, "três dê")
        .replace(/\b2D\b/gi, "dois dê")
        .replace(/\b1º\b/g, "primeiro")
        .replace(/\b2º\b/g, "segundo")
        .replace(/\b3º\b/g, "terceiro")
        .replace(/\b1\b/g, "um")
        .replace(/\b2\b/g, "dois")
        .replace(/\b3\b/g, "três")
        .replace(/\b4\b/g, "quatro")
        .replace(/\b5\b/g, "cinco")
        .replace(/\b6\b/g, "seis")
        .replace(/\b7\b/g, "sete")
        .replace(/\b8\b/g, "oito")
        .replace(/\b9\b/g, "nove")
        .replace(/\b10\b/g, "dez")
        .replace(/\b20\b/g, "vinte")
        .replace(/\b24\b/g, "vinte e quatro")
        .replace(/\b30\b/g, "trinta")
        .replace(/\b60\b/g, "sessenta")
        .replace(/\b100\b/g, "cem")
        .replace(/\bC3-C4\b/gi, "C três a C quatro")
        .replace(/\bC5-T1\b/gi, "C cinco a T um")
        .replace(/\bECG\b/gi, "eletrocardiograma")
        .replace(/\bSTT\b/gi, "reconhecimento de voz")
        .replace(/\bTTS\b/gi, "síntese de áudio")
        .replace(/\bLatarjet\b/gi, "Latarjê");
    } else if (lang === "es") {
      s = s
        .replace(/\b3D\b/gi, "tres de")
        .replace(/\b2D\b/gi, "dos de")
        .replace(/\b1\b/g, "uno")
        .replace(/\b2\b/g, "dos")
        .replace(/\b3\b/g, "tres")
        .replace(/\b4\b/g, "cuatro")
        .replace(/\b5\b/g, "cinco")
        .replace(/\b10\b/g, "diez")
        .replace(/\b20\b/g, "veinte")
        .replace(/\bECG\b/gi, "electrocardiograma");
    }
    return s;
  }

  cleanTextForSpeech(text) {
    return String(text || "")
      .replace(/\[ACTION:[^\]]+\]/g, "")
      .replace(/#{1,6}\s*/g, "")
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
      .replace(/[*_#`~>]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  releaseMicrophoneStream() {
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => {
          track.stop();
        });
      } catch {}
      this.mediaStream = null;
    }
  }

  isAcousticEcho(transcript) {
    if (!transcript || !this.lastSpokenText) return false;
    const now = Date.now();
    if (now - this.lastSpokenTime > 12000) return false;

    const cleanInput = transcript.toLowerCase().replace(/[^a-z0-9]/gi, " ").trim();
    const cleanTutor = this.lastSpokenText.toLowerCase().replace(/[^a-z0-9]/gi, " ").trim();

    if (!cleanInput || !cleanTutor) return false;

    if (cleanInput.length < 24) return false;

    if (cleanTutor.includes(cleanInput) || cleanInput.includes(cleanTutor)) {
      return true;
    }

    return false;
  }

  /**
   * Síntese Vocal de Estúdio com Cartesia Sonic-3 (Eduardo pt-BR) & Deepgram Aura-2 Direct
   */
  async speak(text, tutor, onStart, onEnd) {
    this.stopListening();
    this.stopSpeaking();
    this.unlockAudio();

    const rawClean = this.cleanTextForSpeech(text);
    const langKey = (tutor.langCode || "pt").slice(0, 2).toLowerCase();
    const cleanText = this.oralizeTextForSpeech(rawClean, langKey);

    if (!cleanText) {
      onEnd?.();
      return;
    }

    this.lastSpokenText = cleanText;
    this.lastSpokenTime = Date.now();
    this.isSpeaking = true;

    const finalizeSpeech = () => {
      this.isSpeaking = false;
      this.lastSpokenTime = Date.now();
      setTimeout(() => {
        if (this.activeSession && !this.isSpeaking) {
          onEnd?.();
        }
      }, 650);
    };

    // 1. Cartesia Sonic-3 Direct Neural Streaming TTS (Eduardo pt-BR / Multilingual Baritone)
    if (tutor.cartesiaVoiceId && VITA_VOICE_CONFIG.cartesiaApiKey) {
      try {
        const cartesiaResp = await fetch("https://api.cartesia.ai/tts/bytes", {
          method: "POST",
          headers: {
            "X-API-Key": VITA_VOICE_CONFIG.cartesiaApiKey,
            "Cartesia-Version": "2024-06-10",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model_id: "sonic-multilingual",
            transcript: cleanText,
            voice: {
              mode: "id",
              id: tutor.cartesiaVoiceId
            },
            output_format: {
              container: "mp3",
              encoding: "mp3",
              sample_rate: 44100
            },
            language: langKey
          })
        });

        if (cartesiaResp.ok) {
          const blob = await cartesiaResp.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          this.audioElement = audio;

          audio.onplay = () => {
            this.isSpeaking = true;
            this.stopListening();
            onStart?.();
          };

          audio.onended = () => {
            this.audioElement = null;
            URL.revokeObjectURL(audioUrl);
            finalizeSpeech();
          };

          audio.onerror = () => {
            this.audioElement = null;
            URL.revokeObjectURL(audioUrl);
            this.speakFallback(cleanText, tutor, onStart, finalizeSpeech);
          };

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((playErr) => {
              console.warn("Cartesia audio autoplay notice:", playErr);
              this.speakFallback(cleanText, tutor, onStart, finalizeSpeech);
            });
          }
          return;
        }
      } catch (cartesiaErr) {
        console.warn("Cartesia Sonic-3 direct API notice:", cartesiaErr);
      }
    }

    // 2. Deepgram Aura-2 Direct API (Antonia, Ariana, Fabian)
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
            this.stopListening();
            onStart?.();
          };

          audio.onended = () => {
            this.audioElement = null;
            URL.revokeObjectURL(audioUrl);
            finalizeSpeech();
          };

          audio.onerror = () => {
            this.audioElement = null;
            URL.revokeObjectURL(audioUrl);
            this.speakFallback(cleanText, tutor, onStart, finalizeSpeech);
          };

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((playErr) => {
              console.warn("Audio autoplay notice:", playErr);
              this.speakFallback(cleanText, tutor, onStart, finalizeSpeech);
            });
          }
          return;
        }
      } catch (err) {
        console.warn("Deepgram Aura-2 direct API notice:", err);
      }
    }

    // 3. Fallback com Vozes Neurais do Navegador
    this.speakFallback(cleanText, tutor, onStart, finalizeSpeech);
  }

  speakFallback(cleanText, tutor, onStart, finalizeCallback) {
    if (!this.synthesis) {
      finalizeCallback?.();
      return;
    }

    try {
      this.synthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = tutor.langCode;

      // Modulação Emocional de Prosódia Contextual
      const isAffection = /puxa|lindo|obrigado de coração|ay, qué lindo|warmly|thank you so much/i.test(cleanText);
      const isAnxiety = /fique tranquilo|respira fundo|tranquilo, respira|stay centered|calma/i.test(cleanText);
      const isVictory = /que notícia maravilhosa|parabéns|qué alegría|congratulations|fantastische nachricht/i.test(cleanText);

      if (tutor.id === "eduardo") {
        utterance.rate = isAnxiety ? 0.92 : isVictory ? 1.04 : isAffection ? 0.96 : 0.98;
        utterance.pitch = isAnxiety ? 0.92 : isVictory ? 1.02 : isAffection ? 0.98 : 0.95;
      } else if (tutor.gender === "masculino" || tutor.gender === "männlich") {
        utterance.rate = isAnxiety ? 0.94 : isVictory ? 1.05 : 1.0;
        utterance.pitch = isAnxiety ? 0.92 : isVictory ? 1.02 : 0.96;
      } else {
        utterance.rate = isAnxiety ? 0.95 : isVictory ? 1.06 : isAffection ? 1.0 : 1.02;
        utterance.pitch = isAnxiety ? 0.98 : isVictory ? 1.08 : isAffection ? 1.05 : 1.04;
      }

      if (!this.cachedVoices.length) {
        this.cachedVoices = this.synthesis.getVoices() || [];
      }

      const langPrefix = tutor.langCode.slice(0, 2).toLowerCase();
      const isMale = tutor.gender === "masculino" || tutor.gender === "männlich";

      const matched = this.cachedVoices.filter((v) =>
        v.lang.toLowerCase().replace("_", "-").startsWith(langPrefix)
      );

      if (matched.length > 0) {
        // Filtra e descarta vozes robóticas antigas do Desktop (SAPI 5 antigo)
        const nonRobotic = matched.filter((v) => !v.name.toLowerCase().includes("desktop"));
        const candidatePool = nonRobotic.length > 0 ? nonRobotic : matched;

        // Procura por vozes neurais / naturais / online / Google
        const neuralVoices = candidatePool.filter((v) =>
          /natural|neural|online|google/i.test(v.name)
        );
        const maleNeural = neuralVoices.find((v) =>
          /antonio|antônio|felipe|eduardo|daniel|fábio|fabio|ricardo|lucas|jorge|male|homem|alvaro|jorge/i.test(v.name)
        );
        const femaleNeural = neuralVoices.find((v) =>
          /francisca|luciana|maria|helena|leticia|letícia|female|mulher|elena|laura/i.test(v.name)
        );
        const fallbackMale = candidatePool.find((v) =>
          /antonio|antônio|felipe|eduardo|daniel|fábio|fabio|ricardo|lucas|jorge|male|homem/i.test(v.name)
        );

        if (isMale) {
          utterance.voice = maleNeural || fallbackMale || neuralVoices[0] || candidatePool[0];
        } else {
          utterance.voice = femaleNeural || neuralVoices[0] || candidatePool[0];
        }
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.stopListening();
        onStart?.();
      };

      utterance.onend = () => {
        finalizeCallback?.();
      };

      utterance.onerror = () => {
        finalizeCallback?.();
      };

      this.synthesis.speak(utterance);
    } catch (e) {
      console.warn("SpeechSynthesis notice:", e);
      finalizeCallback?.();
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
    if (this.isSpeaking || !this.activeSession) return;

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

      if (navigator?.mediaDevices?.getUserMedia && !this.mediaStream) {
        try {
          this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        if (!this.activeSession) return;

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

        // 1. Descartar eco acústico da fala completa do tutor
        if (this.isAcousticEcho(currentText)) return;

        // 2. Interrupção Inteligente (Adaptive Barge-In)
        // Se o usuário começar a falar enquanto o tutor reproduz áudio, corta o áudio imediatamente
        if (this.isSpeaking && currentText.length >= 3) {
          this.stopSpeaking();
          onInterimResult?.(currentText);
        }

        onInterimResult?.(currentText);

        if (this.silenceTimer) clearTimeout(this.silenceTimer);

        // 3. Turn Detection Calibrado por Idioma (EOU — End of Utterance)
        const langCode = (tutor.langCode || "pt").slice(0, 2).toLowerCase();
        const silenceThreshold =
          langCode === "pt" ? 665 :
          langCode === "es" ? 590 :
          langCode === "en" ? 560 :
          langCode === "de" ? 495 : 600;

        if (currentText && currentText.length >= 1) {
          this.silenceTimer = setTimeout(() => {
            const fullSpeech = (finalTranscript + " " + interim).trim();
            finalTranscript = "";
            this.stopListening();

            if (fullSpeech && this.activeSession && !this.isAcousticEcho(fullSpeech)) {
              onFinalResult?.(fullSpeech);
            }
          }, silenceThreshold);
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
   * Inicia sessão com saudação dinâmica
   */
  startSession({
    language = "pt",
    userId = "default",
    userName = "",
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
      language,
      userId,
      userName
    };

    const greeting = cerebroAeternumVita.generatePersonalizedGreeting({
      userId,
      language,
      persona: tutor.id,
      userName
    });

    onStatusChange?.({
      status: "speaking",
      tutor,
      text: greeting
    });

    this.speak(
      greeting,
      tutor,
      () => {
        onStatusChange?.({
          status: "speaking",
          tutor,
          text: greeting
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

  /**
   * Encerra completamente o modo de voz e desliga o microfone físico
   */
  stopSession() {
    this.activeSession = null;
    this.stopListening();
    this.stopSpeaking();
    this.releaseMicrophoneStream();
  }
}

export const aeternumVitaVoiceService = new AeternumVitaVoiceEngine();
