
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MissionControlDashboard from './pages/MissionControlDashboard';
import AGVDetails from './pages/AGVDetails';
import HistoricalAnalysis from './pages/HistoricalAnalysis';
import StatusPanel from './components/StatusPanel';

/**
 * Main application layout. Defines routing and structural elements.
 */
function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen bg-background-dark text-white font-sans">
        <header className="flex items-center justify-between p-4 bg-surface-dark shadow-md">
          <Link to="/" className="text-xl font-bold text-primary-blue tracking-wider">
            MANIFEST-ARCHITECT
          </Link>
          <nav>
            <Link to="/" className="px-4 text-sm font-medium hover:text-primary-blue">Dashboard</Link>
            <Link to="/history" className="px-4 text-sm font-medium hover:text-primary-blue">Historical Analysis</Link>
            <Link to="/settings" className="px-4 text-sm font-medium hover:text-primary-blue">Settings</Link>
          </nav>
        </header>

        <main className="flex flex-grow overflow-hidden">
          {/* StatusPanel is a persistent component for global alerts */}
          <StatusPanel />

          <div className="flex-grow overflow-y-auto p-4">
            <Routes>
              <Route path="/" element={<MissionControlDashboard />} />
              <Route path="/agv/:agvId" element={<AGVDetails />} />
              <Route path="/history" element={<HistoricalAnalysis />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
