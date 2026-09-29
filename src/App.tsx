import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { CitizenPortal } from './components/citizen/CitizenPortal';
import { OfficerCommandCenter } from './components/officer/OfficerCommandCenter';
import { AiCopilotWidget } from './components/copilot/AiCopilotWidget';

const MainContent: React.FC = () => {
  const { role } = useApp();

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        {role === 'citizen' ? <CitizenPortal /> : <OfficerCommandCenter />}
      </main>

      <AiCopilotWidget />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
