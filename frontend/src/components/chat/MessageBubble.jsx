import React from 'react';
import { Bot, User, FileText, ShieldCheck, AlertTriangle } from 'lucide-react';
import FeedbackWidget from './FeedbackWidget.jsx';

/**
 * Safe lightweight rich-text renderer supporting headings, bold (**text**),
 * italics (*text*), and bullet lists without using dangerouslySetInnerHTML (XSS-safe).
 */
function renderFormattedLines(text) {
  const lines = String(text || '').split('\n');
  const parseInline = (line, keyPrefix) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={`${keyPrefix}-${idx}`} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        return (
          <em key={`${keyPrefix}-${idx}`} className="italic text-slate-600">
            {part.slice(1, -1)}
          </em>
        );
      }
      return <React.Fragment key={`${keyPrefix}-${idx}`}>{part}</React.Fragment>;
    });
  };

  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;
    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={i} className="text-sm font-bold text-nscet-navy mt-1 mb-1.5">
          {parseInline(trimmed.slice(4), `h-${i}`)}
        </h4>
      );
    }
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      return (
        <div key={i} className="flex items-start gap-2 pl-1 my-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-nscet-gold mt-2 shrink-0" />
          <span className="leading-relaxed">{parseInline(trimmed.slice(2), `li-${i}`)}</span>
        </div>
      );
    }
    return (
      <p key={i} className="leading-relaxed my-0.5">
        {parseInline(line, `p-${i}`)}
      </p>
    );
  });
}

export default function MessageBubble({ message }) {
  const isUser = message.sender === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end items-start gap-2.5">
        <div className="max-w-[82%] sm:max-w-[75%] rounded-2xl rounded-tr-sm bg-nscet-navy text-white px-4 py-3 shadow-xs">
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-nscet-sky border border-blue-200 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-nscet-navy" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start items-start gap-2.5">
      <div className="w-8 h-8 rounded-full nscet-gradient border border-nscet-gold/70 flex items-center justify-center shrink-0 shadow-xs">
        <Bot className="w-4 h-4 text-nscet-goldLight" />
      </div>
      <div className="max-w-[88%] sm:max-w-[80%] rounded-2xl rounded-tl-sm bg-white border border-slate-200 px-4 py-3.5 shadow-card">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs font-bold text-nscet-navy">NSCET AI Assistant</span>
          <div className="flex items-center gap-1.5">
            {message.language === 'ta' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-nscet-goldSoft text-amber-800 border border-amber-200">
                தமிழ்
              </span>
            )}
            {message.is_unanswered && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3 h-3" />
                Office Verification Needed
              </span>
            )}
          </div>
        </div>

        <div className="text-sm text-slate-700">{renderFormattedLines(message.content)}</div>

        {/* Source Document Citations (RAG) */}
        {Array.isArray(message.sources) && message.sources.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-nscet-blue" />
              <span>Referenced College Sources</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((src) => (
                <div
                  key={`${src.document_id}-${src.chunk_index}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700"
                  title={src.excerpt}
                >
                  {src.is_verified_official && (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-medium max-w-[220px] truncate">{src.title}</span>
                  <span className="text-[10px] text-slate-400">({src.category})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Module 10: Feedback System */}
        {message.id && !String(message.id).startsWith('welcome-') && (
          <FeedbackWidget
            messageId={message.id}
            initialRating={message.feedback_rating}
            initialComment={message.feedback_comment}
          />
        )}
      </div>
    </div>
  );
}
