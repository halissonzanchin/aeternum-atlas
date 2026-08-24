import { BaseProvider } from "./BaseProvider.ts";
import { RAGRequest, RAGResponse, ProviderExecutionContext } from "../types/index.ts";

export interface RAGProvider extends BaseProvider {
  retrieve(request: RAGRequest, context?: ProviderExecutionContext): Promise<RAGResponse>;
}
