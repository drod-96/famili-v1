import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { AuthGate } from './components/AuthGate';
import { FundGate } from './components/FundGate';
import type { FundSnapshot } from './domain/models';
import { isShared, localRepository } from './services/repository';
import './styles/tokens.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/sidebar.css';
import './styles/fund.css';
import './styles/admin.css';

/* Défini ici, hors du rendu : `FundGate` s'appuie sur une référence stable. */
function handleUnsealed(snapshot: FundSnapshot): void {
  localRepository?.setSeed(snapshot);
}

/*
 * Deux portes, jamais les deux à la fois.
 *
 * Avec Supabase, chacun se connecte avec son adresse et la base refuse de
 * répondre aux autres. Sans Supabase, les données voyagent dans la page : il
 * faut la phrase de la famille pour les déchiffrer.
 */
const gated = isShared ? (
  <AuthGate>
    <App />
  </AuthGate>
) : (
  <FundGate onUnsealed={handleUnsealed}>
    <App />
  </FundGate>
);

createRoot(document.getElementById('root')!).render(<StrictMode>{gated}</StrictMode>);
