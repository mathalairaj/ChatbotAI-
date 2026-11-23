# NSCET AI College Assistant Chatbot

**Institution:** Nadar Saraswathi College of Engineering & Technology (NSCET), Vadapudupatti, Theni, Tamil Nadu  
**Chatbot Identity:** `NSCET AI Assistant`  
**Stack:** React.js + Tailwind CSS (Vite) | Node.js + Express.js | OpenAI API + RAG Pipeline | PostgreSQL + `pgvector` (with zero-config local Node SQLite fallback)

---

## 1. Key Capabilities & Implemented Modules

| # | Module | Description |
|---|---|---|
| 1 | **AI Chat Interface** | Conversational assistant with exact welcome message, 5 suggested questions, English & Tamil support, persona selector, conversation history, new/clear chat, typing indicator, source citations, and mobile responsive layout. |
| 2 | **College Information Assistant** | Institution profile, Vision & Mission placeholders, Accreditation guidance, Campus Facilities (Labs, Library, Transport, Hostel, Clubs), and Campus Offices directory. |
| 3 | **Admission Assistant** | UG (B.E./B.Tech.) & PG (M.E. CSE) programmes, TNEA counselling & management quota pathways, required certificates checklist, zero-fabrication policy, and persistent **Admission Enquiry Registration Form** with reference code generation. |
| 4 | **Department Assistant** | All 8 NSCET departments (CSE, AI&DS, IT, ECE, EEE, Mechanical, Civil, Science & Humanities) with courses, labs, faculty, workshops, events, industrial visits, achievements, and research. |
| 5 | **Student Academic Assistant** | Authenticated student workspace covering academic regulations, syllabus, internal assessments (CIA), examination guidelines, learning resources, and role-filtered academic documents. |
| 6 | **Placement Assistant** | Placement training framework, internship approval steps, resume & interview prep guides, and strict zero-fabrication verified placement reports section. |
| 7 | **Faculty Assistant** | FDP, NPTEL, Research, and an authenticated **Academic Documentation Draft Assistant** (Course Lesson Plan, Workshop Circular, Bloom’s Taxonomy Question Blueprint). |
| 8 | **Document-Based AI (RAG)** | Admin upload of PDF, DOCX, TXT, and MD files; text extraction, overlapping semantic chunking, vector embeddings, role-based vector search, chunk preview, replace/delete, and live RBAC search tester. |
| 9 | **Admin Dashboard** | Real-time KPIs (users, conversations, daily enquiries, leads, helpful rate, indexed docs, unanswered questions), FAQ analytics, Admission Leads CRM, Feedback Reports, User & Role Management, and Security Audit Logs. |
| 10 | **Feedback System** | Post-response `"Was this information helpful?"` widget (Helpful / Not helpful + Additional feedback note) stored in the `feedback` table. |

---

## 2. Project Folder Structure

```text
nscet-ai-chatbot/
├── package.json                     # Root convenience scripts
├── render.yaml                      # Render production deployment blueprint
├── database/
│   ├── schema.sql                   # Production PostgreSQL + pgvector schema (12 tables)
│   └── seed.sql                     # Roles, 8 departments & clearly marked demo seed SQL
├── docs/
│   ├── ARCHITECTURE.md              # Architecture, RAG pipeline & ER diagrams
│   ├── API_DOCUMENTATION.md         # Complete REST API specification
│   ├── DEPLOYMENT.md                # Vercel + Render + PostgreSQL deployment guide
│   ├── TESTING.md                   # Automated & security testing documentation
│   └── USER_MANUAL.md               # Role-wise user guide
├── backend/
│   ├── .env.example                 # Environment variables template
│   ├── package.json
│   ├── tests/api.test.js            # Automated integration & RBAC/RAG test suite
│   └── src/
│       ├── index.js                 # Express app factory & HTTP server bootstrap
│       ├── config/env.js            # Environment loader & validation
│       ├── db/                      # Dual PostgreSQL+pgvector & SQLite database adapters
│       ├── middleware/              # JWT Auth, RBAC, Rate Limiter, Security Headers, Multer Upload
│       ├── services/                # Document Extractor, Chunker, Embeddings, RAG, Prompt Builder, OpenAI Service, Audit
│       └── routes/                  # auth, chat, documents, admissions, college, feedback, admin
└── frontend/
    ├── .env.example
    ├── vercel.json                  # Vercel SPA & security header config
    ├── package.json
    └── src/
        ├── App.jsx                  # Main layout & module router
        ├── context/AuthContext.jsx  # Authentication state & RBAC helpers
        ├── services/api.js          # Centralized API client
        └── components/
            ├── layout/              # Sidebar, Header
            ├── auth/                # AuthModal (Admin/Faculty/Student sign-in & student register)
            ├── chat/                # ChatInterface, MessageBubble, FeedbackWidget
            ├── modules/             # CollegeInfo, Admission, Department, StudentAcademic, Placement, Faculty
            └── admin/               # AdminDashboard, DocumentManager
```

---

## 3. Installation & Local Quick Start

### Prerequisites
- **Node.js 20+** (Node 24 recommended; provides built-in `node:sqlite` for zero-config local runs)
- **PostgreSQL 15+ with `pgvector`** (recommended for production; optional for local evaluation)
- **OpenAI API Key** (optional for local grounded RAG testing; required for live GPT responses & OpenAI embeddings)

### Step 1: Configure Environment Variables
```bash
cd nscet-ai-chatbot
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```
Edit `backend/.env` to set a secure `JWT_SECRET` and (optionally) `OPENAI_API_KEY` and `DATABASE_URL`.

### Step 2: Install Dependencies
```bash
npm run install:all
```

### Step 3: Run in Development Mode
```bash
# Starts Express API on http://localhost:5000 and React Vite UI on http://localhost:5173
npm run dev
```

### Step 4: Run Automated Tests & Production Build
```bash
# Run backend integration, RBAC, RAG & security tests
npm test

# Build optimized frontend bundle to frontend/dist
npm run build

# Run unified production server (serves API + built frontend on :5000)
npm start
```

---

## 4. Demonstration Accounts (Replace Passwords Before Production)

| Role | Email | Password | Scope |
|---|---|---|---|
| **Administrator** | `admin@nscet.edu.in` | `Admin@NSCET2026` | Full Admin Dashboard, RAG Documents, Users, Leads, Audit Logs |
| **Faculty** | `faculty@nscet.edu.in` | `Faculty@NSCET2026` | Faculty Hub, Academic Draft Tools, Faculty RAG Documents |
| **Student** | `student@nscet.edu.in` | `Student@NSCET2026` | Authenticated Student Academic Hub & Student RAG Documents |

---

## 5. Data Integrity & Zero-Fabrication Policy
- **No fabricated institutional data:** Fee structures, scholarship amounts, TNEA cutoffs, admission deadlines, recruiting companies, and salary packages are **never invented**.
- **Official logo policy:** No fabricated NSCET crest/logo is embedded; the UI uses clean typographic institutional branding until an official college logo asset is supplied.
- **Document priority:** Verified official PDFs/DOCX uploaded by Administrators via **Admin → RAG Documents** are prioritized over general model knowledge and cited directly in chatbot replies.
