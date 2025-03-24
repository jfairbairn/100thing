#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.example to .env and update the values."
    exit 1
fi
source .env

# Configuration
DOMAIN="your-domain.com"  # Replace with your domain
EMAIL="your-email@example.com"  # Replace with your email for SSL notifications

# Create necessary directories
mkdir -p ssl static

# Get SSL certificates using Let's Encrypt
docker run --rm -it \
  -v "$(pwd)/ssl:/etc/letsencrypt" \
  -v "$(pwd)/static:/var/www/html" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/html \
  --email $EMAIL \
  --agree-tos \
  --no-eff-email \
  --domain $DOMAIN

# Replace domain in nginx.conf
sed -i '' "s/your-domain.com/$DOMAIN/g" nginx.conf

# Build and start the containers
docker compose -f docker-compose.prod.yml up -d --build

echo "Deployment complete! Your application should be available at https://$DOMAIN" 