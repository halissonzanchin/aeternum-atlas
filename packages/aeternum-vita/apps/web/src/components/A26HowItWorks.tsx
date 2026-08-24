import './A26HowItWorks.css';

export const A26HowItWorks = () => {
  return (
    <section className="a26-how-it-works" id="como-funciona" aria-labelledby="how-it-works-title">
      <div className="a26-how-heading">
        <span className="a26-eyebrow">Arquitetura de Engenharia</span>
        <h2 id="how-it-works-title">Como o Aeternum Vita Processa Voz em Tempo Real</h2>
        <p>
          O sistema opera em full-duplex de baixa latência, combinando WebRTC nativo, detecção acústica de turno e orquestração de IA em streaming.
        </p>
      </div>

      <div className="a26-architecture-grid">
        <article className="a26-surface a26-arch-card">
          <div className="arch-card-header">
            <span>01</span>
            <code>apps/web</code>
          </div>
          <h3>Interface & WebRTC</h3>
          <strong>React 19 + Liquid Glass</strong>
          <p>
            Captura o microfone local com cancelamento de eco, abre conexão WebRTC com o SFU do LiveKit e renderiza o Spectral Voice Orb e a transcrição reativa.
          </p>
        </article>

        <article className="a26-surface a26-arch-card">
          <div className="arch-card-header">
            <span>02</span>
            <code>supabase / token-server</code>
          </div>
          <h3>Emissão Segura de JWT</h3>
          <strong>Supabase Edge / Node Express</strong>
          <p>
            Protege as chaves de API, valida a autenticação do usuário, emite JWT com TTL de 10 min restrito à faixa de microfone e agenda o despacho do agente na sala.
          </p>
        </article>

        <article className="a26-surface a26-arch-card">
          <div className="arch-card-header">
            <span>03</span>
            <code>apps/agent</code>
          </div>
          <h3>Worker de Voz em Cascata</h3>
          <strong>LiveKit Agents SDK</strong>
          <p>
            Aplica cancelamento de ruído neural, monitora a fala com <code>TurnDetector</code> (VAD acústico + semântico), gerencia interrupções (Barge-in) e orquestra STT &rarr; LLM &rarr; TTS.
          </p>
        </article>
      </div>

      <div className="a26-surface a26-runtime-flow">
        <div className="flow-title-row">
          <div>
            <span className="a26-eyebrow">Pipeline em Streaming</span>
            <h3>Ciclo de Vida do Pacote de Áudio</h3>
          </div>
          <div className="model-badges">
            <span>STT: Deepgram Nova-3 (pt-BR)</span>
            <span>LLM: Gemma 4 31B</span>
            <span>TTS: Cartesia Sonic-3</span>
          </div>
        </div>

        <ol className="a26-flow-steps">
          <li>
            <div className="step-num">1</div>
            <div className="step-content">
              <strong>Entrada de Áudio</strong>
              <small>Usuário fala; pacotes chegam via WebRTC ao SFU</small>
            </div>
          </li>
          <li>
            <div className="step-num">2</div>
            <div className="step-content">
              <strong>Filtro & VAD</strong>
              <small>Cancelamento neural de ruído e detecção de turno</small>
            </div>
          </li>
          <li>
            <div className="step-num">3</div>
            <div className="step-content">
              <strong>Inferência em Cascata</strong>
              <small>STT streaming &rarr; LLM tokens &rarr; TTS chunks</small>
            </div>
          </li>
          <li>
            <div className="step-num">4</div>
            <div className="step-content">
              <strong>Síntese & Retorno</strong>
              <small>Áudio reproduzido com buffer dinâmico de jitter</small>
            </div>
          </li>
        </ol>

        <div className="a26-security-footer">
          <strong>🔒 Conformidade & Segurança:</strong> Credenciais privadas nunca tocam o navegador do cliente. O tráfego de mídia é criptografado ponto a ponto via SRTP/WebRTC.
        </div>
      </div>
    </section>
  );
};
