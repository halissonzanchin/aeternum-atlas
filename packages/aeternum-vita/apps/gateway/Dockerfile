# Aeternum AI Gateway — Production Dockerfile
FROM node:24-bookworm-slim AS builder

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_TLS_REJECT_UNAUTHORIZED="0"
RUN npm config set strict-ssl false && npm install -g pnpm@10.30.3 && pnpm config set strict-ssl false

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/gateway ./apps/gateway
COPY src ./src

RUN pnpm install --prod --frozen-lockfile=false

FROM node:24-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV AETERNUM_AI_GATEWAY_PORT=8081
ENV AETERNUM_AI_GATEWAY_HOST=0.0.0.0

ENV NODE_TLS_REJECT_UNAUTHORIZED="0"
RUN npm config set strict-ssl false && npm install -g tsx && pnpm config set strict-ssl false 2>/dev/null || true

USER node

COPY --from=builder --chown=node:node /app ./

EXPOSE 8081

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('node:http'); http.get('http://127.0.0.1:8081/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["npx", "tsx", "apps/gateway/src/index.ts"]
