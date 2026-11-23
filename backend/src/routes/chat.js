import { Router } from 'express';
import { getDb } from '../db/index.js';
import { optionalAuth } from '../middleware/auth.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';
import { generateAssistantReply } from '../services/aiService.js';

const router = Router();

const VALID_PERSONAS = new Set([
  'prospective_student',
  'current_student',
  'faculty',
  'parent_visitor',
]);

function getSessionToken(req) {
  return (req.headers['x-session-token'] || req.query.session_token || req.body?.session_token || '')
    .toString()
    .trim()
    .slice(0, 120) || null;
}

function canAccessConversation(conv, req, sessionToken) {
  if (!conv) return false;
  if (req.user?.role === 'admin') return true;
  if (req.user && conv.user_id && conv.user_id === req.user.id) return true;
  if (!conv.user_id && sessionToken && conv.session_token === sessionToken) return true;
  return false;
}

/**
 * GET /api/chat/conversations
 */
router.get('/conversations', optionalAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const sessionToken = getSessionToken(req);
    const conversations = await db.listConversations({
      user_id: req.user?.id || null,
      session_token: sessionToken,
      limit: 40,
    });
    return res.json({ conversations });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/chat/conversations
 */
router.post('/conversations', optionalAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const sessionToken = getSessionToken(req);
    const persona = VALID_PERSONAS.has(req.body?.user_persona)
      ? req.body.user_persona
      : req.user?.role === 'faculty'
      ? 'faculty'
      : req.user?.role === 'student'
      ? 'current_student'
      : 'prospective_student';

    const conversation = await db.createConversation({
      user_id: req.user?.id || null,
      session_token: req.user ? null : sessionToken,
      title: (req.body?.title || 'New Conversation').slice(0, 120),
      user_persona: persona,
      language: req.body?.language || 'en',
    });

    return res.status(201).json({ conversation });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/chat/conversations/:id/messages
 */
router.get('/conversations/:id/messages', optionalAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const conv = await db.getConversationById(req.params.id);
    const sessionToken = getSessionToken(req);
    if (!canAccessConversation(conv, req, sessionToken)) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    const messages = await db.listMessages(conv.id);
    return res.json({ conversation: conv, messages });
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /api/chat/conversations/:id/messages (Clear conversation)
 */
router.delete('/conversations/:id/messages', optionalAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const conv = await db.getConversationById(req.params.id);
    const sessionToken = getSessionToken(req);
    if (!canAccessConversation(conv, req, sessionToken)) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    await db.clearConversationMessages(conv.id);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /api/chat/conversations/:id
 */
router.delete('/conversations/:id', optionalAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const conv = await db.getConversationById(req.params.id);
    const sessionToken = getSessionToken(req);
    if (!canAccessConversation(conv, req, sessionToken)) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }
    await db.deleteConversation(conv.id);
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /api/chat/ask
 * Core RAG + LLM conversational endpoint.
 */
router.post('/ask', optionalAuth, chatRateLimiter, async (req, res, next) => {
  try {
    const query = (req.body?.message || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }
    if (query.length > 2000) {
      return res.status(400).json({ error: 'Message exceeds maximum length of 2000 characters.' });
    }

    const db = getDb();
    const sessionToken = getSessionToken(req);
    const persona = VALID_PERSONAS.has(req.body?.user_persona)
      ? req.body.user_persona
      : req.user?.role === 'faculty'
      ? 'faculty'
      : req.user?.role === 'student'
      ? 'current_student'
      : 'prospective_student';

    let conversation = null;
    if (req.body?.conversation_id) {
      const existing = await db.getConversationById(req.body.conversation_id);
      if (canAccessConversation(existing, req, sessionToken)) {
        conversation = existing;
      }
    }

    if (!conversation) {
      conversation = await db.createConversation({
        user_id: req.user?.id || null,
        session_token: req.user ? null : sessionToken,
        title: query.slice(0, 68) + (query.length > 68 ? '...' : ''),
        user_persona: persona,
      });
    } else if (conversation.title === 'New Conversation') {
      conversation = await db.updateConversation(conversation.id, {
        title: query.slice(0, 68) + (query.length > 68 ? '...' : ''),
        user_persona: persona,
      });
    }

    const history = await db.listMessages(conversation.id);

    const userMessage = await db.createMessage({
      conversation_id: conversation.id,
      sender: 'user',
      content: query,
    });

    const aiResult = await generateAssistantReply({
      query,
      conversationHistory: history,
      persona,
      user: req.user,
    });

    const assistantMessage = await db.createMessage({
      conversation_id: conversation.id,
      sender: 'assistant',
      content: aiResult.content,
      language: aiResult.language,
      intent_category: aiResult.intent,
      sources: aiResult.sources,
      confidence_score: aiResult.confidence,
      is_unanswered: aiResult.isUnanswered,
      model_used: aiResult.modelUsed,
      token_usage: aiResult.tokenUsage,
    });

    return res.json({
      conversation,
      userMessage,
      assistantMessage,
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
