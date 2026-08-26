import { useEffect, useState, type PropsWithChildren } from 'react';
import { getSession, onAuthChange, sendMagicLink } from '../services/auth';
import { LockIcon } from './admin/AdminGate';

/**
 * Demande la connexion avant d'afficher la caisse.
 *
 * Remplace la phrase de la famille dès que Supabase est branché : au lieu d'un
 * secret partagé par tout le monde, chacun a son compte, et c'est la base qui
 * refuse de répondre à qui n'est pas connecté.
 */
export function AuthGate({ children }: PropsWithChildren) {
  const [state, setState] = useState<'checking' | 'out' | 'in'>('checking');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;

    void getSession().then((session) => {
      if (active) setState(session ? 'in' : 'out');
    });

    // Le retour du lien magique arrive par cet événement, pas par un rechargement.
    return onAuthChange((session) => {
      if (active) setState(session ? 'in' : 'out');
    });
  }, []);

  if (state === 'checking') return <div className="status-message">Connexion…</div>;
  if (state === 'in') return <>{children}</>;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (sending || !email.trim()) return;

    setSending(true);
    try {
      const message = await sendMagicLink(email.trim());
      if (message) setError(message);
      else setSent(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="gate">
      <section className="gate__card">
        <span className="gate__icon" aria-hidden="true">
          <LockIcon />
        </span>

        <h1 className="gate__title">Caisse Familiale Andamboly</h1>

        {sent ? (
          <p className="gate__text">
            Un lien de connexion vient de partir vers <strong>{email}</strong>. Ouvre-le
            depuis ce téléphone : il te ramènera ici, connecté.
          </p>
        ) : (
          <>
            <p className="gate__text">
              Entre l’adresse e-mail que le responsable de la caisse a inscrite. Tu
              recevras un lien de connexion, sans mot de passe à retenir.
            </p>

            <form className="gate__form" onSubmit={handleSubmit}>
              <label className="visually-hidden" htmlFor="auth-email">
                Adresse e-mail
              </label>
              <input
                id="auth-email"
                className="input"
                type="email"
                autoComplete="email"
                placeholder="prenom@exemple.mg"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError('');
                }}
                required
                autoFocus
              />

              <button
                type="submit"
                className="button button--member"
                disabled={!email.trim() || sending}
              >
                {sending ? 'Envoi…' : 'Recevoir le lien'}
              </button>
            </form>
          </>
        )}

        {error && (
          <p className="gate__error" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
