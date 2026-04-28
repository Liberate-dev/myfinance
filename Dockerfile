# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use install for flexibility)
RUN npm install

# Copy source
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy package files and install production deps only
COPY package*.json ./
RUN npm install --omit=dev

# Copy built frontend and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Expose port
EXPOSE 3001

# Start server
CMD ["npx", "tsx", "server/index.ts"]
