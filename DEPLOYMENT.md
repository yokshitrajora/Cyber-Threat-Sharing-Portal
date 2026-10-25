# 🛡️ Shield AI Threat Intelligence Platform — Production Deployment Guide

This document outlines the complete procedure for deploying the **Shield AI Threat Intelligence & Community Defense SOC Platform** into a high-availability, production-grade environment.

---

## 1. System Architecture Overview

```
                      Internet / Cloudflare / DNS
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │  NGINX Edge Proxy & SSL   │
                    │  (Port 80/443, Rate Limit)│
                    └─────────────┬─────────────┘
                                  │
               ┌──────────────────┴──────────────────┐
               │                                     │
               ▼                                     ▼
     ┌───────────────────┐                 ┌───────────────────┐
     │ React 19 Frontend │                 │  FastAPI Backend  │
     │  (Vite + Tailwind)│                 │   (Gunicorn/ASGI) │
     └───────────────────┘                 └─────────┬─────────┘
                                                     │
               ┌─────────────────────────────────────┼─────────────────────┐
               ▼                                     ▼                     ▼
     ┌───────────────────┐                 ┌───────────────────┐ ┌───────────────────┐
     │  PostgreSQL 16    │                 │   Redis 7 Broker  │ │  External Intel   │
     │  (ACID Relational)│                 │  & Result Cache   │ │  VT / AbuseIPDB   │
     └───────────────────┘                 └─────────┬─────────┘ └───────────────────┘
                                                     │
                                       ┌─────────────┴─────────────┐
                                       ▼                           ▼
                             ┌───────────────────┐       ┌───────────────────┐
                             │   Celery Worker   │       │    Celery Beat    │
                             │ (Threat Ingest &  │       │ (Weekly Automated │
                             │  Async Enrichment)│       │   Email Digest)   │
                             └───────────────────┘       └───────────────────┘
```

---

## 2. Production Stack Components

| Service | Technology | Port | Purpose |
| :--- | :--- | :--- | :--- |
| **Edge Ingress** | NGINX Alpine | `80`, `443` | Reverse proxy, SSL termination, WebSockets, gzip compression, security headers |
| **Frontend** | React 19 + Vite | `80` (internal) | User & SOC dashboard, Leaflet geospatial map, telemetry visualizer |
| **Backend API** | FastAPI + SQLAlchemy | `8000` (internal) | High-concurrency REST endpoints, STIX 2.1 exporter, PII sanitizer, RBAC |
| **Database** | PostgreSQL 16 Alpine | `5432` | Relational threat intelligence database, incidents, user accounts, audit logs |
| **Message Broker** | Redis 7 Alpine | `6379` | Queue for background jobs, rate limiter cache, Celery task broker |
| **Async Worker** | Celery 5.4 | Background | Asynchronous external threat enrichment (VirusTotal, AbuseIPDB, Geolocation) |
| **Periodic Scheduler**| Celery Beat | Background | Automated weekly email digest generation & dispatch every Monday |

---

## 3. Quick Start: 1-Command Docker Deployment (Recommended)

### Step 1: Clone & Configure Environment Variables
```bash
git clone https://github.com/your-org/shield-community-dashboard.git
cd shield-community-dashboard

# Copy the production environment template
cp .env.example .env
```

Edit `.env` and configure your production credentials:
```ini
# Generate a strong 64-char key: openssl rand -hex 32
SECRET_KEY=94a3b8...your_generated_secret_key...
DATABASE_URL=postgresql://shield_user:your_secure_password@db:5432/shield_db
POSTGRES_PASSWORD=your_secure_password
CORS_ORIGINS=https://threats.yourdomain.com,https://yourdomain.com

# Optional Threat Intel & Alerting API Keys
VIRUSTOTAL_API_KEY=your_virustotal_key
ABUSEIPDB_API_KEY=your_abuseipdb_key
SENDGRID_API_KEY=your_sendgrid_key
ALERT_EMAIL_FROM=alerts@yourdomain.com
```

### Step 2: Build & Start All Services
```bash
docker compose up --build -d
```

