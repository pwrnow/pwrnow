traefik.enable=true
traefik.http.middlewares.gzip.compress=true
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
traefik.http.routers.http-0-jwok4gsooccg40gsgsc0o880.entryPoints=http
traefik.http.routers.http-0-jwok4gsooccg40gsgsc0o880.middlewares=redirect-to-https
traefik.http.routers.http-0-jwok4gsooccg40gsgsc0o880.rule=Host(`pwrnow.pl`) && (PathPrefix(`/api/v1/`) || PathPrefix(`/admin/`))
traefik.http.routers.http-0-jwok4gsooccg40gsgsc0o880.service=http-0-jwok4gsooccg40gsgsc0o880
traefik.http.routers.https-0-jwok4gsooccg40gsgsc0o880.entryPoints=https
traefik.http.routers.https-0-jwok4gsooccg40gsgsc0o880.middlewares=gzip
traefik.http.routers.https-0-jwok4gsooccg40gsgsc0o880.rule=Host(`pwrnow.pl`) && (PathPrefix(`/api/v1/`) || PathPrefix(`/admin/`))
traefik.http.routers.https-0-jwok4gsooccg40gsgsc0o880.service=https-0-jwok4gsooccg40gsgsc0o880
traefik.http.routers.https-0-jwok4gsooccg40gsgsc0o880.tls.certresolver=letsencrypt
traefik.http.routers.https-0-jwok4gsooccg40gsgsc0o880.tls=true
traefik.http.routers.https-0-jwok4gsooccg40gsgsc0o880.priority=200
traefik.http.services.http-0-jwok4gsooccg40gsgsc0o880.loadbalancer.server.port=5000
traefik.http.services.https-0-jwok4gsooccg40gsgsc0o880.loadbalancer.server.port=5000

modified backend?

traefik.enable=true
traefik.http.middlewares.gzip.compress=true
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
traefik.http.routers.http-0-jwok4gsooccg40gsgsc0o880.entryPoints=http
traefik.http.routers.http-0-jwok4gsooccg40gsgsc0o880.middlewares=redirect-to-https
traefik.http.routers.http-0-jwok4gsooccg40gsgsc0o880.rule=Host(`api.pwrnow.pl`) && PathPrefix(`/`)
traefik.http.routers.http-0-jwok4gsooccg40gsgsc0o880.service=http-0-jwok4gsooccg40gsgsc0o880
traefik.http.routers.https-0-jwok4gsooccg40gsgsc0o880.entryPoints=https
traefik.http.routers.https-0-jwok4gsooccg40gsgsc0o880.middlewares=gzip
traefik.http.routers.https-0-jwok4gsooccg40gsgsc0o880.rule=Host(`api.pwrnow.pl`) && PathPrefix(`/`)
traefik.http.routers.https-0-jwok4gsooccg40gsgsc0o880.service=https-0-jwok4gsooccg40gsgsc0o880
traefik.http.routers.https-0-jwok4gsooccg40gsgsc0o880.tls.certresolver=letsencrypt
traefik.http.routers.https-0-jwok4gsooccg40gsgsc0o880.tls=true
traefik.http.services.http-0-jwok4gsooccg40gsgsc0o880.loadbalancer.server.port=5000
traefik.http.services.https-0-jwok4gsooccg40gsgsc0o880.loadbalancer.server.port=5000
caddy_0.encode=zstd gzip
caddy_0.handle_path.0_reverse_proxy={{upstreams 5000}}
caddy_0.handle_path=/\*
caddy_0.header=-Server
caddy_0.try_files={path} /index.html /index.php
caddy_0=https://api.pwrnow.pl
caddy_ingress_network=coolify

probably backend?

traefik.enable=true
traefik.http.middlewares.gzip.compress=true
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
traefik.http.routers.http-0-y0w8ogwc04cws4wgkgooc8cw.entryPoints=http
traefik.http.routers.http-0-y0w8ogwc04cws4wgkgooc8cw.middlewares=redirect-to-https
traefik.http.routers.http-0-y0w8ogwc04cws4wgkgooc8cw.rule=Host(`pwrnow.pl`) && PathPrefix(`/`)
traefik.http.routers.http-0-y0w8ogwc04cws4wgkgooc8cw.service=http-0-y0w8ogwc04cws4wgkgooc8cw
traefik.http.routers.https-0-y0w8ogwc04cws4wgkgooc8cw.entryPoints=https
traefik.http.routers.https-0-y0w8ogwc04cws4wgkgooc8cw.middlewares=gzip
traefik.http.routers.https-0-y0w8ogwc04cws4wgkgooc8cw.rule=Host(`pwrnow.pl`) && PathPrefix(`/`)
traefik.http.routers.https-0-y0w8ogwc04cws4wgkgooc8cw.service=https-0-y0w8ogwc04cws4wgkgooc8cw
traefik.http.routers.https-0-y0w8ogwc04cws4wgkgooc8cw.tls.certresolver=letsencrypt
traefik.http.routers.https-0-y0w8ogwc04cws4wgkgooc8cw.tls=true
traefik.http.routers.https-0-y0w8ogwc04cws4wgkgooc8cw.priority=50
traefik.http.services.http-0-y0w8ogwc04cws4wgkgooc8cw.loadbalancer.server.port=3000
traefik.http.services.https-0-y0w8ogwc04cws4wgkgooc8cw.loadbalancer.server.port=3000

modified frontend?

