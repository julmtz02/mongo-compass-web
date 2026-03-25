FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++ git bash

WORKDIR /app
COPY . .

# Clone compass dependency (submodule may not work in shallow clones)
RUN if [ ! -d "compass/.git" ]; then \
      rm -rf compass && \
      git clone --depth 1 --single-branch https://github.com/haohanyang/compass.git compass; \
    fi
RUN bash bootstrap.sh

# Install project dependencies
RUN npm i -g pnpm@10.12.1 && \
    (pnpm install --frozen-lockfile || pnpm install)

# Build client (webpack) and server (rollup)
RUN ELECTRON_OVERRIDE_DIST_PATH=/dev/null ELECTRON_SKIP_BINARY_DOWNLOAD=1 \
    NODE_ENV=production pnpm run build-client:production
RUN NODE_ENV=production pnpm run build-server:production

# Build auth UI (React + Tailwind)
FROM node:22-alpine AS auth
WORKDIR /build/auth-ui
COPY auth-ui/package.json auth-ui/package-lock.json* ./
RUN npm install
COPY auth-ui/ ./
RUN mkdir -p /build/src/static && npm run build
# Output: /build/src/static/auth/

# Final runtime image
FROM node:22-alpine

RUN apk add --no-cache wget

WORKDIR /app

# Production dependencies only
COPY package.json pnpm-lock.yaml ./
RUN npm i -g pnpm@10.12.1 && \
    (pnpm install --prod --frozen-lockfile || pnpm install --prod)

# Built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/compass-import-export ./compass-import-export
COPY --from=auth /build/src/static/auth ./dist/static/auth

RUN mkdir -p /app/data && chown -R node:node /app

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:8080/version || exit 1

VOLUME ["/app/data"]

CMD ["node", "dist/server.js", "--host", "0.0.0.0"]
