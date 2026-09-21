# Shield AI SOC Threat Intelligence Dashboard

An enterprise-grade Security Operations Center (SOC) threat intelligence web platform built with **React (Vite)**, **Tailwind CSS**, **Axios**, **Recharts**, **Python 3.11+ FastAPI**, **PostgreSQL** (with automated SQLite fallback for local dev), and **STIX 2.1 JSON**.

Features an HTML5 Canvas 3D particle stardust background, 3D metallic UI components, server-side PII scrubbing engine, VirusTotal v3 & AbuseIPDB v2 threat intelligence enrichment, Twilio (SMS) & SendGrid (Email) alerting, and full NGINX & Docker Compose containerization.

---

## Complete Project Documentation

For a full architectural breakdown and a complete guide explaining the exact function of **every button and interactive control** in the application, please see:

👉 **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)**

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19 (Vite), Tailwind CSS, Axios (with JWT interceptors), Recharts, Canvas 3D Stardust |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, JWT (python-jose), Passlib (Bcrypt) |
| **Database** | PostgreSQL 16 (production) with SQLAlchemy ORM + SQLite automatic dev fallback |
| **Threat Intelligence** | OASIS STIX 2.1 standard (`stix2`), VirusTotal API v3, AbuseIPDB API v2 |
| **Alerting** | Twilio (SMS), SendGrid / SMTP (Email) |
| **Security & Privacy** | Server-side PII scrubbing & parameter sanitization module |
| **DevOps** | Docker, Docker Compose multi-service architecture, NGINX reverse proxy |

---

## Quick Start Guide

### Option 1: Docker Compose (Full Stack)
Run the entire production stack (PostgreSQL + FastAPI + React Frontend + NGINX) with a single command:
```bash
docker compose up --build
```
- App UI: `http://localhost`
- Backend API Docs (Swagger): `http://localhost/docs`

---

### Option 2: Local Development

#### 1. Backend (FastAPI + SQLite Fallback)
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API Documentation will be live at `http://localhost:8000/docs`.

#### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Frontend will be live at `http://localhost:5173`.

### 3. Live Project (Vercel Deployment)

🌐 **Live Website:** [View Project](cyber-threat-sharing-portal.railway.internal)

---<img width="1907" height="2374" alt="screencapture-localhost-5173-2026-09-20-12_37_01" src="https://github.com/user-attachments/assets/12d38b96-e23a-4ea9-be46-e5bc0154d9da" />
<img width="1907" height="1524" alt="screencapture-localhost-5173-feed-2026-09-20-12_37_44" src="https://github.com/user-attachments/assets/99d5d428-551c-49ad-b851-2af26d36abd3" />

<img width="1907" height="1106" alt="screencapture-localhost-5173-report-2026-09-20-12_38_07" src="https://github.com/user-attachments/assets/83e08aa1-3098-453d-9216-99d431415bc3" />

