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

# Generate OpenAPI spec
RUN cd apps/server && bun run tsoa && bun run openapi

# Build the project
RUN bun run build --filter=@scottystack/server...

# Final runtime image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN groupadd --system --gid 1001 server && \
    useradd --system --uid 1001 --gid 1001 server
USER server

# Copy swagger UI
COPY --from=builder --chown=server:server /app/apps/server/build/swagger.yaml ./build/swagger.yaml

# Copy only what's needed to run the server
COPY --from=builder --chown=server:server /app/apps/server/dist ./apps/server/dist

EXPOSE 3000
CMD ["bun", "apps/server/dist/server.js"]
