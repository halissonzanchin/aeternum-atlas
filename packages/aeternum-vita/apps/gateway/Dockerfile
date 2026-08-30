# Aeternum AI Gateway — Production Dockerfile
# Multi-stage minimal Node 24 runtime
FROM node:24-bookworm-slim AS builder

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/gateway ./apps/gateway
COPY src ./src

RUN pnpm install --prod --frozen-lockfile=false

FROM node:24-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV AETERNUM_AI_GATEWAY_PORT=8081
ENV AETERNUM_AI_GATEWAY_HOST=0.0.0.0
ENV AETERNUM_AI_GATEWAY_AUTH_MODE=SERVICE_TOKEN

USER node

COPY --from=builder --chown=node:node /app ./

EXPOSE 8081

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "http.get('http://127.0.0.1:8081/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "apps/gateway/src/index.ts"]
