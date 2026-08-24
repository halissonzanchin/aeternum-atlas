FROM node:24-bookworm-slim AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_TLS_REJECT_UNAUTHORIZED="0"
RUN npm config set strict-ssl false && npm install -g pnpm@10.30.3 && pnpm config set strict-ssl false

WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/agent ./apps/agent
COPY apps/token-server ./apps/token-server
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @aeternum-vita/web build

FROM nginx:alpine-slim AS runner
COPY docker/web/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
