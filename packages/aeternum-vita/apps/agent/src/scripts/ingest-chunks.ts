import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ANATOMICAL_DATABASE, type AnatomicalTopic } from '../anatomical-knowledge.ts';

const rootEnvironmentPath = fileURLToPath(
  new URL('../../../../.env.local', import.meta.url),
);

dotenv.config({ path: rootEnvironmentPath, quiet: true });

interface IngestReport {
  totalTopics: number;
  totalLanguages: number;
  totalSources: number;
  remoteSyncSuccess: boolean;
  supabaseInserted: number;
}

export const runIngestionPipeline = async (
  supabaseUrl = process.env.SUPABASE_URL,
  supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  fetchImpl = fetch,
): Promise<IngestReport> => {
  console.log('--- Iniciando Pipeline de Ingestão Anatômica Aeternum Vita ---');

  const topics = ANATOMICAL_DATABASE;
  let totalSources = 0;
  let insertedCount = 0;
  let remoteSyncSuccess = false;

  for (const topic of topics) {
    totalSources += topic.sources.length;
  }

  console.log(`[Base Local] ${topics.length} tópicos anatômicos carregados.`);
  console.log(`[Fontes Canônicas] ${totalSources} referências bibliográficas indexadas.`);

  // Sincronização remota opcional com o Supabase da Vita
  if (supabaseUrl && supabaseKey) {
    console.log(`[Supabase Vita] Conectando ao banco ${supabaseUrl}...`);
    try {
      const recordsToInsert: Array<Record<string, unknown>> = [];

      for (const topic of topics) {
        for (const lang of ['pt', 'es', 'en', 'de'] as const) {
          for (const source of topic.sources) {
            recordsToInsert.push({
              book_title: source.title,
              chapter_title: topic.titles[lang],
              page_number: source.page,
              section_reference: source.reference,
              anatomical_structures: topic.keywords,
              content: topic.contexts[lang],
              language: lang,
              metadata: {
                topicId: topic.id,
                keywords: topic.keywords,
              },
            });
          }
        }
      }

      const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/vita_knowledge_chunks`;
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(recordsToInsert),
      });

      if (res.ok) {
        insertedCount = recordsToInsert.length;
        remoteSyncSuccess = true;
        console.log(`[Supabase Vita] ${insertedCount} chunks sincronizados com sucesso.`);
      } else {
        console.warn(`[Supabase Vita] Resposta HTTP ${res.status}: sincronização não concluída.`);
      }
    } catch (err) {
      console.warn('[Supabase Vita] Falha de conexão na sincronização remota:', err);
    }
  } else {
    console.log('[Supabase Vita] Credenciais remotas não configuradas; operando 100% com a base local.');
  }

  console.log('--- Pipeline de Ingestão Concluído com Sucesso ---');
  return {
    totalTopics: topics.length,
    totalLanguages: 4,
    totalSources,
    remoteSyncSuccess,
    supabaseInserted: insertedCount,
  };
};

if (process.argv[1] && process.argv[1].endsWith('ingest-chunks.ts')) {
  void runIngestionPipeline();
}
