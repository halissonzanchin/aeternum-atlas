export abstract class AeternumProviderError extends Error {
  public abstract readonly code: string;
  public readonly providerId: string;
  public readonly timestamp: string;

  constructor(message: string, providerId: string) {
    super(message);
    this.name = this.constructor.name;
    this.providerId = providerId;
    this.timestamp = new Date().toISOString();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ProviderUnavailableError extends AeternumProviderError {
  public readonly code = "PROVIDER_UNAVAILABLE";
}

export class ProviderTimeoutError extends AeternumProviderError {
  public readonly code = "PROVIDER_TIMEOUT";
}

export class ProviderAuthenticationError extends AeternumProviderError {
  public readonly code = "PROVIDER_AUTH_ERROR";
}

export class ProviderRateLimitError extends AeternumProviderError {
  public readonly code = "PROVIDER_RATE_LIMIT";
  public readonly retryAfterSeconds?: number;

  constructor(message: string, providerId: string, retryAfterSeconds?: number) {
    super(message, providerId);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class ProviderInvalidResponseError extends AeternumProviderError {
  public readonly code = "PROVIDER_INVALID_RESPONSE";
}
