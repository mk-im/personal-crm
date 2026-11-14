FROM node:24-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@12.11.2 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time placeholders so the DB and sign-in modules can import. Runtime overrides them.
ENV DATABASE_URL=postgres://build:build@127.0.0.1:5432/build
ENV BETTER_AUTH_URL=http://127.0.0.1:3000
ENV BETTER_AUTH_SECRET=build-only-placeholder-not-a-real-secret-0123456789
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY hide-software-headers.mjs ./hide-software-headers.mjs

EXPOSE 3000
CMD ["node", "--import", "./hide-software-headers.mjs", "server.js"]
