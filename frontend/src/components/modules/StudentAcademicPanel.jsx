import React, { useEffect, useState } from 'react';
import { BookOpen, Lock, FileText, GraduationCap, MessageSquare, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function StudentAcademicPanel({ onOpenAuth, onAskAi }) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setData(null);
      return;
    }
    setLoading(true);
    setError('');
    api
      .getStudentAcademics()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-card">
          <div className="w-14 h-14 rounded-2xl nscet-gradient text-nscet-goldLight flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-nscet-navy">
            Authenticated Student Academic Assistant
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
            To protect confidential student academic information (syllabus documents, regulations,
            internal assessment resources, and academic calendars), please sign in with your NSCET
            Student, Faculty, or Admin account.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-5 py-2.5 rounded-xl bg-nscet-navy text-white text-sm font-semibold hover:bg-nscet-blue transition"
            >
              Sign In to Access Academic Hub
            </button>
            <button
              type="button"
              onClick={() => onAskAi('Tell me about university examination procedures and regulations')}
              className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
            >
              Ask General Academic Question
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        {error ? <span className="text-red-600">{error}</span> : 'Loading Student Academic Assistant...'}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Authenticated Student Banner */}
      <div className="nscet-gradient rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-nscet-goldLight uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Authenticated Academic Session</span>
          </div>
          <h2 className="text-2xl font-extrabold mt-1">Student Academic Assistant</h2>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-blue-100">
            <span>
              <strong>Name:</strong> {data.studentContext.full_name}
            </span>
            <span>•</span>
            <span>
              <strong>Department:</strong> {data.studentContext.department}
            </span>
            <span>•</span>
            <span>
              <strong>Year:</strong> {data.studentContext.academic_year}
            </span>
            <span>•</span>
            <span>
              <strong>Reg No:</strong> {data.studentContext.register_number}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onAskAi('Explain internal assessments and university examination guidelines')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-nscet-gold text-nscet-navy text-xs font-bold hover:bg-nscet-goldLight transition shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask Academic AI</span>
        </button>
      </div>

      {/* Academic Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.academicSections.map((sec) => (
          <div key={sec.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <div className="w-9 h-9 rounded-xl bg-nscet-sky text-nscet-navy flex items-center justify-center mb-3">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-nscet-navy">{sec.title}</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{sec.summary}</p>
          </div>
        ))}
      </div>

      {/* Indexed Academic Documents */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
        <div className="flex items-center gap-2 font-bold text-sm text-nscet-navy mb-3">
          <FileText className="w-4 h-4 text-nscet-gold" />
          <h3>Available Regulations, Syllabus &amp; Academic Circulars</h3>
        </div>
        {data.documents.length === 0 ? (
          <p className="text-xs text-slate-500">
            No academic PDFs uploaded yet. Administrators can upload official regulations and syllabus PDFs in the RAG Document Manager.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.documents.map((doc) => (
              <div key={doc.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-nscet-navy">{doc.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {doc.category} • {doc.chunk_count} indexed sections • Access: {doc.access_level}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onAskAi(`Summarize key points from ${doc.title}`)}
                  className="text-[11px] font-bold text-nscet-blue hover:underline shrink-0"
                >
                  Ask AI →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
