# Deployment Guide

This guide explains how to deploy the 100thing application to production using Docker and Nginx.

## Prerequisites

- Docker and Docker Compose installed on your server
- A domain name pointing to your server's IP address
- Ports 80 and 443 open on your server's firewall
- Git installed on your server

## Server Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/100thing.git
cd 100thing
```

2. Set up the production environment:
```bash
cd deploy/production
cp .env.example .env
```

3. Edit the `.env` file with your production values:
```bash
# Database
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=100thing

# Application
NODE_ENV=production
DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}

# Domain and SSL
DOMAIN=your-domain.com
EMAIL=your-email@example.com
```

## Deployment

1. Make the deployment script executable:
```bash
chmod +x deploy.sh
```

2. Run the deployment script:
```bash
./deploy.sh
```

This script will:
- Create necessary directories for SSL certificates and static files
- Obtain SSL certificates from Let's Encrypt
- Build and start the Docker containers

## Architecture

The production setup consists of three main services:

1. **Nginx (Reverse Proxy)**
   - Handles SSL termination
   - Serves static files
   - Routes API requests to the application
   - Provides security headers and optimizations

2. **Application (SvelteKit)**
   - Runs the main application
   - Handles API requests
   - Connects to the database

3. **PostgreSQL Database**
   - Stores application data
   - Runs in an isolated container
   - Data persists in a Docker volume

## Maintenance

### Updating the Application

To update the application with new code:

```bash
cd deploy/production
docker compose -f docker-compose.prod.yml up -d --build
```

### Viewing Logs

To view application logs:
```bash
docker compose -f docker-compose.prod.yml logs -f
```

To view logs for a specific service:
```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f db
docker compose -f docker-compose.prod.yml logs -f nginx
```

### SSL Certificate Renewal

Let's Encrypt certificates are valid for 90 days. To renew them:

```bash
docker run --rm -v "$(pwd)/ssl:/etc/letsencrypt" certbot/certbot renew
```

Set up automatic renewal with a cron job:
```bash
0 0 1 * * docker run --rm -v /path/to/ssl:/etc/letsencrypt certbot/certbot renew
```

### Database Backups

To backup the database:
```bash
docker compose -f docker-compose.prod.yml exec db pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup.sql
```

To restore from a backup:
```bash
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U $POSTGRES_USER $POSTGRES_DB
```

## Security Considerations

1. **Environment Variables**
   - Never commit the `.env` file to version control
   - Use strong, unique passwords for the database
   - Consider using a secrets management service in production

2. **SSL/TLS**
   - SSL certificates are automatically managed by Let's Encrypt
   - HTTPS is enforced for all traffic
   - Modern SSL configuration with strong ciphers

3. **Network Security**
   - Database is not exposed to the host network
   - Services communicate over an isolated Docker network
   - Only necessary ports (80, 443) are exposed to the internet

4. **Container Security**
   - All containers run with read-only mounts where possible
   - Regular security updates through Docker image updates
   - Health checks ensure service availability

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**
   - Ensure your domain's DNS is correctly configured
   - Check that ports 80 and 443 are open
   - Verify the email address in `.env` is correct

2. **Database Connection Issues**
   - Verify database credentials in `.env`
   - Check database container logs
   - Ensure database volume has proper permissions

3. **Application Issues**
   - Check application logs for errors
   - Verify environment variables are set correctly
   - Ensure all dependencies are installed

### Useful Commands

```bash
# Restart all services
docker compose -f docker-compose.prod.yml restart

# Stop all services
docker compose -f docker-compose.prod.yml down

# View container status
docker compose -f docker-compose.prod.yml ps

# Access container shell
docker compose -f docker-compose.prod.yml exec app sh
docker compose -f docker-compose.prod.yml exec db psql -U $POSTGRES_USER
```

## Monitoring

The setup includes health checks for all services. You can monitor the application's health at:
- Application: `https://your-domain.com/api/health`
- Database: Monitored internally by Docker

Consider setting up additional monitoring:
- Application performance monitoring (e.g., New Relic, Datadog)
- Error tracking (e.g., Sentry)
- Server monitoring (e.g., Prometheus, Grafana)

## Backup and Recovery

1. **Regular Backups**
   - Database backups (as described above)
   - SSL certificates (in `ssl/` directory)
   - Environment configuration (`.env` file)

2. **Recovery Process**
   - Restore database from backup
   - Restore SSL certificates
   - Restore environment configuration
   - Rebuild and restart containers

## Scaling

The current setup is suitable for small to medium workloads. For larger scale:

1. **Database**
   - Consider using a managed database service
   - Implement database replication
   - Set up read replicas

2. **Application**
   - Use a load balancer
   - Scale application containers horizontally
   - Implement caching

3. **Infrastructure**
   - Use container orchestration (e.g., Kubernetes)
   - Implement auto-scaling
   - Use managed services where possible 