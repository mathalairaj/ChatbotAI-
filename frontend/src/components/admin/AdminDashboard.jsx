import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Users,
  MessageSquare,
  GraduationCap,
  ThumbsUp,
  AlertTriangle,
  FileText,
  Activity,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api.js';

const TABS = [
  { id: 'overview', label: 'Analytics Overview' },
  { id: 'enquiries', label: 'Admission Leads' },
  { id: 'feedback', label: 'Feedback Reports' },
  { id: 'users', label: 'User Management' },
  { id: 'audit', label: 'Audit Logs' },
];

export default function AdminDashboard({ onNavigateDocuments }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create User Form
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'faculty',
    department_code: 'CSE',
  });
  const [userNotice, setUserNotice] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [an, enq, fb, usr, logs] = await Promise.all([
        api.getAdminAnalytics(),
        api.listAdmissionEnquiries('all'),
        api.listFeedback(),
        api.listUsers(),
        api.listAuditLogs(),
      ]);
      setAnalytics(an);
      setEnquiries(enq.enquiries || []);
      setFeedbackList(fb.feedback || []);
      setUsers(usr.users || []);
      setAuditLogs(logs.logs || []);
    } catch (err) {
      setError(err.message || 'Unable to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleEnquiryStatusChange = async (id, status) => {
    await api.updateAdmissionEnquiry(id, { status });
    const res = await api.listAdmissionEnquiries('all');
    setEnquiries(res.enquiries || []);
    const an = await api.getAdminAnalytics();
    setAnalytics(an);
  };

  const handleToggleUserActive = async (u) => {
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      const res = await api.listUsers();
      setUsers(res.users || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserNotice('');
    setError('');
    try {
      await api.createUser(newUser);
      setUserNotice(`Created ${newUser.role} account for ${newUser.email}.`);
      setNewUser({ full_name: '', email: '', password: '', role: 'faculty', department_code: 'CSE' });
      const res = await api.listUsers();
      setUsers(res.users || []);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && !analytics) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading Admin Dashboard...</div>;
  }

  const kpis = analytics?.kpis || {};
  const maxIntent = Math.max(1, ...(analytics?.intentBreakdown || []).map((i) => i.count));

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="nscet-gradient rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-nscet-goldLight uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Module 9 • Institutional Administration</span>
          </div>
          <h2 className="text-2xl font-extrabold mt-1">NSCET AI Assistant Admin Dashboard</h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            Real-time Chatbot Analytics, Admission Leads, Feedback Reports, RBAC Users &amp; Audit Logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNavigateDocuments}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-nscet-gold text-nscet-navy text-xs font-bold hover:bg-nscet-goldLight transition"
          >
            <FileText className="w-4 h-4" />
            <span>Manage RAG Docs</span>
          </button>
          <button
            type="button"
            onClick={loadAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === t.id
                ? 'bg-nscet-navy text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-nscet-blue'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ANALYTICS OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={Users} label="Registered Users" value={kpis.totalUsers ?? 0} accent="blue" />
            <KpiCard icon={MessageSquare} label="Total Conversations" value={kpis.totalConversations ?? 0} sub={`${kpis.dailyEnquiries ?? 0} enquiries today`} accent="navy" />
            <KpiCard icon={GraduationCap} label="Admission Leads" value={kpis.totalAdmissionLeads ?? 0} sub={`${kpis.newAdmissionLeads ?? 0} new`} accent="gold" />
            <KpiCard icon={ThumbsUp} label="Helpful Rate" value={`${kpis.helpfulRate ?? 100}%`} sub={`${kpis.helpfulFeedback ?? 0} helpful / ${kpis.notHelpfulFeedback ?? 0} not`} accent="emerald" />
            <KpiCard icon={FileText} label="Indexed RAG Docs" value={kpis.indexedDocuments ?? 0} sub={`${kpis.totalChunks ?? 0} vector chunks`} accent="blue" />
            <KpiCard icon={Activity} label="Total User Queries" value={kpis.totalUserMessages ?? 0} accent="navy" />
            <KpiCard icon={AlertTriangle} label="Unanswered Queries" value={kpis.unansweredCount ?? 0} sub="Review to add docs" accent="amber" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Most Frequently Asked Questions */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
              <h3 className="font-bold text-sm text-nscet-navy mb-3">
                Most Frequently Asked Questions
              </h3>
              {(analytics?.frequentQuestions || []).length === 0 ? (
                <p className="text-xs text-slate-400">No chat questions recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {analytics.frequentQuestions.map((fq, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <span className="text-slate-700 truncate">{fq.question}</span>
                      <span className="px-2 py-0.5 rounded-full bg-nscet-sky text-nscet-navy font-bold shrink-0">
                        {fq.count}×
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Intent Category Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
              <h3 className="font-bold text-sm text-nscet-navy mb-3">
                Enquiry Topics Breakdown
              </h3>
              {(analytics?.intentBreakdown || []).length === 0 ? (
                <p className="text-xs text-slate-400">No assistant responses recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.intentBreakdown.map((item) => (
                    <div key={item.category}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-700 capitalize">
                          {item.category.replace('_', ' ')}
                        </span>
                        <span className="font-bold text-nscet-navy">{item.count}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-nscet-blue rounded-full"
                          style={{ width: `${Math.max(8, Math.round((item.count / maxIntent) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Unanswered Questions Queue */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <h3 className="font-bold text-sm text-nscet-navy mb-2">
              Unanswered / Verification-Required Questions
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Upload official NSCET PDFs/DOCX covering these questions to expand verified RAG coverage.
            </p>
            {(analytics?.unansweredQuestions || []).length === 0 ? (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                All recorded queries have been answered from verified college resources.
              </p>
            ) : (
              <div className="space-y-2">
                {analytics.unansweredQuestions.map((uq) => (
                  <div
                    key={uq.id}
                    className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-medium text-amber-950">
                      {uq.user_question || '(Query logged)'}
                    </span>
                    <span className="text-[11px] text-amber-800 shrink-0">
                      {uq.intent_category || 'general'} • {String(uq.created_at).slice(0, 10)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ADMISSION LEADS */}
      {activeTab === 'enquiries' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 font-bold text-sm text-nscet-navy">
            Admission Enquiries ({enquiries.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Ref Code</th>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Programme &amp; Mode</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enquiries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No admission enquiries submitted yet.
                    </td>
                  </tr>
                ) : (
                  enquiries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono font-bold text-nscet-navy">
                        {e.reference_code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{e.full_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {e.email} • {e.phone}
                        </div>
                        {e.city_district && (
                          <div className="text-[11px] text-slate-400">{e.city_district}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-nscet-blue">{e.preferred_department}</div>
                        <div className="text-[11px] text-slate-500">
                          {e.programme_level} • {e.admission_mode}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs text-slate-600">{e.message || '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={e.status}
                          onChange={(ev) => handleEnquiryStatusChange(e.id, ev.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="counselled">Counselled</option>
                          <option value="admitted">Admitted</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FEEDBACK REPORTS */}
      {activeTab === 'feedback' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 font-bold text-sm text-nscet-navy">
            Chatbot Response Feedback ({feedbackList.length})
          </div>
          <div className="divide-y divide-slate-100">
            {feedbackList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No feedback entries submitted yet.
              </div>
            ) : (
              feedbackList.map((fb) => (
                <div key={fb.id} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        fb.rating === 'helpful'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {fb.rating === 'helpful' ? 'Helpful' : 'Not Helpful'}
                    </span>
                    <p className="text-slate-700 font-medium">
                      {fb.comment || '(No additional comment provided)'}
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      Assistant reply: {fb.assistant_reply}
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-400 shrink-0">
                    {fb.user_name || 'Visitor'} • {String(fb.created_at).slice(0, 10)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <h3 className="font-bold text-sm text-nscet-navy flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4 text-nscet-gold" />
              <span>Create Institutional Account</span>
            </h3>
            {userNotice && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {userNotice}
              </div>
            )}
            <form onSubmit={handleCreateUser} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
              <input
                type="email"
                required
                placeholder="Email (@nscet.edu.in)"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Temporary Password (min 8 chars)"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={newUser.department_code}
                  onChange={(e) => setNewUser({ ...newUser, department_code: e.target.value })}
                  className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
                >
                  <option value="CSE">CSE</option>
                  <option value="AIDS">AI&amp;DS</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="MECH">MECH</option>
                  <option value="CIVIL">CIVIL</option>
                  <option value="SH">S&amp;H</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-nscet-navy text-white text-xs font-bold hover:bg-nscet-blue transition"
              >
                Create User
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 font-bold text-sm text-nscet-navy">
              Registered Portal Users ({users.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Dept</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-nscet-navy">{u.full_name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3 uppercase font-bold text-[10px] text-nscet-blue">
                        {u.role}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.department_code || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleUserActive(u)}
                          className="text-xs font-semibold text-nscet-blue hover:underline"
                        >
                          {u.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 font-bold text-sm text-nscet-navy">
            Security &amp; Administration Audit Logs ({auditLogs.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">
                      {String(log.created_at).replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-nscet-navy">{log.action}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {log.user_email || 'Guest'} ({log.user_role || 'guest'})
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{log.resource_type}</td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-500 font-mono max-w-xs truncate">
                      {JSON.stringify(log.details || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub = '', accent = 'blue' }) {
  const accentStyles = {
    blue: 'bg-blue-50 text-nscet-blue',
    navy: 'bg-slate-100 text-nscet-navy',
    gold: 'bg-nscet-goldSoft text-amber-800',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accentStyles[accent]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-extrabold text-nscet-navy">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}
