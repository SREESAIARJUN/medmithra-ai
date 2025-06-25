import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/AuthComponents';
import { EnhancedDashboard } from './components/EnhancedDashboard';
import { MultimodalCaseEntry } from './components/MultimodalCaseEntry';
import { VoiceCommandInterface } from './components/VoiceCommandInterface';
import { CreateCase, CasesList } from './components/CaseComponents';
import { CaseDetail } from './components/CaseDetail';
import { SearchCases } from './components/SearchComponents';
import { ProfileManagement } from './components/ProfileComponents';

// Main application component
const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentCaseId, setCurrentCaseId] = useState(null);

  const navigate = (view, caseId = null) => {
    setCurrentView(view);
    setCurrentCaseId(caseId);
  };

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">🩺 Clinical Insight Assistant</h2>
          <p className="text-white/80">Loading your AI-powered medical dashboard...</p>
          <div className="mt-4 space-y-1 text-sm text-white/60">
            <div>🤖 Initializing AI models</div>
            <div>🎤 Loading speech recognition</div>
            <div>📊 Preparing multimodal analysis</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Render the appropriate view based on currentView
  switch (currentView) {
    case 'dashboard':
      return <EnhancedDashboard onNavigate={navigate} />;
    case 'multimodal-entry':
      return <MultimodalCaseEntry onNavigate={navigate} />;
    case 'voice-commands':
      return <VoiceCommandInterface onNavigate={navigate} />;
    case 'create-case':
      return <CreateCase onNavigate={navigate} />;
    case 'cases':
      return <CasesList onNavigate={navigate} />;
    case 'case-detail':
      return <CaseDetail caseId={currentCaseId} onNavigate={navigate} />;
    case 'search':
      return <SearchCases onNavigate={navigate} />;
    case 'profile':
      return <ProfileManagement onNavigate={navigate} />;
    default:
      return <EnhancedDashboard onNavigate={navigate} />;
  }
};

// Root App component with providers
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="app">
          <AppContent />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
