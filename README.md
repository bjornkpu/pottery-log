# Pottery Log

A ceramic recipe and logging app for documenting pottery pieces with images, tags, and structured data. Built as a static SPA with a Supabase backend.

## Tech Stack

- React 19, TypeScript, Vite
- TanStack Router, Query, Form, Table
- Tailwind CSS, Shadcn/ui
- Supabase (auth, database, storage)
- PWA with offline support

## Development

```bash
npm install
npm run dev
```

Requires a `.env` file with:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests (Vitest) |
| `npm run lint` | Lint (Biome) |
| `npm run format` | Format (Biome) |

## Self-Hosting

Pre-built Docker images are published to `ghcr.io/bjornkpu/pottery-log`. You provide your own Supabase backend.

### Quick Start

```yaml
# docker-compose.yml
services:
  pottery-log:
    image: ghcr.io/bjornkpu/pottery-log:latest
    ports:
      - "3000:3000"
    environment:
      - SUPABASE_URL=https://your-project.supabase.co
      - SUPABASE_ANON_KEY=your-anon-key-here
    restart: unless-stopped
```

```sh
docker compose up -d
```

Open `http://localhost:3000`.

### Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous/public API key |

Injected at container startup — no rebuild needed. Restart the container after changes.

### Reverse Proxy

The container serves plain HTTP on port 3000. In production, put a reverse proxy in front with TLS.

**HTTPS is required** for PWA features (offline support, install prompt). Browsers exempt `localhost` but not remote hosts.

Caddy example:

```caddyfile
pottery.example.com {
    reverse_proxy pottery-log:3000
}
```

Nginx example:

```nginx
server {
    listen 443 ssl;
    server_name pottery.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://pottery-log:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Health Check

`GET /health` returns `200 OK`. Built-in Docker healthcheck polls every 30s.

### Updating

```sh
docker compose pull
docker compose up -d
```

### Building from Source

```sh
git clone https://github.com/bjornkpu/pottery-log.git
cd pottery-log
docker build -t pottery-log .
docker run -p 3000:3000 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_ANON_KEY=your-anon-key \
  pottery-log
```
