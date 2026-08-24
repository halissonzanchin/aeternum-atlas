import { ProviderInvalidResponseError } from "../types/index.ts";

export interface VoiceProfile {
  id: string; // Ex: "pt-br-warm-male-01"
  name: string;
  language: string;
  gender: "male" | "female" | "neutral";
  providerId: "speaches" | string;
  modelId: string; // Ex: "speaches-ai/Kokoro-82M-v1.0-ONNX"
  nativeVoiceId: string; // Ex: "pm_alex"
  sampleRate: number;
  format: "pcm" | "wav" | "mp3" | "flac";
  speed?: number;
}

export class VoiceProfileRegistry {
  private profiles = new Map<string, VoiceProfile>();

  constructor(registerDefaults = true) {
    if (registerDefaults) {
      this.registerDefaultProfiles();
    }
  }

  private registerDefaultProfiles(): void {
    const defaults: VoiceProfile[] = [
      {
        id: "pt-br-warm-male-01",
        name: "Português Brasileiro (Masculino Acolhedor)",
        language: "pt-BR",
        gender: "male",
        providerId: "speaches",
        modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
        nativeVoiceId: "pm_alex",
        sampleRate: 24000,
        format: "pcm"
      },
      {
        id: "pt-br-calm-female-01",
        name: "Português Brasileiro (Feminino Calmo)",
        language: "pt-BR",
        gender: "female",
        providerId: "speaches",
        modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
        nativeVoiceId: "pf_dora",
        sampleRate: 24000,
        format: "pcm"
      },
      {
        id: "es-warm-male-01",
        name: "Espanhol (Masculino)",
        language: "es",
        gender: "male",
        providerId: "speaches",
        modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
        nativeVoiceId: "em_alex",
        sampleRate: 24000,
        format: "pcm"
      },
      {
        id: "es-calm-female-01",
        name: "Espanhol (Feminino)",
        language: "es",
        gender: "female",
        providerId: "speaches",
        modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
        nativeVoiceId: "ef_dora",
        sampleRate: 24000,
        format: "pcm"
      },
      {
        id: "en-warm-male-01",
        name: "Inglês Americano (Masculino)",
        language: "en-US",
        gender: "male",
        providerId: "speaches",
        modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
        nativeVoiceId: "am_adam",
        sampleRate: 24000,
        format: "pcm"
      },
      {
        id: "en-calm-female-01",
        name: "Inglês Americano (Feminino)",
        language: "en-US",
        gender: "female",
        providerId: "speaches",
        modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
        nativeVoiceId: "af_heart",
        sampleRate: 24000,
        format: "pcm"
      },
      {
        id: "de-clear-male-01",
        name: "Alemão (Masculino Claro)",
        language: "de",
        gender: "male",
        providerId: "speaches",
        modelId: "speaches-ai/piper-de_DE-thorsten-high",
        nativeVoiceId: "thorsten",
        sampleRate: 22050,
        format: "pcm"
      }
    ];

    for (const p of defaults) {
      this.profiles.set(p.id, p);
    }
  }

  public register(profile: VoiceProfile): void {
    this.profiles.set(profile.id, profile);
  }

  public get(id: string): VoiceProfile | undefined {
    return this.profiles.get(id);
  }

  public require(id: string): VoiceProfile {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new ProviderInvalidResponseError(
        `Perfil de voz não encontrado no registro: '${id}'.`,
        "voice-registry"
      );
    }
    return profile;
  }

  public listByLanguage(language: string): VoiceProfile[] {
    const langLower = language.toLowerCase();
    return Array.from(this.profiles.values()).filter(
      (p) => p.language.toLowerCase() === langLower || p.language.toLowerCase().startsWith(langLower)
    );
  }

  public listAll(): VoiceProfile[] {
    return Array.from(this.profiles.values());
  }
}
