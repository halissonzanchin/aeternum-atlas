import { AudioFrame } from "@livekit/rtc-node";
import { tts, tokenize } from "@livekit/agents";
import { randomUUID } from "node:crypto";

class DirectDeepgramChunkedStream extends tts.ChunkedStream {
  label = "deepgram.DirectChunkedStream";
  #model: string;
  #apiKey: string;

  constructor(text: string, parentTts: tts.TTS, model: string, apiKey: string) {
    super(text, parentTts);
    this.#model = model;
    this.#apiKey = apiKey;
  }

  protected async run(): Promise<void> {
    const requestId = randomUUID();
    const segmentId = randomUUID();
    const sampleRate = 24000;
    const numChannels = 1;

    // container=none ensures pure linear16 PCM without the 44-byte RIFF/WAV header (eliminates pops/clicks)
    const response = await fetch(
      `https://api.deepgram.com/v1/speak?model=${this.#model}&encoding=linear16&sample_rate=${sampleRate}&container=none`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${this.#apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: this.inputText }),
        signal: this.abortSignal
      }
    );

    if (!response.ok || !response.body) {
      throw new Error(`Deepgram HTTP error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    // 20ms frame of 24kHz mono 16-bit PCM = 24000 * 0.02 * 2 bytes = 960 bytes (480 samples)
    const chunkSize = 960;
    let buffer = Buffer.alloc(0);
    let pendingFrame: AudioFrame | null = null;

    const makeFrame = (pcmBytes: Buffer) => {
      const sampleCount = Math.floor(pcmBytes.length / 2);
      const samples = new Int16Array(sampleCount);
      for (let index = 0; index < sampleCount; index += 1) {
        samples[index] = pcmBytes.readInt16LE(index * 2);
      }
      return new AudioFrame(samples, sampleRate, numChannels, sampleCount);
    };

    const queueFrame = (frame: AudioFrame) => {
      if (pendingFrame) {
        this.queue.put({ requestId, segmentId, frame: pendingFrame, final: false });
      }
      pendingFrame = frame;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (value) {
        buffer = Buffer.concat([buffer, Buffer.from(value)]);
        while (buffer.length >= chunkSize) {
          const chunk = buffer.subarray(0, chunkSize);
          buffer = buffer.subarray(chunkSize);

          queueFrame(makeFrame(chunk));
        }
      }

      if (done) {
        if (buffer.length >= 2) {
          queueFrame(makeFrame(buffer.subarray(0, buffer.length - (buffer.length % 2))));
        }
        if (pendingFrame) {
          this.queue.put({ requestId, segmentId, frame: pendingFrame, final: true });
        }
        break;
      }
    }
  }
}

export class DirectDeepgramTTS extends tts.TTS {
  label = "deepgram.DirectTTS";
  #model: string;
  #apiKey: string;
  #adapter: tts.StreamAdapter;

  constructor(model: string = "aura-2-antonia-es", apiKey?: string) {
    super(24000, 1, { streaming: false });
    this.#model = model;
    const resolvedApiKey = apiKey?.trim() || process.env.DEEPGRAM_API_KEY?.trim();
    if (!resolvedApiKey) {
      throw new Error("DEEPGRAM_API_KEY is required for DirectDeepgramTTS");
    }
    this.#apiKey = resolvedApiKey;
    this.#adapter = new tts.StreamAdapter(this, new tokenize.basic.SentenceTokenizer());
  }

  stream(): tts.SynthesizeStream {
    return this.#adapter.stream();
  }

  synthesize(text: string): tts.ChunkedStream {
    return new DirectDeepgramChunkedStream(text, this, this.#model, this.#apiKey);
  }
}
