import React, { useEffect, useRef, useState } from 'react';
import {
  Send,
  Plus,
  Trash2,
  RotateCcw,
  MessageSquare,
  Sparkles,
  Languages,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { api } from '../../services/api.js';
import MessageBubble from './MessageBubble.jsx';

const WELCOME_MESSAGE = {
  id: 'welcome-nscet-assistant',
  sender: 'assistant',
  content:
    'Welcome to NSCET AI College Assistant! I am your virtual college assistant. How can I help you today?',
  sources: [],
};

const SUGGESTED_QUESTIONS = [
  'What courses are available at NSCET?',
  'How can I apply for admission?',
  'What departments are available?',
  'What are the placement opportunities?',
  'What facilities are available on campus?',
];

const TAMIL_SAMPLE_QUESTIONS = [
  'NSCET கல்லூரியில் என்ன படிப்புகள் உள்ளன?',
  'சேர்க்கை (Admission) எப்படி விண்ணப்பிப்பது?',
  'வளாக வசதிகள் என்னென்ன உள்ளன?',
];

export default function ChatInterface({ persona, pendingPrompt, onConsumePendingPrompt }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [showTamilHints, setShowTamilHints] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  const loadConversations = async () => {
    try {
      const res = await api.listConversations();
      setConversations(res.conversations || []);
    } catch {
      // ignore initial history load error
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Allow other modules (Departments, Admissions, etc.) to launch a direct AI query
  useEffect(() => {
    if (pendingPrompt) {
      const promptText = pendingPrompt;
      onConsumePendingPrompt?.();
      handleSend(promptText);
    }
  }, [pendingPrompt]);

  const handleSelectConversation = async (convId) => {
    setError('');
    try {
      const res = await api.getConversationMessages(convId);
      setActiveConversationId(convId);
      const loaded = res.messages || [];
      setMessages(loaded.length > 0 ? loaded : [WELCOME_MESSAGE]);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setError('');
  };

  const handleClearConversation = async () => {
    if (!activeConversationId) {
      setMessages([WELCOME_MESSAGE]);
      return;
    }
    try {
      await api.clearConversation(activeConversationId);
      setMessages([WELCOME_MESSAGE]);
      loadConversations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(convId);
      if (activeConversationId === convId) {
        handleNewConversation();
      }
      loadConversations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSend = async (overrideText = null) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    setError('');
    if (overrideText === null) setInput('');

    const optimisticUserMsg = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setLoading(true);

    try {
      const res = await api.askChatbot({
        conversation_id: activeConversationId,
        message: text,
        user_persona: persona,
      });

      setActiveConversationId(res.conversation.id);
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== optimisticUserMsg.id);
        return [...withoutTemp, res.userMessage, res.assistantMessage];
      });
      loadConversations();
    } catch (err) {
      setError(err.message || 'Unable to reach NSCET AI Assistant.');
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex h-[calc(100vh-65px)] bg-slate-50 overflow-hidden">
      {/* Chat History Panel */}
      {showHistory && (
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
          <div className="p-3 border-b border-slate-200 flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewConversation}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-nscet-navy text-white text-xs font-semibold hover:bg-nscet-blue transition"
            >
              <Plus className="w-4 h-4 text-nscet-goldLight" />
              <span>New Conversation</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Chat History
            </div>
            {conversations.length === 0 ? (
              <div className="px-2.5 py-6 text-center text-xs text-slate-400">
                Your recent NSCET conversations will appear here.
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`group flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl cursor-pointer text-xs transition ${
                    activeConversationId === conv.id
                      ? 'bg-nscet-sky text-nscet-navy font-semibold border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 text-nscet-blue shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 hover:text-red-600 transition"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* Active Chat Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sub-toolbar */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="hidden md:inline-flex p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              title={showHistory ? 'Hide chat history' : 'Show chat history'}
            >
              {showHistory ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-nscet-navy">NSCET AI Assistant</span>
              <span className="hidden sm:inline text-xs text-slate-400">
                • 24/7 Virtual College Helpdesk
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTamilHints((v) => !v)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                showTamilHints
                  ? 'bg-nscet-goldSoft border-nscet-gold text-nscet-navy'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>தமிழ்</span>
            </button>

            <button
              type="button"
              onClick={handleNewConversation}
              className="md:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-nscet-navy text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            <button
              type="button"
              onClick={handleClearConversation}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
              title="Clear current conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5">
          <div className="max-w-3xl mx-auto space-y-5">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Suggested Questions */}
            {showSuggestions && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card">
                <div className="flex items-center gap-2 text-xs font-bold text-nscet-navy mb-3">
                  <Sparkles className="w-4 h-4 text-nscet-gold" />
                  <span>Suggested Questions</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSend(q)}
                      className="text-left text-xs font-medium px-3.5 py-2 rounded-xl bg-nscet-sky hover:bg-blue-100 text-nscet-navy border border-blue-200/80 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tamil Quick Prompts */}
            {showTamilHints && (
              <div className="bg-nscet-goldSoft/70 border border-amber-200 rounded-2xl p-3.5">
                <div className="text-xs font-bold text-nscet-navy mb-2">
                  தமிழில் கேள்விகள் கேட்கலாம் (Ask in Tamil):
                </div>
                <div className="flex flex-wrap gap-2">
                  {TAMIL_SAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleSend(q)}
                      className="text-xs font-medium px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-nscet-navy hover:bg-amber-50 transition"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Typing Animation */}
            {loading && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full nscet-gradient flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-nscet-goldLight animate-pulse" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">
                    Searching NSCET knowledge base
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-nscet-blue typing-dot" />
                    <span className="w-1.5 h-1.5 rounded-full bg-nscet-gold typing-dot" />
                    <span className="w-1.5 h-1.5 rounded-full bg-nscet-blue typing-dot" />
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <div ref={endRef} />
          </div>
        </div>

        {/* Input Composer */}
        <div className="bg-white border-t border-slate-200 p-3 sm:p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-slate-50 border border-slate-300 focus-within:border-nscet-blue focus-within:ring-2 focus-within:ring-nscet-blue/15 rounded-2xl p-2 transition">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask NSCET AI Assistant in English or தமிழ்... (Press Enter to send)"
                aria-label="Type your question for NSCET AI Assistant"
                className="flex-1 bg-transparent resize-none px-2.5 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none max-h-32"
              />
              <button
                type="button"
                disabled={loading || !input.trim()}
                onClick={() => handleSend()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nscet-navy text-white text-xs font-semibold hover:bg-nscet-blue disabled:opacity-40 transition shrink-0"
              >
                <Send className="w-4 h-4 text-nscet-goldLight" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400 text-center">
              NSCET AI Assistant prioritizes verified college documents and never invents fees, cutoffs, or placement records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
