# ===================== base =====================
FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# ===================== dev ======================
# Uso: target=dev  -> hot-reload com volumes + npm run dev
FROM base AS dev
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci

EXPOSE 3000
# Em dev, o código vem via bind mount; este CMD serve fora do compose também
CMD ["npm", "run", "dev"]

# ===================== deps =====================
# Deps completas (inclui dev) para compilar/transpilar a aplicação
FROM base AS deps
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci

# ===================== prod-deps =================
# Apenas dependências de produção (reduz o tamanho da imagem final)
FROM base AS prod-deps
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev

# ===================== build ====================
# Transpila o Next.js (gera /.next)
FROM base AS build
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules

COPY . .

# Allow Node to use up to 6GB of heap for V8 during build
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# ===================== prod =====================
# Runner final minimalista
FROM base AS prod
WORKDIR /app
ENV NODE_ENV=production
# Copia apenas o necessário para rodar
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.mjs ./next.config.mjs
EXPOSE 3000
CMD ["npm", "start"]
