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

# Generate artifacts
RUN bun run generate

# Build the project
RUN bun run build --filter=@scottystack/web...

################################################################################
# Aplication Stage
# Reference: https://docs.railway.com/guides/react#use-a-dockerfile
################################################################################

# Use the Caddy image
FROM caddy

# Create and change to the app directory.
WORKDIR /app

# Copy Caddyfile to the container image.
COPY Caddyfile ./

# Copy local code to the container image.
RUN caddy fmt Caddyfile --overwrite

# Copy files to the container image.
COPY --from=build /apps/web/dist ./dist

# Use Caddy to run/serve the app
CMD ["caddy", "run", "--config", "Caddyfile", "--adapter", "caddyfile"]
