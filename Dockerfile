FROM node:20-alpine AS base

# 安装 pnpm + sharp 所需的 libvips
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache vips-dev fftw-dev build-base

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 运行时仅需 vips（不需要 -dev 包）
RUN apk add --no-cache vips fftw

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# standalone 输出已包含 @prisma/client + 引擎
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# 入口脚本需要 prisma CLI 执行 migrate + seed，seed 需要 tsx
RUN npm install -g prisma@6 tsx

# 确保数据目录存在且 nextjs 用户可写
RUN mkdir -p /data && chown nextjs:nodejs /data && chmod 775 /data

# 入口脚本处理 DB 迁移 + seed
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
