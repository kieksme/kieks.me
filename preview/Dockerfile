FROM node:24.22.1-bookworm-slim@sha256:be8204d4bd327363357f532187b752ff62759c31bedf98e9e18fc08c9cbd605c AS build
WORKDIR /app
ENV ASTRO_TELEMETRY_DISABLED=1 SHARP_IGNORE_GLOBAL_LIBVIPS=1
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/* && npm install --global pnpm@9.15.4
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY preview/package.json preview/pnpm-lock.yaml preview/pnpm-workspace.yaml ./preview/
RUN pnpm --dir preview install --frozen-lockfile
COPY . .
RUN pnpm --dir preview build
# Whole-site Pop-Art preview: built without any CMS/preview credentials, served only behind signed requests.
RUN node preview/scripts/build-site.mjs

FROM node:24.22.1-bookworm-slim@sha256:be8204d4bd327363357f532187b752ff62759c31bedf98e9e18fc08c9cbd605c AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4330 ASTRO_TELEMETRY_DISABLED=1
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/preview/package.json ./preview/package.json
COPY --from=build --chown=node:node /app/preview/node_modules ./preview/node_modules
COPY --from=build --chown=node:node /app/preview/dist ./preview/dist
COPY --from=build --chown=node:node /app/preview/site-dist ./preview/site-dist
USER node
EXPOSE 4330
# Internal liveness verifies that the shared preview secret is configured.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD curl --fail --silent http://127.0.0.1:4330/health > /dev/null || exit 1
CMD ["node", "preview/dist/server/entry.mjs"]
