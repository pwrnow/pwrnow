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

## Required Volume Mounts

### Node Exporter

Node Exporter requires access to host system directories to collect metrics. Configure these volume mounts in your deployment platform:

**Required Volumes:**

-   **Host Path:** `/proc` → **Container Path:** `/host/proc` → **Read Only:** ✅
-   **Host Path:** `/sys` → **Container Path:** `/host/sys` → **Read Only:** ✅
-   **Host Path:** `/` → **Container Path:** `/rootfs` → **Read Only:** ✅

**In Coolify:**

1. Go to your Node Exporter service
2. Navigate to "Storages" or "Volumes" section
3. Add the three volume mounts listed above
4. Ensure "Read Only" is enabled for security

### cAdvisor

cAdvisor also requires host system access:

**Required Volumes:**

-   **Host Path:** `/` → **Container Path:** `/rootfs` → **Read Only:** ✅
-   **Host Path:** `/var/run` → **Container Path:** `/var/run` → **Read Write:** ✅
-   **Host Path:** `/sys` → **Container Path:** `/sys` → **Read Only:** ✅
-   **Host Path:** `/var/lib/docker/` → **Container Path:** `/var/lib/docker/` → **Read Only:** ✅
-   **Host Path:** `/dev/disk/` → **Container Path:** `/dev/disk/` → **Read Only:** ✅

**Additional Requirements:**

-   **Privileged Mode:** Enabled
-   **Device:** `/dev/kmsg` (if supported by platform)

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

## Troubleshooting

### Node Exporter Issues

**Error:** `panic: Couldn't create metrics handler: failed to open procfs: could not read "/host/proc": stat /host/proc: no such file or directory`

**Solution:** Ensure host volume mounts are properly configured. Node Exporter needs access to:

-   Host `/proc` filesystem mounted at `/host/proc`
-   Host `/sys` filesystem mounted at `/host/sys`
-   Host root filesystem mounted at `/rootfs`

**Fallback:** If you cannot configure host mounts, the Node Exporter will start in limited mode with container-only metrics.

### cAdvisor Issues

**Error:** Permission denied or cannot access Docker socket

**Solution:**

1. Enable privileged mode for cAdvisor container
2. Ensure Docker socket is mounted: `/var/run/docker.sock:/var/run/docker.sock`
3. Mount required host directories (see volume requirements above)

### Alertmanager Issues

**Error:** `chown: unknown user/group alertmanager:alertmanager` or `su: must be suid to work properly`

**Solution:** The alertmanager base image doesn't have the expected user setup. Update your `alertmanager/start.sh` to:

```bash
#!/bin/sh

echo "Starting Alertmanager setup..."

# Create the alertmanager config directory
mkdir -p /etc/alertmanager

echo "Substituting Discord webhook URL..."

# Substitute environment variables in the template
if [ -n "$DISCORD_WEBHOOK_URL" ]; then
    sed "s|\${DISCORD_WEBHOOK_URL}|$DISCORD_WEBHOOK_URL|g" /tmp/alertmanager.yml.template > /etc/alertmanager/alertmanager.yml
else
    echo "WARNING: DISCORD_WEBHOOK_URL not set, using placeholder"
    cp /tmp/alertmanager.yml.template /etc/alertmanager/alertmanager.yml
fi

echo "Configuration processed successfully"

# Start alertmanager directly (no user switching needed)
exec /bin/alertmanager \
    --config.file=/etc/alertmanager/alertmanager.yml \
    --storage.path=/alertmanager \
    --web.external-url=http://localhost:9093 \
    --web.route-prefix=/
```

**Alternative:** Remove user switching from all start scripts and run containers as root if security permits.

### Alertmanager Environment Variables

**Error:** Discord webhook not working

**Solution:** Ensure `DISCORD_WEBHOOK_URL` environment variable is set correctly in your deployment platform.

## Advantages

-   ✅ **No volume mount issues** - configs are baked into images
-   ✅ **Self-contained services** - each service handles its own setup
-   ✅ **Environment variable substitution** - handled in start scripts
-   ✅ **Coolify friendly** - each service can be deployed separately
-   ✅ **Easy debugging** - isolated build and startup processes
-   ✅ **Version controlled configs** - all configurations tracked in git
-   ✅ **Graceful fallbacks** - services handle missing mounts gracefully

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

## Deployment Notes

### Coolify Specific

-   Each service can be deployed as a separate application
-   Set environment variables in Coolify's environment section
-   Configure volume mounts in the "Storages" section
-   Enable privileged mode for cAdvisor if available

### Security Considerations

-   Node Exporter and cAdvisor require host access for full functionality
-   Always use read-only mounts where possible
-   Consider network policies to limit service communication
-   Regularly update base images for security patches

## Customization

To modify configurations:

1. Edit the config files in each service directory
2. Rebuild the Docker image
3. Restart the service

This approach eliminates complex volume mounting and makes the setup more portable and reliable.
