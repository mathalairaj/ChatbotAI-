import React, { useEffect, useState } from 'react';
import { Briefcase, ShieldAlert, CheckCircle2, MessageSquare, FileText } from 'lucide-react';
import { api } from '../../services/api.js';

export default function PlacementPanel({ onAskAi }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getPlacements().then(setData).catch(() => {});
  }, []);

  if (!data) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading Placement Assistant...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="nscet-gradient rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-nscet-goldLight uppercase tracking-wider">
            <Briefcase className="w-4 h-4" />
            <span>Placement Assistant</span>
          </div>
          <h2 className="text-2xl font-extrabold mt-1">
            NSCET Training, Internships &amp; Placement Preparation
          </h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            Aptitude, Technical &amp; HR Interview Readiness, Resume Guidance, and Official Reports
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAskAi('What are the placement opportunities and preparation training at NSCET?')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-nscet-gold text-nscet-navy text-xs font-bold hover:bg-nscet-goldLight transition shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask Placement AI</span>
        </button>
      </div>

      {/* Zero-fabrication notice */}
      <div className="bg-nscet-goldSoft/80 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-950 leading-relaxed">
          <strong>Strict Accuracy Guarantee:</strong> {data.zeroFabricationNotice}
        </p>
      </div>

      {/* Placement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {data.records.map((rec) => (
          <div key={rec.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-nscet-sky text-nscet-navy">
                {rec.category.replace('_', ' ')}
              </span>
              {rec.is_verified_official ? (
                <span className="text-[11px] font-semibold text-emerald-700">Verified Official</span>
              ) : (
                <span className="text-[11px] font-medium text-slate-400">Guidance / Template</span>
              )}
            </div>
            <h3 className="text-base font-bold text-nscet-navy">{rec.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{rec.summary}</p>

            {rec.details && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {Object.entries(rec.details).map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[11px] font-bold uppercase text-nscet-blue mb-1">
                      {k.replace(/_/g, ' ')}
                    </div>
                    {Array.isArray(v) ? (
                      <ul className="space-y-1 text-xs text-slate-700">
                        {v.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-nscet-gold shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-600">{String(v)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Official Uploaded Placement Reports */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
        <div className="flex items-center gap-2 font-bold text-sm text-nscet-navy mb-2">
          <FileText className="w-4 h-4 text-nscet-gold" />
          <h3>Uploaded Official Placement Reports (RAG)</h3>
        </div>
        {data.officialReports.length === 0 ? (
          <p className="text-xs text-slate-500">
            No official Placement Report PDFs are uploaded yet. Once uploaded by Admin under category{' '}
            <strong>Placement Report</strong>, they will appear here and power cited chatbot responses.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {data.officialReports.map((doc) => (
              <div key={doc.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-nscet-navy">{doc.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {doc.original_filename} • {doc.chunk_count} indexed chunks
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
