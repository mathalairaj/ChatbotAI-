# NSCET AI College Assistant — Production Deployment Guide

This guide covers deploying the **Frontend on Vercel** and the **Backend + PostgreSQL (`pgvector`) on Render** (or equivalent cloud hosting).

---

## 1. Database Setup (PostgreSQL 15+ with `pgvector`)

1. Provision a PostgreSQL 15+ instance (Render PostgreSQL, Supabase, Neon, or self-hosted).
2. Ensure the `pgvector` and `uuid-ossp` extensions are enabled:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "vector";
   ```
3. Run the schema and optional starter seed scripts (or allow the backend to auto-apply `database/schema.sql` on boot):
   ```bash
   psql "$DATABASE_URL" -f database/schema.sql
   psql "$DATABASE_URL" -f database/seed.sql
   ```

---

## 2. Backend Deployment on Render

The repository includes a ready-to-use [`render.yaml`](../render.yaml) Blueprint.

1. Push `nscet-ai-chatbot/` to your GitHub/GitLab repository.
2. In Render Dashboard, select **New → Blueprint** (or **New → Web Service** pointing to `rootDir: backend`).
3. Configure Build & Start commands:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
4. Set secure **Environment Variables** in Render (never commit secrets):
   - `NODE_ENV=production`
   - `JWT_SECRET=<64-char random hex secret>`
   - `DATABASE_URL=<PostgreSQL connection string>`
   - `DB_SSL=true`
   - `OPENAI_API_KEY=<your-openai-api-key>`
   - `OPENAI_CHAT_MODEL=gpt-4o-mini`
   - `OPENAI_EMBEDDING_MODEL=text-embedding-3-small`
   - `CORS_ORIGIN=https://your-vercel-domain.vercel.app`
5. Verify deployment by calling `GET https://your-backend.onrender.com/api/health`.

---

## 3. Frontend Deployment on Vercel

1. In Vercel Dashboard, import the repository and set:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
2. Configure Environment Variable in Vercel:
   - `VITE_API_BASE_URL=https://your-backend.onrender.com`
   - **CRITICAL:** Never place `OPENAI_API_KEY`, `JWT_SECRET`, or `DATABASE_URL` in Vercel frontend env vars.
3. `frontend/vercel.json` automatically configures SPA rewrites and HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).

---

## 4. Post-Deployment Production Hardening Checklist

- [ ] Change all seeded demo account passwords (`admin@nscet.edu.in`, `faculty@nscet.edu.in`, `student@nscet.edu.in`) or replace them with official NSCET institutional accounts.
- [ ] Upload official NSCET PDFs/DOCX documents via **Admin → RAG Documents** (Prospectus, Admission Guidelines, Academic Regulations, Department Syllabi, Placement Reports) and mark them as **Verified Official**.
- [ ] Verify HTTPS-only traffic and strict `CORS_ORIGIN` matching your production frontend domain.
- [ ] Configure automated PostgreSQL backups and periodic review of `audit_logs` and `Unanswered Questions`.
