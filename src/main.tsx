import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { AuthGate } from './components/AuthGate';
import { isShared } from './services/repository';
import './styles/tokens.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/sidebar.css';
import './styles/fund.css';
import './styles/admin.css';

/*
 * Avec Supabase, chacun se connecte avec son adresse et la base refuse de
 * répondre aux autres : c'est elle qui garde les données, elles ne sont
 * jamais dans la page.
 *
 * Sans Supabase, l'application tourne à vide sur le stockage du navigateur.
 * C'est un mode de développement, pas un mode de consultation.
 */
const app = isShared ? (
  <AuthGate>
    <App />
  </AuthGate>
) : (
  <App />
);

createRoot(document.getElementById('root')!).render(<StrictMode>{app}</StrictMode>);
