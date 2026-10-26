/**
 * Concurrency Limiter & Request Queue para o Aeternum AI Gateway.
 * 
 * Protege a VRAM da GPU (RTX 4050) e o tempo de resposta limitando
 * o número de inferências concorrentes e enfileirando requisições excedentes
 * com timeouts granulares e suporte a cancelamento cooperativo (Barge-In).
 */

export interface ConcurrencyQueueConfig {
  maxConcurrent?: number;
  maxQueueSize?: number;
  queueTimeoutMs?: number;
}

export class ConcurrencyQueueError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;

  constructor(message: string, code: string, httpStatus: number) {
    super(message);
    this.name = "ConcurrencyQueueError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

interface QueuedItem {
  id: string;
  resolve: (release: () => void) => void;
  reject: (err: ConcurrencyQueueError) => void;
  timer: NodeJS.Timeout;
  cleanupSignal?: () => void;
}

export class ConcurrencyQueue {
  private activeCount: number = 0;
  private readonly queue: QueuedItem[] = [];
  private readonly maxConcurrent: number;
  private readonly maxQueueSize: number;
  private readonly queueTimeoutMs: number;

  constructor(config: ConcurrencyQueueConfig = {}) {
    this.maxConcurrent = Math.max(1, config.maxConcurrent ?? 1);
    this.maxQueueSize = Math.max(0, config.maxQueueSize ?? 5);
    this.queueTimeoutMs = Math.max(1000, config.queueTimeoutMs ?? 30_000);
  }

  public getMetrics(): { activeCount: number; queueLength: number; maxConcurrent: number; maxQueueSize: number } {
    return {
      activeCount: this.activeCount,
      queueLength: this.queue.length,
      maxConcurrent: this.maxConcurrent,
      maxQueueSize: this.maxQueueSize
    };
  }

  public async acquire(requestId: string, signal?: AbortSignal): Promise<() => void> {
    if (signal?.aborted) {
      throw new ConcurrencyQueueError("Operação cancelada antes de entrar na fila.", "REQUEST_CANCELLED", 499);
    }

    if (this.activeCount < this.maxConcurrent) {
      this.activeCount++;
      return this.createReleaseCallback(requestId);
    }

    if (this.queue.length >= this.maxQueueSize) {
      throw new ConcurrencyQueueError(
        "Fila de requisições do gateway local cheia. Capacidade máxima de VRAM atingida.",
        "QUEUE_FULL",
        429
      );
    }

    return new Promise<() => void>((resolve, reject) => {
      let timer: NodeJS.Timeout;

      const onAbort = () => {
        clearTimeout(timer);
        this.removeFromQueue(requestId);
        reject(new ConcurrencyQueueError("Requisição cancelada enquanto aguardava na fila.", "REQUEST_CANCELLED", 499));
      };

      timer = setTimeout(() => {
        if (signal) {
          signal.removeEventListener("abort", onAbort);
        }
        this.removeFromQueue(requestId);
        reject(new ConcurrencyQueueError("Tempo limite de espera na fila excedido.", "QUEUE_TIMEOUT", 504));
      }, this.queueTimeoutMs);

      if (signal) {
        signal.addEventListener("abort", onAbort, { once: true });
      }

      this.queue.push({
        id: requestId,
        resolve: (release) => {
          clearTimeout(timer);
          if (signal) {
            signal.removeEventListener("abort", onAbort);
          }
          resolve(release);
        },
        reject,
        timer,
        cleanupSignal: () => {
          if (signal) signal.removeEventListener("abort", onAbort);
        }
      });
    });
  }

  private removeFromQueue(requestId: string): void {
    const idx = this.queue.findIndex((item) => item.id === requestId);
    if (idx !== -1) {
      const [item] = this.queue.splice(idx, 1);
      item?.cleanupSignal?.();
    }
  }

  private createReleaseCallback(requestId: string): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.activeCount = Math.max(0, this.activeCount - 1);
      this.processNext();
    };
  }

  private processNext(): void {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const nextItem = this.queue.shift();
    if (!nextItem) return;

    this.activeCount++;
    const release = this.createReleaseCallback(nextItem.id);
    nextItem.resolve(release);
  }
}
