import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/tokens.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/sidebar.css';
import './styles/fund.css';
import './styles/admin.css';

/*
 * Le tableau de bord s'ouvre sans rien demander : la famille reçoit un lien,
 * clique, et voit la caisse. Seul l'espace de saisie demande à se connecter
 * (voir AdminAccess) — et c'est la base qui tranche, pas l'écran.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
