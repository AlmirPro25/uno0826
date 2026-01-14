
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { WebSocketProvider } from './context/WebSocketContext';

const container = document.getElementById('root');
if (!container) {
    throw new Error("Failed to find the root element.");
}
const root = createRoot(container);

// Wraps the application with necessary contexts for real-time data streaming
root.render(
  <React.StrictMode>
    <WebSocketProvider url="ws://localhost:8080/ws/v1/fleet/status">
      <App />
    </WebSocketProvider>
  </React.StrictMode>
);
