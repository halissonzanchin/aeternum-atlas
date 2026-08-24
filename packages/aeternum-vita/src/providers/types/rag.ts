export type RetrievalMethod = "lexical" | "vector" | "hybrid" | "other";

export interface RAGRequest {
  query: string;
  language?: string;
  limit?: number;
  filters?: {
    bookTitles?: string[];
    systems?: string[];
    chapters?: string[];
  };
  metadata?: Record<string, unknown>;
}

export interface RAGChunk {
  sourceId: string;
  sourceTitle: string;
  pageNumber?: number;
  chapterTitle?: string;
  content: string;
  score: number; // Score normalizado [0.0 - 1.0]
  rawScore?: number; // Score bruto original do motor de busca
  retrievalMethod: RetrievalMethod;
  metadata?: Record<string, unknown>;
}

export interface RAGResponse {
  chunks: RAGChunk[];
  totalFound: number;
  providerId: string;
  retrievalMethod: RetrievalMethod;
  latencyMs?: number;
}
