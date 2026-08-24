FROM node:24-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_TLS_REJECT_UNAUTHORIZED="0"
RUN npm config set strict-ssl false && npm install -g pnpm@10.30.3 && pnpm config set strict-ssl false

WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/agent ./apps/agent
COPY apps/token-server ./apps/token-server
COPY apps/web ./apps/web

RUN pnpm install --filter @aeternum-vita/agent... --prod --frozen-lockfile=false

CMD ["node", "apps/agent/src/main.ts", "start"]
