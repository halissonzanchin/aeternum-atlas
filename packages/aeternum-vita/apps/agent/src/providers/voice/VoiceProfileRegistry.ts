import { ProviderInvalidResponseError, AeternumAudioFormat } from "../types/index.ts";

export interface ProviderVoiceTarget {
  providerId: string; // "speaches" | "cartesia" | string
  modelId: string;
  nativeVoiceId: string;
  sampleRate: number;
  format: AeternumAudioFormat;
  speed?: number;
}

export interface VoiceProfile {
  id: string; // Canonical Aeternum voice profile ID (e.g. "pt-br-warm-male-01")
  name: string;
  language: string;
  gender: "male" | "female" | "neutral";
  defaultFormat: AeternumAudioFormat;
  defaultSampleRate: number;
  targets: Record<string, ProviderVoiceTarget>; // Mapeamento por provider ("speaches", "cartesia", etc.)

  // Propriedades legadas / de compatibilidade direta com Speaches
  providerId?: string;
  modelId: string;
  nativeVoiceId: string;
  sampleRate: number;
  format: AeternumAudioFormat;
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
        defaultFormat: "pcm",
        defaultSampleRate: 24000,
        providerId: "speaches",
        modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
        nativeVoiceId: "pm_alex",
        sampleRate: 24000,
        format: "pcm",
        targets: {
          speaches: {
            providerId: "speaches",
            modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
            nativeVoiceId: "pm_alex",
            sampleRate: 24000,
            format: "pcm"
          },
          cartesia: {
            providerId: "cartesia",
            modelId: "sonic-multilingual",
            nativeVoiceId: "a0e99841-438c-4a64-b679-ae501e7d6091", // Cartesia Portuguese Male
            sampleRate: 24000,
            format: "pcm"
          }
        }
      },
      {
        id: "pt-br-calm-female-01",
        name: "Português Brasileiro (Feminino Calmo)",
        language: "pt-BR",
        gender: "female",
        defaultFormat: "pcm",
        defaultSampleRate: 24000,
        providerId: "speaches",
        modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
        nativeVoiceId: "pf_dora",
        sampleRate: 24000,
        format: "pcm",
        targets: {
          speaches: {
            providerId: "speaches",
            modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
            nativeVoiceId: "pf_dora",
            sampleRate: 24000,
            format: "pcm"
          },
          cartesia: {
            providerId: "cartesia",
            modelId: "sonic-multilingual",
            nativeVoiceId: "79a125e8-cd45-4c13-8a67-188112f4dd22", // Cartesia Portuguese Female
            sampleRate: 24000,
            format: "pcm"
          }
        }
      },
      {
        id: "es-warm-male-01",
        name: "Espanhol (Masculino)",
        language: "es",
        gender: "male",
        defaultFormat: "pcm",
        defaultSampleRate: 24000,
        providerId: "speaches",
        modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
        nativeVoiceId: "em_alex",
        sampleRate: 24000,
        format: "pcm",
        targets: {
          speaches: {
            providerId: "speaches",
            modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
            nativeVoiceId: "em_alex",
            sampleRate: 24000,
            format: "pcm"
          },
          cartesia: {
            providerId: "cartesia",
            modelId: "sonic-multilingual",
            nativeVoiceId: "846d035a-e727-4638-953e-0044fa66c3db",
            sampleRate: 24000,
            format: "pcm"
          }
        }
      },
      {
        id: "es-calm-female-01",
        name: "Espanhol (Feminino)",
        language: "es",
        gender: "female",
        defaultFormat: "pcm",
        defaultSampleRate: 24000,
        providerId: "speaches",
        modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
        nativeVoiceId: "ef_dora",
        sampleRate: 24000,
        format: "pcm",
        targets: {
          speaches: {
            providerId: "speaches",
            modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
            nativeVoiceId: "ef_dora",
            sampleRate: 24000,
            format: "pcm"
          },
          cartesia: {
            providerId: "cartesia",
            modelId: "sonic-multilingual",
            nativeVoiceId: "156fb8d2-335b-4950-9cb3-a2d33befec77",
            sampleRate: 24000,
            format: "pcm"
          }
        }
      },
      {
        id: "en-warm-male-01",
        name: "Inglês Americano (Masculino)",
        language: "en-US",
        gender: "male",
        defaultFormat: "pcm",
        defaultSampleRate: 24000,
        providerId: "speaches",
        modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
        nativeVoiceId: "am_adam",
        sampleRate: 24000,
        format: "pcm",
        targets: {
          speaches: {
            providerId: "speaches",
            modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
            nativeVoiceId: "am_adam",
            sampleRate: 24000,
            format: "pcm"
          },
          cartesia: {
            providerId: "cartesia",
            modelId: "sonic-3",
            nativeVoiceId: "c45bc5ec-5968-4f11-8928-e4b3e839e557",
            sampleRate: 24000,
            format: "pcm"
          }
        }
      },
      {
        id: "en-calm-female-01",
        name: "Inglês Americano (Feminino)",
        language: "en-US",
        gender: "female",
        defaultFormat: "pcm",
        defaultSampleRate: 24000,
        providerId: "speaches",
        modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
        nativeVoiceId: "af_heart",
        sampleRate: 24000,
        format: "pcm",
        targets: {
          speaches: {
            providerId: "speaches",
            modelId: "speaches-ai/Kokoro-82M-v1.0-ONNX",
            nativeVoiceId: "af_heart",
            sampleRate: 24000,
            format: "pcm"
          },
          cartesia: {
            providerId: "cartesia",
            modelId: "sonic-3",
            nativeVoiceId: "79a125e8-cd45-4c13-8a67-188112f4dd22",
            sampleRate: 24000,
            format: "pcm"
          }
        }
      },
      {
        id: "de-clear-male-01",
        name: "Alemão (Masculino Claro)",
        language: "de",
        gender: "male",
        defaultFormat: "pcm",
        defaultSampleRate: 22050,
        providerId: "speaches",
        modelId: "speaches-ai/piper-de_DE-thorsten-high",
        nativeVoiceId: "thorsten",
        sampleRate: 22050,
        format: "pcm",
        targets: {
          speaches: {
            providerId: "speaches",
            modelId: "speaches-ai/piper-de_DE-thorsten-high",
            nativeVoiceId: "thorsten",
            sampleRate: 22050,
            format: "pcm"
          },
          cartesia: {
            providerId: "cartesia",
            modelId: "sonic-multilingual",
            nativeVoiceId: "b7d50908-b17c-442d-ad8d-810c63997ed9",
            sampleRate: 24000,
            format: "pcm"
          }
        }
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

  public resolveTarget(profileId: string, providerId: string): ProviderVoiceTarget {
    const profile = this.require(profileId);
    if (profile.targets && profile.targets[providerId]) {
      return profile.targets[providerId];
    }

    if (profile.providerId === providerId && profile.modelId && profile.nativeVoiceId) {
      return {
        providerId: profile.providerId,
        modelId: profile.modelId,
        nativeVoiceId: profile.nativeVoiceId,
        sampleRate: profile.sampleRate ?? profile.defaultSampleRate,
        format: profile.format ?? profile.defaultFormat,
        speed: profile.speed
      };
    }

    throw new ProviderInvalidResponseError(
      `Perfil de voz '${profileId}' não possui target configurado para o provedor '${providerId}'.`,
      "voice-registry"
    );
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
