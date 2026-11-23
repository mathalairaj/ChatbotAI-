import React, { useState } from 'react';
import { X, Lock, Mail, User, GraduationCap, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@nscet.edu.in', pass: 'Admin@NSCET2026', desc: 'Dashboard, RAG Docs, Leads' },
  { role: 'Faculty', email: 'faculty@nscet.edu.in', pass: 'Faculty@NSCET2026', desc: 'Faculty Hub & Doc Tools' },
  { role: 'Student', email: 'student@nscet.edu.in', pass: 'Student@NSCET2026', desc: 'Protected Student Academics' },
];

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('CSE');
  const [registerNumber, setRegisterNumber] = useState('');
  const [academicYear, setAcademicYear] = useState('I Year');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      let loggedUser;
      if (mode === 'login') {
        loggedUser = await login(email, password);
      } else {
        loggedUser = await register({
          full_name: fullName,
          email,
          password,
          role: 'student',
          department_code: departmentCode,
          register_number: registerNumber || undefined,
          academic_year: academicYear,
        });
      }
      onSuccess?.(loggedUser);
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const quickFillDemo = (acc) => {
    setMode('login');
    setEmail(acc.email);
    setPassword(acc.pass);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="nscet-gradient px-6 py-5 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-nscet-goldLight" />
              {mode === 'login' ? 'NSCET Portal Sign In' : 'Student Registration'}
            </h2>
            <p className="text-xs text-blue-200 mt-0.5">
              Role-based access for Admin, Faculty &amp; Students
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:bg-white/10"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-3 text-xs font-bold uppercase tracking-wider transition ${
              mode === 'login'
                ? 'bg-white text-nscet-navy border-b-2 border-nscet-gold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`py-3 text-xs font-bold uppercase tracking-wider transition ${
              mode === 'register'
                ? 'bg-white text-nscet-navy border-b-2 border-nscet-gold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Student Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-nscet-blue/25 focus:border-nscet-blue outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={departmentCode}
                    onChange={(e) => setDepartmentCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                  >
                    <option value="CSE">CSE</option>
                    <option value="AIDS">AI&amp;DS</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="SH">S&amp;H (I Year)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                  >
                    <option>I Year</option>
                    <option>II Year</option>
                    <option>III Year</option>
                    <option>IV Year</option>
                    <option>PG — M.E. CSE</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Register Number (Optional)
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    placeholder="University Register Number"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-nscet-blue outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@nscet.edu.in"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-nscet-blue/25 focus:border-nscet-blue outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                minLength={mode === 'register' ? 8 : 6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Minimum 8 characters' : 'Enter your password'}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-nscet-blue/25 focus:border-nscet-blue outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-nscet-navy text-white text-sm font-semibold hover:bg-nscet-blue transition disabled:opacity-60"
          >
            {submitting
              ? 'Authenticating...'
              : mode === 'login'
              ? 'Sign In to NSCET Portal'
              : 'Create Student Account'}
          </button>

          {mode === 'login' && (
            <div className="pt-3 border-t border-slate-200">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Demonstration Accounts (Click to Fill)
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => quickFillDemo(acc)}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:border-nscet-gold hover:bg-nscet-goldSoft/60 text-left transition"
                  >
                    <div className="text-xs font-bold text-nscet-navy">{acc.role}</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{acc.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
