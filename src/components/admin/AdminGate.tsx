import { useState, type PropsWithChildren } from 'react';
import { checkPassword, isCryptoAvailable, isUnlocked, rememberUnlocked } from '../../utils/adminAccess';

/** Demande le mot de passe avant d'afficher l'espace admin. */
export function AdminGate({ children }: PropsWithChildren) {
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  if (unlocked) return <>{children}</>;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (checking || !password) return;

    if (!isCryptoAvailable()) {
      setError('Ouvre la page en https (ou en localhost) pour pouvoir te connecter.');
      return;
    }

    setChecking(true);
    try {
      if (await checkPassword(password)) {
        rememberUnlocked();
        setUnlocked(true);
      } else {
        setError('Mot de passe incorrect.');
        setPassword('');
      }
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="gate">
      <section className="gate__card">
        <span className="gate__icon" aria-hidden="true">
          <LockIcon />
        </span>

        <h1 className="gate__title">Espace admin protégé</h1>
        <p className="gate__text">
          Seul le responsable de la caisse saisit les entrées, les sorties et les membres.
        </p>

        <form className="gate__form" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="admin-password">
            Mot de passe
          </label>
          <input
            id="admin-password"
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="Mot de passe"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError('');
            }}
            autoFocus
          />

          <button type="submit" className="button button--member" disabled={!password || checking}>
            {checking ? 'Vérification…' : 'Entrer'}
          </button>
        </form>

        {error && (
          <p className="gate__error" role="alert">
            {error}
          </p>
        )}

        <a className="gate__back" href="#/">
          ← Retour au tableau de bord
        </a>
      </section>
    </div>
  );
}

export function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 10.5V7.5a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15.5" r="1.5" fill="currentColor" />
    </svg>
  );
}
