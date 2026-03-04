# ===================== base =====================
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Dependências úteis para libs nativas (ex.: bcrypt, sharp etc.) em ambientes de build
RUN apk add --no-cache python3 make g++ libc6-compat

RUN npm i -g @nestjs/cli

# ===================== dev ======================
# Uso: target=dev  -> hot-reload com volumes + npm run start:dev
FROM base AS dev
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
EXPOSE 3001
# Em dev, o código vem via bind mount; este CMD serve fora do compose também
CMD ["npm", "run", "start:dev"]

# ===================== deps =====================
# Deps completas (inclui dev) para compilar/transpilar a aplicação
FROM base AS deps
COPY package*.json ./
RUN npm ci

# ===================== build ====================
# Transpila o Nest (gera /dist)
FROM base AS build
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Se você usa "npm run build" que chama nest build
RUN npm run build

# ===================== prod-deps =================
# Apenas dependências de produção (reduz o tamanho da imagem final)
FROM base AS prod-deps
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev

# ===================== prod =====================
# Runner final minimalista
FROM base AS prod
WORKDIR /app
ENV NODE_ENV=production
# Copia apenas o necessário para rodar
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# (Opcional) Se sua app lê arquivos estáticos (ex.: schemas, i18n), copie-os aqui.
# COPY --from=build /app/path/to/assets ./dist/path/to/assets
EXPOSE 8080
CMD ["node", "dist/main.js"]

# ===================== migrate (opcional) ========
# Imagem que só executa migrations e sai (útil em CI/CD ou serviço one-shot no compose)
FROM prod AS migrate
CMD ["npm", "run", "typeorm:migration:run"]
