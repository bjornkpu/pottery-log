# Self-Hosting Pottery Log

Pottery Log is a static SPA served via Caddy. You provide your own Supabase backend.

## Quick Start

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

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Your Supabase project URL (e.g. `https://abc123.supabase.co`) |
| `SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous/public API key |

These are injected at container startup — no rebuild needed when changing values. Restart the container after changes.

## Reverse Proxy

The container serves plain HTTP on port 3000. In production, put a reverse proxy in front with TLS termination.

**HTTPS is required** for PWA features (offline support, install prompt). Browsers exempt `localhost` but not remote hosts.

Example Caddy reverse proxy:

```caddyfile
pottery.example.com {
    reverse_proxy pottery-log:3000
}
```

Example Nginx:

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

## Health Check

`GET /health` returns `200 OK`. Use this with load balancers or uptime monitors.

The Docker image includes a built-in healthcheck that polls this endpoint every 30 seconds.

## Updating

```sh
docker compose pull
docker compose up -d
```

## Building from Source

```sh
git clone https://github.com/bjornkpu/pottery-log.git
cd pottery-log
docker build -t pottery-log .
docker run -p 3000:3000 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_ANON_KEY=your-anon-key \
  pottery-log
```
