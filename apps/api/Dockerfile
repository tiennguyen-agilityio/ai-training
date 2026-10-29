ARG NODE_VERSION=24-alpine
ARG PORT=3000
ARG TURBO_VERSION=2.11.9

FROM node:${NODE_VERSION} AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
ENV TURBO_TELEMETRY_DISABLED=1
RUN apk upgrade --no-cache libssl3 libcrypto3 \
  && corepack enable

FROM base AS pruner
ARG TURBO_VERSION
COPY . .
RUN pnpm dlx turbo@${TURBO_VERSION} prune api --docker

FROM base AS deps
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS development
ARG PORT
COPY --from=pruner /app/out/full/ .
# deps installs with --ignore-scripts, so the shared packages' prepare builds never ran.
# "@repo/schemas..." builds it and what it depends on (@repo/constants), in order.
RUN pnpm --filter "@repo/schemas..." build
WORKDIR /app/apps/api
EXPOSE ${PORT}
CMD ["pnpm", "run", "start:dev"]

FROM deps AS build
COPY --from=pruner /app/out/full/ .
RUN pnpm exec turbo run build --filter=api

FROM base AS production
ARG PORT
ENV NODE_ENV=production
COPY --from=pruner /app/out/json/ .
# Also install the runtime dependencies of the workspace packages api imports
# (zod and @repo/constants for @repo/schemas). Not "api...": that also selects
# api's dev-only workspace packages (@repo/eslint-config, ...) and ships their
# dependencies (eslint and friends) in the image.
RUN pnpm --filter api --filter @repo/schemas --filter @repo/constants \
  install --frozen-lockfile --prod --ignore-scripts \
  && rm -rf /root/.cache /pnpm/store /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/constants/dist ./packages/constants/dist
COPY --from=build /app/packages/schemas/dist ./packages/schemas/dist
WORKDIR /app/apps/api
USER node
EXPOSE ${PORT}
CMD ["node", "dist/main"]
