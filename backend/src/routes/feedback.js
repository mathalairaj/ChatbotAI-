import { Router } from 'express';
import { getDb } from '../db/index.js';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/feedback
 * Module 10: "Was this information helpful?" (Helpful / Not helpful + Additional feedback)
 */
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const messageId = (req.body?.message_id || '').trim();
    const rating = req.body?.rating;
    const comment = (req.body?.comment || '').trim().slice(0, 1000) || null;

    if (!messageId) {
      return res.status(400).json({ error: 'message_id is required.' });
    }
    if (rating !== 'helpful' && rating !== 'not_helpful') {
      return res.status(400).json({ error: 'rating must be "helpful" or "not_helpful".' });
    }

    const db = getDb();
    const message = await db.getMessageById(messageId);
    if (!message || message.sender !== 'assistant') {
      return res.status(404).json({ error: 'Assistant message not found.' });
    }

    const feedback = await db.upsertFeedback({
      message_id: message.id,
      conversation_id: message.conversation_id,
      user_id: req.user?.id || null,
      rating,
      comment,
    });

    return res.status(201).json({
      feedback,
      message: 'Thank you for your feedback! It helps improve NSCET AI Assistant.',
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/feedback (Admin only)
 */
router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const db = getDb();
    const limit = Math.min(200, Number(req.query.limit) || 100);
    const items = await db.listFeedback(limit);
    return res.json({ feedback: items });
  } catch (err) {
    return next(err);
  }
});

export default router;
