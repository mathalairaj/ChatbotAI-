import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { getDb } from '../db/index.js';
import { extractDocumentText } from './documentExtractor.js';
import { chunkText } from './chunker.js';
import { generateEmbeddings, generateSingleEmbedding } from './embeddingService.js';
import { getAllowedDocumentAccessLevels } from '../middleware/auth.js';

/**
 * Indexes raw text directly into the documents + document_chunks tables (used for starter references).
 */
export async function indexTextAsDocument({
  db = getDb(),
  title,
  category = 'General',
  accessLevel = 'public',
  description = '',
  content,
  isVerifiedOfficial = false,
  uploadedBy = null,
}) {
  const safeSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48);
  const doc = await db.createDocument({
    title,
    original_filename: `${safeSlug}.md`,
    stored_filename: `seed-${safeSlug}.md`,
    file_type: 'md',
    file_size_bytes: Buffer.byteLength(content, 'utf8'),
    category,
    access_level: accessLevel,
    description,
    status: 'processing',
    is_verified_official: isVerifiedOfficial,
    uploaded_by: uploadedBy,
  });

  const chunks = chunkText(content, {
    metadata: { title, category, access_level: accessLevel },
  });
  const embeddings = await generateEmbeddings(chunks.map((c) => `${title}\n${c.content}`));
  const enriched = chunks.map((c, idx) => ({ ...c, embedding: embeddings[idx] }));

  await db.replaceDocumentChunks(doc.id, enriched);
  return db.updateDocument(doc.id, {
    status: 'indexed',
    chunk_count: enriched.length,
    error_message: null,
  });
}

/**
 * Full RAG ingestion workflow for Admin-uploaded PDF / DOCX / TXT / MD files:
 * 1. Save metadata -> 2. Extract text -> 3. Chunk -> 4. Generate embeddings -> 5. Store vectors -> 6. Mark indexed.
 */
export async function ingestUploadedDocument({
  file,
  title,
  category = 'General',
  accessLevel = 'public',
  description = '',
  isVerifiedOfficial = true,
  uploadedBy = null,
}) {
  const db = getDb();
  const ext = path.extname(file.originalname || '').replace('.', '').toLowerCase() || 'txt';

  const doc = await db.createDocument({
    title: (title || file.originalname).trim(),
    original_filename: file.originalname,
    stored_filename: file.filename,
    file_type: ext,
    file_size_bytes: file.size || 0,
    category,
    access_level: accessLevel,
    description,
    status: 'processing',
    is_verified_official: isVerifiedOfficial,
    uploaded_by: uploadedBy,
  });

  return processDocumentFile({ db, doc, filePath: file.path });
}

export async function replaceUploadedDocument({
  documentId,
  file,
  title,
  category,
  accessLevel,
  description,
  isVerifiedOfficial,
}) {
  const db = getDb();
  const existing = await db.getDocumentById(documentId);
  if (!existing) {
    const err = new Error('Document not found.');
    err.statusCode = 404;
    throw err;
  }

  // Delete previous stored file safely if present in uploadsDir
  removeStoredFile(existing.stored_filename);

  const ext = path.extname(file.originalname || '').replace('.', '').toLowerCase() || 'txt';
  const updated = await db.updateDocument(documentId, {
    title: title ? title.trim() : existing.title,
    original_filename: file.originalname,
    stored_filename: file.filename,
    file_type: ext,
    file_size_bytes: file.size || 0,
    category: category || existing.category,
    access_level: accessLevel || existing.access_level,
    description: description !== undefined ? description : existing.description,
    is_verified_official: isVerifiedOfficial !== undefined ? isVerifiedOfficial : existing.is_verified_official,
    status: 'processing',
    error_message: null,
  });

  return processDocumentFile({ db, doc: updated, filePath: file.path });
}

async function processDocumentFile({ db, doc, filePath }) {
  try {
    const text = await extractDocumentText(filePath, doc.file_type);
    if (!text || text.trim().length < 20) {
      throw new Error('Extracted text is empty or too short (minimum 20 characters required).');
    }

    const chunks = chunkText(text, {
      metadata: {
        title: doc.title,
        category: doc.category,
        filename: doc.original_filename,
        access_level: doc.access_level,
      },
    });

    if (chunks.length === 0) {
      throw new Error('Document produced zero text chunks.');
    }

    const embeddings = await generateEmbeddings(
      chunks.map((c) => `${doc.title} (${doc.category})\n${c.content}`)
    );
    const enriched = chunks.map((c, idx) => ({
      ...c,
      embedding: embeddings[idx],
    }));

    await db.replaceDocumentChunks(doc.id, enriched);
    return await db.updateDocument(doc.id, {
      status: 'indexed',
      chunk_count: enriched.length,
      error_message: null,
    });
  } catch (err) {
    await db.updateDocument(doc.id, {
      status: 'failed',
      chunk_count: 0,
      error_message: err.message,
    });
    return db.getDocumentById(doc.id);
  }
}

export function removeStoredFile(storedFilename) {
  if (!storedFilename || storedFilename.startsWith('seed-')) return;
  const safeName = path.basename(storedFilename);
  const fullPath = path.join(env.uploadsDir, safeName);
  if (fullPath.startsWith(env.uploadsDir) && fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch {
      // Ignore cleanup failure
    }
  }
}

/**
 * Semantic search over indexed college documents with strict role-based access filtering.
 */
export async function retrieveRelevantContext({ query, userRole = 'guest', topK = env.ragTopK }) {
  const db = getDb();
  const allowedAccessLevels = getAllowedDocumentAccessLevels(userRole);
  const queryEmbedding = await generateSingleEmbedding(query);

  const matches = await db.searchSimilarChunks({
    queryEmbedding,
    queryText: query,
    allowedAccessLevels,
    topK,
  });

  return matches.filter((m) => m.similarity >= env.ragMinSimilarity);
}
