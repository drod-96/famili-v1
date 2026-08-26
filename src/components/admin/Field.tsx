import type { PropsWithChildren, ReactNode } from 'react';

interface FieldProps extends PropsWithChildren {
  label: string;
  htmlFor: string;
  hint?: string;
  optional?: boolean;
  /** Contrôle affiché à droite du libellé (bascule Ar / €, par exemple). */
  action?: ReactNode;
}

export function Field({ label, htmlFor, hint, optional = false, action, children }: FieldProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>
        <span className="field__label-text">
          {label}
          {optional && <span className="field__optional"> facultatif</span>}
        </span>
        {action}
      </label>
      {children}
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  );
}
