FROM node:24-bookworm-slim AS base

WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json

FROM base AS build

RUN npm ci
COPY . .
RUN npm run build

FROM base AS runtime

ENV NODE_ENV=production

RUN npm ci --omit=dev
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/server/dist ./server/dist

EXPOSE 8787

CMD ["sh", "-lc", "node server/dist/db/migrate.js && node server/dist/index.js"]
