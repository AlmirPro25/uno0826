/**
 * 👁️ God View Standalone - Acesse diretamente via ?godview=true na URL
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { AetherGodView } from '../components/GodView/AetherGodView';

// Verificar se deve mostrar God View
const urlParams = new URLSearchParams(window.location.search);
const showGodView = urlParams.get('godview') === 'true';

if (showGodView) {
  const root = document.getElementById('root');
  if (root) {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <AetherGodView />
      </React.StrictMode>
    );
  }
}

export { showGodView };
