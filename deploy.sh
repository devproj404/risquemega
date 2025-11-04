#!/bin/bash

# Deployment script for VPS
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found!${NC}"
    echo "Please create .env file with production variables"
    exit 1
fi

# Check if SSL certificates exist
if [ ! -f nginx/ssl/certificate.crt ] || [ ! -f nginx/ssl/private.key ]; then
    echo -e "${YELLOW}Warning: SSL certificates not found!${NC}"
    echo "Copying SSL certificates..."
    mkdir -p nginx/ssl
    cp "Origin Certificate.txt" nginx/ssl/certificate.crt
    cp "Private Key.txt" nginx/ssl/private.key
fi

echo -e "${GREEN}✓${NC} Pre-deployment checks passed"

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start containers
echo "🏗️  Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting containers..."
docker-compose up -d

# Wait for containers to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓${NC} Deployment successful!"
    echo ""
    echo "📊 Container status:"
    docker-compose ps
    echo ""
    echo "📝 View logs with: docker-compose logs -f"
else
    echo -e "${YELLOW}⚠️  Some containers may not be running properly${NC}"
    docker-compose ps
    echo ""
    echo "Check logs with: docker-compose logs"
    exit 1
fi
