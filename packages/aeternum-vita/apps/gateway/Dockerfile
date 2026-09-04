# Aeternum AI Gateway — Production Multi-Stage Dockerfile
FROM node:24-bookworm-slim AS builder

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_OPTIONS="--use-system-ca"

# Instala CA certificates e suporta certificados customizados caso presentes
COPY certs* /usr/local/share/ca-certificates/
RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install -g pnpm@10.30.3

# Copia apenas manifestos e código-fonte (SEM node_modules do host e SEM dist do host)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/gateway ./apps/gateway
COPY src ./src
COPY scripts ./scripts

# Instalação determinística de dependências travadas e compilação do Gateway no builder
RUN pnpm install --frozen-lockfile
RUN node scripts/build_gateway.mjs

FROM node:24-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV AETERNUM_AI_GATEWAY_PORT=8081
ENV AETERNUM_AI_GATEWAY_HOST=0.0.0.0

USER node

# Copia estritamente o artefato compilado internamente no builder stage
COPY --from=builder --chown=node:node /app/dist/gateway.mjs ./dist/gateway.mjs

EXPOSE 8081

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('node:http'); http.get('http://127.0.0.1:8081/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/gateway.mjs"]
