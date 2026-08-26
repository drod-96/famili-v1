import { useEffect, useState, type PropsWithChildren } from 'react';
import { isSupabaseConfigured } from '../../config/supabase';
import { fetchIsAdmin } from '../../services/auth';
import { AdminGate, LockIcon } from './AdminGate';

/**
 * Qui a le droit d'ouvrir l'espace de saisie.
 *
 * Sans Supabase : le mot de passe vérifié dans le navigateur, faute de mieux.
 * Avec Supabase : la question est tranchée par la base (`app_users.is_admin`),
 * et les règles RLS refuseraient de toute façon l'écriture à quelqu'un d'autre.
 * L'écran ne fait donc que s'épargner des boutons voués à échouer.
 */
export function AdminAccess({ children }: PropsWithChildren) {
  if (!isSupabaseConfigured()) return <AdminGate>{children}</AdminGate>;

  return <SupabaseAdminAccess>{children}</SupabaseAdminAccess>;
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
          Ton compte peut consulter la caisse, mais pas y saisir de mouvements. Le
          responsable de la caisse peut t’ouvrir ce droit.
        </p>

        <a className="gate__back" href="#/">
          ← Retour au tableau de bord
        </a>
      </section>
    </div>
  );
}