### Step 3: Verify Container Health
```bash
docker compose ps
```

All 7 containers (`shield_postgres`, `shield_redis`, `shield_backend`, `shield_celery_worker`, `shield_celery_beat`, `shield_frontend`, and `shield_nginx`) should be in `healthy` or `running` state.

Test the backend health check:
```bash
curl -i http://localhost/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Shield AI Threat Intelligence SOC Core",
  "version": "5.0.0",
  "database": "operational",
  "timestamp": "2026-10-25T12:00:00Z"
}
```

---

## 4. Bare-Metal / Ubuntu Linux VPS Deployment

For VPS deployments (DigitalOcean Droplet, AWS EC2, Linode, Hetzner):

### 1. System Dependencies & Python Setup
```bash
sudo apt update && sudo apt install -y python3-pip python3-venv postgresql postgresql-contrib redis-server nginx certbot python3-certbot-nginx
```

### 2. Configure PostgreSQL
```bash
sudo -u postgres psql
CREATE DATABASE shield_db;
CREATE USER shield_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE shield_db TO shield_user;
\q
```

### 3. Backend Setup & Systemd Services
```bash
cd /opt/shield-community-dashboard/backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp ../.env.example .env
```

Create Systemd Service for the API Server (`/etc/systemd/system/shield-api.service`):
```ini
[Unit]
Description=Shield AI SOC FastAPI Service
After=network.target postgresql.service redis-server.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/shield-community-dashboard/backend
EnvironmentFile=/opt/shield-community-dashboard/backend/.env
ExecStart=/opt/shield-community-dashboard/backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

Create Systemd Service for the Celery Worker (`/etc/systemd/system/shield-worker.service`):
```ini
[Unit]
Description=Shield AI SOC Celery Worker
After=network.target redis-server.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/shield-community-dashboard/backend
EnvironmentFile=/opt/shield-community-dashboard/backend/.env
ExecStart=/opt/shield-community-dashboard/backend/.venv/bin/celery -A app.core.celery_app.celery_app worker --loglevel=info -c 4
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start services:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now shield-api shield-worker
```

### 4. Build Frontend Assets
```bash
cd /opt/shield-community-dashboard/frontend
npm install
npm run build
# Built files land in /opt/shield-community-dashboard/frontend/dist
```

### 5. NGINX Configuration & Free Let's Encrypt SSL
Create `/etc/nginx/sites-available/shield`:
```nginx
server {
    server_name threats.yourdomain.com;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Static Frontend SPA
    location / {
        root /opt/shield-community-dashboard/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Probe
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        proxy_set_header Host $host;
    }
}
```

Enable and issue SSL:
```bash
sudo ln -s /etc/nginx/sites-available/shield /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d threats.yourdomain.com
```

---

## 5. Security & Hardening Checklist

- [x] **Production Secret Rotation**: Replace default `SECRET_KEY` with a cryptographically secure random value (`openssl rand -hex 32`).
- [x] **Database Isolation**: Keep PostgreSQL database port `5432` bound only to internal Docker bridge or `127.0.0.1`, blocked from external internet access.
- [x] **CORS Domain Restrictions**: Configure `CORS_ORIGINS` to allow only your production domains.
- [x] **PII Sanitizer Active**: Ensure input scrubbers remove emails, phone numbers, and auth tokens before persistence.
- [x] **Security HTTP Headers**: Nginx is configured with `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy`.
- [x] **Non-Blocking Background Tasks**: All slow third-party API queries (VirusTotal, AbuseIPDB) run via Celery worker queue without blocking web threads.

---

## 6. Maintenance & Backups

### Automated Database Backup Cron
Add a daily backup cron job (`crontab -e`):
```bash
0 2 * * * docker exec shield_postgres pg_dump -U shield_user shield_db | gzip > /opt/backups/shield_db_$(date +\%F).sql.gz
```

### Viewing Logs in Real-time
```bash
# View backend API logs
docker compose logs -f backend

# View Celery worker task execution logs
docker compose logs -f celery_worker

# View NGINX ingress traffic
docker compose logs -f nginx
```
