import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { env } from '../config/env.js';

function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i += 1) {
    const a = vecA[i];
    const b = vecB[i];
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function safeJsonParse(str, fallback) {
  if (str === null || str === undefined) return fallback;
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export class SqliteAdapter {
  constructor(dbPath = env.sqliteDbPath) {
    this.dbPath = dbPath;
    this.engine = 'sqlite';
    this.db = null;
  }

  async init() {
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    this.db = new DatabaseSync(this.dbPath);
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.createTables();
  }

  createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        permissions TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        degree_level TEXT NOT NULL DEFAULT 'UG',
        overview TEXT NOT NULL,
        courses_offered TEXT NOT NULL DEFAULT '[]',
        laboratories TEXT NOT NULL DEFAULT '[]',
        events TEXT NOT NULL DEFAULT '[]',
        workshops TEXT NOT NULL DEFAULT '[]',
        industrial_visits TEXT NOT NULL DEFAULT '[]',
        student_achievements TEXT NOT NULL DEFAULT '[]',
        research_activities TEXT NOT NULL DEFAULT '[]',
        contact_email TEXT,
        is_demo_data INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        role_id INTEGER NOT NULL REFERENCES roles(id),
        department_id INTEGER REFERENCES departments(id),
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        register_number TEXT UNIQUE,
        academic_year TEXT,
        phone TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        last_login_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        session_token TEXT,
        title TEXT NOT NULL DEFAULT 'New Conversation',
        user_persona TEXT NOT NULL DEFAULT 'prospective_student',
        language TEXT NOT NULL DEFAULT 'en',
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_conv_user_id ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_conv_session ON conversations(session_token);

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'en',
        intent_category TEXT,
        sources TEXT NOT NULL DEFAULT '[]',
        confidence_score REAL,
        is_unanswered INTEGER NOT NULL DEFAULT 0,
        model_used TEXT,
        token_usage TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_msg_conv_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_msg_unanswered ON messages(is_unanswered);

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        stored_filename TEXT NOT NULL,
        file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'docx', 'txt', 'md')),
        file_size_bytes INTEGER NOT NULL DEFAULT 0,
        category TEXT NOT NULL DEFAULT 'General',
        access_level TEXT NOT NULL DEFAULT 'public' CHECK (access_level IN ('public', 'student', 'faculty', 'admin')),
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'indexed', 'failed')),
        chunk_count INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        is_verified_official INTEGER NOT NULL DEFAULT 0,
        uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_docs_access ON documents(access_level);
      CREATE INDEX IF NOT EXISTS idx_docs_category ON documents(category);

      CREATE TABLE IF NOT EXISTS document_chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        token_estimate INTEGER NOT NULL DEFAULT 0,
        metadata TEXT NOT NULL DEFAULT '{}',
        embedding TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(document_id, chunk_index)
      );
      CREATE INDEX IF NOT EXISTS idx_chunks_doc_id ON document_chunks(document_id);

      CREATE TABLE IF NOT EXISTS admission_enquiries (
        id TEXT PRIMARY KEY,
        reference_code TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        city_district TEXT,
        programme_level TEXT NOT NULL DEFAULT 'UG',
        preferred_department TEXT NOT NULL,
        admission_mode TEXT NOT NULL DEFAULT 'TNEA Counselling',
        qualification_details TEXT,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'counselled', 'admitted', 'closed')),
        admin_notes TEXT,
        assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_enquiries_status ON admission_enquiries(status);

      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        rating TEXT NOT NULL CHECK (rating IN ('helpful', 'not_helpful')),
        comment TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_feedback_msg ON feedback(message_id);

      CREATE TABLE IF NOT EXISTS faculty (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        designation TEXT NOT NULL,
        qualification TEXT,
        specialization TEXT,
        email TEXT,
        research_interests TEXT,
        is_demo_data INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_faculty_dept ON faculty(department_id);

      CREATE TABLE IF NOT EXISTS placement_information (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL CHECK (category IN ('training', 'internship', 'recruitment_update', 'guidance', 'statistics')),
        title TEXT NOT NULL,
        academic_year TEXT,
        summary TEXT NOT NULL,
        details TEXT NOT NULL DEFAULT '{}',
        is_verified_official INTEGER NOT NULL DEFAULT 0,
        is_demo_data INTEGER NOT NULL DEFAULT 1,
        published_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        user_email TEXT,
        user_role TEXT,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        ip_address TEXT,
        details TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
    `);
  }

  // ---- ROLES ----
  async upsertRole({ name, description, permissions }) {
    const existing = this.db.prepare('SELECT * FROM roles WHERE name = ?').get(name);
    if (existing) return { ...existing, permissions: safeJsonParse(existing.permissions, []) };
    this.db
      .prepare('INSERT INTO roles (name, description, permissions) VALUES (?, ?, ?)')
      .run(name, description, JSON.stringify(permissions || []));
    const created = this.db.prepare('SELECT * FROM roles WHERE name = ?').get(name);
    return { ...created, permissions: safeJsonParse(created.permissions, []) };
  }

  async getRoleByName(name) {
    const row = this.db.prepare('SELECT * FROM roles WHERE name = ?').get(name);
    if (!row) return null;
    return { ...row, permissions: safeJsonParse(row.permissions, []) };
  }

  async listRoles() {
    return this.db
      .prepare('SELECT * FROM roles ORDER BY id ASC')
      .all()
      .map((r) => ({ ...r, permissions: safeJsonParse(r.permissions, []) }));
  }

  // ---- USERS ----
  formatUser(row) {
    if (!row) return null;
    return {
      id: row.id,
      role_id: row.role_id,
      role: row.role_name,
      department_id: row.department_id,
      department_code: row.department_code || null,
      department_name: row.department_name || null,
      full_name: row.full_name,
      email: row.email,
      password_hash: row.password_hash,
      register_number: row.register_number,
      academic_year: row.academic_year,
      phone: row.phone,
      is_active: Boolean(row.is_active),
      last_login_at: row.last_login_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async findUserByEmail(email) {
    const row = this.db
      .prepare(
        `SELECT u.*, r.name AS role_name, d.code AS department_code, d.name AS department_name
         FROM users u
         JOIN roles r ON r.id = u.role_id
         LEFT JOIN departments d ON d.id = u.department_id
         WHERE LOWER(u.email) = LOWER(?)`
      )
      .get(email);
    return this.formatUser(row);
  }

  async findUserById(id) {
    const row = this.db
      .prepare(
        `SELECT u.*, r.name AS role_name, d.code AS department_code, d.name AS department_name
         FROM users u
         JOIN roles r ON r.id = u.role_id
         LEFT JOIN departments d ON d.id = u.department_id
         WHERE u.id = ?`
      )
      .get(id);
    return this.formatUser(row);
  }

  async createUser(data) {
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO users (id, role_id, department_id, full_name, email, password_hash, register_number, academic_year, phone, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        data.role_id,
        data.department_id || null,
        data.full_name,
        data.email.toLowerCase(),
        data.password_hash,
        data.register_number || null,
        data.academic_year || null,
        data.phone || null,
        data.is_active === false ? 0 : 1,
        now,
        now
      );
    return this.findUserById(id);
  }

  async updateUserLogin(id) {
    const now = new Date().toISOString();
    this.db.prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?').run(now, now, id);
  }

  async updateUser(id, patch) {
    const fields = [];
    const values = [];
    if (patch.role_id !== undefined) {
      fields.push('role_id = ?');
      values.push(patch.role_id);
    }
    if (patch.department_id !== undefined) {
      fields.push('department_id = ?');
      values.push(patch.department_id);
    }
    if (patch.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(patch.full_name);
    }
    if (patch.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(patch.is_active ? 1 : 0);
    }
    if (patch.academic_year !== undefined) {
      fields.push('academic_year = ?');
      values.push(patch.academic_year);
    }
    if (patch.phone !== undefined) {
      fields.push('phone = ?');
      values.push(patch.phone);
    }
    if (!fields.length) return this.findUserById(id);
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    this.db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findUserById(id);
  }

  async listUsers() {
    const rows = this.db
      .prepare(
        `SELECT u.*, r.name AS role_name, d.code AS department_code, d.name AS department_name
         FROM users u
         JOIN roles r ON r.id = u.role_id
         LEFT JOIN departments d ON d.id = u.department_id
         ORDER BY u.created_at DESC`
      )
      .all();
    return rows.map((r) => {
      const u = this.formatUser(r);
      delete u.password_hash;
      return u;
    });
  }

  // ---- DEPARTMENTS & FACULTY ----
  formatDepartment(row) {
    if (!row) return null;
    return {
      ...row,
      courses_offered: safeJsonParse(row.courses_offered, []),
      laboratories: safeJsonParse(row.laboratories, []),
      events: safeJsonParse(row.events, []),
      workshops: safeJsonParse(row.workshops, []),
      industrial_visits: safeJsonParse(row.industrial_visits, []),
      student_achievements: safeJsonParse(row.student_achievements, []),
      research_activities: safeJsonParse(row.research_activities, []),
      is_demo_data: Boolean(row.is_demo_data),
    };
  }

  async upsertDepartment(dept) {
    const existing = this.db.prepare('SELECT * FROM departments WHERE code = ?').get(dept.code);
    if (existing) return this.formatDepartment(existing);
    this.db
      .prepare(
        `INSERT INTO departments
         (code, name, degree_level, overview, courses_offered, laboratories, events, workshops, industrial_visits, student_achievements, research_activities, contact_email, is_demo_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        dept.code,
        dept.name,
        dept.degree_level || 'UG',
        dept.overview,
        JSON.stringify(dept.courses_offered || []),
        JSON.stringify(dept.laboratories || []),
        JSON.stringify(dept.events || []),
        JSON.stringify(dept.workshops || []),
        JSON.stringify(dept.industrial_visits || []),
        JSON.stringify(dept.student_achievements || []),
        JSON.stringify(dept.research_activities || []),
        dept.contact_email || null,
        dept.is_demo_data ? 1 : 0
      );
    const created = this.db.prepare('SELECT * FROM departments WHERE code = ?').get(dept.code);
    return this.formatDepartment(created);
  }

  async listDepartments() {
    const depts = this.db.prepare('SELECT * FROM departments ORDER BY id ASC').all().map((d) => this.formatDepartment(d));
    const facultyRows = this.db
      .prepare('SELECT * FROM faculty ORDER BY id ASC')
      .all()
      .map((f) => ({ ...f, is_demo_data: Boolean(f.is_demo_data) }));
    const facByDept = new Map();
    for (const f of facultyRows) {
      if (!facByDept.has(f.department_id)) facByDept.set(f.department_id, []);
      facByDept.get(f.department_id).push(f);
    }
    return depts.map((d) => ({ ...d, faculty: facByDept.get(d.id) || [] }));
  }

  async getDepartmentByCode(code) {
    const row = this.db.prepare('SELECT * FROM departments WHERE UPPER(code) = UPPER(?)').get(code);
    if (!row) return null;
    const dept = this.formatDepartment(row);
    const faculty = this.db
      .prepare('SELECT * FROM faculty WHERE department_id = ? ORDER BY id ASC')
      .all(dept.id)
      .map((f) => ({ ...f, is_demo_data: Boolean(f.is_demo_data) }));
    return { ...dept, faculty };
  }

  async countFaculty() {
    return this.db.prepare('SELECT COUNT(*) AS count FROM faculty').get().count;
  }

  async createFaculty(data) {
    const res = this.db
      .prepare(
        `INSERT INTO faculty (department_id, full_name, designation, qualification, specialization, email, research_interests, is_demo_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.department_id,
        data.full_name,
        data.designation,
        data.qualification || null,
        data.specialization || null,
        data.email || null,
        data.research_interests || null,
        data.is_demo_data ? 1 : 0
      );
    const row = this.db.prepare('SELECT * FROM faculty WHERE id = ?').get(res.lastInsertRowid);
    return { ...row, is_demo_data: Boolean(row.is_demo_data) };
  }

  // ---- PLACEMENT INFORMATION ----
  async countPlacementInfo() {
    return this.db.prepare('SELECT COUNT(*) AS count FROM placement_information').get().count;
  }

  async createPlacementInfo(item) {
    const res = this.db
      .prepare(
        `INSERT INTO placement_information (category, title, academic_year, summary, details, is_verified_official, is_demo_data, published_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        item.category,
        item.title,
        item.academic_year || 'Current',
        item.summary,
        JSON.stringify(item.details || {}),
        item.is_verified_official ? 1 : 0,
        item.is_demo_data ? 1 : 0,
        item.published_by || null
      );
    const row = this.db.prepare('SELECT * FROM placement_information WHERE id = ?').get(res.lastInsertRowid);
    return {
      ...row,
      details: safeJsonParse(row.details, {}),
      is_verified_official: Boolean(row.is_verified_official),
      is_demo_data: Boolean(row.is_demo_data),
    };
  }

  async listPlacementInfo() {
    return this.db
      .prepare('SELECT * FROM placement_information ORDER BY id ASC')
      .all()
      .map((row) => ({
        ...row,
        details: safeJsonParse(row.details, {}),
        is_verified_official: Boolean(row.is_verified_official),
        is_demo_data: Boolean(row.is_demo_data),
      }));
  }

  // ---- CONVERSATIONS & MESSAGES ----
  async createConversation({ user_id = null, session_token = null, title = 'New Conversation', user_persona = 'prospective_student', language = 'en' }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO conversations (id, user_id, session_token, title, user_persona, language, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, user_id, session_token, title, user_persona, language, now, now);
    return this.getConversationById(id);
  }

  async getConversationById(id) {
    const row = this.db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
    if (!row) return null;
    return { ...row, is_archived: Boolean(row.is_archived) };
  }

  async listConversations({ user_id = null, session_token = null, limit = 30 }) {
    let rows = [];
    if (user_id) {
      rows = this.db
        .prepare(
          `SELECT c.*, (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count
           FROM conversations c
           WHERE c.user_id = ? AND c.is_archived = 0
           ORDER BY c.updated_at DESC
           LIMIT ?`
        )
        .all(user_id, limit);
    } else if (session_token) {
      rows = this.db
        .prepare(
          `SELECT c.*, (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count
           FROM conversations c
           WHERE c.session_token = ? AND c.user_id IS NULL AND c.is_archived = 0
           ORDER BY c.updated_at DESC
           LIMIT ?`
        )
        .all(session_token, limit);
    }
    return rows.map((r) => ({ ...r, is_archived: Boolean(r.is_archived) }));
  }

  async updateConversation(id, patch) {
    const fields = [];
    const values = [];
    if (patch.title !== undefined) {
      fields.push('title = ?');
      values.push(patch.title);
    }
    if (patch.user_persona !== undefined) {
      fields.push('user_persona = ?');
      values.push(patch.user_persona);
    }
    if (patch.language !== undefined) {
      fields.push('language = ?');
      values.push(patch.language);
    }
    if (patch.is_archived !== undefined) {
      fields.push('is_archived = ?');
      values.push(patch.is_archived ? 1 : 0);
    }
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    this.db.prepare(`UPDATE conversations SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getConversationById(id);
  }

  async deleteConversation(id) {
    this.db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
  }

  async createMessage(msg) {
    const id = msg.id || crypto.randomUUID();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO messages (id, conversation_id, sender, content, language, intent_category, sources, confidence_score, is_unanswered, model_used, token_usage, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        msg.conversation_id,
        msg.sender,
        msg.content,
        msg.language || 'en',
        msg.intent_category || null,
        JSON.stringify(msg.sources || []),
        msg.confidence_score ?? null,
        msg.is_unanswered ? 1 : 0,
        msg.model_used || null,
        msg.token_usage ? JSON.stringify(msg.token_usage) : null,
        now
      );
    this.db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, msg.conversation_id);
    return this.getMessageById(id);
  }

  async getMessageById(id) {
    const row = this.db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
    if (!row) return null;
    return {
      ...row,
      sources: safeJsonParse(row.sources, []),
      token_usage: safeJsonParse(row.token_usage, null),
      is_unanswered: Boolean(row.is_unanswered),
    };
  }

  async listMessages(conversationId) {
    const rows = this.db
      .prepare(
        `SELECT m.*, f.rating AS feedback_rating, f.comment AS feedback_comment
         FROM messages m
         LEFT JOIN feedback f ON f.message_id = m.id
         WHERE m.conversation_id = ?
         ORDER BY m.created_at ASC`
      )
      .all(conversationId);
    return rows.map((row) => ({
      ...row,
      sources: safeJsonParse(row.sources, []),
      token_usage: safeJsonParse(row.token_usage, null),
      is_unanswered: Boolean(row.is_unanswered),
    }));
  }

  async clearConversationMessages(conversationId) {
    this.db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(conversationId);
    this.db
      .prepare('UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?')
      .run('New Conversation', new Date().toISOString(), conversationId);
  }

  // ---- DOCUMENTS & VECTOR CHUNKS ----
  formatDocument(row) {
    if (!row) return null;
    return {
      ...row,
      is_verified_official: Boolean(row.is_verified_official),
    };
  }

  async countDocuments() {
    return this.db.prepare('SELECT COUNT(*) AS count FROM documents').get().count;
  }

  async createDocument(doc) {
    const id = doc.id || crypto.randomUUID();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO documents (id, title, original_filename, stored_filename, file_type, file_size_bytes, category, access_level, description, status, chunk_count, error_message, is_verified_official, uploaded_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        doc.title,
        doc.original_filename,
        doc.stored_filename,
        doc.file_type,
        doc.file_size_bytes || 0,
        doc.category || 'General',
        doc.access_level || 'public',
        doc.description || '',
        doc.status || 'pending',
        doc.chunk_count || 0,
        doc.error_message || null,
        doc.is_verified_official ? 1 : 0,
        doc.uploaded_by || null,
        now,
        now
      );
    return this.getDocumentById(id);
  }

  async getDocumentById(id) {
    const row = this.db
      .prepare(
        `SELECT d.*, u.full_name AS uploaded_by_name
         FROM documents d
         LEFT JOIN users u ON u.id = d.uploaded_by
         WHERE d.id = ?`
      )
      .get(id);
    return this.formatDocument(row);
  }

  async listDocuments({ allowedAccessLevels = null, category = null } = {}) {
    const clauses = [];
    const params = [];
    if (allowedAccessLevels && allowedAccessLevels.length > 0) {
      clauses.push(`d.access_level IN (${allowedAccessLevels.map(() => '?').join(',')})`);
      params.push(...allowedAccessLevels);
    }
    if (category && category !== 'All') {
      clauses.push('d.category = ?');
      params.push(category);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = this.db
      .prepare(
        `SELECT d.*, u.full_name AS uploaded_by_name
         FROM documents d
         LEFT JOIN users u ON u.id = d.uploaded_by
         ${where}
         ORDER BY d.created_at DESC`
      )
      .all(...params);
    return rows.map((r) => this.formatDocument(r));
  }

  async updateDocument(id, patch) {
    const fields = [];
    const values = [];
    for (const key of [
      'title',
      'original_filename',
      'stored_filename',
      'file_type',
      'file_size_bytes',
      'category',
      'access_level',
      'description',
      'status',
      'chunk_count',
      'error_message',
    ]) {
      if (patch[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(patch[key]);
      }
    }
    if (patch.is_verified_official !== undefined) {
      fields.push('is_verified_official = ?');
      values.push(patch.is_verified_official ? 1 : 0);
    }
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    this.db.prepare(`UPDATE documents SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.getDocumentById(id);
  }

  async deleteDocument(id) {
    this.db.prepare('DELETE FROM documents WHERE id = ?').run(id);
  }

  async replaceDocumentChunks(documentId, chunks) {
    this.db.prepare('DELETE FROM document_chunks WHERE document_id = ?').run(documentId);
    const stmt = this.db.prepare(
      `INSERT INTO document_chunks (id, document_id, chunk_index, content, token_estimate, metadata, embedding, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const now = new Date().toISOString();
    for (const ch of chunks) {
      stmt.run(
        crypto.randomUUID(),
        documentId,
        ch.chunk_index,
        ch.content,
        ch.token_estimate || 0,
        JSON.stringify(ch.metadata || {}),
        JSON.stringify(ch.embedding || []),
        now
      );
    }
  }

  async listDocumentChunks(documentId) {
    return this.db
      .prepare('SELECT id, document_id, chunk_index, content, token_estimate, metadata, created_at FROM document_chunks WHERE document_id = ? ORDER BY chunk_index ASC')
      .all(documentId)
      .map((r) => ({ ...r, metadata: safeJsonParse(r.metadata, {}) }));
  }

  async searchSimilarChunks({ queryEmbedding, queryText = '', allowedAccessLevels = ['public'], topK = 5 }) {
    const placeholders = allowedAccessLevels.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT c.id, c.document_id, c.chunk_index, c.content, c.metadata, c.embedding,
                d.title AS document_title, d.category AS document_category,
                d.access_level, d.is_verified_official, d.original_filename
         FROM document_chunks c
         JOIN documents d ON d.id = c.document_id
         WHERE d.status = 'indexed' AND d.access_level IN (${placeholders})`
      )
      .all(...allowedAccessLevels);

    const queryTokens = (queryText || '')
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((t) => t.length >= 2);

    const scored = rows.map((row) => {
      const emb = safeJsonParse(row.embedding, []);
      const vecSim = cosineSimilarity(queryEmbedding, emb);

      // Hybrid lexical boost for exact institutional terms & acronyms (CSE, TNEA, M.E., etc.)
      let lexicalScore = 0;
      if (queryTokens.length > 0) {
        const hay = `${row.document_title} ${row.document_category} ${row.content}`.toLowerCase();
        let hits = 0;
        for (const tok of queryTokens) {
          if (hay.includes(tok)) hits += 1;
        }
        lexicalScore = hits / queryTokens.length;
      }

      // Verified official docs receive a small priority bonus over unverified starter docs
      const officialBonus = row.is_verified_official ? 0.06 : 0;
      const similarity = Math.min(1, vecSim * 0.65 + lexicalScore * 0.35 + officialBonus);

      return {
        id: row.id,
        document_id: row.document_id,
        chunk_index: row.chunk_index,
        content: row.content,
        metadata: safeJsonParse(row.metadata, {}),
        document_title: row.document_title,
        document_category: row.document_category,
        access_level: row.access_level,
        is_verified_official: Boolean(row.is_verified_official),
        original_filename: row.original_filename,
        similarity: Number(similarity.toFixed(4)),
      };
    });

    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  }

  // ---- ADMISSION ENQUIRIES ----
  async createAdmissionEnquiry(data) {
    const id = crypto.randomUUID();
    const reference_code = `NSCET-ADM-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO admission_enquiries
         (id, reference_code, full_name, email, phone, city_district, programme_level, preferred_department, admission_mode, qualification_details, message, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`
      )
      .run(
        id,
        reference_code,
        data.full_name,
        data.email,
        data.phone,
        data.city_district || null,
        data.programme_level || 'UG',
        data.preferred_department,
        data.admission_mode || 'TNEA Counselling',
        data.qualification_details || null,
        data.message || null,
        now,
        now
      );
    return this.db.prepare('SELECT * FROM admission_enquiries WHERE id = ?').get(id);
  }

  async listAdmissionEnquiries({ status = null } = {}) {
    if (status && status !== 'all') {
      return this.db
        .prepare('SELECT * FROM admission_enquiries WHERE status = ? ORDER BY created_at DESC')
        .all(status);
    }
    return this.db.prepare('SELECT * FROM admission_enquiries ORDER BY created_at DESC').all();
  }

  async updateAdmissionEnquiry(id, patch) {
    const fields = [];
    const values = [];
    if (patch.status !== undefined) {
      fields.push('status = ?');
      values.push(patch.status);
    }
    if (patch.admin_notes !== undefined) {
      fields.push('admin_notes = ?');
      values.push(patch.admin_notes);
    }
    if (patch.assigned_to !== undefined) {
      fields.push('assigned_to = ?');
      values.push(patch.assigned_to);
    }
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    this.db.prepare(`UPDATE admission_enquiries SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.db.prepare('SELECT * FROM admission_enquiries WHERE id = ?').get(id);
  }

  // ---- FEEDBACK ----
  async upsertFeedback({ message_id, conversation_id, user_id = null, rating, comment = null }) {
    const existing = this.db.prepare('SELECT id FROM feedback WHERE message_id = ?').get(message_id);
    if (existing) {
      this.db
        .prepare('UPDATE feedback SET rating = ?, comment = ?, user_id = COALESCE(?, user_id) WHERE id = ?')
        .run(rating, comment, user_id, existing.id);
      return this.db.prepare('SELECT * FROM feedback WHERE id = ?').get(existing.id);
    }
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO feedback (id, message_id, conversation_id, user_id, rating, comment, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, message_id, conversation_id, user_id, rating, comment, now);
    return this.db.prepare('SELECT * FROM feedback WHERE id = ?').get(id);
  }

  async listFeedback(limit = 100) {
    return this.db
      .prepare(
        `SELECT f.*, m.content AS assistant_reply, m.intent_category, u.full_name AS user_name, u.email AS user_email
         FROM feedback f
         JOIN messages m ON m.id = f.message_id
         LEFT JOIN users u ON u.id = f.user_id
         ORDER BY f.created_at DESC
         LIMIT ?`
      )
      .all(limit);
  }

  // ---- AUDIT LOGS ----
  async createAuditLog({ user_id = null, user_email = null, user_role = null, action, resource_type, resource_id = null, ip_address = null, details = {} }) {
    this.db
      .prepare(
        `INSERT INTO audit_logs (user_id, user_email, user_role, action, resource_type, resource_id, ip_address, details, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        user_id,
        user_email,
        user_role,
        action,
        resource_type,
        resource_id ? String(resource_id) : null,
        ip_address,
        JSON.stringify(details || {}),
        new Date().toISOString()
      );
  }

  async listAuditLogs(limit = 100) {
    return this.db
      .prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?')
      .all(limit)
      .map((r) => ({ ...r, details: safeJsonParse(r.details, {}) }));
  }

  // ---- ADMIN ANALYTICS ----
  async getAdminAnalytics() {
    const totalUsers = this.db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
    const totalConversations = this.db.prepare('SELECT COUNT(*) AS count FROM conversations').get().count;
    const totalUserMessages = this.db.prepare("SELECT COUNT(*) AS count FROM messages WHERE sender = 'user'").get().count;
    const todayPrefix = new Date().toISOString().slice(0, 10);
    const dailyEnquiries = this.db
      .prepare("SELECT COUNT(*) AS count FROM messages WHERE sender = 'user' AND created_at LIKE ?")
      .get(`${todayPrefix}%`).count;
    const totalAdmissionLeads = this.db.prepare('SELECT COUNT(*) AS count FROM admission_enquiries').get().count;
    const newAdmissionLeads = this.db
      .prepare("SELECT COUNT(*) AS count FROM admission_enquiries WHERE status = 'new'")
      .get().count;
    const totalDocuments = this.db.prepare('SELECT COUNT(*) AS count FROM documents').get().count;
    const indexedDocuments = this.db
      .prepare("SELECT COUNT(*) AS count FROM documents WHERE status = 'indexed'")
      .get().count;
    const totalChunks = this.db.prepare('SELECT COUNT(*) AS count FROM document_chunks').get().count;

    const feedbackCounts = this.db
      .prepare(
        `SELECT
           SUM(CASE WHEN rating = 'helpful' THEN 1 ELSE 0 END) AS helpful,
           SUM(CASE WHEN rating = 'not_helpful' THEN 1 ELSE 0 END) AS not_helpful,
           COUNT(*) AS total
         FROM feedback`
      )
      .get();

    const frequentQuestions = this.db
      .prepare(
        `SELECT TRIM(content) AS question, COUNT(*) AS count, MAX(created_at) AS last_asked
         FROM messages
         WHERE sender = 'user'
         GROUP BY LOWER(TRIM(content))
         ORDER BY count DESC, last_asked DESC
         LIMIT 10`
      )
      .all();

    const unansweredQuestions = this.db
      .prepare(
        `SELECT a.id, a.conversation_id, a.created_at, a.confidence_score, a.intent_category,
                (SELECT u.content FROM messages u
                 WHERE u.conversation_id = a.conversation_id AND u.sender = 'user' AND u.created_at <= a.created_at
                 ORDER BY u.created_at DESC LIMIT 1) AS user_question
         FROM messages a
         WHERE a.sender = 'assistant' AND a.is_unanswered = 1
         ORDER BY a.created_at DESC
         LIMIT 20`
      )
      .all();

    const intentBreakdown = this.db
      .prepare(
        `SELECT COALESCE(intent_category, 'general') AS category, COUNT(*) AS count
         FROM messages
         WHERE sender = 'assistant'
         GROUP BY COALESCE(intent_category, 'general')
         ORDER BY count DESC`
      )
      .all();

    const dailyTrend = this.db
      .prepare(
        `SELECT SUBSTR(created_at, 1, 10) AS date, COUNT(*) AS queries
         FROM messages
         WHERE sender = 'user'
         GROUP BY SUBSTR(created_at, 1, 10)
         ORDER BY date DESC
         LIMIT 14`
      )
      .all()
      .reverse();

    const helpful = Number(feedbackCounts.helpful || 0);
    const notHelpful = Number(feedbackCounts.not_helpful || 0);
    const totalFeedback = Number(feedbackCounts.total || 0);

    return {
      kpis: {
        totalUsers,
        totalConversations,
        totalUserMessages,
        dailyEnquiries,
        totalAdmissionLeads,
        newAdmissionLeads,
        totalDocuments,
        indexedDocuments,
        totalChunks,
        helpfulFeedback: helpful,
        notHelpfulFeedback: notHelpful,
        helpfulRate: totalFeedback > 0 ? Math.round((helpful / totalFeedback) * 100) : 100,
        unansweredCount: unansweredQuestions.length,
      },
      frequentQuestions,
      unansweredQuestions,
      intentBreakdown,
      dailyTrend,
    };
  }
}
