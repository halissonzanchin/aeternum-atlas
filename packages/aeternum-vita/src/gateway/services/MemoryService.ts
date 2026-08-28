export interface MemoryContextRequest {
  userId: string;
  sessionId?: string;
}

export interface MemoryContextResponse {
  contextSummary: string;
}

export interface MemoryService {
  getContext(req: MemoryContextRequest): Promise<MemoryContextResponse>;
}
