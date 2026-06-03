# Multi-stage build: build the static Astro site, then serve it with a tiny
# internal Caddy file_server. The front Caddy (cyment-infra) reverse-proxies to
# this container's :80. All site config is baked in at build time via args.

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

# Build-time configuration (inlined into the static output by Astro/Vite).
ARG SITE_URL=https://xcsteward.com
ARG PUBLIC_ANALYTICS_PROVIDER=
ARG PUBLIC_PLAUSIBLE_DOMAIN=
ARG PUBLIC_PLAUSIBLE_SRC=
ARG PUBLIC_UMAMI_WEBSITE_ID=
ARG PUBLIC_UMAMI_SRC=
ARG PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=
ARG PUBLIC_GOOGLE_SITE_VERIFICATION=
ENV SITE_URL=$SITE_URL \
    PUBLIC_ANALYTICS_PROVIDER=$PUBLIC_ANALYTICS_PROVIDER \
    PUBLIC_PLAUSIBLE_DOMAIN=$PUBLIC_PLAUSIBLE_DOMAIN \
    PUBLIC_PLAUSIBLE_SRC=$PUBLIC_PLAUSIBLE_SRC \
    PUBLIC_UMAMI_WEBSITE_ID=$PUBLIC_UMAMI_WEBSITE_ID \
    PUBLIC_UMAMI_SRC=$PUBLIC_UMAMI_SRC \
    PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=$PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN \
    PUBLIC_GOOGLE_SITE_VERIFICATION=$PUBLIC_GOOGLE_SITE_VERIFICATION

# Enable the pinned pnpm via corepack and install with the committed lockfile.
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- serve ----
FROM caddy:2.11-alpine AS runtime
# Minimal static config: serve the built site, compress, real 404 for misses.
RUN printf ':80 {\n\troot * /srv\n\tencode gzip zstd\n\tfile_server\n}\n' \
    > /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80
