import React, { useEffect, useState } from 'react';
import {
  Building2,
  Target,
  Award,
  FlaskConical,
  BookMarked,
  Bus,
  Home,
  Users,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../services/api.js';

const FACILITY_ICONS = [FlaskConical, BookMarked, Bus, Home, Users];

export default function CollegeInfoPanel({ onAskAi }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getCollegeProfile()
      .then((res) => setProfile(res.profile))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !profile) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">Loading NSCET College Profile...</div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Institutional Hero Card */}
      <div className="nscet-gradient rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-nscet-gold/50 text-xs font-semibold text-nscet-goldLight mb-3">
            <Building2 className="w-3.5 h-3.5" />
            <span>College Information Assistant</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {profile.institutionName}
          </h2>
          <p className="mt-1 text-sm text-blue-200 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-nscet-goldLight" />
            <span>{profile.location}</span>
          </p>
          <p className="mt-4 text-sm text-blue-100/90 leading-relaxed">{profile.profileSummary}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onAskAi('What facilities are available on campus?')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-nscet-gold text-nscet-navy text-xs font-bold hover:bg-nscet-goldLight transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask AI About Campus</span>
            </button>
          </div>
        </div>
      </div>

      {/* Vision, Mission & Accreditation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
          <div className="flex items-center gap-2 text-nscet-navy font-bold text-base mb-3">
            <Target className="w-5 h-5 text-nscet-gold" />
            <h3>Vision &amp; Mission</h3>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-nscet-blue mb-1">
                Vision
              </div>
              <p className="leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                {profile.vision}
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-nscet-blue mb-1">
                Mission
              </div>
              <ul className="space-y-1.5 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                {profile.mission.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-nscet-navy font-bold text-base mb-3">
              <Award className="w-5 h-5 text-nscet-gold" />
              <h3>Accreditation &amp; Affiliations</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {profile.accreditationAndAffiliation}
            </p>
          </div>
          <div className="mt-4 p-3.5 rounded-xl bg-nscet-goldSoft/70 border border-amber-200 text-xs text-amber-900">
            <strong>Institutional Accuracy Notice:</strong> Official college logo, NAAC/NBA
            accreditation certificates, and statutory prospectus PDFs can be uploaded directly by
            Administrators via the <strong>RAG Documents</strong> dashboard.
          </div>
        </div>
      </div>

      {/* Campus Facilities */}
      <div>
        <h3 className="text-base font-bold text-nscet-navy mb-3">
          Campus Facilities, Labs, Library, Transport, Hostel &amp; Clubs
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profile.campusFacilities.map((fac, idx) => {
            const Icon = FACILITY_ICONS[idx % FACILITY_ICONS.length];
            return (
              <div
                key={fac.name}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card hover:border-nscet-blue/40 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-nscet-sky text-nscet-navy flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-nscet-navy">{fac.name}</h4>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{fac.description}</p>
                <p className="mt-2.5 text-[11px] font-medium text-nscet-blue bg-blue-50/70 px-2.5 py-1.5 rounded-lg">
                  {fac.status}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
        <h3 className="text-base font-bold text-nscet-navy mb-3">Campus Offices &amp; Contact Guidance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profile.contacts.map((c) => (
            <div key={c.office} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-nscet-navy">{c.office}</div>
              <div className="text-xs text-slate-600 mt-1">{c.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
