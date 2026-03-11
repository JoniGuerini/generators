import Decimal from "break_eternity.js";

/** Tempo mínimo de ciclo (segundos) após melhorias. */
export const MIN_CYCLE_SECONDS = 0.1;

/**
 * Máximo de ranques da melhoria "reduzir tempo de ciclo" para este gerador.
 * Cada ranque reduz pela metade; para até 0.1s: rank máx = floor(log2(cycleTime / 0.1)).
 */
export function getMaxCycleSpeedRank(cycleTimeSeconds: number): number {
  if (cycleTimeSeconds <= MIN_CYCLE_SECONDS) return 0;
  return Math.max(0, Math.floor(Math.log2(cycleTimeSeconds / MIN_CYCLE_SECONDS)));
}

/** Tempo de ciclo efetivo após ranques (mínimo 0.1s). */
export function getEffectiveCycleTimeSeconds(
  baseCycleTimeSeconds: number,
  upgradeCycleSpeedRank: number
): number {
  if (upgradeCycleSpeedRank <= 0) return baseCycleTimeSeconds;
  const reduced = baseCycleTimeSeconds / Math.pow(2, upgradeCycleSpeedRank);
  return Math.max(MIN_CYCLE_SECONDS, reduced);
}

/** Produção por ciclo efetiva: base * 2^rank (ranques infinitos). */
export function getEffectiveProductionPerCycle(
  baseProductionPerCycle: Decimal,
  upgradeProductionRank: number
): Decimal {
  if (upgradeProductionRank <= 0) return baseProductionPerCycle;
  return baseProductionPerCycle.mul(Decimal.pow(Decimal.fromNumber(2), upgradeProductionRank));
}

/** Custo em ◆ para o próximo ranque da melhoria "tempo de ciclo" (gerador N, ranque atual). */
export function getUpgradeCostCycleSpeed(generatorNumber: number, currentRank: number): Decimal {
  return Decimal.fromNumber(3 * generatorNumber).mul(
    Decimal.pow(Decimal.fromNumber(2), currentRank)
  );
}

/** Custo em ◆ para o próximo ranque da melhoria "dobrar produção" (gerador N, ranque atual). */
export function getUpgradeCostProduction(generatorNumber: number, currentRank: number): Decimal {
  return Decimal.fromNumber(2 * generatorNumber).mul(
    Decimal.pow(Decimal.fromNumber(2), currentRank)
  );
}

/** Tickets por segundo = 1 + ranque (base 1/s, cada ranque +1/s). */
export function getTicketsPerSecond(upgradeTicketRateRank: number): number {
  return 1 + Math.max(0, upgradeTicketRateRank);
}

/** Custo em ◆ para o próximo ranque da melhoria "tickets por segundo" (ranques infinitos). */
export function getUpgradeCostTicketRate(currentRank: number): Decimal {
  return Decimal.fromNumber(10).mul(
    Decimal.pow(Decimal.fromNumber(2), currentRank)
  );
}
