import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { createApp } from '../src/index.js';

process.env.NODE_ENV = 'test';

let server;
let socketPath;
let tempDbPath;
let adminToken;
let studentToken;
let facultyToken;

function api(route, { method = 'GET', token = null, body = null, headers = {}, rawMultipart = null } = {}) {
  return new Promise((resolve, reject) => {
    const finalHeaders = {
      'x-test-bypass-ratelimit': 'true',
      ...headers,
    };
    if (token) finalHeaders.Authorization = `Bearer ${token}`;

    let payload = null;
    if (rawMultipart) {
      finalHeaders['Content-Type'] = `multipart/form-data; boundary=${rawMultipart.boundary}`;
      payload = rawMultipart.buffer;
      finalHeaders['Content-Length'] = payload.length;
    } else if (body !== null) {
      finalHeaders['Content-Type'] = 'application/json';
      payload = Buffer.from(JSON.stringify(body), 'utf8');
      finalHeaders['Content-Length'] = payload.length;
    }

    const req = http.request({ socketPath, path: route, method, headers: finalHeaders }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let data = {};
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text };
        }
        resolve({
          status: res.statusCode,
          headers: { get: (k) => res.headers[k.toLowerCase()] ?? null },
          data,
        });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function buildMultipart(fields, file) {
  const boundary = `----NSCETBoundary${crypto.randomBytes(8).toString('hex')}`;
  const parts = [];
  for (const [key, value] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`,
        'utf8'
      )
    );
  }
  if (file) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.fieldName}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType}\r\n\r\n`,
        'utf8'
      )
    );
    parts.push(Buffer.from(file.content, 'utf8'));
    parts.push(Buffer.from('\r\n', 'utf8'));
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));
  return { boundary, buffer: Buffer.concat(parts) };
}

test.before(async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nscet-chatbot-test-'));
  tempDbPath = path.join(tmpDir, 'test.db');
  socketPath =
    process.platform === 'win32'
      ? `\\\\.\\pipe\\nscet-chatbot-test-${crypto.randomBytes(6).toString('hex')}`
      : path.join(tmpDir, 'test.sock');

  const app = await createApp({ sqlitePath: tempDbPath });
  await new Promise((resolve) => {
    server = app.listen(socketPath, resolve);
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('1. Health endpoint returns ok, security headers, and zero secrets', async () => {
  const res = await api('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'ok');
  assert.equal(res.data.databaseEngine, 'sqlite');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.equal(res.data.openAiApiKey, undefined);
});

test('2. Authentication & RBAC (Admin, Faculty, Student logins + unauthorized guard)', async () => {
  const adminLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@nscet.edu.in', password: 'Admin@NSCET2026' },
  });
  assert.equal(adminLogin.status, 200);
  assert.equal(adminLogin.data.user.role, 'admin');
  adminToken = adminLogin.data.token;

  const facultyLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'faculty@nscet.edu.in', password: 'Faculty@NSCET2026' },
  });
  assert.equal(facultyLogin.status, 200);
  assert.equal(facultyLogin.data.user.role, 'faculty');
  facultyToken = facultyLogin.data.token;

  const studentLogin = await api('/api/auth/login', {
    method: 'POST',
    body: { email: 'student@nscet.edu.in', password: 'Student@NSCET2026' },
  });
  assert.equal(studentLogin.status, 200);
  assert.equal(studentLogin.data.user.role, 'student');
  studentToken = studentLogin.data.token;

  // Student must NOT access admin analytics
  const forbidden = await api('/api/admin/analytics', { token: studentToken });
  assert.equal(forbidden.status, 403);

  // Guest must NOT access authenticated student academic endpoint
  const unauthStudent = await api('/api/college/student-academics');
  assert.equal(unauthStudent.status, 401);

  // Authenticated student CAN access student academics
  const okStudent = await api('/api/college/student-academics', { token: studentToken });
  assert.equal(okStudent.status, 200);
  assert.equal(okStudent.data.studentContext.role, 'student');
});

