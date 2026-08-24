export type RetrievalMethod = "lexical" | "vector" | "hybrid" | "memory" | "other";

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
  score: number;
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
