import {
  AeternumProviderError,
  ProviderAuthenticationError,
  ProviderCancelledError,
  ProviderInvalidResponseError,
  ProviderRateLimitError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  ProviderExecutionContext
} from "../../types/index.ts";

export type TerminationCause = "NONE" | "USER_CANCELLED" | "TIMEOUT";

export interface ProviderFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export interface ExecutionCoordinator {
  signal: AbortSignal;
  checkAborted: () => void;
  cleanup: () => void;
  getCause: () => TerminationCause;
  handleError: (error: unknown) => never;
}

export interface ProviderFetchSession {
  response: Response;
  cleanup: () => void;
  checkAborted: () => void;
  getCause: () => TerminationCause;
  handleStreamReadError: (error: unknown) => never;
}

export function createExecutionCoordinator(
  providerId: string,
  context?: ProviderExecutionContext,
  defaultTimeoutMs?: number
): ExecutionCoordinator {
  const controller = new AbortController();
  const state: { cause: TerminationCause } = { cause: "NONE" };
  let timeoutId: NodeJS.Timeout | undefined;

  const onUserAbort = () => {
    if (state.cause === "NONE") {
      state.cause = "USER_CANCELLED";
      controller.abort("USER_CANCELLED");
    }
  };

  if (context?.signal) {
    if (context.signal.aborted) {
      throw new ProviderCancelledError("Operação cancelada antes do início.", providerId);
    }
    context.signal.addEventListener("abort", onUserAbort, { once: true });
  }

  const timeoutMs = context?.timeoutMs ?? defaultTimeoutMs;
  if (timeoutMs && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      if (state.cause === "NONE") {
        state.cause = "TIMEOUT";
        controller.abort("TIMEOUT");
      }
    }, timeoutMs);
  }

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    if (context?.signal) {
      context.signal.removeEventListener("abort", onUserAbort);
    }
  };

  const checkAborted = () => {
    if (state.cause === "USER_CANCELLED") {
      throw new ProviderCancelledError("Operação abortada por cancelamento do usuário.", providerId);
    }
    if (state.cause === "TIMEOUT") {
      throw new ProviderTimeoutError(`Tempo limite de ${timeoutMs}ms excedido na requisição.`, providerId);
    }
  };

  const handleError = (error: unknown): never => {
    checkAborted();
    if (error instanceof AeternumProviderError) {
      throw error;
    }
    if ((error as Error)?.name === "AbortError" || (error as Error)?.name === "DOMException") {
      if (state.cause === "TIMEOUT") {
        throw new ProviderTimeoutError(`Tempo limite de ${timeoutMs}ms excedido na leitura do stream.`, providerId);
      }
      throw new ProviderCancelledError("Stream abortado pelo usuário.", providerId);
    }
    throw new ProviderUnavailableError(
      `Falha durante a operação: ${(error as Error)?.message || String(error)}`,
      providerId
    );
  };

  return {
    signal: controller.signal,
    checkAborted,
    cleanup,
    getCause: () => state.cause,
    handleError
  };
}

export async function nextWithExecutionCoordinator<T>(
  iterator: AsyncIterator<T>,
  coordinator: ExecutionCoordinator
): Promise<IteratorResult<T>> {
  coordinator.checkAborted();

  if (coordinator.signal.aborted) {
    try {
      if (typeof iterator.return === "function") {
        await iterator.return();
      }
    } catch {
      // ignore return cleanup error
    }
    coordinator.checkAborted();
  }

  let abortHandler: (() => void) | undefined;

  const abortPromise = new Promise<never>((_, reject) => {
    abortHandler = () => {
      try {
        if (typeof iterator.return === "function") {
          iterator.return().catch(() => {});
        }
      } catch {
        // ignore
      }
      try {
        coordinator.checkAborted();
      } catch (err) {
        reject(err);
      }
    };
    coordinator.signal.addEventListener("abort", abortHandler, { once: true });
  });

  const nextPromise = iterator.next();
  // Anexar no-op catch para evitar unhandled promise rejection caso o abort vença primeiro
  nextPromise.then(
    () => {},
    () => {}
  );

  try {
    const result = await Promise.race([nextPromise, abortPromise]);
    return result;
  } finally {
    if (abortHandler) {
      coordinator.signal.removeEventListener("abort", abortHandler);
    }
  }
}

export async function executeProviderFetchSession(
  url: string,
  options: ProviderFetchOptions,
  providerId: string,
  context?: ProviderExecutionContext,
  existingCoordinator?: ExecutionCoordinator
): Promise<ProviderFetchSession> {
  const coordinator = existingCoordinator || createExecutionCoordinator(providerId, context, options.timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: coordinator.signal
    });

    if (!res.ok) {
      coordinator.cleanup();
      if (res.status === 401 || res.status === 403) {
        throw new ProviderAuthenticationError(`Falha de autenticação no provider [HTTP ${res.status}]`, providerId);
      }
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("retry-after")) || undefined;
        throw new ProviderRateLimitError(`Cota excedida no provider [HTTP 429]`, providerId, retryAfter);
      }
      if (res.status >= 500) {
        throw new ProviderUnavailableError(`Serviço indisponível [HTTP ${res.status}]`, providerId);
      }
      throw new ProviderInvalidResponseError(`Resposta inesperada do provider [HTTP ${res.status}]`, providerId);
    }

    return {
      response: res,
      cleanup: coordinator.cleanup,
      checkAborted: coordinator.checkAborted,
      getCause: coordinator.getCause,
      handleStreamReadError: coordinator.handleError
    };
  } catch (error) {
    coordinator.cleanup();
    throw coordinator.handleError(error);
  }
}

export async function executeProviderJson<T = any>(
  url: string,
  options: ProviderFetchOptions,
  providerId: string,
  context?: ProviderExecutionContext
): Promise<T> {
  const session = await executeProviderFetchSession(url, options, providerId, context);
  try {
    const data = await session.response.json();
    session.checkAborted();
    return data as T;
  } catch (err) {
    session.checkAborted();
    if (err instanceof AeternumProviderError) throw err;
    throw new ProviderInvalidResponseError(
      `Falha ao decodificar JSON do provider: ${(err as Error)?.message || String(err)}`,
      providerId
    );
  } finally {
    session.cleanup();
  }
}

export async function executeProviderBinary(
  url: string,
  options: ProviderFetchOptions,
  providerId: string,
  context?: ProviderExecutionContext
): Promise<Uint8Array> {
  const session = await executeProviderFetchSession(url, options, providerId, context);
  try {
    const arrayBuffer = await session.response.arrayBuffer();
    session.checkAborted();
    return new Uint8Array(arrayBuffer);
  } catch (err) {
    session.checkAborted();
    if (err instanceof AeternumProviderError) throw err;
    throw new ProviderInvalidResponseError(
      `Falha ao ler dados binários do provider: ${(err as Error)?.message || String(err)}`,
      providerId
    );
  } finally {
    session.cleanup();
  }
}
