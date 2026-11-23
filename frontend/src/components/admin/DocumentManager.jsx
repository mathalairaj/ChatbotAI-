import React, { useEffect, useState } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShieldCheck,
  X,
} from 'lucide-react';
import { api } from '../../services/api.js';

const CATEGORIES = [
  'Brochure',
  'Academic Regulations',
  'Syllabus',
  'Admission Guidelines',
  'Placement Report',
  'Circular',
  'Department',
  'Faculty Resource',
  'General',
];

export default function DocumentManager() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Upload Form State
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Brochure');
  const [accessLevel, setAccessLevel] = useState('public');
  const [description, setDescription] = useState('');
  const [isVerifiedOfficial, setIsVerifiedOfficial] = useState(true);

  // Replace state
  const [replacingId, setReplacingId] = useState(null);

  // Chunk Inspector Modal
  const [inspectDoc, setInspectDoc] = useState(null);
  const [chunks, setChunks] = useState([]);

  // Semantic Search Tester
  const [searchQuery, setSearchQuery] = useState('');
  const [simulateRole, setSimulateRole] = useState('guest');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.listDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF, DOCX, TXT, or MD file to upload.');
      return;
    }
    setError('');
    setMessage('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', title.trim() || file.name);
      fd.append('category', category);
      fd.append('access_level', accessLevel);
      fd.append('description', description.trim());
      fd.append('is_verified_official', String(isVerifiedOfficial));

      const res = replacingId
        ? await api.replaceDocument(replacingId, fd)
        : await api.uploadDocument(fd);

      const doc = res.document;
      setMessage(
        doc.status === 'indexed'
          ? `"${doc.title}" processed and indexed into ${doc.chunk_count} searchable vector chunks.`
          : `"${doc.title}" saved with status "${doc.status}": ${doc.error_message || ''}`
      );
      setFile(null);
      setTitle('');
      setDescription('');
      setReplacingId(null);
      const fileInput = document.getElementById('rag-file-input');
      if (fileInput) fileInput.value = '';
      loadDocuments();
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}" and all its indexed vector chunks?`)) return;
    setError('');
    try {
      await api.deleteDocument(doc.id);
      setMessage(`Deleted "${doc.title}".`);
      loadDocuments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInspectChunks = async (doc) => {
    try {
      const res = await api.getDocumentChunks(doc.id);
      setInspectDoc(res.document);
      setChunks(res.chunks || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStartReplace = (doc) => {
    setReplacingId(doc.id);
    setTitle(doc.title);
    setCategory(doc.category);
    setAccessLevel(doc.access_level);
    setDescription(doc.description || '');
    setIsVerifiedOfficial(doc.is_verified_official);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSemanticSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.searchDocuments({
        query: searchQuery.trim(),
        simulate_role: simulateRole,
        top_k: 5,
      });
      setSearchResults(res.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="nscet-gradient rounded-2xl p-6 text-white shadow-lg">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-nscet-goldLight uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Module 8 • Document-Based AI (RAG Pipeline)</span>
        </div>
        <h2 className="text-2xl font-extrabold mt-1">College Document &amp; Knowledge Base Manager</h2>
        <p className="text-xs sm:text-sm text-blue-200 mt-1">
          Upload PDF, DOCX, TXT, or MD college circulars, brochures, regulations, syllabus, and placement reports.
          Documents are automatically extracted, chunked, embedded, and role-filtered for AI responses.
        </p>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload / Replace Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-nscet-navy flex items-center gap-2">
              <Upload className="w-4 h-4 text-nscet-gold" />
              <span>{replacingId ? 'Replace & Re-index Document' : 'Upload College Document'}</span>
            </h3>
            {replacingId && (
              <button
                type="button"
                onClick={() => {
                  setReplacingId(null);
                  setTitle('');
                  setDescription('');
                }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel Replace
              </button>
            )}
          </div>

          <form onSubmit={handleUpload} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document File (PDF, DOCX, TXT, MD) *
              </label>
              <input
                id="rag-file-input"
                type="file"
                accept=".pdf,.docx,.txt,.md"
                required
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFile(f);
                  if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''));
                }}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-nscet-sky file:text-nscet-navy hover:file:bg-blue-100 border border-slate-300 rounded-xl p-1.5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Document Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., NSCET Official Admission Brochure 2026"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role Access Level
                </label>
                <select
                  value={accessLevel}
                  onChange={(e) => setAccessLevel(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                >
                  <option value="public">Public (Everyone)</option>
                  <option value="student">Student &amp; Above</option>
                  <option value="faculty">Faculty &amp; Admin</option>
                  <option value="admin">Admin Only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional summary of document contents..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isVerifiedOfficial}
                onChange={(e) => setIsVerifiedOfficial(e.target.checked)}
                className="rounded border-slate-300 text-nscet-navy"
              />
              <span>Mark as Verified Official NSCET Document (prioritized by RAG)</span>
            </label>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 rounded-xl bg-nscet-navy text-white text-xs font-bold hover:bg-nscet-blue transition disabled:opacity-60"
            >
              {uploading
                ? 'Extracting, Chunking & Indexing...'
                : replacingId
                ? 'Replace & Re-Index Document'
                : 'Upload & Index into Vector DB'}
            </button>
          </form>
        </div>

        {/* Semantic Search Verification Tool */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-card flex flex-col">
          <h3 className="font-bold text-sm text-nscet-navy flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-nscet-gold" />
            <span>RAG Semantic Search &amp; RBAC Tester</span>
          </h3>
          <form onSubmit={handleSemanticSearch} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Test a user query against indexed vector chunks..."
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
            />
            <select
              value={simulateRole}
              onChange={(e) => setSimulateRole(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50"
            >
              <option value="guest">As Guest</option>
              <option value="student">As Student</option>
              <option value="faculty">As Faculty</option>
              <option value="admin">As Admin</option>
            </select>
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-2 rounded-xl bg-nscet-gold text-nscet-navy text-xs font-bold hover:bg-nscet-goldLight transition"
            >
              {searching ? 'Searching...' : 'Test Search'}
            </button>
          </form>

          <div className="mt-4 flex-1 overflow-y-auto max-h-72 space-y-2.5">
            {searchResults === null ? (
              <div className="text-xs text-slate-400 text-center py-10">
                Enter any English or Tamil query above to inspect top retrieved document chunks and verify role-based access filtering.
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                No chunks met the similarity threshold for role <strong>{simulateRole}</strong>.
              </div>
            ) : (
              searchResults.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-nscet-navy truncate">{r.document_title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-nscet-sky text-nscet-navy font-bold text-[10px] shrink-0">
                      {Math.round(r.similarity * 100)}% match • {r.access_level}
                    </span>
                  </div>
                  <p className="text-slate-600 line-clamp-3 leading-relaxed">{r.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Indexed Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-nscet-navy">
            Knowledge Base Documents ({documents.length})
          </h3>
          <button
            type="button"
            onClick={loadDocuments}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-nscet-blue hover:underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Access</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Chunks</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Loading documents...
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-nscet-navy flex items-center gap-1.5">
                        {doc.is_verified_official && (
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" title="Verified Official" />
                        )}
                        <span>{doc.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {doc.original_filename} • {doc.file_type.toUpperCase()}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{doc.category}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                        {doc.access_level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                          doc.status === 'indexed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : doc.status === 'failed'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                      {doc.chunk_count}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInspectChunks(doc)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-nscet-blue"
                          title="Inspect extracted chunks"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartReplace(doc)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                          title="Replace document file"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chunk Preview Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[82vh] flex flex-col overflow-hidden">
            <div className="px-5 py-4 nscet-gradient text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">{inspectDoc.title}</h4>
                <p className="text-[11px] text-blue-200">
                  {chunks.length} Indexed Text Chunks • Category: {inspectDoc.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectDoc(null)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3">
              {chunks.map((c) => (
                <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="font-bold text-nscet-blue mb-1">
                    Chunk #{c.chunk_index + 1} (~{c.token_estimate} tokens)
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
