# Monitoring Stack with Individual Dockerfiles

This setup uses individual Dockerfiles and start.sh scripts for each monitoring component, making it easier to deploy and manage in environments like Coolify.

## Structure

```
monitoring/
├── prometheus/
│   ├── Dockerfile
│   ├── start.sh
│   ├── prometheus.yml
│   └── alert_rules.yml
├── alertmanager/
│   ├── Dockerfile
│   ├── start.sh
│   └── alertmanager.yml.template
├── grafana/
│   ├── Dockerfile
│   ├── start.sh
│   └── provisioning/
├── node-exporter/
│   ├── Dockerfile
│   └── start.sh
├── cadvisor/
│   ├── Dockerfile
│   └── start.sh
├── docker-compose.build.yml
└── README-build.md
```

## Usage

### Option 1: Use the build-based Docker Compose

```bash
docker-compose -f docker-compose.build.yml up -d
```

### Option 2: Deploy individually in Coolify

Each service directory can be deployed as a separate service in Coolify:

1. **Prometheus**: Deploy from `./prometheus/` directory
2. **Alertmanager**: Deploy from `./alertmanager/` directory
3. **Grafana**: Deploy from `./grafana/` directory
4. **Node Exporter**: Deploy from `./node-exporter/` directory
5. **cAdvisor**: Deploy from `./cadvisor/` directory
6. **PostgreSQL**: Use standard PostgreSQL image

## Environment Variables

Create a `.env` file with:

```bash
# Discord webhook for alerts
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN

# Database credentials
USER_POSTGRES=grafana
PASSWORD_POSTGRES=secure_password_123
POSTGRES_DB=grafana

# Grafana admin password
PASSWORD_GRAFANA=admin_password_123
```

## Advantages

-   ✅ **No volume mount issues** - configs are baked into images
-   ✅ **Self-contained services** - each service handles its own setup
-   ✅ **Environment variable substitution** - handled in start scripts
-   ✅ **Coolify friendly** - each service can be deployed separately
-   ✅ **Easy debugging** - isolated build and startup processes
-   ✅ **Version controlled configs** - all configurations tracked in git

## Service URLs (when using ports)

-   Prometheus: http://localhost:9090
-   Alertmanager: http://localhost:9093
-   Grafana: http://localhost:3000
-   Node Exporter: http://localhost:9100
-   cAdvisor: http://localhost:8080

## Building Individual Services

```bash
# Build Prometheus
docker build -t my-prometheus ./prometheus

# Build Alertmanager
docker build -t my-alertmanager ./alertmanager

# Build Grafana
docker build -t my-grafana ./grafana

# Build Node Exporter
docker build -t my-node-exporter ./node-exporter

# Build cAdvisor
docker build -t my-cadvisor ./cadvisor
```

## Customization

To modify configurations:

1. Edit the config files in each service directory
2. Rebuild the Docker image
3. Restart the service

This approach eliminates complex volume mounting and makes the setup more portable and reliable.
