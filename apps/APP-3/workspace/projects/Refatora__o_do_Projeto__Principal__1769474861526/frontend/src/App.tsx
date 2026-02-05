
import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTacticalStore } from './stores/tacticalStore';
import { useTacticalLoop } from './hooks/useTacticalLoop';
import { useGameAudio } from './hooks/useGameAudio';
import { Header } from './components/dashboard/Header';
import { Fabricator } from './components/dashboard/Fabricator';
import { UnitRoster } from './components/dashboard/UnitRoster';
import { TacticalMap } from './components/dashboard/TacticalMap';
import { ConsoleLog } from './components/dashboard/ConsoleLog';
import { StatusBanner } from './components/dashboard/StatusBanner';
import { LoginScreen } from './components/auth/LoginScreen';
import { RegisterScreen } from './components/auth/RegisterScreen';

// Dashboard Layout Component
const DashboardLayout = () => {
  // Initialize tactical loop (polling for data)
  useTacticalLoop(1000); // Poll every 1 second

  // Initialize game audio (for feedback)
  useGameAudio();

  return (
    <div className="h-screen w-screen flex flex-col bg-aegis-black text-aegis-green font-mono crt overflow-hidden">
      {/* SCANLINE OVERLAY */}
      <div className="scanline"></div>

      <StatusBanner /> {/* Global error banner */}

      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <Header />

        <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
          
          {/* LEFT COLUMN: Logistics */}
          <section className="col-span-1 md:col-span-3 flex flex-col h-full min-h-0">
            <Fabricator />
            <UnitRoster />
          </section>

          {/* CENTER COLUMN: The Map */}
          <section className="col-span-1 md:col-span-6 h-full min-h-0">
            <TacticalMap />
          </section>

          {/* RIGHT COLUMN: Intel */}
          <section className="col-span-1 md:col-span-3 h-full min-h-0">
            <ConsoleLog />
          </section>
        </main>
      </div>
    </div>
  );
}

// Protected Route Component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useTacticalStore();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen w-screen bg-aegis-black text-aegis-green text-2xl animate-pulse">
      LOADING TACTICAL SYSTEMS...
    </div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  const { initializeAuth } = useTacticalStore();

  useEffect(() => {
    initializeAuth(); // Attempt to load token from localStorage on app start
  }, [initializeAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} /> {/* Default route */}
      </Routes>
    </Router>
  );
}

export default App;
