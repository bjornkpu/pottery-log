#!/bin/sh
set -e

# Generate runtime config from environment variables
cat > /srv/config.js <<EOF
window.__CONFIG__ = {
  SUPABASE_URL: "${SUPABASE_URL:-}",
  SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY:-}"
};
EOF

# Start Caddy (exec replaces shell so Caddy is PID 1)
exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
