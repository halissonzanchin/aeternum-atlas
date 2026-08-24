export type PublicConfig = {
  agentName: string;
};

export const fetchPublicConfig = async (signal?: AbortSignal): Promise<PublicConfig> => {
  const response = await fetch('/api/config', signal ? { signal } : undefined);

  if (!response.ok) {
    throw new Error(`Configuração indisponível: ${response.status}`);
  }

  const body: unknown = await response.json();

  if (
    typeof body !== 'object' ||
    body === null ||
    !('agentName' in body) ||
    typeof body.agentName !== 'string' ||
    body.agentName.trim().length === 0
  ) {
    throw new Error('Resposta de configuração inválida.');
  }

  return { agentName: body.agentName };
};
