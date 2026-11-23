import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  ClipboardCheck,
  ShieldAlert,
  Send,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../services/api.js';

export default function AdmissionPanel({ onAskAi }) {
  const [info, setInfo] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    city_district: '',
    programme_level: 'UG',
    preferred_department: 'B.E. Computer Science and Engineering',
    admission_mode: 'TNEA Counselling',
    qualification_details: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    api.getAdmissionInfo().then(setInfo).catch(() => {});
  }, []);

  const handleProgrammeChange = (level) => {
    setForm((prev) => ({
      ...prev,
      programme_level: level,
      preferred_department:
        level === 'PG'
          ? 'M.E. Computer Science and Engineering'
          : 'B.E. Computer Science and Engineering',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.submitAdmissionEnquiry(form);
      setReceipt(res);
      setForm({
        full_name: '',
        email: '',
        phone: '',
        city_district: '',
        programme_level: 'UG',
        preferred_department: 'B.E. Computer Science and Engineering',
        admission_mode: 'TNEA Counselling',
        qualification_details: '',
        message: '',
      });
    } catch (err) {
      setError(err.message || 'Unable to submit enquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!info) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading Admission Assistant...</div>;
  }

  const departmentChoices =
    form.programme_level === 'PG' ? info.programmes.pg : info.programmes.ug;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="nscet-gradient rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-nscet-goldLight uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Admission Assistant</span>
          </div>
          <h2 className="text-2xl font-extrabold mt-1">NSCET UG &amp; PG Admissions Guidance</h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            TNEA Counselling, Management Quota Enquiries, Programmes, Certificates &amp; Official Registration
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAskAi('How can I apply for admission?')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-nscet-gold text-nscet-navy text-xs font-bold hover:bg-nscet-goldLight transition shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask Admission AI</span>
        </button>
      </div>

      {/* Zero-Fabrication Verification Notice */}
      <div className="bg-nscet-goldSoft/80 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 space-y-1">
          <div className="font-bold">Official Verification Policy (Zero-Fabrication Guarantee)</div>
          <p>
            Exact eligibility percentages, TNEA cutoffs, tuition/hostel fees, scholarship amounts,
            and current-year admission deadlines are <strong>never invented or estimated</strong> by
            this portal. Submit the Admission Enquiry form below to receive verified current-year
            details directly from the NSCET Admission Office.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Programmes, Modes, Certificates */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <h3 className="font-bold text-sm text-nscet-navy mb-3">Programmes Offered</h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold text-nscet-blue uppercase tracking-wider mb-1.5">
                  Undergraduate Programmes (B.E. / B.Tech.)
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {info.programmes.ug.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-nscet-gold" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-bold text-nscet-blue uppercase tracking-wider mb-1.5">
                  Postgraduate Programme (M.E.)
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {info.programmes.pg.map((p) => (
                    <li key={p} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-nscet-gold" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <h3 className="font-bold text-sm text-nscet-navy mb-3">Admission Pathways</h3>
            <div className="space-y-3">
              {info.admissionModes.map((m) => (
                <div key={m.title} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-nscet-navy">{m.title}</div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{m.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <div className="flex items-center gap-2 font-bold text-sm text-nscet-navy mb-3">
              <ClipboardCheck className="w-4 h-4 text-nscet-gold" />
              <h3>Required Certificates Checklist</h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              {info.requiredCertificatesChecklist.map((c) => (
                <li key={c} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Admission Enquiry Registration Form */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card sticky top-20">
            <h3 className="text-base font-bold text-nscet-navy">
              Admission Enquiry Registration Form
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Register your enquiry to receive verified fee structure, scholarships, and admission guidance from NSCET.
            </p>

            {receipt && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enquiry Registered Successfully!</span>
                </div>
                <p>{receipt.confirmation}</p>
                <div className="font-mono text-[11px] bg-white px-2.5 py-1 rounded border border-emerald-200 inline-block mt-1">
                  Reference Code: <strong>{receipt.enquiry.reference_code}</strong>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Applicant Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Enter student full name"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="student@email.com"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Programme Level *
                  </label>
                  <select
                    value={form.programme_level}
                    onChange={(e) => handleProgrammeChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                  >
                    <option value="UG">Undergraduate (B.E. / B.Tech.)</option>
                    <option value="PG">Postgraduate (M.E. CSE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Admission Mode
                  </label>
                  <select
                    value={form.admission_mode}
                    onChange={(e) => setForm({ ...form, admission_mode: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                  >
                    <option>TNEA Counselling</option>
                    <option>Management Quota Enquiry</option>
                    <option>Lateral Entry (Diploma)</option>
                    <option>PG Admission (M.E.)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Department / Programme *
                </label>
                <select
                  value={form.preferred_department}
                  onChange={(e) => setForm({ ...form, preferred_department: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                >
                  {departmentChoices.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City / District
                  </label>
                  <input
                    type="text"
                    value={form.city_district}
                    onChange={(e) => setForm({ ...form, city_district: e.target.value })}
                    placeholder="e.g., Theni, Madurai"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qualifying Exam
                  </label>
                  <input
                    type="text"
                    value={form.qualification_details}
                    onChange={(e) => setForm({ ...form, qualification_details: e.target.value })}
                    placeholder="e.g., 12th HSC / Diploma / B.E."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enquiry Message / Questions
                </label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Ask about hostel, transport, scholarships, or campus visit..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-nscet-navy text-white text-sm font-semibold hover:bg-nscet-blue transition disabled:opacity-60"
              >
                <Send className="w-4 h-4 text-nscet-goldLight" />
                <span>{submitting ? 'Submitting Enquiry...' : 'Submit Admission Enquiry'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
