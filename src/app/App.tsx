import { useCallback, useEffect, useMemo, useState } from 'react';
import { FUND_ANNOUNCEMENT, MONTHLY_DUE_AR } from '../config/fund';
import { ActivityCard } from '../components/ActivityCard';
import { Announcement } from '../components/Announcement';
import { AppHeader } from '../components/AppHeader';
import { BalanceCard } from '../components/BalanceCard';
import { MembersSidebar } from '../components/MembersSidebar';
import { PaidMonthsCard } from '../components/PaidMonthsCard';
import { TopPayersCard } from '../components/TopPayersCard';
import { AdminGate } from '../components/admin/AdminGate';
import type {
  DisplayCurrency,
  FundSnapshot,
  NewContribution,
  NewExpense,
  NewMember,
} from '../domain/models';
import { repository } from '../services/repository';
import {
  buildActivity,
  sortMembers,
  buildPeriods,
  computeTotals,
  currentPeriodIndex,
  rankPayers,
  summarizeMember,
} from '../utils/fund';
import { currentEurRate, formatAmount, setEurRateAr } from '../utils/format';
import { useHashRoute } from '../utils/route';
import { AdminPage } from './AdminPage';

export default function App() {
  const [snapshot, setSnapshot] = useState<FundSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<DisplayCurrency>('MGA');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const route = useHashRoute();
  const today = useMemo(() => new Date(), []);

  /*
   * Le taux enregistré est poussé dans `format` avant chaque rendu : c'est lui
   * que `formatAmount` applique pour convertir les ariary en euros.
   */
  const applySnapshot = useCallback((data: FundSnapshot) => {
    setEurRateAr(currentEurRate(data).rateAr);
    setSnapshot(data);
  }, []);

  useEffect(() => {
    let active = true;

    repository
      .getFundSnapshot()
      .then((data) => {
        if (active) applySnapshot(data);
      })
      .catch(() => {
        if (active) setError('Impossible de charger les données de la caisse.');
      });

    return () => {
      active = false;
    };
  }, [applySnapshot]);

  const model = useMemo(() => {
    if (!snapshot) return null;

    const periods = buildPeriods(today);
    const summaries = new Map(
      snapshot.members.map((member) => [
        member.id,
        summarizeMember(member, snapshot.contributions, periods, today),
      ]),
    );

    return {
      members: sortMembers(snapshot.members),
      summaries,
      totals: computeTotals(snapshot, today),
      activity: buildActivity(snapshot),  // tous : la carte filtre et fait défiler
      fundStarted: currentPeriodIndex(today) >= 0,
      /* Les mois de l'année en cours : ce qu'un membre peut couvrir d'avance. */
      periods,
      eurRate: currentEurRate(snapshot),
      ranking: rankPayers([...summaries.values()]),
    };
  }, [snapshot, today]);

  const addContribution = useCallback(
    async (input: NewContribution) => applySnapshot(await repository.addContribution(input)),
    [applySnapshot],
  );

  const addExpense = useCallback(
    async (input: NewExpense) => applySnapshot(await repository.addExpense(input)),
    [applySnapshot],
  );

  const addMember = useCallback(
    async (input: NewMember) => applySnapshot(await repository.addMember(input)),
    [applySnapshot],
  );

  const updateContribution = useCallback(
    async (id: string, input: NewContribution) =>
      applySnapshot(await repository.updateContribution(id, input)),
    [applySnapshot],
  );

  const deleteContribution = useCallback(
    async (id: string) => applySnapshot(await repository.deleteContribution(id)),
    [applySnapshot],
  );

  const updateMember = useCallback(
    async (id: string, input: NewMember) => applySnapshot(await repository.updateMember(id, input)),
    [applySnapshot],
  );

  const setEurRate = useCallback(
    async (rateAr: number, since: string) => applySnapshot(await repository.setEurRate(rateAr, since)),
    [applySnapshot],
  );

  const resetFund = useCallback(async () => {
    applySnapshot(await repository.reset());
    setSelectedId(null);
  }, [applySnapshot]);

  const activeId = selectedId ?? snapshot?.members[0]?.id ?? null;
  const activeSummary = activeId ? model?.summaries.get(activeId) : undefined;

  return (
    <div className="app-shell">
      <AppHeader today={today} route={route} />

      <main className="dashboard" aria-busy={!snapshot && !error}>
        {error && <div className="status-message status-message--error">{error}</div>}
        {!snapshot && !error && <div className="status-message">Chargement…</div>}

        {snapshot && model && route === 'admin' && (
          <AdminGate>
            <AdminPage
              snapshot={snapshot}
              members={model.members}
              totals={model.totals}
              currency={currency}
              today={today}
              onAddContribution={addContribution}
              onAddExpense={addExpense}
              onAddMember={addMember}
              onUpdateContribution={updateContribution}
              onDeleteContribution={deleteContribution}
              onUpdateMember={updateMember}
              onSetEurRate={setEurRate}
              onReset={resetFund}
            />
          </AdminGate>
        )}

        {model && activeSummary && route === 'dashboard' && (
          <>
            {FUND_ANNOUNCEMENT ? (
              <Announcement>{FUND_ANNOUNCEMENT}</Announcement>
            ) : (
              !model.fundStarted && (
                <Announcement>
                  La caisse démarre en <strong>septembre&nbsp;2026</strong>. Les versements
                  enregistrés avant cette date comptent comme des mois payés d’avance :{' '}
                  <strong>{formatAmount(model.periods.length * MONTHLY_DUE_AR, currency)}</strong>{' '}
                  couvrent les {model.periods.length} mois qui restent jusqu’à décembre&nbsp;
                  {model.periods[model.periods.length - 1]?.year}.
                </Announcement>
              )
            )}

            <div className="dashboard__grid">
              <BalanceCard
                totals={model.totals}
                currency={currency}
                eurRate={model.eurRate}
                onCurrencyChange={setCurrency}
              />

              <MembersSidebar
                members={model.members}
                summaries={model.summaries}
                selectedId={activeSummary.member.id}
                onSelect={setSelectedId}
              />

              <PaidMonthsCard
                summary={activeSummary}
                currency={currency}
                fundStarted={model.fundStarted}
              />

              <TopPayersCard
                ranking={model.ranking}
                currency={currency}
                selectedId={activeSummary.member.id}
                onSelect={setSelectedId}
              />

              <ActivityCard
                entries={model.activity}
                currency={currency}
                today={today}
                selectedMemberId={activeSummary.member.id}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
