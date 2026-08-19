/**
 * Aeternum Vita Voice AI — Multi-Tutor Voice Engine
 * Real-time Speech-to-Text, LLM Orchestration, and Vocal Synthesis
 * Seamlessly integrated into Aeternum Atlas Apple Intelligence Mode.
 */

export const AETERNUM_VITA_TUTORS = {
  pt: {
    id: "eduardo",
    name: "Eduardo",
    flag: "🇧🇷",
    country: "Brasil",
    langCode: "pt-BR",
    gender: "masculino",
    role: "Mentor de Voz em Português",
    greeting: "Olá! Sou o Eduardo, seu tutor em português. Em que posso te guiar nos estudos anatômicos hoje?",
    promptDirective: "Você é o Eduardo, mentor de anatomia do Aeternum Vita. Responda em Português do Brasil de forma calorosa, clara e direta, em exatamente UMA ou DUAS frases faladas concisas sem Markdown ou listas."
  },
  es: {
    id: "antonia",
    name: "Antonia",
    flag: "🇪🇸",
    country: "Latam / España",
    langCode: "es-ES",
    gender: "femenino",
    role: "Mentora de Voz en Español",
    greeting: "¡Hola! Soy Antonia, tu mentora en español. ¿Qué estructura anatómica deseas explorar hoy?",
    promptDirective: "Eres Antonia, mentora de anatomía de Aeternum Vita. Responde en español nativo de forma empática y clara, en exactamente UNA o DOS frases habladas concisas sin Markdown ni listas."
  },
  en: {
    id: "ariana",
    name: "Ariana",
    flag: "🇺🇸",
    country: "United States",
    langCode: "en-US",
    gender: "female",
    role: "English Voice Mentor",
    greeting: "Hello! I'm Ariana, your English anatomy tutor. What structure or concept would you like to review?",
    promptDirective: "You are Ariana, anatomy mentor of Aeternum Vita. Respond in natural native English in exactly ONE or TWO concise spoken sentences without Markdown or bullet points."
  },
  de: {
    id: "fabian",
    name: "Fabian",
    flag: "🇩🇪",
    country: "Deutschland",
    langCode: "de-DE",
    gender: "männlich",
    role: "Deutscher Sprach-Mentor",
    greeting: "Hallo! Ich bin Fabian, dein Anatomie-Tutor auf Deutsch. Welches Thema möchtest du heute vertiefen?",
    promptDirective: "Du bist Fabian, Anatomie-Mentor von Aeternum Vita. Antworte auf natürlichem Hochdeutsch in genau EINEM oder ZWEI prägnanten gesprochenen Sätzen ohne Markdown oder Listen."
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
    this.synthesis = typeof window !== "undefined" ? window.speechSynthesis : null;
    this.currentUtterance = null;
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

  getBestVoiceForTutor(tutor) {
    if (!this.cachedVoices.length && this.synthesis) {
      this.cachedVoices = this.synthesis.getVoices() || [];
    }

    const langPrefix = tutor.langCode.slice(0, 2).toLowerCase();
    const isMale = tutor.gender === "masculino" || tutor.gender === "männlich";

    // 1. Exact match with lang and preferred gender
    const matchedVoices = this.cachedVoices.filter((v) =>
      v.lang.toLowerCase().startsWith(langPrefix)
    );

    if (matchedVoices.length > 0) {
      // Find natural or neural voices
      const premiumVoice = matchedVoices.find((v) =>
        /natural|neural|premium|enhanced/i.test(v.name)
      );
      if (premiumVoice) return premiumVoice;

      if (isMale) {
        const maleVoice = matchedVoices.find((v) =>
          /male|homem|hombre|mann|david|jorge|daniel|stefan|george/i.test(v.name)
        );
        if (maleVoice) return maleVoice;
      } else {
        const femaleVoice = matchedVoices.find((v) =>
          /female|mulher|mujer|frau|luciana|monica|helena|zira|samantha|victoria/i.test(v.name)
        );
        if (femaleVoice) return femaleVoice;
      }

      return matchedVoices[0];
    }

    return null;
  }

  async speak(text, tutor, onStart, onEnd) {
    if (!this.synthesis) {
      onEnd?.();
      return;
    }

    this.synthesis.cancel();
    const cleanText = String(text || "")
      .replace(/\[ACTION:[^\]]+\]/g, "")
      .replace(/[*_#`~>]/g, "")
      .trim();

    if (!cleanText) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = tutor.langCode;
    utterance.rate = 1.02;
    utterance.pitch = tutor.gender === "masculino" || tutor.gender === "männlich" ? 0.96 : 1.04;

    const voice = this.getBestVoiceForTutor(tutor);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn("TTS Error:", e);
      this.isSpeaking = false;
      this.currentUtterance = null;
      onEnd?.();
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  startListening(tutor, onInterimResult, onFinalResult, onError) {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      onError?.("Navegador não suporta Web Speech Recognition.");
      return;
    }

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch {}
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
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += (finalTranscript ? " " : "") + transcriptPiece;
          } else {
            interim += transcriptPiece;
          }
        }

        const currentText = (finalTranscript + (interim ? " " + interim : "")).trim();
        onInterimResult?.(currentText);

        // Reset silence timer on user voice activity
        if (this.silenceTimer) clearTimeout(this.silenceTimer);
        if (currentText && currentText.length > 2) {
          this.silenceTimer = setTimeout(() => {
            if (finalTranscript || interim) {
              const fullSpeech = (finalTranscript + " " + interim).trim();
              if (fullSpeech) {
                finalTranscript = "";
                onFinalResult?.(fullSpeech);
              }
            }
          }, 1400);
        }
      };

      rec.onerror = (event) => {
        if (event.error === "no-speech" || event.error === "aborted") return;
        console.warn("STT Error:", event.error);
        onError?.(event.error);
      };

      rec.onstart = () => {
        this.isListening = true;
      };

      rec.onend = () => {
        this.isListening = false;
        // Auto restart recognition if session is active and not currently speaking
        if (this.activeSession && !this.isSpeaking) {
          try {
            rec.start();
          } catch {}
        }
      };

      this.recognition = rec;
      rec.start();
    } catch (err) {
      console.warn("Failed to start SpeechRecognition:", err);
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

  startSession({
    language = "pt",
    onStatusChange,
    onTranscript,
    onTutorReply,
    onError
  }) {
    this.stopSession();

    const tutor = getTutorForLanguage(language);
    this.activeSession = {
      tutor,
      language
    };

    onStatusChange?.({
      status: "speaking_greeting",
      tutor,
      text: tutor.greeting
    });

    // Speak initial greeting from the language's native tutor
    this.speak(
      tutor.greeting,
      tutor,
      () => {
        onStatusChange?.({ status: "speaking", tutor, text: tutor.greeting });
      },
      () => {
        if (!this.activeSession) return;
        onStatusChange?.({ status: "listening", tutor });
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
