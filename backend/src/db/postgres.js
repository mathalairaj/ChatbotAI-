import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

/**
 * Production PostgreSQL + pgvector adapter.
 * Activated automatically when DATABASE_URL is configured in backend/.env.
 */
export class PostgresAdapter {
  constructor(connectionString = env.databaseUrl) {
    this.connectionString = connectionString;
    this.engine = 'postgresql';
    this.pool = null;
  }

  async init() {
    const pgMod = await import('pg');
    const Pool = pgMod.Pool || pgMod.default?.Pool;
    this.pool = new Pool({
      connectionString: this.connectionString,
      ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
    });

    // Apply schema.sql idempotently on first boot
    const schemaPath = path.resolve(env.backendRoot, '../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await this.pool.query(schemaSql);
    }
  }

  async query(sql, params = []) {
    return this.pool.query(sql, params);
  }

  async upsertRole({ name, description, permissions }) {
    const res = await this.query(
      `INSERT INTO roles (name, description, permissions)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
       RETURNING *`,
      [name, description, JSON.stringify(permissions || [])]
    );
    return res.rows[0];
  }

  async getRoleByName(name) {
    const res = await this.query('SELECT * FROM roles WHERE name = $1', [name]);
    return res.rows[0] || null;
  }

  async listRoles() {
    const res = await this.query('SELECT * FROM roles ORDER BY id ASC');
    return res.rows;
  }

  formatUser(row) {
    if (!row) return null;
    return {
      ...row,
      role: row.role_name,
    };
  }

  async findUserByEmail(email) {
    const res = await this.query(
      `SELECT u.*, r.name AS role_name, d.code AS department_code, d.name AS department_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );
    return this.formatUser(res.rows[0]);
  }

  async findUserById(id) {
    const res = await this.query(
      `SELECT u.*, r.name AS role_name, d.code AS department_code, d.name AS department_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.id = $1`,
      [id]
    );
    return this.formatUser(res.rows[0]);
  }

  async createUser(data) {
    const res = await this.query(
      `INSERT INTO users (role_id, department_id, full_name, email, password_hash, register_number, academic_year, phone, is_active)
       VALUES ($1, $2, $3, LOWER($4), $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        data.role_id,
        data.department_id || null,
        data.full_name,
        data.email,
        data.password_hash,
        data.register_number || null,
        data.academic_year || null,
        data.phone || null,
        data.is_active !== false,
      ]
    );
    return this.findUserById(res.rows[0].id);
  }

  async updateUserLogin(id) {
    await this.query('UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1', [id]);
  }

