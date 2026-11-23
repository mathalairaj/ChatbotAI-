# NSCET AI College Assistant — Testing & Security Verification Documentation

## 1. Automated Backend Integration & Security Test Suite

Location: [`backend/tests/api.test.js`](../backend/tests/api.test.js)

Run with:
```bash
npm test
# or directly:
node --test backend/tests/api.test.js
```

### Automated Test Coverage

| Suite | Verified Behaviours |
|---|---|
| **1. Health & Security Headers** | Confirms `/api/health` returns `200 OK`, security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`), and zero leaked API keys or secrets. |
| **2. Authentication & RBAC** | Verifies Admin, Faculty, and Student JWT login; confirms Student is blocked (`403`) from `/api/admin/analytics`; confirms unauthenticated Guest is blocked (`401`) from `/api/college/student-academics`; confirms authenticated Student gains access (`200`). |
| **3. Institutional Modules** | Verifies College Profile, all 8 NSCET departments (`CSE`, `AIDS`, `IT`, `ECE`, `EEE`, `MECH`, `CIVIL`, `SH`), Placement zero-fabrication notice, and Faculty documentation drafting tool. |
| **4. Bilingual AI Chat & Guardrails** | Verifies English queries, Tamil (`தமிழ்`) language detection & response, zero-fabrication guard on salary/company queries, confidential student record protection for guests, and Feedback (`POST /api/feedback`) persistence. |
| **5. End-to-End RAG Pipeline & Document RBAC** | Admin uploads a circular, confirms automatic chunking & vector indexing, verifies chatbot cites the newly uploaded document verbatim; uploads a `faculty`-only document and proves a `guest` search cannot retrieve it while a `faculty` search retrieves it cleanly. |
| **6. Admission Enquiries, Analytics & Audit Logs** | Submits an admission enquiry, verifies unique `NSCET-ADM-YYYY-XXXX` reference code, checks Admin KPI counts, and verifies audit log entries are persisted. |

---

## 2. Frontend Build Verification

Run:
```bash
npm run build
```
Confirms zero JSX syntax errors, clean Tailwind CSS compilation, and valid Vite production bundle output in `frontend/dist`.

---

## 3. Manual UAT & Security Checklist

1. **XSS Resistance:** Submit `<script>alert(1)</script>` in chat input and admission enquiry message; verify script tags are stripped by server sanitizer and never executed in React.
2. **SQL Injection Resistance:** Submit `' OR '1'='1` in login email and search queries; verify parameterized SQL queries prevent injection.
3. **File Upload Security:** Attempt uploading a `.exe` or `.js` file in Admin RAG Document Manager; verify `400 Unsupported file type` rejection.
4. **Rate Limiting:** Rapidly exceed `AUTH_RATE_LIMIT_MAX` login attempts; verify `429 Too Many Requests` with `Retry-After` header.
5. **Responsive Mobile UI:** Verify sidebar drawer, chat history toggle, and form layouts at `375px` mobile, `768px` tablet, and `1440px` desktop widths.
6. **Feedback Loop:** Submit both `Helpful` and `Not helpful` + comment on assistant messages and confirm they appear under **Admin Dashboard → Feedback Reports**.
