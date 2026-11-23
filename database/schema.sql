-- ============================================================================
-- NSCET AI COLLEGE ASSISTANT CHATBOT - PRODUCTION POSTGRESQL SCHEMA
-- Institution: Nadar Saraswathi College of Engineering & Technology (NSCET)
-- Location: Vadapudupatti, Theni, Tamil Nadu
-- Engine: PostgreSQL 15+ with pgvector extension
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ----------------------------------------------------------------------------
-- 1. ROLES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. DEPARTMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    degree_level VARCHAR(50) NOT NULL DEFAULT 'UG', -- UG, PG, UG/PG, S&H
    overview TEXT NOT NULL,
    courses_offered JSONB NOT NULL DEFAULT '[]'::jsonb,
    laboratories JSONB NOT NULL DEFAULT '[]'::jsonb,
    events JSONB NOT NULL DEFAULT '[]'::jsonb,
    workshops JSONB NOT NULL DEFAULT '[]'::jsonb,
    industrial_visits JSONB NOT NULL DEFAULT '[]'::jsonb,
    student_achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
    research_activities JSONB NOT NULL DEFAULT '[]'::jsonb,
    contact_email VARCHAR(150),
    is_demo_data BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. USERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    register_number VARCHAR(50) UNIQUE,
    academic_year VARCHAR(20),
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);

-- ----------------------------------------------------------------------------
-- 4. CONVERSATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_token VARCHAR(120),
    title VARCHAR(255) NOT NULL DEFAULT 'New Conversation',
    user_persona VARCHAR(50) NOT NULL DEFAULT 'prospective_student',
    language VARCHAR(20) NOT NULL DEFAULT 'en',
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_session_token ON conversations(session_token);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- ----------------------------------------------------------------------------
-- 5. MESSAGES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    language VARCHAR(20) NOT NULL DEFAULT 'en',
    intent_category VARCHAR(80),
    sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence_score REAL,
    is_unanswered BOOLEAN NOT NULL DEFAULT FALSE,
    model_used VARCHAR(80),
    token_usage JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_unanswered ON messages(is_unanswered) WHERE is_unanswered = TRUE;
CREATE INDEX IF NOT EXISTS idx_messages_intent_category ON messages(intent_category);

-- ----------------------------------------------------------------------------
-- 6. DOCUMENTS TABLE (RAG KNOWLEDGE BASE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('pdf', 'docx', 'txt', 'md')),
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    category VARCHAR(80) NOT NULL DEFAULT 'General',
    access_level VARCHAR(30) NOT NULL DEFAULT 'public'
        CHECK (access_level IN ('public', 'student', 'faculty', 'admin')),
    description TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'indexed', 'failed')),
    chunk_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    is_verified_official BOOLEAN NOT NULL DEFAULT FALSE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_access_level ON documents(access_level);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- ----------------------------------------------------------------------------
-- 7. DOCUMENT_CHUNKS TABLE (PGVECTOR EMBEDDINGS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_estimate INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
-- HNSW index for fast cosine similarity search in pgvector
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
    ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- ----------------------------------------------------------------------------
-- 8. ADMISSION_ENQUIRIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admission_enquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_code VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    city_district VARCHAR(120),
    programme_level VARCHAR(30) NOT NULL DEFAULT 'UG', -- UG or PG
    preferred_department VARCHAR(120) NOT NULL,
    admission_mode VARCHAR(50) NOT NULL DEFAULT 'TNEA Counselling',
    qualification_details VARCHAR(255),
    message TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'contacted', 'counselled', 'admitted', 'closed')),
    admin_notes TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admission_enquiries_status ON admission_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_admission_enquiries_created_at ON admission_enquiries(created_at DESC);

-- ----------------------------------------------------------------------------
-- 9. FEEDBACK TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rating VARCHAR(20) NOT NULL CHECK (rating IN ('helpful', 'not_helpful')),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_message_id ON feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- ----------------------------------------------------------------------------
-- 10. FACULTY TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faculty (
    id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    designation VARCHAR(120) NOT NULL,
    qualification VARCHAR(150),
    specialization VARCHAR(255),
    email VARCHAR(180),
    research_interests TEXT,
    is_demo_data BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faculty_department_id ON faculty(department_id);

-- ----------------------------------------------------------------------------
-- 11. PLACEMENT_INFORMATION TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS placement_information (
    id SERIAL PRIMARY KEY,
    category VARCHAR(60) NOT NULL
        CHECK (category IN ('training', 'internship', 'recruitment_update', 'guidance', 'statistics')),
    title VARCHAR(200) NOT NULL,
    academic_year VARCHAR(20),
    summary TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_verified_official BOOLEAN NOT NULL DEFAULT FALSE,
    is_demo_data BOOLEAN NOT NULL DEFAULT TRUE,
    published_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placement_info_category ON placement_information(category);

-- ----------------------------------------------------------------------------
-- 12. AUDIT_LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(180),
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    resource_id VARCHAR(120),
    ip_address VARCHAR(64),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
