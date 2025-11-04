#!/bin/bash

# Setup cron job for scheduled posts
# Run this script on your VPS to configure the cron job

set -e

echo "Setting up cron job for scheduled posts..."

# Read CRON_SECRET from .env file
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    exit 1
fi

CRON_SECRET=$(grep CRON_SECRET .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")

if [ -z "$CRON_SECRET" ]; then
    echo "Error: CRON_SECRET not found in .env"
    exit 1
fi

# Create cron script
cat > /tmp/publish-scheduled-cron.sh << 'EOF'
#!/bin/bash
curl -X GET "https://leakybabes.net/api/cron/publish-scheduled" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  >> /var/log/leakynew-cron.log 2>&1
EOF

# Replace CRON_SECRET placeholder
sed -i "s/\$CRON_SECRET/${CRON_SECRET}/" /tmp/publish-scheduled-cron.sh

# Make it executable
chmod +x /tmp/publish-scheduled-cron.sh

# Move to system location
sudo mv /tmp/publish-scheduled-cron.sh /usr/local/bin/publish-scheduled-cron.sh

# Create log file
sudo touch /var/log/leakynew-cron.log
sudo chmod 666 /var/log/leakynew-cron.log

# Add cron job (runs every 5 minutes)
CRON_JOB="*/5 * * * * /usr/local/bin/publish-scheduled-cron.sh"

# Check if cron job already exists
(crontab -l 2>/dev/null | grep -v "publish-scheduled-cron.sh"; echo "$CRON_JOB") | crontab -

echo "✓ Cron job installed successfully!"
echo "  - Runs every 5 minutes"
echo "  - Endpoint: https://leakybabes.net/api/cron/publish-scheduled"
echo "  - Logs: /var/log/leakynew-cron.log"
echo ""
echo "To view logs: tail -f /var/log/leakynew-cron.log"
echo "To list cron jobs: crontab -l"
echo "To remove cron job: crontab -e (then delete the line)"
