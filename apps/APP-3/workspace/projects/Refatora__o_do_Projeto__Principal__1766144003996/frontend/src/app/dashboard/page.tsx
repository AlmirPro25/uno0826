
"use client";

import { LayoutDashboard, AlertTriangle, Cpu, CircleDotDashed } from "lucide-react";
import FleetSummary from "@/components/Dashboard/FleetSummary";
import FleetMapCanvas from "@/components/Dashboard/FleetMapCanvas";
import SidebarNavigation from "@/components/SidebarNavigation";
import StatusPanel from "@/components/Dashboard/StatusPanel";
import AgvDetailsPanel from "@/components/Dashboard/AgvDetailsPanel";
import { useFleetStore } from "@/store/fleetStore";
import { useWebSocketClient } from "@/hooks/useWebSocketClient";
import { AnimatePresence, motion } from "framer-motion";
import { AgvOperationalStatus } from "@/types/agv";

/**
 * Main dashboard page for MANIFEST-ARCHITECT Mission Control.
 * Displays real-time AGV locations, fleet summary, and a detail panel.
 * Uses a responsive grid layout (Priority 5: Mobile-first).
 */
export default function DashboardPage() {
  // 1. Establish real-time WebSocket connection to backend twin-service
  useWebSocketClient("ws://localhost:8080/api/v1/ws/fleet/status");

  // 2. Retrieve state from Zustand store
  const { agvs, statusSummary, selectedAgvId, isLoading } = useFleetStore();

  // 3. Filter AGVs for alert list (Priority 4: high contrast alerts)
  const alertAgvs = Array.from(agvs.values()).filter(
    (agv) => agv.status === AgvOperationalStatus.PREDICTIVE_MAINTENANCE || agv.status === AgvOperationalStatus.WARNING
  );

  return (
    <div className="dashboard-layout bg-background dark:bg-gray-950">
      {/* Header and Navbar */}
      <header className="grid-area header border-b px-6 py-4 flex items-center justify-between z-10 bg-card shadow-lg">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-primary dark:text-gray-100">
          <Cpu className="h-6 w-6 text-indigo-500" /> MANIFEST-ARCHITECT
        </h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">AGV Digital Twin Platform</span>
          {/* Add user menu or settings here */}
        </div>
      </header>

      {/* Left Sidebar: Fleet Summary and Navigation */}
      <aside className="grid-area sidebar border-r p-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto hidden lg:block">
        <SidebarNavigation activePath="/dashboard" />
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 text-primary dark:text-gray-100 flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" /> Fleet Summary
          </h2>
          {isLoading ? (
            <div className="p-4 bg-card rounded-lg shadow-inner animate-pulse">Loading data...</div>
          ) : (
            <FleetSummary summary={statusSummary} />
          )}
        </div>
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 text-red-500 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Critical Alerts
          </h2>
          <StatusPanel agvs={alertAgvs} />
        </div>
      </aside>

      {/* Main Content Area: Warehouse Map Visualization */}
      <main className="grid-area main relative p-4 lg:p-8 overflow-hidden">
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm"
            >
              <CircleDotDashed className="h-12 w-12 text-indigo-400 animate-spin" />
              <p className="mt-4 text-lg text-white font-mono">Loading Real-time Telemetry...</p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="w-full h-full bg-gray-800 rounded-lg shadow-2xl overflow-hidden relative">
          <h2 className="absolute top-4 left-4 text-white font-semibold z-10 text-xl backdrop-blur-sm bg-gray-900/50 p-2 rounded">
            Warehouse Map Visualization (5,000 AGVs)
          </h2>
          <FleetMapCanvas agvs={agvs} selectedAgvId={selectedAgvId} />
        </div>
      </main>

      {/* Right Sidebar: AGV Detail Panel */}
      <aside className="grid-area sidebar-right border-l p-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto hidden lg:block">
        <AgvDetailsPanel agvId={selectedAgvId} />
      </aside>
    </div>
  );
}
