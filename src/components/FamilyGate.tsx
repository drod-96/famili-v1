import { useEffect, useState, type PropsWithChildren } from 'react';
import { FUND_SHORT_NAME } from '../config/fund';
import { isSupabaseConfigured } from '../config/supabase';
import { getSession, onAuthChange, signInAsFamily } from '../services/auth';
import { LockIcon } from './LockIcon';

/**
 * Le mot de passe de la famille, demandé avant tout le reste.
 *
 * Un seul mot de passe pour tout le monde, retenu par appareil : on ne le
 * saisit qu'une fois par téléphone. Il ouvre la consultation, rien de plus —
 * saisir un mouvement demande ensuite un compte de responsable.
 *
 * Sans Supabase, il n'y a rien à protéger : les données sont celles du
 * navigateur lui-même. Le portail s'efface alors.
 */
export function FamilyGate({ children }: PropsWithChildren) {
  const [state, setState] = useState<'checking' | 'out' | 'in'>(
    isSupabaseConfigured() ? 'checking' : 'in',
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let active = true;
    void getSession().then((session) => {
      if (active) setState(session ? 'in' : 'out');
    });

    return onAuthChange((session) => {
      if (active) setState(session ? 'in' : 'out');
    });
  }, []);

  if (state === 'in') return <>{children}</>;
  if (state === 'checking') return <div className="status-message">Ouverture…</div>;

  return <FamilyPasswordScreen />;
}

function FamilyPasswordScreen() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (checking || !password) return;

    setChecking(true);
    try {
      const message = await signInAsFamily(password);
      if (message) {
        setError(message);
        setPassword('');
      }
      // Si c'est passé, `onAuthChange` bascule l'écran : rien à faire ici.
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="curtain">
      {/*
        Le décor derrière la carte est factice, et il le restera : les vrais
        chiffres ne sont pas chargés tant que la base n'a pas répondu, et elle
        ne répond pas sans jeton. C'est précisément ce qui fait que ce mot de
        passe protège quelque chose.
      */}
      <div className="curtain__decor" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => (
          <div className="curtain__bar" key={index} style={{ width: `${88 - index * 9}%` }} />
        ))}
      </div>

      <section className="gate__card curtain__card">
        <span className="gate__icon" aria-hidden="true">
          <LockIcon />
        </span>

        <h1 className="gate__title">{FUND_SHORT_NAME}</h1>
        <p className="gate__text">
          Cette caisse est réservée à la famille. Entre le mot de passe partagé pour
          l’ouvrir — il n’est demandé qu’une fois par appareil.
        </p>

        <form className="gate__form" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="family-password">
            Mot de passe
          </label>
          <input
            id="family-password"
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
            {checking ? 'Vérification…' : 'Ouvrir la caisse'}
          </button>
        </form>

        {error && (
          <p className="gate__error" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
