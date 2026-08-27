import { FUND_SHORT_NAME, FUND_TAGLINE } from '../config/fund';
import { formatLongDate } from '../utils/format';
import type { Route } from '../utils/route';
import { LockIcon } from './LockIcon';

interface AppHeaderProps {
  today: Date;
  route: Route;
}

export function AppHeader({ today, route }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <a className="brand" href="#/" aria-label={`${FUND_SHORT_NAME} — Accueil`}>
          <span className="brand__mark" aria-hidden="true">A</span>
          <span className="brand__text">
            <span className="brand__name">{FUND_SHORT_NAME}</span>
            <span className="brand__tagline">{FUND_TAGLINE}</span>
          </span>
        </a>

        <div className="app-header__side">
          <p className="app-header__date">
            <span className="app-header__dot" aria-hidden="true" />
            {formatLongDate(today)}
          </p>

          {route === 'admin' ? (
            <a className="header-link" href="#/">
              <span aria-hidden="true">←</span>
              <span className="header-link__label">Tableau de bord</span>
            </a>
          ) : (
            <a
              className="header-link header-link--admin"
              href="#/admin"
              title="Espace admin — réservé au responsable"
            >
              <LockIcon />
              <span className="header-link__label">Admin</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
