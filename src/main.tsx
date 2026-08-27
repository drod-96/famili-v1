import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { FamilyGate } from './components/FamilyGate';
import './styles/tokens.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/sidebar.css';
import './styles/fund.css';
import './styles/admin.css';

/*
 * Un mot de passe unique ouvre la caisse (FamilyGate), et l'espace de saisie en
 * demande un second, personnel (voir AdminAccess). Les deux sont vérifiés par
 * Supabase, jamais ici : sans le jeton qu'il délivre, la base ne répond pas.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FamilyGate>
      <App />
    </FamilyGate>
  </StrictMode>,
);
