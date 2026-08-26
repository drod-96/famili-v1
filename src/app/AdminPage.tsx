import { ContributionEditForm } from '../components/admin/ContributionEditForm';
import { ContributionForm } from '../components/admin/ContributionForm';
import { EurRateForm } from '../components/admin/EurRateForm';
import { ExpenseForm } from '../components/admin/ExpenseForm';
import { MemberEditForm } from '../components/admin/MemberEditForm';
import { MemberForm } from '../components/admin/MemberForm';
import type {
  DisplayCurrency,
  FamilyMember,
  FundSnapshot,
  NewContribution,
  NewExpense,
  NewMember,
} from '../domain/models';
import type { FundTotals } from '../utils/fund';
import { currentEurRate, formatAmount } from '../utils/format';

interface AdminPageProps {
  snapshot: FundSnapshot;
  /** Membres triés par ordre alphabétique. */
  members: FamilyMember[];
  totals: FundTotals;
  currency: DisplayCurrency;
  today: Date;
  onAddContribution: (input: NewContribution) => Promise<void>;
  onAddExpense: (input: NewExpense) => Promise<void>;
  onAddMember: (input: NewMember) => Promise<void>;
  onUpdateContribution: (id: string, input: NewContribution) => Promise<void>;
  onDeleteContribution: (id: string) => Promise<void>;
  onUpdateMember: (id: string, input: NewMember) => Promise<void>;
  onSetEurRate: (rateAr: number, since: string) => Promise<void>;
  /** Absent si le stockage utilisé ne sait pas repartir de zéro. */
  onReset?: () => Promise<void>;
}

export function AdminPage({
  snapshot,
  members,
  totals,
  currency,
  today,
  onAddContribution,
  onAddExpense,
  onAddMember,
  onUpdateContribution,
  onDeleteContribution,
  onUpdateMember,
  onSetEurRate,
  onReset,
}: AdminPageProps) {
  const eurRate = currentEurRate(snapshot);

  // De la plus récente à la plus ancienne : on corrige surtout ce qu'on vient de saisir.
  const recentFirst = [...snapshot.contributions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="admin">
      <header className="admin__head">
        <div>
          <p className="eyebrow">Espace admin</p>
          <h1 className="admin__title">Saisir les mouvements de la caisse</h1>
        </div>

        <dl className="admin__stats">
          <div>
            <dt>Solde</dt>
            <dd>{formatAmount(totals.balanceAr, currency)}</dd>
          </div>
          <div>
            <dt>Membres</dt>
            <dd>{snapshot.members.length}</dd>
          </div>
          <div>
            <dt>Versements</dt>
            <dd>{snapshot.contributions.length}</dd>
          </div>
          <div>
            <dt>Taux 1 €</dt>
            <dd>{formatAmount(eurRate.rateAr, 'MGA')}</dd>
          </div>
        </dl>
      </header>

      <div className="admin__grid">
        <ContributionForm members={members} today={today} onSubmit={onAddContribution} />
        <ExpenseForm members={members} today={today} onSubmit={onAddExpense} />
      </div>

      <MemberForm members={snapshot.members} onSubmit={onAddMember} />

      <div className="admin__grid">
        <ContributionEditForm
          contributions={recentFirst}
          members={members}
          onSave={onUpdateContribution}
          onDelete={onDeleteContribution}
        />
        <MemberEditForm members={members} onSave={onUpdateMember} />
      </div>

      <EurRateForm
        current={eurRate}
        history={snapshot.eurRates}
        balanceAr={totals.balanceAr}
        today={today}
        onSubmit={onSetEurRate}
      />

      <div className="admin__footnote">
        <p>
          Les saisies sont enregistrées <strong>sur cet appareil uniquement</strong>. Tant qu’il
          n’y a pas de serveur, elles ne sont pas visibles depuis un autre téléphone.
        </p>

        {onReset && (
          <p className="admin__reset">
            <button
              type="button"
              className="button button--ghost"
              onClick={() => {
                const sure = window.confirm(
                  'Effacer toutes les saisies enregistrées sur cet appareil ?',
                );
                if (sure) void onReset();
              }}
            >
              Vider cet appareil
            </button>
            <span>
              Efface les saisies du navigateur et repart d’une caisse vide. Sans effet sur
              les autres appareils, puisqu’ils ont chacun les leurs.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
