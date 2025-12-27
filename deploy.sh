#!/bin/bash

###############################################################################
# RISQUEMEGA.NET - SECURE DEPLOYMENT SCRIPT
# This script handles safe deployment with security checks and rollback
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
PROJECT_DIR="/var/www/risquemega"
BACKUP_DIR="/var/backups/risquemega"
MAX_BACKUPS=5
HEALTH_CHECK_TIMEOUT=60

###############################################################################
# Pre-deployment checks
###############################################################################

log_info "Starting deployment process..."

# Check if running from correct directory
if [ ! -f "docker-compose.yml" ]; then
    log_error "docker-compose.yml not found. Are you in the correct directory?"
    exit 1
fi

# Security check: Warn if running as root
if [ "$EUID" -eq 0 ]; then
    log_warning "Running as root. Consider using a non-root user with sudo."
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker first."
    exit 1
fi

###############################################################################
# Backup current state
###############################################################################

log_info "Creating backup..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Backup timestamp
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$BACKUP_TIMESTAMP"

# Export current container states
docker-compose ps > "$BACKUP_PATH.containers.txt" 2>&1 || true

# Backup .env file
if [ -f ".env" ]; then
    cp .env "$BACKUP_PATH.env"
    log_success "Environment variables backed up"
fi

# Clean up old backups (keep only last N backups)
cd "$BACKUP_DIR"
ls -t backup_*.env 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
ls -t backup_*.containers.txt 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
cd - > /dev/null

log_success "Backup created: $BACKUP_PATH"

###############################################################################
# Pull latest code
###############################################################################

log_info "Pulling latest code from repository..."

# Stash any local changes (except .env)
if git diff-index --quiet HEAD --; then
    log_info "No local changes to stash"
else
    log_warning "Stashing local changes..."
    git stash
fi

# Pull latest changes
if git pull origin main; then
    log_success "Code updated successfully"
else
    log_error "Failed to pull latest code"
    exit 1
fi

###############################################################################
# SSL Certificate Check
###############################################################################

log_info "Checking SSL certificates..."

if [ ! -f "nginx/ssl/certificate.crt" ] || [ ! -f "nginx/ssl/private.key" ]; then
    log_warning "SSL certificates not found in nginx/ssl/"

    # Check if they exist in root with different names
    if [ -f "Origin Certificate.txt" ] && [ -f "Private Key.txt" ]; then
        log_info "Copying SSL certificates from root directory..."
        mkdir -p nginx/ssl
        cp "Origin Certificate.txt" nginx/ssl/certificate.crt
        cp "Private Key.txt" nginx/ssl/private.key
        log_success "SSL certificates copied"
    else
        log_error "SSL certificates not found! Please add them before deployment."
        exit 1
    fi
else
    log_success "SSL certificates found"
fi

###############################################################################
# Environment configuration check
###############################################################################

log_info "Checking environment configuration..."

# Verify .env exists
if [ ! -f ".env" ]; then
    log_error ".env file not found!"
    log_info "Please create .env file with proper configuration"
    exit 1
fi

# Check for critical environment variables
REQUIRED_VARS=("DATABASE_URL" "DIRECT_URL" "NEXT_PUBLIC_BASE_URL")
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env; then
        log_error "Missing required environment variable: $var"
        exit 1
    fi
done

# Verify DATABASE_URL has connection pool settings
if ! grep -q "connection_limit" .env; then
    log_warning "DATABASE_URL missing connection_limit parameter"
    log_info "Add this to your DATABASE_URL: &connection_limit=30&pool_timeout=30&sslmode=require"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if ! grep -q "sslmode" .env; then
    log_warning "DATABASE_URL missing sslmode parameter (recommended: sslmode=require)"
fi

log_success "Environment configuration OK"

###############################################################################
# Stop current containers gracefully
###############################################################################

log_info "Stopping current containers..."

# Graceful shutdown with timeout
docker-compose down --timeout 30 || {
    log_warning "Graceful shutdown failed, forcing stop..."
    docker-compose down --timeout 5 || true
}

log_success "Containers stopped"

###############################################################################
# Clean up Docker resources
###############################################################################

log_info "Cleaning up old Docker resources..."

# Remove dangling images
docker image prune -f > /dev/null 2>&1 || true

# Remove unused volumes (be careful!)
# docker volume prune -f > /dev/null 2>&1 || true  # Commented for safety

# Remove build cache older than 24h
docker builder prune -f --filter "until=24h" > /dev/null 2>&1 || true

log_success "Docker cleanup completed"

###############################################################################
# Build new images
###############################################################################

log_info "Building new Docker images (this may take a few minutes)..."

# Build with no cache to ensure fresh build
if docker-compose build --no-cache app; then
    log_success "Docker images built successfully"
else
    log_error "Docker build failed!"
    log_info "Attempting to restore from backup..."
    docker-compose up -d
    exit 1
fi

###############################################################################
# Start containers
###############################################################################

log_info "Starting containers..."

# Start in detached mode
if docker-compose up -d; then
    log_success "Containers started"
else
    log_error "Failed to start containers"
    exit 1
fi

###############################################################################
# Health checks
###############################################################################

log_info "Running health checks..."

# Wait for app container to be healthy
log_info "Waiting for app container to become healthy (timeout: ${HEALTH_CHECK_TIMEOUT}s)..."

ELAPSED=0
INTERVAL=5

while [ $ELAPSED -lt $HEALTH_CHECK_TIMEOUT ]; do
    HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' leakynew-app 2>/dev/null || echo "none")

    if [ "$HEALTH_STATUS" = "healthy" ]; then
        log_success "App container is healthy"
        break
    elif [ "$HEALTH_STATUS" = "unhealthy" ]; then
        log_error "App container is unhealthy"
        log_info "Showing last 50 lines of logs:"
        docker logs leakynew-app --tail 50
        exit 1
    fi

    echo -n "."
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

