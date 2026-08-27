import { useEffect, useState, type PropsWithChildren } from 'react';
import {
  fetchAdminMembers,
  getSession,
  isFamilySession,
  onAuthChange,
  signInAsMember,
} from '../services/auth';
import { LockIcon } from './LockIcon';

/**
 * Demande à savoir *qui* saisit, avant d'ouvrir l'espace de saisie.
 *
 * À ce stade la caisse est déjà ouverte : on est connecté avec le compte
 * partagé de la famille, qui ne sait que lire. Se déclarer responsable
 * remplace cette session par la sienne, et c'est elle que la base regardera.
 *
 * Le nom se choisit dans une liste — celle des membres marqués responsables.
 * Personne n'a d'adresse à retenir : elle se déduit du membre choisi.
 */
export function AuthGate({ children }: PropsWithChildren) {
  const [needsSignIn, setNeedsSignIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    void getSession().then((session) => {
      if (active) setNeedsSignIn(isFamilySession(session) || !session);
    });

    return onAuthChange((session) => {
      if (active) setNeedsSignIn(isFamilySession(session) || !session);
    });
  }, []);

  if (needsSignIn === null) return <div className="status-message">Vérification…</div>;
  if (!needsSignIn) return <>{children}</>;

  return <MemberSignIn />;
}

function MemberSignIn() {
  const [members, setMembers] = useState<{ id: string; name: string }[] | null>(null);
  const [memberId, setMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchAdminMembers().then((list) => {
      if (!active) return;
      setMembers(list);
      if (list.length === 1) setMemberId(list[0].id);
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (checking || !memberId || !password) return;

    setChecking(true);
    try {
      const message = await signInAsMember(memberId, password);
      if (message) {
        setError(message);
        setPassword('');
      }
      // Si c'est passé, `onAuthChange` bascule l'écran.
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

        <h1 className="gate__title">Espace responsable</h1>
        <p className="gate__text">
          Choisis ton nom et entre ton mot de passe. Il est personnel : ce n’est pas
          celui de la famille.
        </p>

        {members !== null && members.length === 0 ? (
          <p className="gate__error" role="alert">
            Aucun membre n’est marqué responsable. Il faut le faire dans Supabase,
            table <code>members</code>, colonne <code>is_admin</code>.
          </p>
        ) : (
          <form className="gate__form" onSubmit={handleSubmit}>
            <label className="visually-hidden" htmlFor="admin-member">
              Nom
            </label>
            <select
              id="admin-member"
              className="input"
              value={memberId}
              onChange={(event) => {
                setMemberId(event.target.value);
                setError('');
              }}
              disabled={members === null}
            >
              <option value="" disabled>
                {members === null ? 'Chargement…' : 'Choisis ton nom'}
              </option>
              {(members ?? []).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>

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
            />

            <button
              type="submit"
              className="button button--member"
              disabled={!memberId || !password || checking}
            >
              {checking ? 'Vérification…' : 'Entrer'}
            </button>
          </form>
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
