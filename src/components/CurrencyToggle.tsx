import type { DisplayCurrency } from '../domain/models';

const OPTIONS: Array<{ value: DisplayCurrency; label: string; title: string }> = [
  { value: 'MGA', label: 'Ar', title: 'Afficher les montants en ariary' },
  { value: 'EUR', label: '€', title: 'Afficher les montants en euros' },
];

interface CurrencyToggleProps {
  value: DisplayCurrency;
  onChange: (currency: DisplayCurrency) => void;
  size?: 'sm' | 'md';
  label?: string;
}

export function CurrencyToggle({
  value,
  onChange,
  size = 'md',
  label = "Monnaie d'affichage",
}: CurrencyToggleProps) {
  return (
    <div className={`currency-toggle currency-toggle--${size}`} role="group" aria-label={label}>
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`currency-toggle__option${value === option.value ? ' currency-toggle__option--active' : ''}`}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          title={option.title}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