echo ""  # New line after dots

if [ $ELAPSED -ge $HEALTH_CHECK_TIMEOUT ]; then
    log_warning "Health check timeout reached"
    log_info "Container may still be starting up. Check logs manually."
fi

# Test database connectivity
log_info "Testing database connection..."
if docker exec leakynew-app node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('Database connection successful'); process.exit(0); }).catch(e => { console.error('Database connection failed:', e.message); process.exit(1); });" 2>&1; then
    log_success "Database connection verified"
else
    log_error "Database connection failed"
    log_warning "Check your DATABASE_URL in .env"
fi

# Test HTTP endpoints
log_info "Testing HTTP endpoints..."
sleep 5  # Give nginx time to start

# Test localhost:3000 (app)
if curl -f -s http://localhost:3000 > /dev/null 2>&1; then
    log_success "App responding on port 3000"
else
    log_warning "App not responding on port 3000"
fi

# Test localhost:80 (nginx)
if curl -f -s http://localhost:80 > /dev/null 2>&1; then
    log_success "Nginx responding on port 80"
else
    log_warning "Nginx not responding on port 80"
fi

###############################################################################
# Security checks
###############################################################################

log_info "Running security checks..."

# Check for high CPU usage (possible cryptominer)
APP_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" leakynew-app | sed 's/%//')
APP_CPU_INT=${APP_CPU%.*}

if [ "$APP_CPU_INT" -gt 200 ]; then
    log_error "SECURITY ALERT: Abnormally high CPU usage: ${APP_CPU}%"
    log_warning "Possible cryptominer infection detected!"
    log_info "Check running processes: docker exec leakynew-app ps aux"
else
    log_success "CPU usage normal: ${APP_CPU}%"
fi

# Check for high memory usage
APP_MEM=$(docker stats --no-stream --format "{{.MemPerc}}" leakynew-app | sed 's/%//')
APP_MEM_INT=${APP_MEM%.*}

if [ "$APP_MEM_INT" -gt 80 ]; then
    log_warning "High memory usage: ${APP_MEM}%"
else
    log_success "Memory usage normal: ${APP_MEM}%"
fi

# Check number of processes
APP_PIDS=$(docker stats --no-stream --format "{{.PIDs}}" leakynew-app)

if [ "$APP_PIDS" -gt 100 ]; then
    log_warning "High number of processes: $APP_PIDS"
    log_info "Normal range: 20-50 processes"
else
    log_success "Process count normal: $APP_PIDS"
fi

###############################################################################
# Display status
###############################################################################

echo ""
log_info "=== Deployment Summary ==="
echo ""

# Container status
docker-compose ps

echo ""
log_info "=== Resource Usage ==="
docker stats --no-stream

echo ""
log_info "=== Recent Logs ==="
docker logs leakynew-app --tail 20

echo ""
log_success "Deployment completed successfully!"
echo ""
log_info "Useful commands:"
echo "  - View logs:           docker logs -f leakynew-app"
echo "  - Check status:        docker-compose ps"
echo "  - Restart:             docker-compose restart"
echo "  - Stop:                docker-compose down"
echo "  - View metrics:        docker stats"
echo "  - Check security:      docker exec leakynew-app ps aux"
echo ""
log_info "Backup location: $BACKUP_PATH"
log_info "Monitor site at: https://risquemega.net"
echo ""

###############################################################################
# Setup Cron Jobs
###############################################################################

log_info "Setting up cron jobs..."

# Read CRON_SECRET from .env
CRON_SECRET=$(grep "^CRON_SECRET=" .env | cut -d '=' -f2)

if [ -z "$CRON_SECRET" ]; then
    log_warning "CRON_SECRET not found in .env - cron jobs will not be authenticated"
    CRON_SECRET="your-secret-here"
fi

# Cron job script path
CRON_SCRIPT_DIR="/var/www/risquemega/scripts"
CRON_SCRIPT="$CRON_SCRIPT_DIR/publish-scheduled.sh"

# Create scripts directory if it doesn't exist
mkdir -p "$CRON_SCRIPT_DIR"

# Create the cron job script
cat > "$CRON_SCRIPT" <<EOF
#!/bin/bash
# Auto-publish scheduled posts every 5 minutes
curl -s -X GET "http://localhost:3000/api/cron/publish-scheduled" \\
  -H "Authorization: Bearer $CRON_SECRET" \\
  >> /var/log/risquemega-cron.log 2>&1
EOF

# Make it executable
chmod +x "$CRON_SCRIPT"

# Check if cron job already exists
CRON_EXISTS=$(crontab -l 2>/dev/null | grep -F "publish-scheduled.sh" || echo "")

if [ -z "$CRON_EXISTS" ]; then
    # Add cron job (every 5 minutes)
    (crontab -l 2>/dev/null; echo "*/5 * * * * $CRON_SCRIPT") | crontab -
    log_success "Cron job added: Publish scheduled posts every 5 minutes"
else
    log_info "Cron job already exists (skipping)"
fi

# Create log file if it doesn't exist
touch /var/log/risquemega-cron.log
chmod 644 /var/log/risquemega-cron.log

log_success "Cron jobs configured"
log_info "View cron logs: tail -f /var/log/risquemega-cron.log"

###############################################################################
# Optional: Send notification
###############################################################################

# Uncomment and configure if you want deployment notifications
# curl -X POST "https://your-webhook-url" \
#   -H "Content-Type: application/json" \
#   -d "{\"text\":\"Deployment completed on $(hostname) at $(date)\"}"

exit 0
