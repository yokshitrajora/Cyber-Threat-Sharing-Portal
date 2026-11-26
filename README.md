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

🌐 **Live Website:** [View Project](https://cyber-threat-sharing-portal-psi.vercel.app/)

<img width="1917" height="920" alt="image" src="https://github.com/user-attachments/assets/d053deb7-04e4-46ca-b7c8-aef9d52ce3dd" />

<img width="1920" height="3928" alt="image" src="https://github.com/user-attachments/assets/904663d4-deba-4358-b8ee-a32111ae6c99" />


<img width="1920" height="1043" alt="image" src="https://github.com/user-attachments/assets/d978d7ab-4e60-4d69-876c-34cf9ad4bcef" />