traefik.enable=true
traefik.http.middlewares.gzip.compress=true
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
traefik.http.routers.http-0-y0w8ogwc04cws4wgkgooc8cw.entryPoints=http
traefik.http.routers.http-0-y0w8ogwc04cws4wgkgooc8cw.middlewares=redirect-to-https
traefik.http.routers.http-0-y0w8ogwc04cws4wgkgooc8cw.rule=Host(`pwrnow.pl`) && PathPrefix(`/`)
traefik.http.routers.http-0-y0w8ogwc04cws4wgkgooc8cw.service=http-0-y0w8ogwc04cws4wgkgooc8cw
traefik.http.routers.https-0-y0w8ogwc04cws4wgkgooc8cw.entryPoints=https
traefik.http.routers.https-0-y0w8ogwc04cws4wgkgooc8cw.middlewares=gzip
traefik.http.routers.https-0-y0w8ogwc04cws4wgkgooc8cw.rule=Host(`pwrnow.pl`) && PathPrefix(`/`)
traefik.http.routers.https-0-y0w8ogwc04cws4wgkgooc8cw.service=https-0-y0w8ogwc04cws4wgkgooc8cw
traefik.http.routers.https-0-y0w8ogwc04cws4wgkgooc8cw.tls.certresolver=letsencrypt
traefik.http.routers.https-0-y0w8ogwc04cws4wgkgooc8cw.tls=true
traefik.http.services.http-0-y0w8ogwc04cws4wgkgooc8cw.loadbalancer.server.port=3000
traefik.http.services.https-0-y0w8ogwc04cws4wgkgooc8cw.loadbalancer.server.port=3000
caddy_0.encode=zstd gzip
caddy_0.handle_path.0_reverse_proxy={{upstreams 3000}}
caddy_0.handle_path=/\*
caddy_0.header=-Server
caddy_0.try_files={path} /index.html /index.php
caddy_0=https://pwrnow.pl
caddy_ingress_network=coolify

frontend?

traefik.enable=true
traefik.http.middlewares.gzip.compress=true
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
traefik.http.routers.http-0-kckk040o8gsoso8ggcskk4oo.entryPoints=http
traefik.http.routers.http-0-kckk040o8gsoso8ggcskk4oo.middlewares=redirect-to-https
traefik.http.routers.http-0-kckk040o8gsoso8ggcskk4oo.rule=Host(`kckk040o8gsoso8ggcskk4oo.pwrnow.pl`) && PathPrefix(`/`)
traefik.http.routers.http-0-kckk040o8gsoso8ggcskk4oo.service=http-0-kckk040o8gsoso8ggcskk4oo
traefik.http.routers.https-0-kckk040o8gsoso8ggcskk4oo.entryPoints=https
traefik.http.routers.https-0-kckk040o8gsoso8ggcskk4oo.middlewares=gzip
traefik.http.routers.https-0-kckk040o8gsoso8ggcskk4oo.rule=Host(`kckk040o8gsoso8ggcskk4oo.pwrnow.pl`) && PathPrefix(`/`)
traefik.http.routers.https-0-kckk040o8gsoso8ggcskk4oo.service=https-0-kckk040o8gsoso8ggcskk4oo
traefik.http.routers.https-0-kckk040o8gsoso8ggcskk4oo.tls.certresolver=letsencrypt
traefik.http.routers.https-0-kckk040o8gsoso8ggcskk4oo.tls=true
traefik.http.services.http-0-kckk040o8gsoso8ggcskk4oo.loadbalancer.server.port=3000
traefik.http.services.https-0-kckk040o8gsoso8ggcskk4oo.loadbalancer.server.port=3000
caddy_0.encode=zstd gzip
caddy_0.handle_path.0_reverse_proxy={{upstreams 3000}}
caddy_0.handle_path=/\*
caddy_0.header=-Server
caddy_0.try_files={path} /index.html /index.php
caddy_0=https://kckk040o8gsoso8ggcskk4oo.pwrnow.pl
caddy_ingress_network=coolify

modified nginx?

traefik.enable=true
traefik.http.middlewares.gzip.compress=true
traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
traefik.http.routers.http-0-kckk040o8gsoso8ggcskk4oo.entryPoints=http
traefik.http.routers.http-0-kckk040o8gsoso8ggcskk4oo.middlewares=redirect-to-https
traefik.http.routers.http-0-kckk040o8gsoso8ggcskk4oo.rule=Host(`kckk040o8gsoso8ggcskk4oo.pwrnow.pl`) && PathPrefix(`/`)
traefik.http.routers.http-0-kckk040o8gsoso8ggcskk4oo.service=http-0-kckk040o8gsoso8ggcskk4oo
traefik.http.routers.https-0-kckk040o8gsoso8ggcskk4oo.entryPoints=https
traefik.http.routers.https-0-kckk040o8gsoso8ggcskk4oo.middlewares=gzip
traefik.http.routers.https-0-kckk040o8gsoso8ggcskk4oo.rule=Host(`kckk040o8gsoso8ggcskk4oo.pwrnow.pl`) && PathPrefix(`/`)
traefik.http.routers.https-0-kckk040o8gsoso8ggcskk4oo.service=https-0-kckk040o8gsoso8ggcskk4oo
traefik.http.routers.https-0-kckk040o8gsoso8ggcskk4oo.tls.certresolver=letsencrypt
traefik.http.routers.https-0-kckk040o8gsoso8ggcskk4oo.tls=true
traefik.http.services.http-0-kckk040o8gsoso8ggcskk4oo.loadbalancer.server.port=3000
traefik.http.services.https-0-kckk040o8gsoso8ggcskk4oo.loadbalancer.server.port=3000
caddy_0.encode=zstd gzip
caddy_0.handle_path.0_reverse_proxy={{upstreams 3000}}
caddy_0.handle_path=/\*
caddy_0.header=-Server
caddy_0.try_files={path} /index.html /index.php
caddy_0=https://kckk040o8gsoso8ggcskk4oo.pwrnow.pl
caddy_ingress_network=coolify

nginx
