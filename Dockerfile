# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL and Sharp dependencies
RUN apt-get update -y && \
    apt-get install -y openssl libssl-dev python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

# Accept build arguments
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_BASE_URL

# Set as environment variables for build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

# Install OpenSSL, Sharp dependencies, and curl for health check
RUN apt-get update -y && \
    apt-get install -y openssl libssl-dev python3 make g++ curl && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production && \
    npx prisma generate && \
    npm cache clean --force

# Install PM2 globally for cluster mode
RUN npm install pm2 -g

# Copy standalone server
COPY --from=builder /app/.next/standalone ./

# Copy static files for standalone
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy Prisma files
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy PM2 config
COPY ecosystem.config.js ./

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the app with PM2 cluster mode
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
