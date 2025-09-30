# マルチステージビルドでサイズを最小化
FROM node:20-alpine AS base

# 依存関係のインストール
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 依存関係ファイルをコピー
COPY package.json package-lock.json* ./
RUN npm ci

# ビルダーステージ
FROM base AS builder
WORKDIR /app
ARG NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ENV NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=$NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ARG NEXT_PUBLIC_MLIT_API_KEY
ENV NEXT_PUBLIC_MLIT_API_KEY=$NEXT_PUBLIC_MLIT_API_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.jsアプリをビルド
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ランナーステージ
FROM base AS runner
WORKDIR /app

ARG NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ENV NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=$NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ARG NEXT_PUBLIC_MLIT_API_KEY
ENV NEXT_PUBLIC_MLIT_API_KEY=$NEXT_PUBLIC_MLIT_API_KEY

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# 出力ファイルを自動的に活用してスタンドアロンにする
RUN mkdir .next
RUN chown nextjs:nodejs .next

# ビルド成果物を自動的にコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# server.jsはnext buildによって作成される
CMD ["node", "server.js"]
