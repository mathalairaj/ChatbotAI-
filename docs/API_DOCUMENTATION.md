# NSCET AI College Assistant — REST API Documentation

**Base URL (Local Dev):** `http://localhost:5000/api`  
**Authentication:** Bearer JWT in `Authorization: Bearer <token>` header. Guest chat sessions pass `x-session-token: <id>`.

---

## 1. System Health

### `GET /api/health`
Returns service readiness, active database engine (`postgresql` or `sqlite`), and AI mode (`openai` or `local-rag-grounded`). Exposes zero secrets.

---

## 2. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public (rate-limited) | Authenticates Admin, Faculty, or Student. Body: `{ email, password }`. Returns `{ token, user }`. |
| `POST` | `/api/auth/register` | Public (rate-limited) | Registers a `student` or `guest` user. Body: `{ full_name, email, password, department_code?, register_number?, academic_year? }`. |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user profile. |
| `POST` | `/api/auth/logout` | Authenticated | Records audit log entry for user sign-out. |

---

## 3. AI Chat Interface (`/api/chat`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/chat/conversations` | Public / Auth | Lists recent conversations for the authenticated user or guest `x-session-token`. |
| `POST` | `/api/chat/conversations` | Public / Auth | Creates a new conversation thread. Body: `{ title?, user_persona?, language? }`. |
| `GET` | `/api/chat/conversations/:id/messages` | Owner / Admin | Fetches full message history and feedback state for a conversation. |
| `DELETE` | `/api/chat/conversations/:id/messages` | Owner / Admin | Clears all messages in a conversation and resets title. |
| `DELETE` | `/api/chat/conversations/:id` | Owner / Admin | Permanently deletes a conversation. |
| `POST` | `/api/chat/ask` | Public / Auth (rate-limited) | Sends a natural-language question (English or Tamil), runs RBAC-filtered RAG retrieval + LLM generation, saves user & assistant messages, and returns `{ conversation, userMessage, assistantMessage }`. |

**Example `POST /api/chat/ask` Request:**
```json
{
  "conversation_id": null,
  "message": "What courses are available at NSCET?",
  "user_persona": "prospective_student"
}
```

---

## 4. Document Management & RAG Pipeline (`/api/documents`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/documents` | Public / Auth (RBAC-filtered) | Lists documents permitted for the requester's role (`?category=...`). |
| `POST` | `/api/documents/upload` | **Admin** | Multipart upload (`file` + `title`, `category`, `access_level`, `description`, `is_verified_official`). Accepts `.pdf`, `.docx`, `.txt`, `.md`. Extracts text, chunks, embeds, and indexes. |
| `PUT` | `/api/documents/:id/replace` | **Admin** | Replaces an existing document file and re-indexes all vector chunks. |
| `DELETE` | `/api/documents/:id` | **Admin** | Deletes stored file, DB metadata, and all vector chunks. |
| `GET` | `/api/documents/:id/chunks` | **Admin** | Returns extracted text chunks and token estimates for inspection. |
| `POST` | `/api/documents/search` | **Admin** | Tests semantic vector retrieval with role simulation: `{ query, simulate_role, top_k }`. |

---

## 5. Admission Assistant (`/api/admissions`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admissions/info` | Public | Returns UG/PG programmes, TNEA & management quota pathways, verification notice, and required certificates checklist. |
| `POST` | `/api/admissions/enquiries` | Public | Validates and stores a new admission enquiry. Returns `{ enquiry, confirmation }` with generated `NSCET-ADM-YYYY-XXXX` reference code. |
| `GET` | `/api/admissions/enquiries` | **Admin** | Lists all enquiries (optional `?status=new`). |
| `PATCH` | `/api/admissions/enquiries/:id` | **Admin** | Updates enquiry workflow status (`new`, `contacted`, `counselled`, `admitted`, `closed`) and `admin_notes`. |

---

## 6. College, Departments, Academics, Placements & Faculty (`/api/college`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/college/profile` | Public | Returns NSCET profile, Vision/Mission placeholders, campus facilities, and office contacts. |
| `GET` | `/api/college/departments` | Public | Returns all 8 departments with courses, labs, events, workshops, industrial visits, achievements, research, and faculty. |
| `GET` | `/api/college/departments/:code` | Public | Returns single department detail by code (`CSE`, `AIDS`, `IT`, `ECE`, `EEE`, `MECH`, `CIVIL`, `SH`). |
| `GET` | `/api/college/placements` | Public | Returns placement training, guidance, internships, and uploaded official Placement Reports. |
| `GET` | `/api/college/student-academics` | **Authenticated** | Returns protected student academic context, regulations/exam sections, and role-permitted academic documents. |
| `GET` | `/api/college/faculty-resources` | Public / Enhanced for Faculty | Returns faculty FDP/NPTEL/research info and role-permitted faculty documents. |
| `POST` | `/api/college/faculty-assistant/draft` | **Faculty / Admin** | Generates structured academic documentation templates (`lesson_plan`, `event_circular`, `question_blueprint`). |

---

## 7. Feedback (`/api/feedback`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/feedback` | Public / Auth | Records `helpful` or `not_helpful` rating and optional `comment` for an assistant `message_id`. |
| `GET` | `/api/feedback` | **Admin** | Lists recent feedback entries with associated assistant replies. |

---

## 8. Admin Analytics, Users & Audit Logs (`/api/admin`)

All endpoints require `Authorization: Bearer <admin-jwt>`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/analytics` | KPIs, top FAQs, unanswered questions, intent breakdown, and daily query trend. |
| `GET` | `/api/admin/users` | Lists all portal users (password hashes excluded). |
| `POST` | `/api/admin/users` | Creates a new Admin, Faculty, Student, or Guest account. |
| `PATCH` | `/api/admin/users/:id` | Updates user role, full name, or active status. |
| `GET` | `/api/admin/roles` | Lists RBAC role definitions. |
| `GET` | `/api/admin/audit-logs` | Lists chronological security & admin audit trail records. |
