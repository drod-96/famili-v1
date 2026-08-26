import { useEffect, useState } from 'react';

export type Route = 'dashboard' | 'admin';

function readRoute(): Route {
  return window.location.hash.replace(/^#\/?/, '').toLowerCase() === 'admin' ? 'admin' : 'dashboard';
}

/**
 * Routage par ancre (`#/admin`).
 * Volontairement minimal : pas de dépendance, et compatible GitHub Pages.
 */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}
