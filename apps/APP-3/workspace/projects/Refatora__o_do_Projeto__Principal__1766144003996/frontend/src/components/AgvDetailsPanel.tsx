
import React, { useCallback, useState } from 'react';
import { useAgvDataStore } from '../store/agvStore';
import { AgvStatus, AgvCommandRequestSchema } from '../types';
import axios from 'axios';
import HistoricalChart from './HistoricalChart';

interface AgvDetailsPanelProps {
  agvId: string | null;
  onCommandSent: (agvId: string, command: string) => void;
}

/**
 * Renders detailed information for the selected AGV and allows command issuance.
 */
const AgvDetailsPanel: React.FC<AgvDetailsPanelProps> = ({ agvId, onCommandSent }) => {
  const agvData = useAgvDataStore(state => state.getAgvById(agvId || ''));
  const [loadingCommand, setLoadingCommand] = useState(false);
  const [commandError, setCommandError] = useState('');

  const handleSendCommand = useCallback(async (command: 'GOTO_MAINTENANCE_BAY' | 'EMERGENCY_STOP' | 'RESUME_MISSION') => {
    if (!agvId) return;

    try {
      setLoadingCommand(true);
      setCommandError('');

      // Validate command schema before sending
      const commandPayload = AgvCommandRequestSchema.parse({ command });

      // Send command via REST API (which then publishes to MQTT)
      await axios.post(`/api/v1/agv/${agvId}/command`, commandPayload, {
        headers: { Authorization: 'Bearer YOUR_JWT_TOKEN' } // RBAC/JWT requirement
      });

      onCommandSent(agvId, command);
      alert(`Command '${command}' successfully sent to AGV ${agvId}`);

    } catch (error) {
      console.error("Failed to send command:", error);
      setCommandError(`Failed to send command: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingCommand(false);
    }
  }, [agvId, onCommandSent]);

  if (!agvData) {
    return (
      <div className="text-gray-400 p-4">Selecione um AGV no mapa para ver detalhes.</div>
    );
  }

  // Determine AGV status visual class based on status (Priority 4)
  const statusClass = {
    OPERATIONAL: 'bg-success-green',
    WARNING: 'bg-warning-orange',
    PREDICTIVE_MAINTENANCE: 'bg-error-red animate-pulse',
    OFFLINE: 'bg-gray-500',
  }[agvData.status];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 flex justify-between items-center">
        AGV ID: {agvData.robotId}
        <span className={`px-2 py-1 text-xs font-semibold rounded ${statusClass} text-white`}>
          {agvData.status}
        </span>
      </h2>

      {/* Telemetry Snapshot Data */}
      <div className="space-y-3 p-3 bg-background-dark rounded-md shadow-inner mb-4">
        <div className="text-sm">
          <span className="font-medium">Position:</span> ({agvData.telemetry.positionX.toFixed(2)}, {agvData.telemetry.positionY.toFixed(2)})
        </div>
        <div className="text-sm">
          <span className="font-medium">Battery Level:</span> {agvData.telemetry.batteryLevel}%
          <span className="font-medium ml-4">Temp:</span> {agvData.telemetry.batteryTemperature.toFixed(1)}°C
        </div>
        <div className="text-sm">
          <span className="font-medium">Vibration:</span> {agvData.telemetry.motorVibrationMS2.toFixed(2)} m/s²
          <span className="font-medium ml-4">Load:</span> {agvData.telemetry.loadKG.toFixed(1)} kg
        </div>
      </div>

      {/* Command Panel */}
      <div className="p-3 bg-background-dark rounded-md shadow-inner mb-4">
        <h3 className="text-lg font-semibold mb-2 text-primary-blue">Comandos de Missão</h3>
        <button
          onClick={() => handleSendCommand('GOTO_MAINTENANCE_BAY')}
          className="w-full bg-warning-orange hover:bg-warning-orange/80 text-white font-bold py-2 px-4 rounded transition duration-200 mb-2 disabled:opacity-50"
          disabled={loadingCommand}
        >
          {loadingCommand ? 'Enviando...' : 'Go to Maintenance Bay'}
        </button>
        <button
          onClick={() => handleSendCommand('EMERGENCY_STOP')}
          className="w-full bg-error-red hover:bg-error-red/80 text-white font-bold py-2 px-4 rounded transition duration-200 disabled:opacity-50"
          disabled={loadingCommand}
        >
          {loadingCommand ? 'Enviando...' : 'Emergency Stop'}
        </button>
        {commandError && <p className="text-error-red text-xs mt-2">{commandError}</p>}
      </div>

      {/* Historical Data Analysis Chart */}
      <div className="p-3 bg-background-dark rounded-md shadow-inner flex-grow">
        <h3 className="text-lg font-semibold mb-2 text-primary-blue">Análise Histórica</h3>
        {/* Placeholder for the chart component */}
        <HistoricalChart agvId={agvId} />
      </div>
    </div>
  );
};

export default AgvDetailsPanel;
