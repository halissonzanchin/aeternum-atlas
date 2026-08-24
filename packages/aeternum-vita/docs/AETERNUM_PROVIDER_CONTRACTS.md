# 🏛️ AETERNUM AI PROVIDER CONTRACTS (FASE 2A)

**Status:** APROVADO & VERIFICADO  
**Data:** 24 de Agosto de 2026  
**Escopo:** Camada de Interfaces e Abstração de Fornecedores da Aeternum Sovereign AI

---

## 🎯 1. Princípios Fundamentais

1. **Independência de Fornecedor:** Nenhum contrato na camada de abstração importa SDKs ou tipos específicos de fornecedores externos (*Ollama, Gemini, Deepgram, Cartesia, Whisper, Kokoro, Supabase*).
2. **Segregação de Responsabilidade (Pedagogia vs. Infraestrutura):**
   * **O que pertence ao Provider:** Computação pura de inferência (gerar texto, transcrever áudio, sintetizar voz, buscar chunks brutos, persistir dados do estudante).
   * **O que NÃO pertence ao Provider:** As personas dos tutores (*Eduardo, Antonia, Ariana, Fabian*), método socrático, roteiro de 5 pontos, terminologia FCAT/IFAA, regras clínicas e decisões de câmera 3D.
3. **Imutabilidade da Aplicação:** A substituição de um provider (ex: migrar do *HP Victus com Ollama* para um *Servidor GPU Dedicado com vLLM*) deve ocorrer com **ZERO alteração** no frontend, nos tutores ou na lógica de negócios.

---

## 🏗️ 2. Mapeamento dos Contratos de Provedores

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AETERNUM BASE PROVIDER                          │
│  - metadata: { id, name, type, location: "LOCAL" | "CLOUD" | "HYBRID" }│
│  - health(): Promise<HealthResult>                                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌──────────────┬─────────────┼─────────────┬──────────────┐
       ▼              ▼             ▼             ▼              ▼
┌──────────────┐┌────────────┐┌───────────┐┌─────────────┐┌──────────────┐
│ LLMProvider  ││STTProvider ││TTSProvider││ RAGProvider ││MemoryProvider│
├──────────────┤├────────────┤├───────────┤├─────────────┤├──────────────┤
│ - generate() ││-transcribe ││-synthesize││ - retrieve()││-getStudent...│
│ - stream()   ││-streamTr...││-streamS...││ (com scores ││-saveInter... │
│              ││            ││           ││ e metadados)││-updateMast...│
└──────────────┘└────────────┘└───────────┘└─────────────┘└──────────────┘
```

---

## 📋 3. Detalhamento das Interfaces

### 3.1. `LLMProvider`
```typescript
export interface LLMProvider extends BaseProvider {
  generate(request: LLMRequest): Promise<LLMResponse>;
  stream(request: LLMRequest): AsyncIterable<LLMStreamChunk>;
}
```
* **Entrada (`LLMRequest`):** `messages` (system, user, assistant), `temperature`, `maxTokens`, `metadata`.
* **Saída (`LLMResponse`):** `text`, `providerId`, `modelId`, `finishReason`, `usage` (tokens), `latency` (total e TTFT).
* **Streaming (`LLMStreamChunk`):** `deltaText`, `isComplete`, `finishReason`.

---

### 3.2. `STTProvider` (Speech-to-Text)
```typescript
export interface STTProvider extends BaseProvider {
  transcribe(request: STTRequest): Promise<STTResponse>;
  streamTranscription(
    audioStream: AsyncIterable<Uint8Array>,
    options: Omit<STTRequest, "audioBuffer">
  ): AsyncIterable<STTStreamChunk>;
}
```
* **Entrada:** `audioBuffer`, `language`, `sampleRate`, `audioFormat`, `medicalContextHints`.
* **Saída:** `text`, `languageDetected`, `confidence`, `timestamps`, `latency`.

---

### 3.3. `TTSProvider` (Text-to-Speech)
```typescript
export interface TTSProvider extends BaseProvider {
  synthesize(request: TTSRequest): Promise<TTSResponse>;
  streamSynthesis(request: TTSRequest): AsyncIterable<TTSStreamChunk>;
}
```
* **Entrada:** `text`, `voiceId`, `language`, `speed`, `sampleRate`, `audioFormat`.
* **Saída:** `audioBuffer`, `sampleRate`, `audioFormat`, `latency` (total e TTFB).

---

### 3.4. `RAGProvider` (Conhecimento Canônico)
```typescript
export interface RAGProvider extends BaseProvider {
  retrieve(request: RAGRequest): Promise<RAGResponse>;
}
```
* **Campos Obrigatórios de cada Chunk (`RAGChunk`):**
  * `sourceId`: Identificador único do fragmento.
  * `sourceTitle`: Título do livro ou tratado (*Moore, Netter, Sobotta*).
  * `pageNumber`: Página original (quando catalogada).
  * `content`: Texto anatômico verificado.
  * `score`: Relevância / similaridade.
  * `retrievalMethod`: `"lexical" | "vector" | "hybrid" | "memory" | "other"`.

---

### 3.5. `MemoryProvider` (Memória do Estudante)
```typescript
export interface MemoryProvider extends BaseProvider {
  getStudentContext(studentId: string): Promise<StudentContext>;
  saveInteraction(record: InteractionRecord): Promise<void>;
  updateMastery(update: MasteryUpdate): Promise<void>;
  getLearningProfile(studentId: string): Promise<LearningProfile>;
}
```
* **Isolamento Absoluto:** A memória responde *"O que sabemos sobre este aluno?"* e nunca deve ser contaminada com o conhecimento do RAG (*"O que a anatomia sabe?"*).

---

## 🚨 4. Hierarquia de Erros Canônicos Aeternum

Nenhum módulo superior da aplicação precisa conhecer erros específicos de provedores externos. Todos herdam da classe abstrata `AeternumProviderError`:

1. `ProviderUnavailableError` (`PROVIDER_UNAVAILABLE`): Falha de conexão, serviço fora do ar.
2. `ProviderTimeoutError` (`PROVIDER_TIMEOUT`): Tempo limite de resposta excedido.
3. `ProviderAuthenticationError` (`PROVIDER_AUTH_ERROR`): Credenciais inválidas ou expiradas.
4. `ProviderRateLimitError` (`PROVIDER_RATE_LIMIT`): Cota excedida, inclui `retryAfterSeconds`.
5. `ProviderInvalidResponseError` (`PROVIDER_INVALID_RESPONSE`): Resposta corrompida ou vazia.

---

## 🧪 5. Provedores de Teste (Fakes)

Para validação estrita sem dependência de rede, a camada inclui implementações completas em `src/providers/testing/`:
* `FakeLLMProvider`
* `FakeSTTProvider`
* `FakeTTSProvider`
* `FakeRAGProvider`
* `FakeMemoryProvider`
