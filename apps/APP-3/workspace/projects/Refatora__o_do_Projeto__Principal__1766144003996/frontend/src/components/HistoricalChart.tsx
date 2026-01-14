
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartData, ChartOptions
} from 'chart.js';
import { AgvTelemetrySnapshot } from '../types';
import axios from 'axios';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface HistoricalChartProps {
  agvId: string | null;
}

/**
 * HistoricalChart component fetches and renders time-series data for a specific AGV.
 * This component demonstrates the "Analise Histórica" feature from the requirements.
 */
const HistoricalChart: React.FC<HistoricalChartProps> = ({ agvId }) => {
  const [historyData, setHistoryData] = useState<AgvTelemetrySnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!agvId) {
      setHistoryData([]);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get<AgvTelemetrySnapshot[]>(`/api/v1/agv/${agvId}/history?duration=6h`);
        setHistoryData(response.data);
      } catch (err) {
        setError("Error fetching historical data.");
        setHistoryData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [agvId]);

  if (loading) {
    return <div className="text-primary-blue">Loading historical data...</div>;
  }

  if (error) {
    return <div className="text-error-red">{error}</div>;
  }

  if (historyData.length === 0) {
    return <div className="text-gray-400">No historical data available for analysis.</div>;
  }

  //
