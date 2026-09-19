# Multi-stage Dockerfile for Aeternum AI Gateway (Staging / Production)
# Stage 1: Build stage
FROM node:24-bookworm-slim AS builder

WORKDIR /app

# Copy root manifests and lockfiles
COPY package.json package-lock.json ./
COPY packages/aeternum-vita/package.json ./packages/aeternum-vita/

# Install build dependencies
RUN npm ci

# Copy source code required for building the gateway
COPY packages/aeternum-vita ./packages/aeternum-vita

# Compile standalone ESM bundle
RUN npm run build:gateway

# Stage 2: Minimal production runtime image
FROM node:24-bookworm-slim AS runner

WORKDIR /app

# Ensure non-root user
USER node

# Copy compiled gateway bundle from builder
COPY --chown=node:node --from=builder /app/packages/aeternum-vita/apps/gateway/dist/index.js ./dist/index.js

# Environment defaults
ENV NODE_ENV=production \
    PORT=8081 \
    AETERNUM_AI_GATEWAY_PORT=8081 \
    AETERNUM_AI_GATEWAY_HOST=0.0.0.0 \
    AETERNUM_AI_GATEWAY_AUTH_MODE=BEARER_TOKEN \
    AETERNUM_AI_GATEWAY_MODE=cloud_only

EXPOSE 8081

# Native container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8081) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/index.js"]
