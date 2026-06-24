/**
 * ATLAS DEVICE CAPABILITY DETECTION
 * Analisa o hardware do dispositivo atual para definir a capacidade de renderização gráfica.
 * Retorna um perfil: 'low', 'medium' ou 'high'.
 */

export function detectAtlasDeviceProfile() {
  if (typeof window === 'undefined') return 'medium';

  let score = 0;
  let deviceMemory = 4; // Default safe assumption
  let hardwareConcurrency = 4;

  // 1. Memória RAM (disponível apenas no Chrome/Edge)
  if (navigator.deviceMemory) {
    deviceMemory = navigator.deviceMemory;
  }
  if (deviceMemory >= 8) score += 2;
  else if (deviceMemory >= 4) score += 1;

  // 2. Cores de CPU
  if (navigator.hardwareConcurrency) {
    hardwareConcurrency = navigator.hardwareConcurrency;
  }
  if (hardwareConcurrency >= 8) score += 2;
  else if (hardwareConcurrency >= 4) score += 1;

  // 3. User Agent Simples (Dedução de Mobile)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (!isMobile) score += 1; // Desktops geralmente tem GPU dedicada ou resfriamento melhor

  // Decisão do Perfil
  // Max score: 5
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}
