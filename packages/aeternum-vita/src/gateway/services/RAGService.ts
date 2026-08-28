export interface RAGSearchRequest {
  query: string;
  limit?: number;
}

export interface RAGSearchResponse {
  results: Array<{ id: string; title: string; content: string; score: number }>;
}

export interface RAGService {
  search(req: RAGSearchRequest): Promise<RAGSearchResponse>;
}
