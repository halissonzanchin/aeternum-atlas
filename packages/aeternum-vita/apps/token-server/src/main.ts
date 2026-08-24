import { createApp } from './app.ts';
import { ConfigurationError, loadConfig } from './config.ts';

try {
  const config = loadConfig();
  const app = createApp(config);

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`Servidor de tokens do Aeternum Vita ativo na porta ${config.port}.`);
  });
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error(error.message);
  } else {
    console.error('Não foi possível iniciar o servidor de tokens.', error);
  }

  process.exitCode = 1;
}
