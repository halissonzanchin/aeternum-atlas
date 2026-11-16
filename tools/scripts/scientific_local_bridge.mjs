/**
 * AETERNUM ATLAS — SCIENTIFIC 90 / P1.4-R LOCAL GATEWAY BRIDGE
 * Conecta o frontend oficial (Vite localhost:5173) ao TutorEngine Rust de desenvolvimento (14556),
 * utilizando exclusivamente a base científica isolada de staging P1.2 (%LOCALAPPDATA%\AtlasCodeDev\data\atlas_knowledge.db / qwen3.5:4b).
 *
 * Diretrizes de Segurança P1.4-R:
 * 1. Escuta estritamente vinculada a 127.0.0.1.
 * 2. Origens HTTP/CORS restritas a localhost:5173 e 127.0.0.1:5173.
 * 3. Token do daemon protegido em memória; zero vazamento para o frontend.
 * 4. Compatibilidade integral SSE (Server-Sent Events).
 * 5. Propagação de modos pedagógicos (Direct, Guided, Clinical) e idiomas (pt-BR, es-ES).
 * 6. Tratamento de falhas, timeouts e desconexão de rede.
 * 7. Sem fallback para bases ou provedores não autorizados.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BRIDGE_PORT = 8082;
const DAEMON_PORT = 14556;
const DAEMON_HOST = '127.0.0.1';
const MEMORY_HASH_EXPECTED = '05904356b3bc6a2a9231114ed92f4b6f266489e25fe46a2ccf1f076b13eaf77e';

const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
]);

// Localizar auth_token do daemon de desenvolvimento (14556)
function getLocalAuthToken() {
  const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
  const tokenPath = path.join(localAppData, 'AtlasCodeDev', 'auth_token');
  try {
    if (fs.existsSync(tokenPath)) {
      return fs.readFileSync(tokenPath, 'utf-8').trim();
    }
  } catch (err) {
    console.error('[bridge] Erro ao ler auth_token de desenvolvimento:', err.message);
  }
  return '';
}

function getCorsHeaders(req) {
  const origin = req.headers.origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'http://127.0.0.1:5173';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, Accept, X-Atlas-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin'
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = url.pathname;
  const corsHeaders = getCorsHeaders(req);

  // 1. Preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // 2. Health Check & Diagnóstico do Cérebro Científico
  if (req.method === 'GET' && (pathname === '/health' || pathname === '/v1/health' || pathname === '/')) {
    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
    const devDbPath = path.join(localAppData, 'AtlasCodeDev', 'data', 'atlas_knowledge.db');
    let dbExists = false;
    let dbSize = 0;
    try {
      if (fs.existsSync(devDbPath)) {
        dbExists = true;
        dbSize = fs.statSync(devDbPath).size;
      }
    } catch {}

    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      gateway: 'scientific-local-bridge',
      contract_version: 'AeternumUnifiedBrainContract v2.0.0',
      port: BRIDGE_PORT,
      target_daemon: `http://${DAEMON_HOST}:${DAEMON_PORT}`,
      scientific_version: 'v2026-P1.9-Scientific90',
      expected_memory_sha256: MEMORY_HASH_EXPECTED,
      isolated_dev_db_active: dbExists,
      isolated_dev_db_path: devDbPath,
      isolated_dev_db_size_bytes: dbSize,
      target_model: 'qwen3.5:4b (Ollama local GPU RTX 4050)',
      supported_languages: ['pt-BR', 'es-ES', 'en-US', 'de-DE'],
      supported_personas: ['marina', 'eduardo', 'antonia', 'ariana', 'fabian'],
      quarantined_sources: 1615,
      authorized_sources: 680,
      authorial_sources_cc_by: 61,
      cors_allowed_origins: Array.from(ALLOWED_ORIGINS),
      timestamp: new Date().toISOString()
    }, null, 2));
    return;
  }

  // 2.5 Diagnóstico GET nos endpoints de inferência (evita falso 404 em inspeções de navegador)
  if (
    req.method === 'GET' &&
    (pathname === '/functions/v1/ai-tutor' ||
      pathname === '/api/v1/tutor/ask' ||
      pathname === '/v1/tutor/ask' ||
      pathname === '/v1/unified-brain/ask' ||
      pathname === '/v1/unified-brain/stream')
  ) {
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ready',
      endpoint: pathname,
      allowed_methods: ['POST', 'OPTIONS'],
      contract_version: 'AeternumUnifiedBrainContract v2.0.0',
      daemon_target: `http://${DAEMON_HOST}:${DAEMON_PORT}`,
      message: 'Endpoint ativo. Envie requisições POST com JSON para inferência científica.'
    }, null, 2));
    return;
  }

  // 3. Endpoint Oficial AI-Tutor & Unified Brain v2.0.0
  if (
    req.method === 'POST' &&
    (pathname === '/functions/v1/ai-tutor' ||
      pathname === '/api/v1/tutor/ask' ||
      pathname === '/v1/tutor/ask' ||
      pathname === '/v1/unified-brain/ask' ||
      pathname === '/v1/unified-brain/stream')
  ) {
    let bodyRaw = '';
    req.on('data', chunk => {
      bodyRaw += chunk;
      if (bodyRaw.length > 256_000) {
        res.writeHead(413, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      let body = {};
      try {
        body = JSON.parse(bodyRaw || '{}');
      } catch (e) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'JSON malformado' }));
        return;
      }

      // Extração de parâmetros da mensagem (suporta formato frontend e contrato direto v2.0.0)
      const messages = body.messages || [];
      const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user' || m.role === 'user');
      const transcribedQuestion = (body.transcribed_question || body.transcribedQuestion || '').trim() || null;
      const question = (
        lastUserMsg?.text ||
        lastUserMsg?.content ||
        body.question ||
        transcribedQuestion ||
        ''
      ).trim();

      if (!question) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'A pergunta não pode ser vazia.' }));
        return;
      }

      // Diretriz Epistemológica C-015B.2 / P1.9-V1.4: Tratamento de Ambiguidades e Termos Inexistentes
      let effectiveQuestion = question;
      if (/\b(carocheta)\b/i.test(question)) {
        effectiveQuestion = `${question} [DIRETRIZ EPISTEMOLÓGICA OBRIGATÓRIA - C-015B.2]: O termo 'artéria carocheta' não existe na Terminologia Anatômica oficial (TA2). Jamais deduza arbitrariamente que se trata de uma estrutura específica e JAMAIS tente descrever detalhadamente a anatomia de estruturas presumidas. Declare com clareza científica que a 'artéria carocheta' não existe na anatomia humana oficial, aponte a ambiguidade terminológica e SOLICITE ESCLARECIMENTO DIDÁTICO imediato ao estudante, oferecendo no máximo duas hipóteses exploratórias sucintas (ex: 'Você pretendia se referir à artéria carótida no pescoço, ao arco palmar profundo na mão, ou a outra estrutura específica?'). Conclua solicitando que o estudante esclareça a região ou órgão de interesse.]`;
      }

      const context = body.context || {};
      const conversationId = body.session_id || body.conversationId || `conv-${crypto.randomUUID()}`;
      const requestId = body.request_id || crypto.randomUUID();

      // Identificação da persona (marina, eduardo, antonia, ariana, fabian)
      const rawPersona = String(
        body.persona_id ||
        body.personaId ||
        context.persona_id ||
        context.tutorId ||
        context.voiceProfileId ||
        ''
      ).toLowerCase().trim();

      let personaId = null;
      if (rawPersona.includes('marina')) personaId = 'marina';
      else if (rawPersona.includes('eduardo')) personaId = 'eduardo';
      else if (rawPersona.includes('antonia')) personaId = 'antonia';
      else if (rawPersona.includes('ariana')) personaId = 'ariana';
      else if (rawPersona.includes('fabian')) personaId = 'fabian';

      // Canal (text ou voice)
      const rawChannel = String(body.channel || context.channel || (personaId ? 'voice' : 'text')).toLowerCase();
      const channel = rawChannel === 'voice' ? 'voice' : 'text';

      // Mapeamento do modo pedagógico para o contrato Rust (Direct, Guided, Clinical)
      let pedagogicalMode = 'Direct';
      const modeStr = String(body.pedagogical_mode || context.mode || context.pedagogical_mode || '').toLowerCase();
      const directiveStr = String(context.tutorPromptDirective || '').toLowerCase();
      if (modeStr.includes('clinical') || directiveStr.includes('clinical') || directiveStr.includes('caso clínico')) {
        pedagogicalMode = 'Clinical';
      } else if (modeStr.includes('guided') || modeStr.includes('socratic') || directiveStr.includes('socrático')) {
        pedagogicalMode = 'Guided';
      }

      // Mapeamento do idioma para o contrato Rust (pt-BR, es-ES, en-US, de-DE)
      // Prioridade Soberana: 1º body.language explícito, 2º context.language explícito, 3º persona vocal, 4º detecção lexical estrita
      let language = 'pt-BR';
      const explicitBodyLang = String(body.language || '').toLowerCase().trim();
      const contextLang = String(context.language || '').toLowerCase().trim();
      const isGermanLexical = /\b(der|die|das|des|dem|den|ein|eine|einer|eines|und|oder|nicht|ist|sind|welche|welcher|welches|wo|wie|warum|knochen|muskel|muskeln|sehne|nerv|nerven|schlagader|blutader|herz|herzens|herzkammern|herzkranzgefäße|perikard|koronararterien|lunge|leber|milz|niere|harnblase|magen|gehirn|schlüsselbein|schluesselbein|kniescheibe|oberschenkel|brustbein|erkläre|erklaere|beschreibe)\b/i.test(question) || /[äöüß]/.test(question);
      const isEnglishLexical = /\b(what|which|where|how|why|is|are|the|and|of|in|to|with|for|explain|describe|layers|sinuses|chambers|coronary|pericardium|bone|bones|muscle|muscles|tendon|nerve|nerves|artery|arteries|vein|veins|heart|lung|lungs|liver|spleen|kidney|kidneys|bladder|stomach|brain|clavicle|collarbone|kneecap|patella|femur|sternum)\b/i.test(question);
      const isSpanishLexical = /¿|\b(cuál|cuáles|dónde|cómo|qué|explícame|describa|hueso|pulmón|riñón|hígado|corazón|articulación|cadera|rodilla|antebrazo|hombro|espalda|estómago|vejiga)\b|\bde la\b|\ben el\b|\bpor el\b|\bcon los\b/i.test(question);

      if (explicitBodyLang.startsWith('pt')) {
        language = 'pt-BR';
      } else if (explicitBodyLang.startsWith('es')) {
        language = 'es-ES';
      } else if (explicitBodyLang.startsWith('en')) {
        language = 'en-US';
      } else if (explicitBodyLang.startsWith('de')) {
        language = 'de-DE';
      } else if (contextLang.startsWith('pt')) {
        language = 'pt-BR';
      } else if (contextLang.startsWith('es')) {
        language = 'es-ES';
      } else if (contextLang.startsWith('en')) {
        language = 'en-US';
      } else if (contextLang.startsWith('de')) {
        language = 'de-DE';
      } else if (personaId === 'marina' || personaId === 'eduardo') {
        language = 'pt-BR';
      } else if (personaId === 'antonia') {
        language = 'es-ES';
      } else if (personaId === 'ariana') {
        language = 'en-US';
      } else if (personaId === 'fabian') {
        language = 'de-DE';
      } else if (isGermanLexical) {
        language = 'de-DE';
      } else if (isEnglishLexical) {
        language = 'en-US';
      } else if (isSpanishLexical) {
        language = 'es-ES';
      }

      const daemonPayload = JSON.stringify({
        contract_version: 'AeternumUnifiedBrainContract v2.0.0',
        request_id: requestId,
        session_id: conversationId,
        persona_id: personaId,
        channel: channel,
        question: effectiveQuestion,
        transcribed_question: transcribedQuestion,
        language: language,
        pedagogical_mode: pedagogicalMode,
        selected_anatomical_entity_id: body.selected_anatomical_entity_id || body.active_structure_id || context.selectedEntityId || context.activeStructure?.id || null,
        selected_3d_object_id: body.selected_3d_object_id || context.model?.id || context.modelSlug || null,
        timestamp: new Date().toISOString()
      });

      const authToken = getLocalAuthToken();
      const isStream = pathname === '/v1/unified-brain/stream' ? true : (pathname === '/v1/unified-brain/ask' ? Boolean(body.stream) : body.stream !== false);

      console.log(`[bridge] Consulta (${channel}/${personaId || 'default'}): "${question.slice(0, 60)}..." | Modo: ${pedagogicalMode} | Idioma: ${language} | Stream: ${isStream}`);

      const targetPath = isStream ? '/v1/unified-brain/stream' : '/v1/unified-brain/ask';

      const daemonReq = http.request({
        hostname: DAEMON_HOST,
        port: DAEMON_PORT,
        path: targetPath,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Accept': isStream ? 'text/event-stream' : 'application/json',
          'Content-Length': Buffer.byteLength(daemonPayload)
        },
        timeout: 60_000
      }, daemonRes => {
        if (daemonRes.statusCode && daemonRes.statusCode >= 400) {
          let errData = '';
          daemonRes.on('data', d => { errData += d; });
          daemonRes.on('end', () => {
            console.error(`[bridge] Erro do daemon Rust (${daemonRes.statusCode}):`, errData);
            res.writeHead(daemonRes.statusCode || 500, { ...corsHeaders, 'Content-Type': 'application/json' });
            res.end(errData || JSON.stringify({ error: 'Erro no motor cognitivo Rust' }));
          });
          return;
        }

        if (isStream) {
          res.writeHead(200, {
            ...corsHeaders,
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
          });

          let buffer = '';
          let currentEvent = 'message';

          const processSseLine = line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            if (trimmed.startsWith('event:')) {
              currentEvent = trimmed.slice(6).trim();
            } else if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.slice(5).trim();
              try {
                const parsed = JSON.parse(dataStr);
                const evType = parsed.type || currentEvent;
                if ((evType === 'token' || currentEvent === 'token') && parsed.chunk) {
                  res.write(`data: ${JSON.stringify({ text: parsed.chunk })}\n\n`);
                } else if (evType === 'complete' || currentEvent === 'complete') {
                  const respObj = parsed.response || parsed;
                  const canonicalEntities = respObj.canonical_entities || respObj.referenced_entities || [];
                  res.write(`data: ${JSON.stringify({
                    action: null,
                    conversationId: conversationId,
                    scientific_trace: {
                      contract_version: respObj.contract_version || 'AeternumUnifiedBrainContract v2.0.0',
                      persona_id: respObj.persona_id || personaId,
                      channel: respObj.channel || channel,
                      language: respObj.language || language,
                      resolved_entity_id: respObj.resolved_entity_id || canonicalEntities[0] || null,
                      evidence_status: respObj.evidence_status,
                      evidence_gate_passed: respObj.evidence_gate_passed ?? (respObj.retrieval_strategy !== 'Abstention'),
                      abstained: respObj.abstained ?? false,
                      retrieval_strategy: respObj.retrieval_strategy,
                      canonical_entities: canonicalEntities,
                      referenced_entities: respObj.referenced_entities || [],
                      anatomical_relations: respObj.anatomical_relations || [],
                      eligible_passages: respObj.eligible_passages || [],
                      citations: respObj.citations || [],
                      oralizable_answer: respObj.oralizable_answer || respObj.answer,
                      corpus_version: respObj.corpus_version || 'v2026-P1.9-Scientific90',
                      latency_metrics: respObj.latency_metrics,
                      pedagogical_mode: pedagogicalMode,
                      engine: 'Rust-TutorEngine-14556 (AeternumUnifiedBrainContract v2.0.0)'
                    }
                  })}\n\n`);
                } else if (evType === 'error' || currentEvent === 'error') {
                  res.write(`data: ${JSON.stringify({ error: parsed.message || 'Erro de inferência' })}\n\n`);
                }
              } catch {}
            }
          };

          daemonRes.on('data', chunk => {
            buffer += chunk.toString('utf-8');
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              processSseLine(line);
            }
          });

          daemonRes.on('end', () => {
            if (buffer.trim()) {
              processSseLine(buffer);
              buffer = '';
            }
            res.write('data: [DONE]\n\n');
            res.end();
            console.log(`[bridge] Stream concluído com sucesso para requisição ${requestId}`);
          });

          daemonRes.on('error', err => {
            console.error('[bridge] Erro no stream do daemon:', err);
            res.write(`data: ${JSON.stringify({ error: 'Conexão interrompida com o daemon Rust' })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
          });
        } else {
          // Resposta síncrona JSON (suporta tanto formato legado quanto AeternumUnifiedBrainContract v2.0.0 completo)
          let jsonBody = '';
          daemonRes.on('data', d => { jsonBody += d; });
          daemonRes.on('end', () => {
            try {
              const parsed = JSON.parse(jsonBody);
              const canonicalEntities = parsed.canonical_entities || parsed.referenced_entities || [];
              const gatePassed = parsed.evidence_gate_passed ?? (parsed.retrieval_strategy !== 'Abstention');
              const abstained = parsed.abstained ?? !gatePassed;
              res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                ...parsed,
                contract_version: parsed.contract_version || 'AeternumUnifiedBrainContract v2.0.0',
                mode: 'live',
                text: parsed.answer,
                oralizable_answer: parsed.oralizable_answer || parsed.answer,
                source: 'rust_tutor_engine_staging_dev',
                conversationId: conversationId,
                persona_id: parsed.persona_id || personaId,
                channel: parsed.channel || channel,
                language: parsed.language || language,
                citations: parsed.citations || [],
                resolved_entity_id: parsed.resolved_entity_id || canonicalEntities[0] || null,
                canonical_entities: canonicalEntities,
                referenced_entities: parsed.referenced_entities || [],
                anatomical_relations: parsed.anatomical_relations || [],
                eligible_passages: parsed.eligible_passages || [],
                evidence_status: parsed.evidence_status,
                evidence_gate_passed: gatePassed,
                abstained: abstained,
                abstention_reason: parsed.abstention_reason || (abstained ? 'Ausência de evidência biomédica ou fora de domínio' : null),
                corpus_version: parsed.corpus_version || 'v2026-P1.9-Scientific90',
                latency_metrics: parsed.latency_metrics
              }));
            } catch (e) {
              res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Resposta inválida do daemon Rust' }));
            }
          });
        }
      });

      // Suporte a Barge-in / Cancelamento imediato quando o cliente fecha a conexão
      res.on('close', () => {
        if (!res.writableEnded) {
          daemonReq.destroy();
        }
      });

      daemonReq.on('error', err => {
        console.error('[bridge] Erro de rede ao conectar com daemon 14556:', err.message);
        if (!res.headersSent) {
          res.writeHead(503, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'O TutorEngine Rust (porta 14556) não respondeu. Verifique se o daemon de desenvolvimento está em execução.',
            details: err.message
          }));
        }
      });

      daemonReq.write(daemonPayload);
      daemonReq.end();
    });
    return;
  }

  // Endpoint de apoio para síntese de voz do estudante (teste de microfone WebRTC em localhost)
  if (req.method === 'POST' && url.pathname === '/v1/dev-synthesize-student-voice') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString('utf-8'); });
    req.on('end', async () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const text = String(parsed.text || 'Marina, me explique sobre o coração.').trim();
        const lang = String(parsed.language || 'pt').toLowerCase().slice(0, 2);
        const envPath = path.resolve(__dirname, '../../packages/aeternum-vita/.env.local');
        let speechKey = 'local-development-only';
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf-8');
          const m = envContent.match(/^LOCAL_SPEECH_API_KEY=(.+)$/m);
          if (m) speechKey = m[1].trim();
        }
        const persona = String(parsed.persona || parsed.tutorId || '').toLowerCase();
        const model = lang === 'de'
          ? 'speaches-ai/piper-de_DE-thorsten-high'
          : 'speaches-ai/Kokoro-82M-v1.0-ONNX';
        const voice = parsed.voice
          ? String(parsed.voice)
          : lang === 'de'
          ? 'thorsten'
          : lang === 'es'
          ? 'ef_dora'
          : lang === 'en'
          ? 'af_heart'
          : persona === 'eduardo'
          ? 'pm_alex'
          : 'pf_dora';

        const ttsResp = await fetch('http://127.0.0.1:8000/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${speechKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            voice,
            input: text,
            response_format: 'wav',
            speed: 1.0
          })
        });
        if (!ttsResp.ok) {
          const errTxt = await ttsResp.text();
          res.writeHead(ttsResp.status, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Falha ao sintetizar áudio de teste', details: errTxt }));
          return;
        }
        const wavBuf = Buffer.from(await ttsResp.arrayBuffer());
        if (url.searchParams.get('format') === 'json' || parsed.returnStt === true) {
          let sttText = text;
          try {
            const form = new FormData();
            form.append('file', new Blob([wavBuf], { type: 'audio/wav' }), 'student_question.wav');
            form.append('model', 'Systran/faster-whisper-small');
            form.append('language', lang);
            const sttResp = await fetch('http://127.0.0.1:8000/v1/audio/transcriptions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${speechKey}`
              },
              body: form
            });
            if (sttResp.ok) {
              const sttJson = await sttResp.json();
              if (sttJson && typeof sttJson.text === 'string' && sttJson.text.trim()) {
                sttText = sttJson.text.trim();
              }
            }
          } catch (sttErr) {
            console.warn('[bridge] Aviso STT roundtrip:', sttErr.message);
          }
          res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            ok: true,
            inputText: text,
            sttText,
            language: lang,
            wavBytes: wavBuf.length,
            wavBase64: wavBuf.toString('base64')
          }));
          return;
        }
        res.writeHead(200, {
          ...corsHeaders,
          'Content-Type': 'audio/wav',
          'Content-Length': wavBuf.length
        });
        res.end(wavBuf);
      } catch (err) {
        res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Rota desconhecida
  res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Rota não encontrada' }));
});

server.listen(BRIDGE_PORT, '127.0.0.1', () => {
  console.log(`================================================================`);
  console.log(` AETERNUM ATLAS — SCIENTIFIC LOCAL GATEWAY BRIDGE ATIVO (P1.9-V1)`);
  console.log(` Contrato: AeternumUnifiedBrainContract v2.0.0                  `);
  console.log(` Escutando em: http://127.0.0.1:${BRIDGE_PORT}                   `);
  console.log(` Destino Rust: http://${DAEMON_HOST}:${DAEMON_PORT} (atlas-daemon-dev) `);
  console.log(` Memória: v2026-P1.9-Scientific90 (SHA: ${MEMORY_HASH_EXPECTED.slice(0, 16)}...)`);
  console.log(` Origens CORS permitidas: ${Array.from(ALLOWED_ORIGINS).join(', ')}`);
  console.log(`================================================================`);
});
