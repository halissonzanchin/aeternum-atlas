/**
 * Aeternum LiveKit Service
 * Direct WebRTC Client & JWT Generator for LiveKit Cloud Gateway
 * wss://aeternum-atlas-0c2hve13.livekit.cloud
 */

import { VITA_VOICE_CONFIG } from "./aeternumVitaConfig";

function base64UrlEncode(str) {
  const base64 = btoa(str);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
}

/**
 * Generate LiveKit JWT AccessToken directly via Web Crypto API
 */
export async function createLiveKitToken(tutorId = "eduardo") {
  const apiKey = VITA_VOICE_CONFIG.livekitApiKey;
  const apiSecret = VITA_VOICE_CONFIG.livekitApiSecret;
  const agentName = VITA_VOICE_CONFIG.livekitAgentName;

  const now = Math.floor(Date.now() / 1000);
  const roomId = `aeternum-sala-${tutorId}-${Math.random().toString(36).slice(2, 10)}`;
  const identity = `estudante-${tutorId}-${Math.random().toString(36).slice(2, 10)}`;

  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    exp: now + 900,
    nbf: now - 5,
    iat: now,
    iss: apiKey,
    sub: identity,
    name: "Estudante Aeternum",
    metadata: JSON.stringify({ tutorId }),
    video: {
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canPublishSources: ["microphone"],
      canSubscribe: true,
      canPublishData: true
    },
    roomConfig: {
      agents: [{ agentName }]
    }
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${headerEncoded}.${payloadEncoded}`;

  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await window.crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(dataToSign)
  );

  const signatureEncoded = bufferToBase64Url(signature);
  const jwt = `${dataToSign}.${signatureEncoded}`;

  return {
    serverUrl: VITA_VOICE_CONFIG.livekitUrl,
    token: jwt,
    roomId,
    identity,
    tutorId
  };
}