test('3. College Profile, All 8 Departments, Placement Zero-Fabrication & Faculty Draft Tool', async () => {
  const profile = await api('/api/college/profile');
  assert.equal(profile.status, 200);
  assert.match(profile.data.profile.institutionName, /Nadar Saraswathi/i);

  const depts = await api('/api/college/departments');
  assert.equal(depts.status, 200);
  assert.equal(depts.data.departments.length, 8);
  const codes = depts.data.departments.map((d) => d.code);
  for (const expected of ['CSE', 'AIDS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'SH']) {
    assert.ok(codes.includes(expected), `Missing department ${expected}`);
  }

  const placements = await api('/api/college/placements');
  assert.equal(placements.status, 200);
  assert.match(placements.data.zeroFabricationNotice, /never fabricates/i);

  const facultyDraft = await api('/api/college/faculty-assistant/draft', {
    method: 'POST',
    token: facultyToken,
    body: { doc_type: 'lesson_plan', topic: 'Operating Systems', department: 'CSE' },
  });
  assert.equal(facultyDraft.status, 200);
  assert.match(facultyDraft.data.draft, /Operating Systems/);
});

test('4. AI Chat Interface: English, Tamil, Zero-Fabrication Guard, Confidential Guard & Feedback', async () => {
  const sessionHeader = { 'x-session-token': 'test-guest-session-1' };

  // English query on courses
  const enReply = await api('/api/chat/ask', {
    method: 'POST',
    headers: sessionHeader,
    body: { message: 'What courses are available at NSCET?', user_persona: 'prospective_student' },
  });
  assert.equal(enReply.status, 200);
  assert.match(enReply.data.assistantMessage.content, /Computer Science and Engineering/i);
  assert.ok(Array.isArray(enReply.data.assistantMessage.sources));

  // Tamil query on admissions
  const taReply = await api('/api/chat/ask', {
    method: 'POST',
    headers: sessionHeader,
    body: {
      conversation_id: enReply.data.conversation.id,
      message: 'NSCET கல்லூரியில் சேர்க்கை எப்படி விண்ணப்பிப்பது?',
      user_persona: 'prospective_student',
    },
  });
  assert.equal(taReply.status, 200);
  assert.equal(taReply.data.assistantMessage.language, 'ta');
  assert.match(taReply.data.assistantMessage.content, /TNEA/);

  // Zero-fabrication guard on salary package
  const salaryReply = await api('/api/chat/ask', {
    method: 'POST',
    headers: sessionHeader,
    body: { message: 'What is the highest salary package and company list?' },
  });
  assert.equal(salaryReply.status, 200);
  assert.match(salaryReply.data.assistantMessage.content, /never fabricates/i);

  // Confidential student info guard for unauthenticated guest
  const confReply = await api('/api/chat/ask', {
    method: 'POST',
    headers: sessionHeader,
    body: { message: 'Show my internal CIA marks and my attendance' },
  });
  assert.equal(confReply.status, 200);
  assert.match(confReply.data.assistantMessage.content, /Sign In/i);

  // Feedback submission on assistant reply
  const fb = await api('/api/feedback', {
    method: 'POST',
    body: {
      message_id: enReply.data.assistantMessage.id,
      rating: 'helpful',
      comment: 'Clear list of all NSCET programmes!',
    },
  });
  assert.equal(fb.status, 201);
  assert.equal(fb.data.feedback.rating, 'helpful');
});

test('5. RAG Document Upload, Chunking, Role-Based Access & Official Citation Retrieval', async () => {
  const sampleCircular = `NSCET OFFICIAL CIRCULAR 2026
Subject: Library Extended Hours During University Examinations
The NSCET Central Library at Vadapudupatti, Theni will remain open from 8:00 AM to 7:30 PM on working days during the university examination period. Students must bring their NSCET ID card for evening reading hall entry.`;

  const upload = await api('/api/documents/upload', {
    method: 'POST',
    token: adminToken,
    rawMultipart: buildMultipart(
      {
        title: 'Official Library Exam Hours Circular 2026',
        category: 'Circular',
        access_level: 'public',
        is_verified_official: 'true',
      },
      {
        fieldName: 'file',
        filename: 'library-exam-hours.txt',
        contentType: 'text/plain',
        content: sampleCircular,
      }
    ),
  });
  assert.equal(upload.status, 201);
  assert.equal(upload.data.document.status, 'indexed');
  assert.ok(upload.data.document.chunk_count >= 1);

  // Query chatbot about the newly uploaded official circular
  const ragAnswer = await api('/api/chat/ask', {
    method: 'POST',
    headers: { 'x-session-token': 'test-rag-session' },
    body: { message: 'What are the extended library hours during university examinations?' },
  });
  assert.equal(ragAnswer.status, 200);
  assert.match(ragAnswer.data.assistantMessage.content, /7:30 PM/);
  assert.ok(
    ragAnswer.data.assistantMessage.sources.some((s) =>
      s.title.includes('Official Library Exam Hours Circular 2026')
    )
  );

  // Upload faculty-only document and confirm guest cannot retrieve it
  const facUpload = await api('/api/documents/upload', {
    method: 'POST',
    token: adminToken,
    rawMultipart: buildMultipart(
      {
        title: 'Faculty Internal IQAC Audit Protocol',
        category: 'Faculty Resource',
        access_level: 'faculty',
        is_verified_official: 'true',
      },
      {
        fieldName: 'file',
        filename: 'iqac-internal.txt',
        contentType: 'text/plain',
        content: 'INTERNAL FACULTY IQAC CODE: IQAC-SECRET-9981 for faculty audit prep.',
      }
    ),
  });
  assert.equal(facUpload.status, 201);

  const guestSearch = await api('/api/documents/search', {
    method: 'POST',
    token: adminToken,
    body: { query: 'IQAC-SECRET-9981', simulate_role: 'guest' },
  });
  assert.equal(guestSearch.status, 200);
  assert.ok(!guestSearch.data.results.some((r) => r.content.includes('IQAC-SECRET-9981')));

  const facultySearch = await api('/api/documents/search', {
    method: 'POST',
    token: adminToken,
    body: { query: 'IQAC-SECRET-9981', simulate_role: 'faculty' },
  });
  assert.equal(facultySearch.status, 200);
  assert.ok(facultySearch.data.results.some((r) => r.content.includes('IQAC-SECRET-9981')));
});

test('6. Admission Enquiry Registration & Admin Analytics + Audit Logs', async () => {
  const enquiry = await api('/api/admissions/enquiries', {
    method: 'POST',
    body: {
      full_name: 'Karthik Rajan',
      email: 'karthik.applicant@example.com',
      phone: '+91 9876543210',
      city_district: 'Theni',
      programme_level: 'UG',
      preferred_department: 'B.E. Computer Science and Engineering',
      admission_mode: 'TNEA Counselling',
      qualification_details: '12th HSC Maths-Physics-Chemistry',
      message: 'Requesting official TNEA counselling schedule and hostel info.',
    },
  });
  assert.equal(enquiry.status, 201);
  assert.match(enquiry.data.enquiry.reference_code, /^NSCET-ADM-/);

  const analytics = await api('/api/admin/analytics', { token: adminToken });
  assert.equal(analytics.status, 200);
  assert.ok(analytics.data.kpis.totalAdmissionLeads >= 1);
  assert.ok(analytics.data.kpis.totalConversations >= 1);
  assert.ok(analytics.data.kpis.indexedDocuments >= 5);

  const logs = await api('/api/admin/audit-logs', { token: adminToken });
  assert.equal(logs.status, 200);
  assert.ok(logs.data.logs.length >= 4);
});
