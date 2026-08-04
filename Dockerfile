# ---- Build ----
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG GIT_SHA=unknown
ENV GIT_SHA=$GIT_SHA

# Format and lint gate: biome ci never writes and fails on warnings, so a
# violation stops the image here rather than needing a second npm ci in CI
RUN npm run check:ci
RUN npm run build

# ---- Runtime ----
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/health || exit 1

# No ENTRYPOINT: the caddy image already runs
# caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
