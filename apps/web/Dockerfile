FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.5.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --frozen-lockfile

COPY . .

WORKDIR /app/apps/web

EXPOSE 3004

CMD ["pnpm", "dev"]
