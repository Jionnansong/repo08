# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy frontend packages
COPY repo/frontend/package*.json ./

# Install dependencies with lockfile consistency and speed
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci

# Copy frontend source and build
COPY repo/frontend/ .
RUN npm run build

# Stage 2: Prepare Backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

# Copy backend packages
COPY repo/backend/package*.json ./

# Install backend dependencies (excluding devDependencies to shrink image)
RUN npm config set registry https://registry.npmmirror.com
RUN npm ci --omit=dev

# We still need devDependencies temporarily for prisma client generation
RUN npm install -D prisma@5 --registry=https://registry.npmmirror.com

# Copy backend source
COPY repo/backend/ .

# Run prisma generation
RUN npx prisma generate

# Stage 3: Production Image
FROM node:20-alpine
WORKDIR /app

# Install openssl for Prisma Client to run correctly in Alpine
RUN apk add --no-cache openssl

# Copy built frontend static files
COPY --from=frontend-builder /app/frontend/dist /app/repo/frontend/dist

# Copy prepared backend files
COPY --from=backend-builder /app/backend /app/repo/backend

# Set up repo
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Set running directory to app root
WORKDIR /app

# Initialize SQLite database on container start and launch the server
CMD ["sh", "-c", "cd repo/backend && npx prisma db push && npm start"]
