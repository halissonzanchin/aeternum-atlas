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

export interface ProviderFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function executeProviderFetch(
  url: string,
  options: ProviderFetchOptions,
  providerId: string,
  context?: ProviderExecutionContext
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  let timeoutId: NodeJS.Timeout | undefined;

  if (context?.signal) {
    if (context.signal.aborted) {
      throw new ProviderCancelledError("Operação cancelada antes do início.", providerId);
    }
    context.signal.addEventListener(
      "abort",
      () => {
        controller.abort("USER_CANCELLED");
      },
      { once: true }
    );
  }

  const timeoutMs = context?.timeoutMs || options.timeoutMs;
  if (timeoutMs && timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort("TIMEOUT");
    }, timeoutMs);
  }

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!res.ok) {
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

    return res;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);

    if (error instanceof AeternumProviderError) {
      throw error;
    }

    if (timedOut || controller.signal.reason === "TIMEOUT") {
      throw new ProviderTimeoutError(`Tempo limite de ${timeoutMs}ms excedido na requisição.`, providerId);
    }

    if (
      context?.signal?.aborted ||
      controller.signal.reason === "USER_CANCELLED" ||
      (error as Error)?.name === "AbortError"
    ) {
      throw new ProviderCancelledError("Operação abortada por sinal de cancelamento.", providerId);
    }

    throw new ProviderUnavailableError(
      `Falha de conexão com provider: ${(error as Error)?.message || String(error)}`,
      providerId
    );
  }
}
