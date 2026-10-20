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
RUN pnpm --filter api install --frozen-lockfile --prod --ignore-scripts \
  && rm -rf /root/.cache /pnpm/store /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
COPY --from=build /app/apps/api/dist ./apps/api/dist
WORKDIR /app/apps/api
USER node
EXPOSE ${PORT}
CMD ["node", "dist/main"]
