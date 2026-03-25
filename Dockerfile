FROM node:22-slim AS auth
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /build/auth-ui
COPY auth-ui/package.json auth-ui/package-lock.json* ./
RUN npm install
COPY auth-ui/ ./
RUN mkdir -p /build/src/static && npm run build

FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends wget python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev && \
    apt-get purge -y python3 make g++ && apt-get autoremove -y && rm -rf /var/lib/apt/lists/* /root/.npm

# Pre-built artifacts
COPY dist/ ./dist/
COPY compass-import-export/ ./compass-import-export/
COPY --from=auth /build/src/static/auth ./dist/static/auth

RUN mkdir -p /app/data && chown -R node:node /app

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/auth/status || exit 1

VOLUME ["/app/data"]

CMD ["node", "dist/server.js", "--host", "0.0.0.0"]
