export function buildProviderUrl(baseUrl: string, endpoint: string): string {
  const cleanBase = (baseUrl || "").trim().replace(/\/+$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (cleanEndpoint.startsWith("/v1/")) {
    if (cleanBase.endsWith("/v1")) {
      return `${cleanBase}${cleanEndpoint.slice(3)}`;
    }
    return `${cleanBase}${cleanEndpoint}`;
  }

  if (cleanEndpoint.startsWith("/api/")) {
    if (cleanBase.endsWith("/v1")) {
      return `${cleanBase.slice(0, -3)}${cleanEndpoint}`;
    }
    return `${cleanBase}${cleanEndpoint}`;
  }

  return `${cleanBase}${cleanEndpoint}`;
}
