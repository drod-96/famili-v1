import type { DisplayCurrency, EurRate } from '../domain/models';
import type { FundTotals } from '../utils/fund';
import { formatAmount, formatRate, formatSignedAmount } from '../utils/format';
import { Card } from './Card';
import { CurrencyToggle } from './CurrencyToggle';

interface BalanceCardProps {
  totals: FundTotals;
  currency: DisplayCurrency;
  /** Taux en vigueur, modifiable depuis l'espace admin. */
  eurRate: EurRate;
  onCurrencyChange: (currency: DisplayCurrency) => void;
}

export function BalanceCard({ totals, currency, eurRate, onCurrencyChange }: BalanceCardProps) {
  const otherCurrency: DisplayCurrency = currency === 'MGA' ? 'EUR' : 'MGA';

  return (
    <Card className="balance-card">
      <div className="balance-card__top">
        <p className="eyebrow">Argent actuel</p>
        <CurrencyToggle value={currency} onChange={onCurrencyChange} />
      </div>

      <p className="balance-card__amount">{formatAmount(totals.balanceAr, currency)}</p>

      <p className="balance-card__caption">
        Solde de la caisse
        <span className="balance-card__equivalent">
          ≈ {formatAmount(totals.balanceAr, otherCurrency)}
        </span>
      </p>

      <div className="balance-card__stats" aria-label="Résumé du mois">
        <div className="stat stat--in">
          <span className="stat__label">Entrées ce mois</span>
          <strong className="stat__value amount-positive">
            {formatSignedAmount(totals.monthIncomeAr, currency)}
          </strong>
        </div>

        <div className="stat stat--out">
          <span className="stat__label">Sorties ce mois</span>
          <strong className="stat__value amount-negative">
            {formatSignedAmount(-totals.monthExpenseAr, currency)}
          </strong>
        </div>
      </div>

      <p className="balance-card__rate">
        Taux saisi à la main : {formatRate(eurRate.rateAr)}
      </p>
    </Card>
  );
}
