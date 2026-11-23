import React from 'react';
import {
  MessageSquare,
  Building2,
  GraduationCap,
  Layers,
  BookOpen,
  Briefcase,
  Users,
  ShieldCheck,
  FileText,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const PRIMARY_NAV = [
  { id: 'chat', label: 'AI Chat Assistant', icon: MessageSquare, badge: '24/7' },
  { id: 'college', label: 'College Information', icon: Building2 },
  { id: 'admissions', label: 'Admission Assistant', icon: GraduationCap },
  { id: 'departments', label: 'Departments (8)', icon: Layers },
  { id: 'academics', label: 'Student Academics', icon: BookOpen },
  { id: 'placements', label: 'Placement Assistant', icon: Briefcase },
  { id: 'faculty', label: 'Faculty Assistant', icon: Users },
];

const ADMIN_NAV = [
  { id: 'admin-dashboard', label: 'Admin Dashboard', icon: ShieldCheck },
  { id: 'admin-documents', label: 'RAG Documents', icon: FileText },
];

export default function Sidebar({ activeView, onSelectView, mobileOpen, onCloseMobile }) {
  const { isAdmin, user } = useAuth();

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = activeView === item.id;
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onSelectView(item.id);
          onCloseMobile();
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive
            ? 'bg-nscet-gold text-nscet-navy shadow-sm font-semibold'
            : 'text-blue-100/90 hover:bg-white/10 hover:text-white'
        }`}
      >
        <span className="flex items-center gap-3">
          <Icon className={`w-4 h-4 ${isActive ? 'text-nscet-navy' : 'text-nscet-goldLight'}`} />
          <span>{item.label}</span>
        </span>
        {item.badge && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isActive ? 'bg-nscet-navy text-white' : 'bg-white/15 text-nscet-goldLight'
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full nscet-gradient text-white">
      {/* Institutional Header (No fabricated crest/logo — monogram only until official logo file is supplied) */}
      <div className="px-4 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-nscet-gold/60 flex items-center justify-center shrink-0">
            <span className="text-nscet-goldLight font-extrabold text-xs tracking-wider">NSCET</span>
          </div>
          <div className="leading-tight">
            <div className="font-bold text-sm tracking-tight text-white">NSCET AI Assistant</div>
            <div className="text-[11px] text-blue-200/80">Vadapudupatti, Theni</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-blue-200 hover:bg-white/10"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
        <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-blue-200/60">
          Campus Modules
        </div>
        {PRIMARY_NAV.map(renderNavItem)}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-white/10 space-y-1">
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-nscet-goldLight/90">
              Administration
            </div>
            {ADMIN_NAV.map(renderNavItem)}
          </div>
        )}
      </nav>

      {/* Footer Institutional Badge */}
      <div className="p-3.5 m-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-2 text-xs font-semibold text-nscet-goldLight">
          <Sparkles className="w-3.5 h-3.5" />
          <span>English &amp; தமிழ் Support</span>
        </div>
        <p className="mt-1 text-[11px] text-blue-100/75 leading-relaxed">
          Nadar Saraswathi College of Engineering &amp; Technology. Grounded in verified documents.
        </p>
        {user && (
          <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-blue-200 truncate">
            Signed in: <span className="font-semibold text-white">{user.role.toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-68 xl:w-72 shrink-0 h-full shadow-lg z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
