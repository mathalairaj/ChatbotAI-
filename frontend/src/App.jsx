import React, { useEffect, useState } from 'react';
import Sidebar from './components/layout/Sidebar.jsx';
import Header from './components/layout/Header.jsx';
import AuthModal from './components/auth/AuthModal.jsx';
import ChatInterface from './components/chat/ChatInterface.jsx';
import CollegeInfoPanel from './components/modules/CollegeInfoPanel.jsx';
import AdmissionPanel from './components/modules/AdmissionPanel.jsx';
import DepartmentPanel from './components/modules/DepartmentPanel.jsx';
import StudentAcademicPanel from './components/modules/StudentAcademicPanel.jsx';
import PlacementPanel from './components/modules/PlacementPanel.jsx';
import FacultyPanel from './components/modules/FacultyPanel.jsx';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import DocumentManager from './components/admin/DocumentManager.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { api } from './services/api.js';

export default function App() {
  const { user, isAdmin } = useAuth();
  const [activeView, setActiveView] = useState('chat');
  const [persona, setPersona] = useState('prospective_student');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState('');
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    api.health().then(setSystemHealth).catch(() => {});
  }, []);

  // Automatically align persona with authenticated user role
  useEffect(() => {
    if (user?.role === 'faculty') setPersona('faculty');
    else if (user?.role === 'student') setPersona('current_student');
  }, [user]);

  // Redirect away from admin-only views if signed out
  useEffect(() => {
    if (!isAdmin && (activeView === 'admin-dashboard' || activeView === 'admin-documents')) {
      setActiveView('chat');
    }
  }, [isAdmin, activeView]);

  const handleAskAi = (promptText) => {
    setPendingPrompt(promptText);
    setActiveView('chat');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          persona={persona}
          onChangePersona={setPersona}
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          systemHealth={systemHealth}
        />

        <main className="flex-1 overflow-y-auto">
          {activeView === 'chat' && (
            <ChatInterface
              persona={persona}
              pendingPrompt={pendingPrompt}
              onConsumePendingPrompt={() => setPendingPrompt('')}
            />
          )}
          {activeView === 'college' && <CollegeInfoPanel onAskAi={handleAskAi} />}
          {activeView === 'admissions' && <AdmissionPanel onAskAi={handleAskAi} />}
          {activeView === 'departments' && <DepartmentPanel onAskAi={handleAskAi} />}
          {activeView === 'academics' && (
            <StudentAcademicPanel
              onOpenAuth={() => setAuthModalOpen(true)}
              onAskAi={handleAskAi}
            />
          )}
          {activeView === 'placements' && <PlacementPanel onAskAi={handleAskAi} />}
          {activeView === 'faculty' && (
            <FacultyPanel
              onOpenAuth={() => setAuthModalOpen(true)}
              onAskAi={handleAskAi}
            />
          )}
          {activeView === 'admin-dashboard' && isAdmin && (
            <AdminDashboard onNavigateDocuments={() => setActiveView('admin-documents')} />
          )}
          {activeView === 'admin-documents' && isAdmin && <DocumentManager />}
        </main>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(loggedUser) => {
          if (loggedUser?.role === 'admin') setActiveView('admin-dashboard');
        }}
      />
    </div>
  );
}
