# Aeternum AI Gateway — Production Dockerfile
FROM node:24-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV AETERNUM_AI_GATEWAY_PORT=8081
ENV AETERNUM_AI_GATEWAY_HOST=0.0.0.0

USER node

COPY --chown=node:node dist/gateway.mjs ./dist/gateway.mjs

EXPOSE 8081

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('node:http'); http.get('http://127.0.0.1:8081/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/gateway.mjs"]
