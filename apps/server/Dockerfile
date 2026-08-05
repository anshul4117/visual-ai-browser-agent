# Multi-stage Dockerfile for @visual-ai/server in Monorepo

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo files
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils
COPY apps/server ./apps/server

# Install dependencies and build shared packages + server
RUN npm ci
RUN npm run build --workspace=@visual-ai/shared-types
RUN npm run build --workspace=@visual-ai/shared-utils
RUN npm run build --workspace=@visual-ai/server

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy root monorepo structure & built packages
COPY package.json package-lock.json ./
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-utils/package.json ./packages/shared-utils/
COPY --from=builder /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=builder /app/apps/server/package.json ./apps/server/
COPY --from=builder /app/apps/server/dist ./apps/server/dist

# Install production dependencies only
RUN npm ci --omit=dev

EXPOSE 3000

CMD ["node", "apps/server/dist/index.js"]
