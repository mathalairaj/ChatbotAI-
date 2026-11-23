import React, { useEffect, useState } from 'react';
import {
  Layers,
  FlaskConical,
  Users,
  Calendar,
  Wrench,
  Factory,
  Trophy,
  Microscope,
  MessageSquare,
} from 'lucide-react';
import { api } from '../../services/api.js';

export default function DepartmentPanel({ onAskAi }) {
  const [departments, setDepartments] = useState([]);
  const [selectedCode, setSelectedCode] = useState('CSE');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listDepartments()
      .then((res) => {
        setDepartments(res.departments || []);
        if (res.departments?.length) setSelectedCode(res.departments[0].code);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading NSCET Departments...</div>;
  }

  const active = departments.find((d) => d.code === selectedCode) || departments[0];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="nscet-gradient rounded-2xl p-6 text-white shadow-lg">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-nscet-goldLight uppercase tracking-wider">
          <Layers className="w-4 h-4" />
          <span>Department Assistant</span>
        </div>
        <h2 className="text-2xl font-extrabold mt-1">Academic Departments at NSCET</h2>
        <p className="text-xs sm:text-sm text-blue-200 mt-1">
          Explore all 8 departments: CSE, AI&amp;DS, IT, ECE, EEE, Mechanical, Civil, and Science &amp; Humanities.
        </p>
      </div>

      {/* Department Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {departments.map((dept) => (
          <button
            key={dept.code}
            type="button"
            onClick={() => setSelectedCode(dept.code)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
              active?.code === dept.code
                ? 'bg-nscet-navy text-white border-nscet-navy shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-nscet-blue'
            }`}
          >
            {dept.code === 'AIDS' ? 'AI&DS' : dept.code === 'SH' ? 'S&H' : dept.code} — {dept.name}
          </button>
        ))}
      </div>

      {active && (
        <div className="space-y-5">
          {/* Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-nscet-sky text-nscet-navy">
                    {active.degree_level}
                  </span>
                  {active.is_demo_data && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      Demonstration Placeholders Included
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-nscet-navy mt-2">{active.name}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">{active.overview}</p>
              </div>
              <button
                type="button"
                onClick={() => onAskAi(`Tell me about the ${active.name} department at NSCET`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-nscet-gold text-nscet-navy text-xs font-bold hover:bg-nscet-goldLight transition shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Ask AI About {active.code}</span>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs font-bold uppercase tracking-wider text-nscet-blue mb-2">
                Courses Offered
              </div>
              <div className="flex flex-wrap gap-2">
                {active.courses_offered.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-nscet-navy"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InfoListCard icon={FlaskConical} title="Laboratory Facilities" items={active.laboratories} />
            <InfoListCard icon={Microscope} title="Research Activities" items={active.research_activities} />
            <InfoListCard icon={Calendar} title="Department Events" items={active.events} />
            <InfoListCard icon={Wrench} title="Workshops & Seminars" items={active.workshops} />
            <InfoListCard icon={Factory} title="Industrial Visits" items={active.industrial_visits} />
            <InfoListCard icon={Trophy} title="Student Achievements" items={active.student_achievements} />
          </div>

          {/* Faculty Directory */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <div className="flex items-center gap-2 font-bold text-sm text-nscet-navy mb-3">
              <Users className="w-4 h-4 text-nscet-gold" />
              <h4>Department Faculty Information</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(active.faculty || []).map((f) => (
                <div key={f.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-sm font-bold text-nscet-navy">{f.full_name}</div>
                  <div className="text-xs font-semibold text-nscet-blue mt-0.5">{f.designation}</div>
                  <div className="text-xs text-slate-600 mt-1.5">
                    <strong>Qualification:</strong> {f.qualification}
                  </div>
                  <div className="text-xs text-slate-600">
                    <strong>Specialization:</strong> {f.specialization}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{f.email}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoListCard({ icon: Icon, title, items }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
      <div className="flex items-center gap-2 font-bold text-sm text-nscet-navy mb-2.5">
        <Icon className="w-4 h-4 text-nscet-gold" />
        <h4>{title}</h4>
      </div>
      <ul className="space-y-2 text-xs text-slate-600">
        {(items || []).map((item, i) => (
          <li key={i} className="flex items-start gap-2 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-nscet-blue mt-1.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
