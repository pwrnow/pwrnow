#!/bin/sh

echo "Starting Node Exporter..."

# Check if required host directories are mounted
if [ ! -d "/host/proc" ]; then
    echo "WARNING: /host/proc not mounted. Node Exporter needs host /proc mounted to /host/proc"
fi

if [ ! -d "/host/sys" ]; then
    echo "WARNING: /host/sys not mounted. Node Exporter needs host /sys mounted to /host/sys"
fi

if [ ! -d "/rootfs" ]; then
    echo "WARNING: /rootfs not mounted. Node Exporter needs host / mounted to /rootfs"
fi

# Start Node Exporter with or without host paths depending on what's available
if [ -d "/host/proc" ] && [ -d "/host/sys" ] && [ -d "/rootfs" ]; then
    echo "All host directories found, starting with full metrics collection..."
    exec /bin/node_exporter \
        --path.procfs=/host/proc \
        --path.rootfs=/rootfs \
        --path.sysfs=/host/sys \
        --collector.filesystem.mount-points-exclude="^/(sys|proc|dev|host|etc)($$|/)"
else
    echo "Host directories not fully mounted, starting with limited metrics collection..."
    exec /bin/node_exporter
fi