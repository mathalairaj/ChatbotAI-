import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check, Send } from 'lucide-react';
import { api } from '../../services/api.js';

export default function FeedbackWidget({ messageId, initialRating = null, initialComment = '' }) {
  const [rating, setRating] = useState(initialRating);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState(initialComment || '');
  const [saved, setSaved] = useState(Boolean(initialRating));
  const [submitting, setSubmitting] = useState(false);

  const handleRate = async (newRating) => {
    setRating(newRating);
    setSubmitting(true);
    try {
      await api.submitFeedback({ message_id: messageId, rating: newRating, comment: comment || undefined });
      setSaved(true);
      if (newRating === 'not_helpful') {
        setShowCommentBox(true);
      }
    } catch {
      // Keep UI responsive
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!rating || !comment.trim()) return;
    setSubmitting(true);
    try {
      await api.submitFeedback({ message_id: messageId, rating, comment: comment.trim() });
      setSaved(true);
      setShowCommentBox(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="font-medium">Was this information helpful?</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleRate('helpful')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
              rating === 'helpful'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Helpful</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleRate('not_helpful')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
              rating === 'not_helpful'
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-800'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>Not helpful</span>
          </button>

          {rating && (
            <button
              type="button"
              onClick={() => setShowCommentBox((v) => !v)}
              className="text-[11px] font-semibold text-nscet-blue hover:underline ml-1"
            >
              {showCommentBox ? 'Hide note' : 'Additional feedback'}
            </button>
          )}
        </div>
      </div>

      {saved && !showCommentBox && (
        <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
          <Check className="w-3 h-3" />
          <span>Feedback recorded. Thank you!</span>
        </div>
      )}

      {showCommentBox && (
        <form onSubmit={handleCommentSubmit} className="mt-2 flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share additional feedback to help NSCET improve..."
            maxLength={500}
            className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:border-nscet-blue outline-none"
          />
          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-nscet-navy text-white text-xs font-semibold hover:bg-nscet-blue disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>Save</span>
          </button>
        </form>
      )}
    </div>
  );
}
