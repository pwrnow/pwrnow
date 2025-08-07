#!/bin/sh

echo "Starting Node Exporter..."

# Start Node Exporter with host system monitoring
exec /bin/node_exporter \
    --path.procfs=/host/proc \
    --path.rootfs=/rootfs \
    --path.sysfs=/host/sys \
    --collector.filesystem.mount-points-exclude='^/(sys|proc|dev|host|etc)($$|/)'
