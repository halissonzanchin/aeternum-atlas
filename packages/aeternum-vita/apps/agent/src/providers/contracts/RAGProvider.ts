import { BaseProvider } from "./BaseProvider.ts";
import { RAGRequest, RAGResponse } from "../types/index.ts";

export interface RAGProvider extends BaseProvider {
  retrieve(request: RAGRequest): Promise<RAGResponse>;
}
