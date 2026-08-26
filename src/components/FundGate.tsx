import { useEffect, useState, type PropsWithChildren } from 'react';
import type { FundSnapshot } from '../domain/models';
import { SEALED_FUND } from '../data/sealedFund';
import { isCryptoAvailable, unseal } from '../utils/seal';
import { LockIcon } from './admin/AdminGate';

const SESSION_KEY = 'famili.fund.passphrase';

interface FundGateProps extends PropsWithChildren {
  /** Reçoit les données une fois le paquet ouvert. */
  onUnsealed: (snapshot: FundSnapshot) => void;
}

/**
 * Demande la phrase de la famille avant d'ouvrir la caisse.
 *
 * Le site est publié sur une adresse publique : sans cette phrase, le paquet
 * embarqué dans la page n'est qu'un bloc chiffré. Personne ne peut lire les
 * noms ni les montants en tombant sur le lien, ni en lisant le dépôt.
 */
export function FundGate({ onUnsealed, children }: FundGateProps) {
  const [open, setOpen] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  // Une phrase déjà donnée dans cet onglet rouvre la caisse sans redemander.
  useEffect(() => {
    const remembered = readRemembered();
    if (!remembered || !isCryptoAvailable()) return;

    let active = true;
    void unseal(SEALED_FUND, remembered).then((snapshot) => {
      if (!active || !snapshot) return;
      onUnsealed(snapshot);
      setOpen(true);
    });

    return () => {
      active = false;
    };
  }, [onUnsealed]);

  if (open) return <>{children}</>;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (checking || !passphrase) return;

    if (!isCryptoAvailable()) {
      setError('Ouvre la page en https (ou en localhost) pour pouvoir l’ouvrir.');
      return;
    }

    setChecking(true);
    try {
      const snapshot = await unseal(SEALED_FUND, passphrase);
      if (snapshot) {
        remember(passphrase);
        onUnsealed(snapshot);
        setOpen(true);
      } else {
        setError('Phrase incorrecte.');
        setPassphrase('');
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

        <h1 className="gate__title">Caisse Familiale Andamboly</h1>
        <p className="gate__text">
          Les données de la caisse sont chiffrées. Entre la phrase de la famille pour
          les afficher.
        </p>

        <form className="gate__form" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="fund-passphrase">
            Phrase de la famille
          </label>
          <input
            id="fund-passphrase"
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="Phrase de la famille"
            value={passphrase}
            onChange={(event) => {
              setPassphrase(event.target.value);
              setError('');
            }}
            autoFocus
          />

          <button type="submit" className="button button--member" disabled={!passphrase || checking}>
            {checking ? 'Ouverture…' : 'Ouvrir la caisse'}
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

function readRemembered(): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function remember(passphrase: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, passphrase);
  } catch {
    // Sans stockage, la phrase sera redemandée au prochain chargement.
  }
}
