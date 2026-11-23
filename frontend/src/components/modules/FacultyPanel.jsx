import React, { useEffect, useState } from 'react';
import { Users, FileEdit, Lock, Copy, Check, MessageSquare } from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function FacultyPanel({ onOpenAuth, onAskAi }) {
  const { isFaculty } = useAuth();
  const [data, setData] = useState(null);
  const [docType, setDocType] = useState('lesson_plan');
  const [topic, setTopic] = useState('');
  const [department, setDepartment] = useState('Computer Science and Engineering');
  const [audience, setAudience] = useState('III Year UG Engineering Students');
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getFacultyResources().then(setData).catch(() => {});
  }, [isFaculty]);

  const handleGenerateDraft = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const res = await api.generateFacultyDraft({
        doc_type: docType,
        topic: topic.trim(),
        department,
        audience,
      });
      setDraft(res.draft);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!data) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading Faculty Assistant...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="nscet-gradient rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-nscet-goldLight uppercase tracking-wider">
            <Users className="w-4 h-4" />
            <span>Faculty Assistant</span>
          </div>
          <h2 className="text-2xl font-extrabold mt-1">
            NSCET Faculty Development, Research &amp; Academic Tools
          </h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            FDP, Workshops, NPTEL, Research Support &amp; Academic Documentation Assistant
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAskAi('Tell me about faculty FDP, NPTEL and research documentation at NSCET')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-nscet-gold text-nscet-navy text-xs font-bold hover:bg-nscet-goldLight transition shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask Faculty AI</span>
        </button>
      </div>

      {/* Resource Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.sections.map((sec) => (
          <div key={sec.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <h3 className="font-bold text-sm text-nscet-navy">{sec.title}</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{sec.summary}</p>
          </div>
        ))}
      </div>

      {/* Academic Documentation Assistant (Role-gated to Faculty/Admin) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-nscet-gold" />
            <h3 className="font-bold text-base text-nscet-navy">
              Academic Documentation Draft Assistant
            </h3>
          </div>
          {!isFaculty && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              <Lock className="w-3.5 h-3.5" />
              Faculty / Admin Login Required
            </span>
          )}
        </div>

        {!isFaculty ? (
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-xs text-slate-600">
              Sign in with your Faculty or Admin account to generate structured NSCET Lesson Plans,
              Workshop Circulars, and Bloom’s Taxonomy Question Blueprints, and access internal faculty RAG documents.
            </p>
            <button
              type="button"
              onClick={onOpenAuth}
              className="mt-3 px-4 py-2 rounded-xl bg-nscet-navy text-white text-xs font-semibold hover:bg-nscet-blue transition"
            >
              Sign In as Faculty
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <form onSubmit={handleGenerateDraft} className="lg:col-span-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                >
                  <option value="lesson_plan">Course Lesson Plan Outline</option>
                  <option value="event_circular">Workshop / Seminar Circular</option>
                  <option value="question_blueprint">Bloom’s Taxonomy Question Blueprint</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject / Workshop Topic *
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Operating Systems / Generative AI Workshop"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Batch / Audience
                </label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={generating}
                className="w-full py-2.5 rounded-xl bg-nscet-navy text-white text-xs font-semibold hover:bg-nscet-blue transition"
              >
                {generating ? 'Generating Draft...' : 'Generate Structured Template'}
              </button>
            </form>

            <div className="lg:col-span-7 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-600">Generated Academic Draft</span>
                {draft && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-nscet-blue hover:underline"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                )}
              </div>
              <pre className="flex-1 min-h-[240px] p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed overflow-y-auto">
                {draft || 'Select a document template and enter a topic to generate a structured NSCET academic draft.'}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
