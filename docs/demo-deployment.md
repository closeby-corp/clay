# Demo deployment on Pi

The demo runs at https://clay.close-by.org/ on Pi as the `bad-ui-demo` systemd service. It runs Bun as the `pi` user from `/home/pi/bad-ui-demo` on port 4000. The existing Flock Cloudflare tunnel forwards `clay.close-by.org` to `http://localhost:4000`; the Cloudflare DNS record is a proxied CNAME to that tunnel.

## Update the demo

From the repository root on a machine with SSH access to the `pi` host, copy the working tree and rebuild on Pi:

```sh
tar --exclude-vcs --exclude=node_modules --exclude=dist-pack \
  --exclude=.env --exclude='.env.*' --exclude=.badui-user-data \
  --exclude=.clay-user-data --exclude=.clay --exclude=.tmp \
  -czf /tmp/clay-demo-deploy.tgz .
scp /tmp/clay-demo-deploy.tgz pi:/tmp/clay-demo-deploy.tgz
ssh pi 'tar -xzf /tmp/clay-demo-deploy.tgz -C ~/bad-ui-demo && \
  cd ~/bad-ui-demo && export PATH="$HOME/.local/bin:$PATH" && \
  bun install --frozen-lockfile && bun run build:client && \
  sudo systemctl restart bad-ui-demo'
```

This copies the current working tree, including uncommitted changes. Extraction does not delete files removed from the source tree; remove obsolete deployed files deliberately when needed. The service keeps running the previous process until the restart, but the copy and build happen in its working directory.

Check the service and public endpoint:

```sh
ssh pi 'systemctl status bad-ui-demo --no-pager; journalctl -u bad-ui-demo -n 50 --no-pager'
curl -I https://clay.close-by.org/
```

## Service and tunnel setup

The service is enabled with `sudo systemctl enable --now bad-ui-demo`. Its unit is `/etc/systemd/system/bad-ui-demo.service`:

```ini
[Unit]
Description=Clay demo
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/bad-ui-demo
Environment=PORT=4000
Environment=PATH=/home/pi/.local/bin:/usr/local/bin:/usr/bin:/bin
EnvironmentFile=/home/pi/.config/bad-ui-demo/service.env
ExecStart=/home/pi/.local/bin/bun apps/demo/src/main.ts
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
```

The environment file contains `CLAY_AUTH_SECRET`; keep it private and stable across restarts. To create it on a fresh deployment, use `umask 077`, create `/home/pi/.config/bad-ui-demo`, and write `CLAY_AUTH_SECRET=` followed by a random secret (for example, from `openssl rand -hex 32`). Changing it invalidates existing signed sessions. After changing a unit, run `sudo systemctl daemon-reload` and restart the service.

The tunnel configuration is `/etc/cloudflared/flock.yml`, managed by `flock-tunnel.service`. Its Clay ingress entry must precede the final catch-all:

```yaml
- hostname: clay.close-by.org
  service: http://localhost:4000
```

Validate changes with `sudo cloudflared tunnel --config /etc/cloudflared/flock.yml ingress validate`, then restart `flock-tunnel`. This is shared with Flock, so preserve its existing ingress entries. The DNS CNAME must point to the existing tunnel's `<tunnel-id>.cfargotunnel.com` and be proxied; the tunnel credentials on Pi alone do not grant permission to edit Cloudflare DNS.

This is a public demo with example authentication and data, not a hardened production application. See [Production & security](./production.md) before deploying real data or applications.
