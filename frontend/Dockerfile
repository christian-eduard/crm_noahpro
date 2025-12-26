# ========================================
# NoahPro CRM - Frontend Dockerfile
# StormsBoys PaaS Standard (Multi-stage)
# ========================================

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build-time variable for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
