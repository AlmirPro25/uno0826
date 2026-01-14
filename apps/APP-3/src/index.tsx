
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App'; // Import from same directory

// 👁️ GOD VIEW - Acesse via URL params:
//    ?godview=true     → Demo animada (Aether)
//    ?godview=real     → Colaboração real com API
const urlParams = new URLSearchParams(window.location.search);
const godViewMode = urlParams.get('godview');

function mountApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Fatal Error: Could not find root element with ID 'root' to mount to. Ensure it exists in your index.html.");
    // Display a user-friendly message on the page itself if possible
    document.body.innerHTML = `
      <div style="font-family: sans-serif; padding: 20px; text-align: center; color: #ff4d4d; background-color: #fff0f0; border: 1px solid #ffb8b8; border-radius: 8px;">
        <h1>Application Mount Error</h1>
        <p>Could not find the root HTML element (<code>#root</code>) to start the application.</p>
        <p>Please check the browser console for more details or contact support.</p>
      </div>
    `;
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  
  // 👁️ God View modes
  if (godViewMode === 'true' || godViewMode === 'demo') {
    // Demo animada
    import('../components/GodView/AetherGodView').then(({ AetherGodView }) => {
      root.render(
        <React.StrictMode>
          <AetherGodView />
        </React.StrictMode>
      );
    }).catch(err => {
      console.error('Erro ao carregar Aether God View:', err);
      root.render(<React.StrictMode><App /></React.StrictMode>);
    });
  } else if (godViewMode === 'real') {
    // Colaboração real com API
    import('../components/GodView/RealGodView').then(({ RealGodView }) => {
      root.render(
        <React.StrictMode>
          <RealGodView />
        </React.StrictMode>
      );
    }).catch(err => {
      console.error('Erro ao carregar Real God View:', err);
      root.render(<React.StrictMode><App /></React.StrictMode>);
    });
  } else {
    // App normal
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

if (document.readyState === 'loading') {
  // Loading hasn't finished yet
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  // DOMContentLoaded has already fired
  mountApp();
}