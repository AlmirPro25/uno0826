
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { AgvStatus } from '../types';
import { useAgvDataStore } from '../store/agvStore';
import AgvDetailsPanel from '../components/AgvDetailsPanel';

/**
 * MissionControlDashboard: Main real-time visualization page.
 * Renders the map with 5000 AGVs using Canvas for high performance.
 */
const MissionControlDashboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isConnected } = useWebSocket();
  const { agvs, updateAgvData } = useAgvDataStore();
  const [selectedAgvId, setSelectedAgvId] = useState<string | null>(null);

  //
