import React from 'react';
import { Menu, LogIn, LogOut, UserCircle2, Shield, Cpu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const PERSONA_OPTIONS = [
  { value: 'prospective_student', label: 'Prospective Student' },
  { value: 'current_student', label: 'Current Student' },
  { value: 'faculty', label: 'Faculty Member' },
  { value: 'parent_visitor', label: 'Parent / Visitor' },
];

export default function Header({
  persona,
  onChangePersona,
  onOpenAuth,
  onOpenMobileMenu,
  systemHealth,
}) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200/90 px-4 lg:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-10">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-nscet-navy hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-nscet-navy truncate">
            Nadar Saraswathi College of Engineering &amp; Technology
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="truncate">Vadapudupatti, Theni, Tamil Nadu</span>
            {systemHealth && (
              <span
                className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  systemHealth.aiMode === 'openai'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-50 text-nscet-blue border border-blue-200'
                }`}
                title={`Database: ${systemHealth.databaseEngine} | Model: ${systemHealth.chatModel}`}
              >
                <Cpu className="w-3 h-3" />
                {systemHealth.aiMode === 'openai' ? `OpenAI (${systemHealth.chatModel})` : 'Grounded RAG Mode'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {/* Audience / Persona Selector */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Role View:
          </span>
          <select
            value={persona}
            onChange={(e) => onChangePersona(e.target.value)}
            aria-label="Select your visitor or campus role"
            className="text-xs font-semibold text-nscet-navy bg-transparent focus:outline-none cursor-pointer"
          >
            {PERSONA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Auth Actions */}
        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-nscet-sky border border-blue-100">
              {user.role === 'admin' ? (
                <Shield className="w-4 h-4 text-nscet-gold" />
              ) : (
                <UserCircle2 className="w-4 h-4 text-nscet-blue" />
              )}
              <div className="leading-tight">
                <div className="text-xs font-semibold text-nscet-navy max-w-[130px] truncate">
                  {user.full_name}
                </div>
                <div className="text-[10px] font-bold uppercase text-nscet-blue">{user.role}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-nscet-navy text-white hover:bg-nscet-blue transition shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5 text-nscet-goldLight" />
            <span>Portal Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
