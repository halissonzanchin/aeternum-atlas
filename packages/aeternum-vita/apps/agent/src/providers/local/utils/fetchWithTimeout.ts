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

export interface ProviderFetchSession {
  response: Response;
  cleanup: () => void;
  checkAborted: () => void;
  getCause: () => TerminationCause;
  handleStreamReadError: (error: unknown) => never;
}

export async function executeProviderFetchSession(
  url: string,
  options: ProviderFetchOptions,
  providerId: string,
  context?: ProviderExecutionContext
): Promise<ProviderFetchSession> {
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

  const timeoutMs = context?.timeoutMs || options.timeoutMs;
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

  const handleStreamReadError = (error: unknown): never => {
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
      `Falha na leitura do stream: ${(error as Error)?.message || String(error)}`,
      providerId
    );
  };

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    if (!res.ok) {
      cleanup();
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
      cleanup,
      checkAborted,
      getCause: () => state.cause,
      handleStreamReadError
    };
  } catch (error) {
    cleanup();

    if (error instanceof AeternumProviderError) {
      throw error;
    }

    if (state.cause === "USER_CANCELLED") {
      throw new ProviderCancelledError("Operação abortada por cancelamento.", providerId);
    }

    if (state.cause === "TIMEOUT") {
      throw new ProviderTimeoutError(`Tempo limite de ${timeoutMs}ms excedido na requisição.`, providerId);
    }

    throw new ProviderUnavailableError(
      `Falha de conexão com provider: ${(error as Error)?.message || String(error)}`,
      providerId
    );
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
