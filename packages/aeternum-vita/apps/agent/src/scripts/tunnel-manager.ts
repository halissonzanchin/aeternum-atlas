import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsDir = fileURLToPath(new URL('../../../../tools', import.meta.url));
const cloudflaredPath = path.join(toolsDir, 'cloudflared.exe');

export const startLiveKitTunnel = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log('[Túnel Cloudflare] Iniciando conexão para LiveKit na porta 7880...');

    const process = spawn(cloudflaredPath, ['tunnel', '--url', 'http://localhost:7880'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let tunnelUrl = '';

    const handleOutput = (data: Buffer) => {
      const text = data.toString();
      const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (match && !tunnelUrl) {
        tunnelUrl = match[0];
        const wssUrl = tunnelUrl.replace('https://', 'wss://');
        console.log('\n===============================================================');
        console.log('🚀 TÚNEL SEGURO ATIVO COM SUCESSO!');
        console.log(`🌐 URL HTTPS: ${tunnelUrl}`);
        console.log(`📡 URL WSS (LiveKit): ${wssUrl}`);
        console.log('===============================================================\n');
        console.log('👉 Configure no Vercel e no Supabase:');
        console.log(`   LIVEKIT_URL=${wssUrl}`);
        console.log(`   VITE_LIVEKIT_URL=${wssUrl}\n`);
        resolve(wssUrl);
      }
    };

    process.stdout?.on('data', handleOutput);
    process.stderr?.on('data', handleOutput);

    process.on('error', (err) => {
      console.error('[Túnel Cloudflare] Erro ao iniciar processo:', err);
      reject(err);
    });

    process.on('exit', (code) => {
      console.log(`[Túnel Cloudflare] Processo finalizado com código ${code}`);
    });
  });
};

if (process.argv[1] && process.argv[1].endsWith('tunnel-manager.ts')) {
  void startLiveKitTunnel();
}
