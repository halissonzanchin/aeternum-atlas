/**
 * Aeternum Vita Voice AI — Multi-Tutor Voice Engine
 * High-Fidelity Deepgram Aura-2 & LiveKit Neural Audio Pipeline
 * Native Multi-Tutor Architecture: Eduardo 🇧🇷, Antonia 🇪🇸, Ariana 🇺🇸, Fabian 🇩🇪
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
    deepgramModel: "aura-2-arcas-en",
    role: "Mentor de Voz em Português",
    badgeGradient: "linear-gradient(135deg, #009c3b 0%, #ffdf00 50%, #002776 100%)",
    promptDirective: "Você é o Eduardo, mentor oficial de anatomia do Aeternum Atlas. Responda em Português do Brasil de forma clara, natural e direta, em exatamente UMA ou DUAS frases faladas concisas sem Markdown ou listas."
  },
  es: {
    id: "antonia",
    name: "Antonia",
    countryCode: "ES",
    country: "Argentina / España",
    langCode: "es-ES",
    gender: "femenino",
    deepgramModel: "aura-2-antonia-es",
    role: "Mentora de Voz en Español",
    badgeGradient: "linear-gradient(135deg, #aa151b 0%, #f1bf00 50%, #aa151b 100%)",
    promptDirective: "Eres Antonia, mentora oficial de anatomía de Aeternum Atlas. Responde en español nativo con voz clara y empática, en exactamente UNA o DOS frases habladas concisas sin Markdown ni listas."
  },
  en: {
    id: "ariana",
    name: "Ariana",
    countryCode: "US",
    country: "United States",
    langCode: "en-US",
    gender: "female",
    deepgramModel: "aura-2-thalia-en",
    role: "English Voice Mentor",
    badgeGradient: "linear-gradient(135deg, #0a3161 0%, #ffffff 50%, #b31942 100%)",
    promptDirective: "You are Ariana, official anatomy mentor of Aeternum Atlas. Respond in natural native American English in exactly ONE or TWO concise spoken sentences without Markdown or bullet points."
  },
  de: {
    id: "fabian",
    name: "Fabian",
    countryCode: "DE",
    country: "Deutschland",
    langCode: "de-DE",
    gender: "männlich",
    deepgramModel: "aura-2-fabian-de",
    role: "Deutscher Sprach-Mentor",
    badgeGradient: "linear-gradient(135deg, #000000 0%, #dd0000 50%, #ffce00 100%)",
    promptDirective: "Du bist Fabian, offizieller Anatomie-Mentor von Aeternum Atlas. Antworte auf natürlichem Hochdeutsch in genau EINEM oder ZWEI prägnanten gesprochenen Sätzen ohne Markdown oder Listen."
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

  cleanTextForSpeech(text) {
    return String(text || "")
      .replace(/\[ACTION:[^\]]+\]/g, "")
      .replace(/[*_#`~>]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * High-Definition Audio Synthesis via Deepgram Aura-2 Direct API
   */
  async speak(text, tutor, onStart, onEnd) {
    this.stopSpeaking();

    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) {
      onEnd?.();
      return;
    }

    // 1. Deepgram Aura-2 Direct API
    if (VITA_VOICE_CONFIG.deepgramApiKey) {
      const model = tutor.deepgramModel || "aura-2-arcas-en";
      try {
        const response = await fetch(
          `https://api.deepgram.com/v1/speak?model=${model}&encoding=mp3`,
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

          await audio.play();
          return;
        }
      } catch (err) {
        console.warn("Deepgram Aura-2 playback notice:", err);
      }
    }

    // 2. Fallback
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
      utterance.lang = tutor.langCode;
      utterance.rate = 1.0;
      utterance.pitch = tutor.gender === "masculino" || tutor.gender === "männlich" ? 0.96 : 1.04;

      if (!this.cachedVoices.length) {
        this.cachedVoices = this.synthesis.getVoices() || [];
      }

      const langPrefix = tutor.langCode.slice(0, 2).toLowerCase();
      const isMale = tutor.gender === "masculino" || tutor.gender === "männlich";
      const matched = this.cachedVoices.filter((v) =>
        v.lang.toLowerCase().startsWith(langPrefix)
      );

      if (matched.length > 0) {
        const premium = matched.find((v) => /natural|neural|google|microsoft|premium/i.test(v.name));
        if (premium) {
          utterance.voice = premium;
        } else {
          const genderMatch = matched.find((v) =>
            isMale ? /male|homem|mann|david|jorge|daniel|stefan/i.test(v.name) : /female|mulher|mujer|frau|luciana|monica|helena|zira|samantha/i.test(v.name)
          );
          utterance.voice = genderMatch || matched[0];
        }
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        onStart?.();
      };

      utterance.onend = () => {
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

      // Ensure microphone permission is active
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
        if (currentText && currentText.length >= 2) {
          this.silenceTimer = setTimeout(() => {
            const fullSpeech = (finalTranscript + " " + interim).trim();
            if (fullSpeech) {
              finalTranscript = "";
              this.stopListening();
              onFinalResult?.(fullSpeech);
            }
          }, 950);
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
      status: "listening",
      tutor
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

    return tutor;
  }

  stopSession() {
    this.activeSession = null;
    this.stopListening();
    this.stopSpeaking();
  }
}

export const aeternumVitaVoiceService = new AeternumVitaVoiceEngine();
