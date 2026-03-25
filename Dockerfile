FROM node:22-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm@10.12.1 && \
    (pnpm install --prod --frozen-lockfile || pnpm install --prod)

FROM node:22-alpine AS auth
WORKDIR /build
COPY auth-ui/package.json ./auth-ui/
RUN cd auth-ui && npm install
COPY auth-ui/ ./auth-ui/
RUN mkdir -p src/static && cd auth-ui && npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY dist/ ./dist/
COPY compass-import-export/ ./compass-import-export/
COPY --from=auth /build/src/static/auth ./dist/static/auth

RUN mkdir -p /app/data && chown -R node:node /app
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/version || exit 1
VOLUME ["/app/data"]
CMD ["node", "dist/server.js", "--host", "0.0.0.0"]
