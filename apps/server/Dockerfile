# Base image with Bun
FROM oven/bun:latest AS base
WORKDIR /app

# Build stage
FROM base AS builder
WORKDIR /app

# Copy everything
COPY . .

# Install deps from bun.lock
RUN bun install --frozen-lockfile

# Build the project
RUN bun run build --filter=@scottystack/server...

# Final runtime image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN groupadd --system --gid 1001 server && \
    useradd --system --uid 1001 --gid 1001 server

# Copy Swagger spec
COPY --from=builder --chown=server:server \
  /app/apps/server/build/swagger.yaml \
  /app/apps/server/build/swagger.yaml

# Copy Swagger UI dist
# (which can be either in apps/node_modules or apps/server/node_modules)
# COPY --from=builder --chown=server:server \
#   /app/apps/node_modules/swagger-ui-dist \
#   /app/apps/node_modules/swagger-ui-dist
COPY --from=builder --chown=server:server \
  /app/apps/server/node_modules/swagger-ui-dist \
  /app/apps/server/node_modules/swagger-ui-dist

# Copy only what's needed to run the server
COPY --from=builder --chown=server:server \
  /app/apps/server/dist \
  /app/apps/server/dist

COPY --from=builder --chown=server:server \
  /app/apps/server/src/instrument.ts \
  /app/apps/server/src/instrument.ts

# Install Sentry
RUN bun install @sentry/bun

# Copy db folder and Drizzle config to enable migrations
COPY --from=builder --chown=server:server \
  /app/apps/server/drizzle \
  /app/apps/server/drizzle

COPY --from=builder --chown=server:server \
  /app/apps/server/drizzle.config.ts \
  /app/apps/server/drizzle.config.ts

USER server
EXPOSE 3000
WORKDIR /app/apps/server
CMD ["bun", "--preload", "./src/instrument.ts", "dist/server.js"]
