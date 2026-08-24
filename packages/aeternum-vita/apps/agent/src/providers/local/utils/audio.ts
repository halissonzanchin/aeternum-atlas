import { ProviderInvalidResponseError } from "../../types/index.ts";

export function pcmToWav(
  pcmData: Uint8Array,
  sampleRate?: number,
  channels = 1,
  bitDepth = 16
): Uint8Array {
  if (!sampleRate || sampleRate <= 0) {
    throw new ProviderInvalidResponseError(
      "Para áudio no formato 'pcm', o campo 'sampleRate' é obrigatório e deve ser maior que zero.",
      "audio-encoder"
    );
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF Chunk
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmt Subchunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data Subchunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const uint8 = new Uint8Array(buffer);
  uint8.set(pcmData, 44);
  return uint8;
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
