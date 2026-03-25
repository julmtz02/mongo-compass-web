# Compass Web Secure

![npm](https://img.shields.io/npm/v/compass-web.svg)

A hardened, self-hosted web interface for managing multiple MongoDB databases from any device — tablet, phone, or desktop. Based on [MongoDB Compass](https://www.mongodb.com/products/compass), running entirely in your browser.

| Login | Setup | Admin Panel |
|-------|-------|-------------|
| ![Login](/images/screenshot-login.png) | ![Setup](/images/screenshot-setup.png) | ![Admin](/images/screenshot-admin.png) |

| Documents & Queries | Aggregation Pipeline | Schema Analysis |
|---------------------|----------------------|-----------------|
| ![Documents](/images/screenshot-documents.png) | ![Aggregation](/images/screenshot-aggregation.png) | ![Schema](/images/screenshot-schema.png) |

## Features

- Full MongoDB Compass UI in the browser (collections, queries, aggregation pipelines, indexes, schema viewer, import/export)
- Multi-database support (connect to multiple MongoDB instances simultaneously)
- User management with roles (admin, editor, viewer) backed by SQLite
- Auto-setup wizard on first run
- Mobile-friendly login, setup, and admin pages (React 19 + TailwindCSS)
- Connection string encryption at rest (AES-256-GCM)
- Optional OpenAI integration for natural language queries
- Lightweight: runs on a Raspberry Pi, $5 VPS, or any 1GB RAM machine

### Supported providers

- MongoDB Atlas
- Amazon DocumentDB
- Azure Cosmos DB
- Any MongoDB-compatible server

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 22 + Fastify 5 |
| Frontend (Compass) | React (upstream MongoDB Compass components) |
| Auth pages | React 19 + TailwindCSS 3 (Vite build) |
| User database | SQLite via better-sqlite3 |
| Crypto | AES-256-GCM (connections), PBKDF2-SHA512 (passwords) |
| Container | Docker (Alpine, multi-stage build) |

---

## Installation

### Option 1: Docker Compose (recommended)

```bash
git clone https://github.com/YOUR_USER/compass-web-secure.git
cd compass-web-secure

# Set required env var
export CW_MASTER_PASSWORD="your-secure-password-here"

# Start
docker compose up -d
```

Open `http://localhost:8080`. The setup wizard will guide you to create your admin account.

### Option 2: Docker Compose with HTTPS (production)

For exposing to the internet (e.g., accessing from your phone outside your network):

```bash
export CW_MASTER_PASSWORD="your-secure-password-here"
export DOMAIN="compass.yourdomain.com"

# Caddy handles TLS certificates automatically via Let's Encrypt
docker compose -f docker-compose.prod.yaml up -d
```

Open `https://compass.yourdomain.com`.

### Option 3: Without Docker (bare metal)

**Prerequisites:** Node.js 22+, pnpm, Python 3 + make + g++ (for native module compilation)

```bash
git clone https://github.com/YOUR_USER/compass-web-secure.git
cd compass-web-secure

# Install dependencies
pnpm install

# Initialize the Compass submodule (required for the frontend build)
git submodule update --init --recursive --single-branch --depth 1
bash bootstrap.sh
cd compass && npm install && cd ..

# Build client and server
pnpm run build-client:production
pnpm run build-server:production

# Run
CW_MASTER_PASSWORD="your-secure-password" \
CW_MONGO_URI="mongodb://localhost:27017" \
  node dist/server.js --host 0.0.0.0
```

Open `http://localhost:8080`.

### Option 4: EasyPanel

Fully compatible with [EasyPanel](https://easypanel.io/).

**Method A — From Dockerfile (recommended):**

1. Create a new service in EasyPanel > **App** > **Dockerfile**
2. Point to your Git repo URL
3. Set environment variables:

| Variable | Value |
|----------|-------|
| `CW_MONGO_URI` | `mongodb://your-mongo-host:27017` |
| `CW_MASTER_PASSWORD` | *(generate a strong password)* |
| `CW_HOST` | `0.0.0.0` |
| `CW_DB_PATH` | `/app/data/compass-web.db` |
| `NODE_ENV` | `production` |

4. Set exposed port to **8080**
5. Mount a persistent volume at `/app/data` (stores the SQLite database)
6. Enable HTTPS in domain settings (EasyPanel handles certificates)
7. Deploy

**Method B — Docker Compose:**

1. Create a new service > **Docker Compose**
2. Paste the contents of `docker-compose.yaml`
3. Set `CW_MASTER_PASSWORD` in the environment variables section
4. Deploy

**MongoDB on EasyPanel:** You can run MongoDB as a separate EasyPanel service. Connect using the internal service name as hostname (e.g., `mongodb://mongodb:27017`).

---

## Configuration

All options can be set via CLI flags or environment variables (prefix: `CW_`).

| Environment Variable | CLI Flag | Default | Description |
|---------------------|----------|---------|-------------|
| `CW_MONGO_URI` | `--mongo-uri` | — | MongoDB connection string(s), space-separated for multiple |
| `CW_MASTER_PASSWORD` | `--master-password` | — | Encryption password. **Required** when `enable-edit-connections` is on. Prefer env var over CLI flag |
| `CW_HOST` | `--host` | `localhost` | Server bind address. Use `0.0.0.0` for Docker/remote access |
| `CW_PORT` | `--port` | `8080` | Server port |
| `CW_DB_PATH` | — | `./data/compass-web.db` | Path to SQLite user database |
| `CW_APP_NAME` | `--app-name` | `Compass Web` | App name shown in UI |
| `CW_ORG_ID` | `--org-id` | `default-org-id` | Organization ID |
| `CW_PROJECT_ID` | `--project-id` | `default-project-id` | Project ID |
| `CW_CLUSTER_ID` | `--cluster-id` | `default-cluster-id` | Cluster ID |
| `CW_ENABLE_EDIT_CONNECTIONS` | `--enable-edit-connections` | `false` | Allow adding/removing connections in the UI |
| `CW_ENABLE_GEN_AI_FEATURES` | `--enable-gen-ai-features` | `false` | Enable natural language queries (requires OpenAI key) |
| `CW_OPENAI_API_KEY` | `--openai-api-key` | — | OpenAI API key |
| `CW_OPENAI_MODEL` | `--openai-model` | `gpt-5-mini` | OpenAI model to use |
| `CW_ENABLE_GEN_AI_SAMPLE_DOCUMENTS` | `--enable-gen-ai-sample-documents` | `false` | Send sample docs to OpenAI for better query generation |
| `NODE_ENV` | — | — | Set to `production` for secure cookies and optimized builds |

### Connecting to multiple databases

Pass multiple connection strings separated by spaces:

```bash
CW_MONGO_URI="mongodb://db1:27017 mongodb://db2:27017 mongodb+srv://user:pass@cluster.mongodb.net/?name=Atlas"
```

Each appears as a separate cluster in the sidebar. Use `name=<label>` in the query string to set a display name.

> **Note:** You may need to add `tls=true` to your connection string when using the `mongodb+srv://` scheme.

---

## First Run

1. Open the app in your browser
2. You'll see the **Setup** page — create your admin username and password
3. After setup, you're logged in and see the Compass dashboard
4. To manage users, go to `/admin`

## User Roles

| Role | Permissions |
|------|------------|
| **admin** | Full access: manage users, manage connections, read/write data, change settings |
| **editor** | Read/write data, add connections (if enabled) |
| **viewer** | Read-only access to data |

The first user created during setup is automatically **admin**.

---

## Security

### Protection summary

| Attack Vector | Protection |
|---------------|-----------|
| Brute force | Global rate limit (100 req/min) + per-account lockout (5 attempts / 15 min) |
| Session hijacking | httpOnly + sameSite cookies, secure flag in production, session rotation on login |
| CSRF | Token-based protection on all state-changing endpoints |
| SSRF | WebSocket proxy restricted to preset MongoDB hosts only |
| XSS | Content Security Policy via Helmet, output escaping |
| Clickjacking | X-Frame-Options: DENY |
| SQL injection | Parameterized queries (better-sqlite3) |
| Credential theft | PBKDF2-SHA512 (100k iterations), timing-safe comparison |
| Man-in-the-middle | HSTS headers, client TLS overrides blocked |
| Path traversal | Static serving restricted to `/static/` directory only |
| Connection string exposure | AES-256-GCM encryption at rest |

### Production checklist

1. **Always use HTTPS** — use `docker-compose.prod.yaml` with Caddy, or EasyPanel's built-in HTTPS
2. **Set `NODE_ENV=production`** — enables the `Secure` cookie flag
3. **Use strong passwords** — both for the admin account and `CW_MASTER_PASSWORD`
4. **Set `CW_MASTER_PASSWORD` via env var**, not CLI flag (CLI args are visible in `ps aux`)
5. **Back up `/app/data`** — contains the SQLite database with user accounts and sessions
6. **Don't expose port 8080 directly** — always put a reverse proxy with HTTPS in front

---

## Resource Requirements

| Component | RAM | Image Size |
|-----------|-----|-----------|
| Compass Web | ~256 MB | ~150 MB |
| MongoDB 7 | ~256 MB | ~700 MB |
| Caddy (HTTPS proxy) | ~20 MB | ~40 MB |
| **Total** | **~530 MB** | **~890 MB** |

MongoDB cache is tuned to 256 MB via `--wiredTigerCacheSizeGB 0.25` in the compose files. The whole stack runs comfortably on a 1 GB RAM machine.

---

## Project Structure

```
src/
  app.js                    Server setup + plugin registration
  server.js                 Entry point + graceful shutdown
  auth.js                   Session authentication hooks
  db.js                     SQLite: users, sessions, permissions
  cli.js                    CLI argument parsing
  constants.js              Centralized configuration constants
  connection-manager.js     MongoDB connection lifecycle
  encryption.js             AES-256-GCM for connection strings
  ws.js                     WebSocket proxy to MongoDB
  data-service.js           MongoDB data access wrapper
  gen-ai.js                 OpenAI integration

  middleware/               Reusable Fastify hooks
    error-handler.js          Unified error responses
    require-role.js           Role-based access control
    validate-connection.js    Connection ID resolution
    ssrf-guard.js             WebSocket host allowlist

  routes/                   API endpoints by domain
    index.js                  Route registrar
    auth.js                   Login, setup, user management
    connections.js            Connection CRUD
    export.js                 CSV/JSON data export
    import.js                 CSV/JSON data import
    ai.js                     Natural language queries
    settings.js               App settings + version

  connection-storage/       Pluggable storage backends
    in-memory.js              Volatile (default)
    encrypted-file.js         Persistent + encrypted

  utils/                    Pure utility functions
    sanitize.js               Filename sanitization
    create-mongo-socket.js    TLS/TCP socket factory
    srv-resolver.js           MongoDB SRV resolution

  static/                   Shared frontend assets
    auth.css                  Styles for auth pages
    auth-form.js              Form submission helper

  *.eta                     HTML templates (Eta engine)
```

---

## Development

```bash
# Install
pnpm install
git submodule update --init --recursive --single-branch --depth 1
bash bootstrap.sh

# Build
pnpm run build-client        # Webpack (frontend)
pnpm run build-server        # Rollup (backend)

# Run in development
CW_MONGO_URI="mongodb://localhost:27017" node dist/server.js

# Tests
pnpm test

# Format
pnpm run format
```

### Settings (UI)

Editable in the **Settings** page:
- Theme (dark/light)
- Default Sort for Query Bar

### Unsupported features

These Compass Desktop features are not available in the web version:
- Mongo Shell
- Proxy connections

---

## License

[Server Side Public License (SSPL)](/LICENSE)

## Credits

- [MongoDB Compass](https://github.com/mongodb-js/compass) — upstream UI components
- Inspired by the compass-web concept of running MongoDB Compass in a browser
- Security hardening, user management system, and Docker optimization by this fork
