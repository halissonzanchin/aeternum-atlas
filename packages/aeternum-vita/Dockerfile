FROM node:24-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/agent ./apps/agent
COPY apps/token-server ./apps/token-server
COPY apps/web ./apps/web

RUN pnpm install --filter @aeternum-vita/agent... --prod --frozen-lockfile

CMD ["node", "apps/agent/src/main.ts", "start"]
