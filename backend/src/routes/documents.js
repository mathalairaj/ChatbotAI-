import { Router } from 'express';
import { getDb } from '../db/index.js';
import { getAllowedDocumentAccessLevels, optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';
import { documentUpload } from '../middleware/upload.js';
import {
  ingestUploadedDocument,
  removeStoredFile,
  replaceUploadedDocument,
  retrieveRelevantContext,
} from '../services/ragService.js';
import { recordAudit } from '../services/auditService.js';

const router = Router();

const VALID_ACCESS_LEVELS = new Set(['public', 'student', 'faculty', 'admin']);

/**
 * GET /api/documents
 * Returns documents permitted for the requester's role (Admin sees all).
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const role = req.user?.role || 'guest';
    const allowedAccessLevels = getAllowedDocumentAccessLevels(role);
    const category = req.query.category || null;
    const documents = await db.listDocuments({ allowedAccessLevels, category });
    return res.json({ documents });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/documents/:id/chunks
 * Admin-only view of extracted RAG chunks for a document.
 */
router.get('/:id/chunks', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const db = getDb();
    const doc = await db.getDocumentById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });
    const chunks = await db.listDocumentChunks(doc.id);
    return res.json({ document: doc, chunks });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/documents/upload
 * Admin uploads a PDF, DOCX, TXT, or MD document into the RAG pipeline.
 */
router.post(
  '/upload',
  requireAuth,
  requireRole('admin'),
  documentUpload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Please attach a PDF, DOCX, TXT, or MD file.' });
      }
      const accessLevel = VALID_ACCESS_LEVELS.has(req.body?.access_level)
        ? req.body.access_level
        : 'public';
      const isVerifiedOfficial = req.body?.is_verified_official !== 'false';

      const document = await ingestUploadedDocument({
        file: req.file,
        title: req.body?.title || req.file.originalname,
        category: (req.body?.category || 'General').trim(),
        accessLevel,
        description: (req.body?.description || '').trim(),
        isVerifiedOfficial,
        uploadedBy: req.user.id,
      });

      await recordAudit({
        req,
        action: 'DOCUMENT_UPLOADED',
        resourceType: 'document',
        resourceId: document.id,
        details: {
          title: document.title,
          category: document.category,
          access_level: document.access_level,
          status: document.status,
          chunk_count: document.chunk_count,
        },
      });

      return res.status(201).json({ document });
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * PUT /api/documents/:id/replace
 * Admin replaces an existing document file and re-indexes its vector chunks.
 */
router.put(
  '/:id/replace',
  requireAuth,
  requireRole('admin'),
  documentUpload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Please attach a replacement PDF, DOCX, TXT, or MD file.' });
      }
      const accessLevel = req.body?.access_level && VALID_ACCESS_LEVELS.has(req.body.access_level)
        ? req.body.access_level
        : undefined;

      const document = await replaceUploadedDocument({
        documentId: req.params.id,
        file: req.file,
        title: req.body?.title,
        category: req.body?.category,
        accessLevel,
        description: req.body?.description,
        isVerifiedOfficial:
          req.body?.is_verified_official !== undefined
            ? req.body.is_verified_official !== 'false'
            : undefined,
      });

      await recordAudit({
        req,
        action: 'DOCUMENT_REPLACED',
        resourceType: 'document',
        resourceId: document.id,
        details: { title: document.title, status: document.status, chunk_count: document.chunk_count },
      });

      return res.json({ document });
    } catch (err) {
      return next(err);
    }
  }
);

/**
 * DELETE /api/documents/:id
 */
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const db = getDb();
    const doc = await db.getDocumentById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    removeStoredFile(doc.stored_filename);
    await db.deleteDocument(doc.id);

    await recordAudit({
      req,
      action: 'DOCUMENT_DELETED',
      resourceType: 'document',
      resourceId: doc.id,
      details: { title: doc.title, original_filename: doc.original_filename },
    });

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/documents/search
 * Admin semantic search test endpoint to verify RAG retrieval accuracy.
 */
router.post('/search', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const query = (req.body?.query || '').trim();
    if (!query) return res.status(400).json({ error: 'Search query is required.' });
    const simulateRole = req.body?.simulate_role || 'admin';
    const results = await retrieveRelevantContext({
      query,
      userRole: simulateRole,
      topK: Math.min(10, Number(req.body?.top_k) || 5),
    });
    return res.json({ results, simulateRole });
  } catch (err) {
    return next(err);
  }
});

export default router;
