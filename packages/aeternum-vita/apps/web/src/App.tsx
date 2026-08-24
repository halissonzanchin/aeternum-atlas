import { useEffect, useState } from 'react';
import { fetchPublicConfig, type PublicConfig } from './api.ts';
import { VoiceSession } from './VoiceSession.tsx';

type ConfigState =
  { status: 'loading' } | { status: 'ready'; config: PublicConfig } | { status: 'error' };

const App = () => {
  const [configState, setConfigState] = useState<ConfigState>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();

    fetchPublicConfig(controller.signal)
      .then((config) => setConfigState({ status: 'ready', config }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setConfigState({ status: 'error' });
      });

    return () => controller.abort();
  }, []);

  if (configState.status === 'loading') {
    return (
      <main className="centered-state" aria-live="polite">
        <span className="loading-ring" />
        <p>Iniciando o ecossistema Aeternum Vita…</p>
      </main>
    );
  }

  if (configState.status === 'error') {
    return (
      <main className="centered-state">
        <div className="config-error" role="alert">
          <span>!</span>
          <h1>Serviço de Voz Não Configurado</h1>
          <p>
            Não foi possível comunicar com o servidor de tokens. Certifique-se de configurar o arquivo{' '}
            <code>.env.local</code> com as credenciais do LiveKit Cloud.
          </p>
          <button
            className="a26-pill-button a26-pill-button-primary"
            style={{ marginTop: '20px' }}
            type="button"
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </button>
        </div>
      </main>
    );
  }

  return <VoiceSession agentName={configState.config.agentName} />;
};

export default App;
