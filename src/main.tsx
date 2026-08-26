import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { FundGate } from './components/FundGate';
import type { FundSnapshot } from './domain/models';
import { repository } from './services/repository';
import './styles/tokens.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/sidebar.css';
import './styles/fund.css';
import './styles/admin.css';

/* Défini ici, hors du rendu : `FundGate` s'appuie sur une référence stable. */
function handleUnsealed(snapshot: FundSnapshot): void {
  repository.setSeed(snapshot);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FundGate onUnsealed={handleUnsealed}>
      <App />
    </FundGate>
  </StrictMode>,
);
