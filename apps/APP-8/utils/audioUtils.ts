export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// --- New Centralized Audio Playback System ---

let audioCtx: AudioContext | null = null;

/**
 * Manages a single, shared AudioContext for the entire application.
 * Avoids conflicts and resource overhead from creating multiple contexts.
 */
export const getAudioContext = (): AudioContext => {
    if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioCtx;
};

/**
 * Decodes a base64 audio string and plays it using the shared AudioContext.
 * @param base64 The base64 encoded audio data.
 */
export const playBase64Audio = async (base64: string): Promise<void> => {
    if (!base64) return;
    try {
        const ctx = getAudioContext();
        // Resume context if it's suspended (e.g., due to browser policy)
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
        
        const decodedBytes = decode(base64);
        const audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start();

        return new Promise(resolve => {
            source.onended = () => resolve();
        });

    } catch (error) {
        console.error("Failed to play audio:", error);
    }
};