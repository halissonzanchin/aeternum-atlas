# LiveKit Community em produção

O `docker-compose.yml` da raiz é um ambiente local de validação. A produção deve usar uma VM Linux com IP público estável, DNS e certificado TLS confiável.

## Rede mínima

- `443/TCP`: WebSocket seguro (`wss://`) por proxy reverso.
- `7881/TCP`: WebRTC sobre TCP.
- `3478/UDP` e `5349/TCP`: TURN.
- `50000-60000/UDP`: mídia WebRTC.

Não exponha Redis, Ollama ou Speaches à internet. Esses serviços pertencem à rede privada dos contêineres.

## Separação de endereços

- Agente e token server usam `LIVEKIT_URL=ws://livekit:7880` dentro da rede privada.
- O navegador recebe `LIVEKIT_PUBLIC_URL=wss://voice.seu-dominio.com`.
- O frontend principal pode continuar em `https://www.aeternumatlas.com`; somente a rota do tutor chama a função de token da Vita.

## Segredos

Gere novas chaves LiveKit e configure-as no gerenciador de segredos do servidor e na Edge Function. Revogue qualquer chave que já tenha aparecido em código ou log. Nunca copie `.env.local` para Git ou para um pacote de distribuição.

## GPU e capacidade

O perfil padrão reserva a GPU para o Ollama e executa Speaches em CPU. Em servidor com VRAM suficiente, ative também o TTS/STT em GPU com:

```bash
docker compose -f docker-compose.yml -f docker-compose.speech-gpu.yml up -d
```

Antes de liberar tráfego, valide simultaneamente latência de STT, primeiro token do LLM, primeiro áudio do TTS, interrupção do estudante, TURN externo e reconexão.
