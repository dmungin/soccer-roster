# ⚽ Soccer Roster

A self-hostable soccer team roster and tactical planning web application. Manage multiple teams, build player rosters, schedule games, and create drag-and-drop lineup formations for each period.

![CI](https://github.com/dmungin/soccer-roster/actions/workflows/ci.yml/badge.svg)
![CD](https://github.com/dmungin/soccer-roster/actions/workflows/cd.yml/badge.svg)

---

## Features

- **Multi-team management** — Create and manage multiple teams with custom colors and icons
- **Player rosters** — Bulk-add players, remove them, and track participation across lineups
- **Game planning** — Schedule games and create multiple lineup periods (Q1, Q2, halves, etc.)
- **Drag-and-drop formations** — Interactively place players on an SVG soccer field across 11v11, 9v9, and 7v7 formations
- **Player participation tracker** — See what percentage of game time each player is assigned across all lineups
- **Print-ready layouts** — Print field grids and player participation tables directly from the browser
- **Authentication** — Secure login with JWT sessions stored in httpOnly cookies
- **Admin invite system** — Only admins can create accounts; no open registration
- **Admin user management** — Manage users, reset passwords, toggle admin roles, and delete accounts
- **Persistent storage** — All data stored in SQLite via `better-sqlite3`
- **Docker-ready** — Single container with a persistent `/data` volume for the database

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | Pinia |
| Routing | Vue Router |
| Backend | Express.js (Node 22) |
| Database | SQLite (`better-sqlite3`) |
| Auth | JWT + bcrypt + httpOnly cookies |
| Testing | Playwright (E2E) |
| Container | Docker (multi-stage, Alpine) |

---

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Run for development

The app requires both the Express backend (API + auth) and the Vite dev server (HMR) running simultaneously.

**Terminal 1 — Express backend:**
```bash
npm run dev:server
```

**Terminal 2 — Vite frontend (with API proxy):**
```bash
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:3000`, so both servers work together seamlessly.

Open **http://localhost:5173** in your browser.

> **First launch:** You'll be prompted to create an admin account. This is the only account that can be created without an invite.

### 3. Run the production build locally

```bash
npm run build      # Build the Vue frontend
npm start          # Serve everything from Express on port 3000
```

Open **http://localhost:3000**.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the Express server listens on |
| `DB_PATH` | `./data/soccer-roster.db` | Path to the SQLite database file |
| `JWT_SECRET` | *(random on startup)* | Secret used to sign JWT tokens — **set this in production** |
| `NODE_ENV` | `development` | Set to `production` to enable secure cookies |

> ⚠️ If `JWT_SECRET` is not set, a random value is generated at startup and all sessions will be invalidated on every restart.

---

## Docker

### Build the image

```bash
docker build -t soccer-roster .
```

### Run the container

```bash
docker run -d \
  --name soccer-roster \
  -p 3000:3000 \
  -v soccer-roster-data:/data \
  -e JWT_SECRET=your-secret-here \
  -e NODE_ENV=production \
  dmungin/soccer-roster:latest
```

Open **http://localhost:3000**.

### Docker Compose (recommended for Unraid/self-hosting)

```yaml
version: '3.8'
services:
  soccer-roster:
    image: dmungin/soccer-roster:latest
    container_name: soccer-roster
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
    environment:
      - JWT_SECRET=your-secret-here
      - NODE_ENV=production
```

### Pre-built image

The latest image is published to Docker Hub automatically on every merge to `master`:

```bash
docker pull dmungin/soccer-roster:latest
```

---

## Running Tests

The test suite uses Playwright for end-to-end tests against the real Express + SQLite backend.

### Run all E2E tests

```bash
npm run test:e2e:clean
```

This command:
1. Deletes the previous test database (`data/e2e-test.db`)
2. Builds the Vue frontend
3. Starts the Express server on port 3000
4. Runs all 17 Playwright tests in sequence
5. Shuts the server down

### Re-run without rebuilding

```bash
npm run test:e2e
```

> Requires the server to already be running, or Playwright will start one automatically (with `reuseExistingServer` in non-CI mode).

### Test coverage

| Suite | Tests |
|-------|-------|
| Authentication | 7 — setup, login, logout, invalid credentials, redirect |
| Team CRUD | 4 — create, add players, remove player, delete |
| Game CRUD | 4 — create game, add lineup, data persistence, delete |
| Access Control | 2 — API returns 401 for unauthenticated requests |
| **Total** | **17** |

---

## CI/CD

| Workflow | Trigger | Action |
|----------|---------|--------|
| **CI** | Pull request → `master` | Runs all 17 Playwright E2E tests |
| **CD** | Push/merge → `master` | Builds and pushes `dmungin/soccer-roster:latest` to Docker Hub |

### Required GitHub Secrets

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username (`dmungin`) |
| `DOCKERHUB_TOKEN` | Docker Hub [access token](https://hub.docker.com/settings/security) |

---

## Project Structure

```
soccer-roster/
├── server/
│   ├── db.js              # SQLite schema & connection
│   ├── auth.js            # Auth routes + JWT middleware
│   └── routes/
│       ├── teams.js       # Teams + players CRUD API
│       └── games.js       # Games + lineups + positions CRUD API
├── src/
│   ├── services/
│   │   └── api.ts         # Fetch wrapper for API calls
│   ├── stores/
│   │   ├── auth.ts        # Auth Pinia store
│   │   └── appState.ts    # Teams & games Pinia store
│   ├── views/
│   │   ├── LoginView.vue  # Login + initial admin setup
│   │   ├── AdminView.vue  # User management (admin only)
│   │   ├── HomeView.vue   # Dashboard (teams + games)
│   │   ├── TeamView.vue   # Roster management
│   │   └── GameView.vue   # Tactical lineup builder
│   ├── utils/
│   │   └── formations.ts  # Formation definitions
│   └── types/
│       └── index.ts       # Shared TypeScript interfaces
├── e2e/
│   └── app.e2e.ts         # Playwright end-to-end tests
├── .github/workflows/
│   ├── ci.yml             # Run tests on PRs
│   └── cd.yml             # Build & push Docker image on merge
├── server.js              # Express app entry point
├── Dockerfile             # Multi-stage production build
└── playwright.config.ts   # Playwright configuration
```

---

## License

MIT
