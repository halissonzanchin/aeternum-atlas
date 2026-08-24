# 🏛️ AETERNUM AI PROVIDER CONTRACTS (FASE 2A.1)

**Status:** IMPLEMENTED / PENDING CHATGPT AUDIT  
**Data da Atualização:** 24 de Agosto de 2026  
**Escopo:** Camada de Interfaces, Contexto de Execução, Cancelamento Canônico e Abstração de Fornecedores da Aeternum Sovereign AI

---

## 🎯 1. Princípios Fundamentais

1. **Independência de Fornecedor:** Nenhum contrato na camada de abstração importa SDKs ou tipos específicos de fornecedores externos (*Ollama, Gemini, Deepgram, Cartesia, Whisper, Kokoro, Supabase*).
2. **Contexto de Execução e Barge-in:** Todas as operações suportam `ProviderExecutionContext` contendo `requestId`, `traceId`, `timeoutMs` e `signal: AbortSignal`, permitindo cancelamento real de streaming quando o estudante interrompe o tutor.
3. **Segregação de Responsabilidade (Pedagogia vs. Infraestrutura):**
   * **O que pertence ao Provider:** Computação pura de inferência (gerar texto, transcrever áudio, sintetizar voz, buscar chunks brutos, persistir dados do estudante).
   * **O que NÃO pertence ao Provider:** As personas dos tutores (*Eduardo, Antonia, Ariana, Fabian*), método socrático, roteiro de 5 pontos, terminologia FCAT/IFAA, regras clínicas e decisões de câmera 3D.
4. **Distinção Essencial de Voz e Persona:**
   $$\text{Tutor Persona} \neq \text{Voice Profile} \neq \text{Native Provider Voice ID}$$
   * *Tutor Persona:* Entidade pedagógica (*Eduardo, Antonia*).
   * *Voice Profile:* Perfil de voz canônico da Aeternum (*ex: `test-voice-ptbr-01`*).
   * *Native Provider Voice ID:* Identificador específico do motor (*ex: `pt_BR-faber-medium` no Piper ou `pt_br_male_1` no Kokoro*).
5. **Imutabilidade da Aplicação:** A substituição de um provider (ex: migrar do *HP Victus com Ollama* para um *Servidor GPU Dedicado com vLLM*) deve ocorrer com **ZERO alteração** no frontend, nos tutores ou na lógica de negócios.

---

## 🏗️ 2. Mapeamento dos Contratos de Provedores

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AETERNUM BASE PROVIDER                          │
│  - metadata: { id, name, type: "LLM"|"STT"|"TTS"|"RAG"|"MEMORY", ... } │
│  - health(context?: ProviderExecutionContext): Promise<HealthResult>   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌──────────────┬─────────────┼─────────────┬──────────────┐
       ▼              ▼             ▼             ▼              ▼
┌──────────────┐┌────────────┐┌───────────┐┌─────────────┐┌──────────────┐
│ LLMProvider  ││STTProvider ││TTSProvider││ RAGProvider ││MemoryProvider│
├──────────────┤├────────────┤├───────────┤├─────────────┤├──────────────┤
│ - generate() ││-transcribe ││-synthesize││ - retrieve()││-getStudent...│
│ - stream()   ││-streamTr...││-streamS...││ (scores 0..1││-saveInter... │
│              ││            ││           ││ e metadados)││-updateMast...│
└──────────────┘└────────────┘└───────────┘└─────────────┘└──────────────┘
```

---

## 📋 3. Detalhamento das Interfaces & Tipagens

### 3.1. `ProviderExecutionContext`
```typescript
export interface ProviderExecutionContext {
  requestId: string;
  traceId?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  metadata?: Record<string, unknown>;
}
```

### 3.2. `LLMProvider`
```typescript
export interface LLMProvider extends BaseProvider {
  generate(request: LLMRequest, context?: ProviderExecutionContext): Promise<LLMResponse>;
  stream(request: LLMRequest, context?: ProviderExecutionContext): AsyncIterable<LLMStreamChunk>;
}
```
* **FinishReason Canônico:** `"stop" | "length" | "content_filter" | "unknown"` (falhas utilizam erros canônicos).

### 3.3. `STTProvider` (Speech-to-Text)
```typescript
export interface STTProvider extends BaseProvider {
  transcribe(request: STTRequest, context?: ProviderExecutionContext): Promise<STTResponse>;
  streamTranscription(
    audioStream: AsyncIterable<Uint8Array>,
    options: Omit<STTRequest, "audioBuffer">,
    context?: ProviderExecutionContext
  ): AsyncIterable<STTStreamChunk>;
}
```

### 3.4. `TTSProvider` (Text-to-Speech)
```typescript
export interface TTSProvider extends BaseProvider {
  synthesize(request: TTSRequest, context?: ProviderExecutionContext): Promise<TTSResponse>;
  streamSynthesis(request: TTSRequest, context?: ProviderExecutionContext): AsyncIterable<TTSStreamChunk>;
}
```
* Utiliza `voiceProfileId` (completamente desacoplado de IDs de persona).

### 3.5. `RAGProvider` (Conhecimento Canônico)
```typescript
export interface RAGProvider extends BaseProvider {
  retrieve(request: RAGRequest, context?: ProviderExecutionContext): Promise<RAGResponse>;
}
```
* **Score Normalizado:** `score` é obrigatoriamente um valor normalizado $[0.0, 1.0]$. Opcionalmente `rawScore?: number` preserva a métrica nativa.
* **RetrievalMethod Canônico:** `"lexical" | "vector" | "hybrid" | "other"` (sem contaminação com `"memory"`).

### 3.6. `MemoryProvider` (Memória do Estudante)
```typescript
export interface MemoryProvider extends BaseProvider {
  getStudentContext(studentId: string, context?: ProviderExecutionContext): Promise<StudentContext>;
  saveInteraction(record: InteractionRecord, context?: ProviderExecutionContext): Promise<void>;
  updateMastery(update: MasteryUpdate, context?: ProviderExecutionContext): Promise<void>;
  getLearningProfile(studentId: string, context?: ProviderExecutionContext): Promise<LearningProfile>;
}
```

### 3.7. `ProviderHealthMonitor`
```typescript
export interface ProviderHealthMonitor {
  checkHealth(provider: BaseProvider, context?: ProviderExecutionContext): Promise<HealthResult>;
  checkAll(providers: BaseProvider[], context?: ProviderExecutionContext): Promise<HealthResult[]>;
}
```

---

## 🚨 4. Hierarquia de Erros Canônicos Aeternum

Todos os erros operacionais herdam de `AeternumProviderError`:
1. `ProviderUnavailableError` (`PROVIDER_UNAVAILABLE`): Conexão recusada ou serviço indisponível.
2. `ProviderTimeoutError` (`PROVIDER_TIMEOUT`): Tempo limite de execução atingido.
3. `ProviderCancelledError` (`PROVIDER_CANCELLED`): Operação abortada por `AbortSignal` / barge-in.
4. `ProviderAuthenticationError` (`PROVIDER_AUTH_ERROR`): Falha de autenticação.
5. `ProviderRateLimitError` (`PROVIDER_RATE_LIMIT`): Cota excedida (`retryAfterSeconds`).
6. `ProviderInvalidResponseError` (`PROVIDER_INVALID_RESPONSE`): Resposta corrompida.
