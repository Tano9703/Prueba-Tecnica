FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.5.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN pnpm install --frozen-lockfile

COPY . .

WORKDIR /app/apps/api

EXPOSE 3002

CMD ["sh", "-c", "pnpm prisma:generate && pnpm prisma:deploy && pnpm prisma:seed && pnpm dev"]
