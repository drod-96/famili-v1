import { useEffect, useState, type PropsWithChildren } from 'react';
import { getSession, onAuthChange, sendMagicLink } from '../services/auth';
import { LockIcon } from './admin/AdminGate';

/**
 * Demande la connexion avant d'ouvrir l'espace de saisie.
 *
 * La caisse, elle, se consulte sans compte. Seuls les responsables en ont un,
 * et il leur est créé sur invitation : le formulaire ci-dessous n'inscrit
 * personne, il envoie un lien à une adresse déjà connue.
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

  if (state === 'checking') return <div className="status-message">Vérification…</div>;
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

        <h1 className="gate__title">Espace admin protégé</h1>

        {sent ? (
          <p className="gate__text">
            Un lien de connexion vient de partir vers <strong>{email}</strong>. Ouvre-le
            depuis ce téléphone : il te ramènera ici, connecté.
          </p>
        ) : (
          <>
            <p className="gate__text">
              Seul le responsable de la caisse saisit les mouvements. Entre ton adresse
              e-mail : tu recevras un lien de connexion, sans mot de passe à retenir.
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

        <a className="gate__back" href="#/">
          ← Retour au tableau de bord
        </a>
      </section>
    </div>
  );
}