  async updateUser(id, patch) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of ['role_id', 'department_id', 'full_name', 'is_active', 'academic_year', 'phone']) {
      if (patch[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(patch[key]);
      }
    }
    if (!fields.length) return this.findUserById(id);
    fields.push('updated_at = NOW()');
    values.push(id);
    await this.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`, values);
    return this.findUserById(id);
  }

  async listUsers() {
    const res = await this.query(
      `SELECT u.id, u.role_id, r.name AS role, u.department_id, d.code AS department_code, d.name AS department_name,
              u.full_name, u.email, u.register_number, u.academic_year, u.phone, u.is_active, u.last_login_at, u.created_at
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN departments d ON d.id = u.department_id
       ORDER BY u.created_at DESC`
    );
    return res.rows;
  }

  async upsertDepartment(dept) {
    const res = await this.query(
      `INSERT INTO departments
       (code, name, degree_level, overview, courses_offered, laboratories, events, workshops, industrial_visits, student_achievements, research_activities, contact_email, is_demo_data)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`,
      [
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
        Boolean(dept.is_demo_data),
      ]
    );
    return res.rows[0];
  }

  async listDepartments() {
    const depts = (await this.query('SELECT * FROM departments ORDER BY id ASC')).rows;
    const faculty = (await this.query('SELECT * FROM faculty ORDER BY id ASC')).rows;
    const facMap = new Map();
    for (const f of faculty) {
      if (!facMap.has(f.department_id)) facMap.set(f.department_id, []);
      facMap.get(f.department_id).push(f);
    }
    return depts.map((d) => ({ ...d, faculty: facMap.get(d.id) || [] }));
  }

  async getDepartmentByCode(code) {
    const res = await this.query('SELECT * FROM departments WHERE UPPER(code) = UPPER($1)', [code]);
    if (!res.rows[0]) return null;
    const dept = res.rows[0];
    const fac = (await this.query('SELECT * FROM faculty WHERE department_id = $1 ORDER BY id ASC', [dept.id])).rows;
    return { ...dept, faculty: fac };
  }

  async countFaculty() {
    const res = await this.query('SELECT COUNT(*)::int AS count FROM faculty');
    return res.rows[0].count;
  }

  async createFaculty(data) {
    const res = await this.query(
      `INSERT INTO faculty (department_id, full_name, designation, qualification, specialization, email, research_interests, is_demo_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        data.department_id,
        data.full_name,
        data.designation,
        data.qualification || null,
        data.specialization || null,
        data.email || null,
        data.research_interests || null,
        Boolean(data.is_demo_data),
      ]
    );
    return res.rows[0];
  }

  async countPlacementInfo() {
    const res = await this.query('SELECT COUNT(*)::int AS count FROM placement_information');
    return res.rows[0].count;
  }

  async createPlacementInfo(item) {
    const res = await this.query(
      `INSERT INTO placement_information (category, title, academic_year, summary, details, is_verified_official, is_demo_data, published_by)
       VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8) RETURNING *`,
      [
        item.category,
        item.title,
        item.academic_year || 'Current',
        item.summary,
        JSON.stringify(item.details || {}),
        Boolean(item.is_verified_official),
        Boolean(item.is_demo_data),
        item.published_by || null,
      ]
    );
    return res.rows[0];
  }

  async listPlacementInfo() {
    return (await this.query('SELECT * FROM placement_information ORDER BY id ASC')).rows;
  }

  async createConversation({ user_id = null, session_token = null, title = 'New Conversation', user_persona = 'prospective_student', language = 'en' }) {
    const res = await this.query(
      `INSERT INTO conversations (user_id, session_token, title, user_persona, language)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [user_id, session_token, title, user_persona, language]
    );
    return res.rows[0];
  }

  async getConversationById(id) {
    const res = await this.query('SELECT * FROM conversations WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async listConversations({ user_id = null, session_token = null, limit = 30 }) {
    if (user_id) {
      return (
        await this.query(
          `SELECT c.*, (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id = c.id) AS message_count
           FROM conversations c WHERE c.user_id = $1 AND c.is_archived = FALSE
           ORDER BY c.updated_at DESC LIMIT $2`,
          [user_id, limit]
        )
      ).rows;
    }
    if (session_token) {
      return (
        await this.query(
          `SELECT c.*, (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id = c.id) AS message_count
           FROM conversations c WHERE c.session_token = $1 AND c.user_id IS NULL AND c.is_archived = FALSE
           ORDER BY c.updated_at DESC LIMIT $2`,
          [session_token, limit]
        )
      ).rows;
    }
    return [];
  }

  async updateConversation(id, patch) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of ['title', 'user_persona', 'language', 'is_archived']) {
      if (patch[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(patch[key]);
      }
    }
    fields.push('updated_at = NOW()');
    values.push(id);
    const res = await this.query(`UPDATE conversations SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    return res.rows[0];
  }

  async deleteConversation(id) {
    await this.query('DELETE FROM conversations WHERE id = $1', [id]);
  }

  async createMessage(msg) {
    const res = await this.query(
      `INSERT INTO messages (conversation_id, sender, content, language, intent_category, sources, confidence_score, is_unanswered, model_used, token_usage)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10::jsonb) RETURNING *`,
      [
        msg.conversation_id,
        msg.sender,
        msg.content,
        msg.language || 'en',
        msg.intent_category || null,
        JSON.stringify(msg.sources || []),
        msg.confidence_score ?? null,
        Boolean(msg.is_unanswered),
        msg.model_used || null,
        msg.token_usage ? JSON.stringify(msg.token_usage) : null,
      ]
    );
    await this.query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [msg.conversation_id]);
    return res.rows[0];
  }

  async getMessageById(id) {
    const res = await this.query('SELECT * FROM messages WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async listMessages(conversationId) {
    const res = await this.query(
      `SELECT m.*, f.rating AS feedback_rating, f.comment AS feedback_comment
       FROM messages m
       LEFT JOIN feedback f ON f.message_id = m.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [conversationId]
    );
    return res.rows;
  }

  async clearConversationMessages(conversationId) {
    await this.query('DELETE FROM messages WHERE conversation_id = $1', [conversationId]);
    await this.query("UPDATE conversations SET title = 'New Conversation', updated_at = NOW() WHERE id = $1", [conversationId]);
  }

  async countDocuments() {
    const res = await this.query('SELECT COUNT(*)::int AS count FROM documents');
    return res.rows[0].count;
  }

  async createDocument(doc) {
    const res = await this.query(
      `INSERT INTO documents (title, original_filename, stored_filename, file_type, file_size_bytes, category, access_level, description, status, chunk_count, error_message, is_verified_official, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
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
        Boolean(doc.is_verified_official),
        doc.uploaded_by || null,
      ]
    );
    return res.rows[0];
  }

  async getDocumentById(id) {
    const res = await this.query(
      `SELECT d.*, u.full_name AS uploaded_by_name
       FROM documents d LEFT JOIN users u ON u.id = d.uploaded_by WHERE d.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async listDocuments({ allowedAccessLevels = null, category = null } = {}) {
    const clauses = [];
    const params = [];
    let idx = 1;
    if (allowedAccessLevels?.length) {
      clauses.push(`d.access_level = ANY($${idx++}::text[])`);
      params.push(allowedAccessLevels);
    }
    if (category && category !== 'All') {
      clauses.push(`d.category = $${idx++}`);
      params.push(category);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const res = await this.query(
      `SELECT d.*, u.full_name AS uploaded_by_name
       FROM documents d LEFT JOIN users u ON u.id = d.uploaded_by
       ${where}
       ORDER BY d.created_at DESC`,
      params
    );
    return res.rows;
  }

  async updateDocument(id, patch) {
    const fields = [];
    const values = [];
    let idx = 1;
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
      'is_verified_official',
    ]) {
      if (patch[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(patch[key]);
      }
    }
    fields.push('updated_at = NOW()');
    values.push(id);
    const res = await this.query(`UPDATE documents SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    return res.rows[0];
  }

  async deleteDocument(id) {
    await this.query('DELETE FROM documents WHERE id = $1', [id]);
  }

  async replaceDocumentChunks(documentId, chunks) {
    await this.query('DELETE FROM document_chunks WHERE document_id = $1', [documentId]);
    for (const ch of chunks) {
      const vecLiteral = `[${(ch.embedding || []).join(',')}]`;
      await this.query(
        `INSERT INTO document_chunks (document_id, chunk_index, content, token_estimate, metadata, embedding)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::vector)`,
        [documentId, ch.chunk_index, ch.content, ch.token_estimate || 0, JSON.stringify(ch.metadata || {}), vecLiteral]
      );
    }
  }

  async listDocumentChunks(documentId) {
    const res = await this.query(
      'SELECT id, document_id, chunk_index, content, token_estimate, metadata, created_at FROM document_chunks WHERE document_id = $1 ORDER BY chunk_index ASC',
      [documentId]
    );
    return res.rows;
  }

  async searchSimilarChunks({ queryEmbedding, allowedAccessLevels = ['public'], topK = 5 }) {
    const vecLiteral = `[${queryEmbedding.join(',')}]`;
    const res = await this.query(
      `SELECT c.id, c.document_id, c.chunk_index, c.content, c.metadata,
              d.title AS document_title, d.category AS document_category,
              d.access_level, d.is_verified_official, d.original_filename,
              ROUND((1 - (c.embedding <=> $1::vector))::numeric, 4)::float AS similarity
       FROM document_chunks c
       JOIN documents d ON d.id = c.document_id
       WHERE d.status = 'indexed' AND d.access_level = ANY($2::text[])
       ORDER BY c.embedding <=> $1::vector ASC
       LIMIT $3`,
      [vecLiteral, allowedAccessLevels, topK]
    );
    return res.rows;
  }

  async createAdmissionEnquiry(data) {
    const reference_code = `NSCET-ADM-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const res = await this.query(
      `INSERT INTO admission_enquiries
       (reference_code, full_name, email, phone, city_district, programme_level, preferred_department, admission_mode, qualification_details, message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
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
      ]
    );
    return res.rows[0];
  }

  async listAdmissionEnquiries({ status = null } = {}) {
    if (status && status !== 'all') {
      return (await this.query('SELECT * FROM admission_enquiries WHERE status = $1 ORDER BY created_at DESC', [status])).rows;
    }
    return (await this.query('SELECT * FROM admission_enquiries ORDER BY created_at DESC')).rows;
  }

  async updateAdmissionEnquiry(id, patch) {
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of ['status', 'admin_notes', 'assigned_to']) {
      if (patch[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(patch[key]);
      }
    }
    fields.push('updated_at = NOW()');
    values.push(id);
    const res = await this.query(`UPDATE admission_enquiries SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    return res.rows[0];
  }

  async upsertFeedback({ message_id, conversation_id, user_id = null, rating, comment = null }) {
    const existing = await this.query('SELECT id FROM feedback WHERE message_id = $1', [message_id]);
    if (existing.rows[0]) {
      const res = await this.query(
        'UPDATE feedback SET rating = $1, comment = $2 WHERE id = $3 RETURNING *',
        [rating, comment, existing.rows[0].id]
      );
      return res.rows[0];
    }
    const res = await this.query(
      `INSERT INTO feedback (message_id, conversation_id, user_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [message_id, conversation_id, user_id, rating, comment]
    );
    return res.rows[0];
  }

  async listFeedback(limit = 100) {
    return (
      await this.query(
        `SELECT f.*, m.content AS assistant_reply, m.intent_category, u.full_name AS user_name, u.email AS user_email
         FROM feedback f
         JOIN messages m ON m.id = f.message_id
         LEFT JOIN users u ON u.id = f.user_id
         ORDER BY f.created_at DESC LIMIT $1`,
        [limit]
      )
    ).rows;
  }

  async createAuditLog({ user_id = null, user_email = null, user_role = null, action, resource_type, resource_id = null, ip_address = null, details = {} }) {
    await this.query(
      `INSERT INTO audit_logs (user_id, user_email, user_role, action, resource_type, resource_id, ip_address, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
      [user_id, user_email, user_role, action, resource_type, resource_id ? String(resource_id) : null, ip_address, JSON.stringify(details || {})]
    );
  }

  async listAuditLogs(limit = 100) {
    return (await this.query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT $1', [limit])).rows;
  }

  async getAdminAnalytics() {
    const [
      usersRes,
      convRes,
      msgRes,
      dailyRes,
      leadsRes,
      newLeadsRes,
      docsRes,
      indexedRes,
      chunksRes,
      fbRes,
      faqRes,
      unansweredRes,
      intentRes,
      trendRes,
    ] = await Promise.all([
      this.query('SELECT COUNT(*)::int AS count FROM users'),
      this.query('SELECT COUNT(*)::int AS count FROM conversations'),
      this.query("SELECT COUNT(*)::int AS count FROM messages WHERE sender = 'user'"),
      this.query("SELECT COUNT(*)::int AS count FROM messages WHERE sender = 'user' AND created_at::date = CURRENT_DATE"),
      this.query('SELECT COUNT(*)::int AS count FROM admission_enquiries'),
      this.query("SELECT COUNT(*)::int AS count FROM admission_enquiries WHERE status = 'new'"),
      this.query('SELECT COUNT(*)::int AS count FROM documents'),
      this.query("SELECT COUNT(*)::int AS count FROM documents WHERE status = 'indexed'"),
      this.query('SELECT COUNT(*)::int AS count FROM document_chunks'),
      this.query(
        `SELECT
           COALESCE(SUM(CASE WHEN rating = 'helpful' THEN 1 ELSE 0 END), 0)::int AS helpful,
           COALESCE(SUM(CASE WHEN rating = 'not_helpful' THEN 1 ELSE 0 END), 0)::int AS not_helpful,
           COUNT(*)::int AS total
         FROM feedback`
      ),
      this.query(
        `SELECT TRIM(content) AS question, COUNT(*)::int AS count, MAX(created_at) AS last_asked
         FROM messages WHERE sender = 'user'
         GROUP BY LOWER(TRIM(content)), TRIM(content)
         ORDER BY count DESC, last_asked DESC LIMIT 10`
      ),
      this.query(
        `SELECT a.id, a.conversation_id, a.created_at, a.confidence_score, a.intent_category,
                (SELECT u.content FROM messages u
                 WHERE u.conversation_id = a.conversation_id AND u.sender = 'user' AND u.created_at <= a.created_at
                 ORDER BY u.created_at DESC LIMIT 1) AS user_question
         FROM messages a WHERE a.sender = 'assistant' AND a.is_unanswered = TRUE
         ORDER BY a.created_at DESC LIMIT 20`
      ),
      this.query(
        `SELECT COALESCE(intent_category, 'general') AS category, COUNT(*)::int AS count
         FROM messages WHERE sender = 'assistant'
         GROUP BY COALESCE(intent_category, 'general') ORDER BY count DESC`
      ),
      this.query(
        `SELECT TO_CHAR(created_at::date, 'YYYY-MM-DD') AS date, COUNT(*)::int AS queries
         FROM messages WHERE sender = 'user'
         GROUP BY created_at::date ORDER BY created_at::date DESC LIMIT 14`
      ),
    ]);

    const fb = fbRes.rows[0];
    return {
      kpis: {
        totalUsers: usersRes.rows[0].count,
        totalConversations: convRes.rows[0].count,
        totalUserMessages: msgRes.rows[0].count,
        dailyEnquiries: dailyRes.rows[0].count,
        totalAdmissionLeads: leadsRes.rows[0].count,
        newAdmissionLeads: newLeadsRes.rows[0].count,
        totalDocuments: docsRes.rows[0].count,
        indexedDocuments: indexedRes.rows[0].count,
        totalChunks: chunksRes.rows[0].count,
        helpfulFeedback: fb.helpful,
        notHelpfulFeedback: fb.not_helpful,
        helpfulRate: fb.total > 0 ? Math.round((fb.helpful / fb.total) * 100) : 100,
        unansweredCount: unansweredRes.rows.length,
      },
      frequentQuestions: faqRes.rows,
      unansweredQuestions: unansweredRes.rows,
      intentBreakdown: intentRes.rows,
      dailyTrend: trendRes.rows.reverse(),
    };
  }
}
