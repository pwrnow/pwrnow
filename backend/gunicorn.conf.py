import multiprocessing

# Performance settings
bind = "0.0.0.0:5000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "gthread"
threads = 4
worker_connections = 1000

# Prevent memory leaks
max_requests = 1000
max_requests_jitter = 100
preload_app = True

# Timeout settings
timeout = 60
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"