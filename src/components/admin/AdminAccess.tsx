import { useEffect, useState, type PropsWithChildren } from 'react';
import { isSupabaseConfigured } from '../../config/supabase';
import { fetchIsAdmin } from '../../services/auth';
import { AuthGate } from '../AuthGate';
import { LockIcon } from '../LockIcon';

/**
 * Qui a le droit d'ouvrir l'espace de saisie.
 *
 * Consulter la caisse ne demande rien : le lien suffit. C'est ici, et ici
 * seulement, qu'on demande à savoir à qui on a affaire.
 *
 * Sans Supabase, les données sont celles du navigateur : il n'y a rien à
 * protéger, l'espace s'ouvre. Avec Supabase, on se connecte sous son nom, puis
 * la base tranche (`app_users.is_admin`).
 * Les règles RLS refuseraient de toute façon l'écriture à quelqu'un d'autre —
 * l'écran ne fait que s'épargner des boutons voués à échouer.
 */
export function AdminAccess({ children }: PropsWithChildren) {
  if (!isSupabaseConfigured()) return <>{children}</>;

  return (
    <AuthGate>
      <SupabaseAdminAccess>{children}</SupabaseAdminAccess>
    </AuthGate>
  );
}

function SupabaseAdminAccess({ children }: PropsWithChildren) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void fetchIsAdmin().then((value) => {
      if (active) setAllowed(value);
    });

    return () => {
      active = false;
    };
  }, []);

  if (allowed === null) return <div className="status-message">Vérification…</div>;
  if (allowed) return <>{children}</>;

  return (
    <div className="gate">
      <section className="gate__card">
        <span className="gate__icon" aria-hidden="true">
          <LockIcon />
        </span>

        <h1 className="gate__title">Espace réservé au responsable</h1>
        <p className="gate__text">
          Ce compte peut consulter la caisse, mais pas y saisir de mouvements. Un
          responsable peut ouvrir ce droit depuis Supabase.
        </p>

        <a className="gate__back" href="#/">
          ← Retour au tableau de bord
        </a>
      </section>
    </div>
  );
}
