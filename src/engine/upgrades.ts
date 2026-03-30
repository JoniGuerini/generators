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

/** Custo em ◆ para o próximo ranque da melhoria "tempo de ciclo". Base 1, dobra a cada ranque (1, 2, 4, 8…), igual para todos os geradores. */
export function getUpgradeCostCycleSpeed(_generatorNumber: number, currentRank: number): Decimal {
  return Decimal.fromNumber(2 ** currentRank);
}

/** Custo em ◆ para o próximo ranque da melhoria "dobrar produção". Base 1, dobra a cada ranque (1, 2, 4, 8…), igual para todos os geradores. */
export function getUpgradeCostProduction(_generatorNumber: number, currentRank: number): Decimal {
  return Decimal.fromNumber(2 ** currentRank);
}

/** Marcos de troca: recurso base → +1 ▲/s. Índice 0 = 500, 1 = 5k, 2 = 5M, 3 = 5B, 4 = 5T, 5 = 5Qa, … */
export function getTicketTradeThreshold(index: number): Decimal {
  const exp = index <= 1 ? 2 + index : 3 * index;
  return Decimal.fromNumber(5).mul(Decimal.pow(Decimal.fromNumber(10), exp));
}

export function getMaxAffordableTrades(currentCount: number, resource: Decimal): { trades: number; totalCost: Decimal } {
  let remaining = resource;
  let trades = 0;
  let count = currentCount;
  let totalCost = Decimal.dZero;
  while (true) {
    const cost = getTicketTradeThreshold(count);
    if (remaining.lt(cost)) break;
    remaining = remaining.sub(cost);
    totalCost = totalCost.add(cost);
    trades++;
    count++;
  }
  return { trades, totalCost };
}

/** Produção base de ▲/s = 1 + soma de trocas de todas as linhas. */
function getTicketProductionBase(totalTrades: number): number {
  return 1 + Math.max(0, totalTrades);
}

/** Tickets por segundo = produção base × 2^multiplierRank. */
export function getTicketsPerSecond(
  totalTrades: number = 0,
  upgradeTicketMultiplierRank: number = 0
): number {
  const base = getTicketProductionBase(totalTrades);
  const mult = 2 ** Math.max(0, upgradeTicketMultiplierRank);
  return base * mult;
}

/** Custo em ◆ para "dobrar produção de ▲/s": 1, 4, 16, 64… (quadruplica por ranque). */
export function getUpgradeCostTicketMultiplier(currentRank: number): Decimal {
  return Decimal.pow(Decimal.fromNumber(4), Math.max(0, currentRank));
}

/** Custo efetivo para comprar gerador (cada ranque global reduz pela metade). */
export function getEffectiveGeneratorCost(
  baseCost: Decimal,
  upgradeGeneratorCostHalfRank: number
): Decimal {
  if (upgradeGeneratorCostHalfRank <= 0) return baseCost;
  return baseCost.div(Decimal.pow(Decimal.fromNumber(2), upgradeGeneratorCostHalfRank));
}

/** Custo em ◆ para o próximo ranque da melhoria global "custo de compra ÷2": 1, 2, 4, 8… (dobra por ranque). */
export function getUpgradeCostGeneratorCostHalf(currentRank: number): Decimal {
  return Decimal.pow(Decimal.fromNumber(2), Math.max(0, currentRank));
}

/** Máximo de ranques da melhoria "chance de crítico": 40 ranques = 100%. */
export const MAX_CRIT_CHANCE_RANK = 40;

/** Chance de crítico: rank × 2.5% (0–100%). */
export function getCritChance(rank: number): number {
  return Math.min(1, Math.max(0, rank) * 0.025);
}

/** Multiplicador de crítico: 2 + rank × 2 (×2, ×4, ×6, ×8…). */
export function getCritMultiplier(rank: number): number {
  return 2 + Math.max(0, rank) * 2;
}

/** Custo em ◆ para "chance de crítico": 1, 2, 4, 8… (dobra por ranque). */
export function getUpgradeCostCritChance(_generatorNumber: number, currentRank: number): Decimal {
  return Decimal.fromNumber(2 ** currentRank);
}

/** Custo em ◆ para "eficiência do crítico": 1, 2, 4, 8… (dobra por ranque). */
export function getUpgradeCostCritMultiplier(_generatorNumber: number, currentRank: number): Decimal {
  return Decimal.fromNumber(2 ** currentRank);
}

/** Custo em ◆ para "dobrar ◆ por marco": 2, 8, 32, 128… (quadruplica por ranque, base 2). */
export function getUpgradeCostMilestoneDoubler(currentRank: number): Decimal {
  return Decimal.fromNumber(2).mul(Decimal.pow(Decimal.fromNumber(4), Math.max(0, currentRank)));
}

/** Multiplicador efetivo de ◆ por marco: 2^rank. */
export function getMilestoneRewardMultiplier(rank: number): number {
  return 2 ** Math.max(0, rank);
}
