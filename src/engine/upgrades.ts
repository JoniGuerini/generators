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

/** Produção por ciclo efetiva: base * 2^(perGenRank + globalRank + lineRank). */
export function getEffectiveProductionPerCycle(
  baseProductionPerCycle: Decimal,
  upgradeProductionRank: number,
  globalProductionDoublerRank: number = 0,
  lineProductionDoublerRank: number = 0
): Decimal {
  const totalRank = upgradeProductionRank + globalProductionDoublerRank + lineProductionDoublerRank;
  if (totalRank <= 0) return baseProductionPerCycle;
  return baseProductionPerCycle.mul(Decimal.pow(Decimal.fromNumber(2), totalRank));
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

/** Valor por troca: 2^tradeDoublerRank (1, 2, 4, 8…). */
export function getTicketTradeValue(tradeDoublerRank: number): number {
  return 2 ** Math.max(0, tradeDoublerRank);
}

/** Produção base de ▲/s = 1 + totalTrades × tradeValue. */
function getTicketProductionBase(totalTrades: number, tradeDoublerRank: number): number {
  const tradeValue = getTicketTradeValue(tradeDoublerRank);
  return 1 + Math.max(0, totalTrades) * tradeValue;
}

/** Tickets por segundo = produção base × 2^multiplierRank. */
export function getTicketsPerSecond(
  totalTrades: number = 0,
  upgradeTicketMultiplierRank: number = 0,
  upgradeTicketTradeDoublerRank: number = 0
): number {
  const base = getTicketProductionBase(totalTrades, upgradeTicketTradeDoublerRank);
  const mult = 2 ** Math.max(0, upgradeTicketMultiplierRank);
  return base * mult;
}

/** Custo em ◆ para "dobrar valor de troca ▲/s": 1, 2, 4, 8… (dobra por ranque). */
export function getUpgradeCostTicketTradeDoubler(currentRank: number): Decimal {
  return Decimal.pow(Decimal.fromNumber(2), Math.max(0, currentRank));
}

/** Custo em ◆ para "dobrar produção de ▲/s": 1, 4, 16, 64… (quadruplica por ranque). */
export function getUpgradeCostTicketMultiplier(currentRank: number): Decimal {
  return Decimal.pow(Decimal.fromNumber(4), Math.max(0, currentRank));
}

/** Custo efetivo para comprar gerador (global + linha reduzem pela metade, mínimo 1). */
export function getEffectiveGeneratorCost(
  baseCost: Decimal,
  upgradeGeneratorCostHalfRank: number,
  lineCostHalfRank: number = 0
): Decimal {
  const totalRank = upgradeGeneratorCostHalfRank + lineCostHalfRank;
  if (totalRank <= 0) return baseCost;
  const reduced = baseCost.div(Decimal.pow(Decimal.fromNumber(2), totalRank));
  return Decimal.max(Decimal.dOne, reduced.floor());
}

/** Custo em ◆ para "custo ÷2 (linha)": 50, 100, 200, 400… (dobra por ranque). */
export function getUpgradeCostLineCostHalf(currentRank: number): Decimal {
  return Decimal.fromNumber(50 * 2 ** currentRank);
}

/** Custo em ◆ para o próximo ranque da melhoria global "custo de compra ÷2": 1, 2, 4, 8… (dobra por ranque). */
export function getUpgradeCostGeneratorCostHalf(currentRank: number): Decimal {
  return Decimal.fromNumber(200).mul(Decimal.pow(Decimal.fromNumber(3), Math.max(0, currentRank)));
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
  return Decimal.fromNumber(25 * 2 ** currentRank);
}

/** Custo em ◆ para "eficiência do crítico": 50, 100, 200, 400… (dobra por ranque). */
export function getUpgradeCostCritMultiplier(_generatorNumber: number, currentRank: number): Decimal {
  return Decimal.fromNumber(50 * 2 ** currentRank);
}

/** Custo em ◆ para "dobrar produção global": 100, 200, 400, 800… (dobra por ranque). */
export function getUpgradeCostGlobalProductionDoubler(currentRank: number): Decimal {
  return Decimal.fromNumber(100 * 2 ** currentRank);
}

/** Custo em ◆ para "dobrar produção da linha": 50, 100, 200, 400… (dobra por ranque). */
export function getUpgradeCostLineProductionDoubler(currentRank: number): Decimal {
  return Decimal.fromNumber(50 * 2 ** currentRank);
}

/** Custo em ◆ para "dobrar ◆ por marco": 2, 8, 32, 128… (quadruplica por ranque, base 2). */
export function getUpgradeCostMilestoneDoubler(currentRank: number): Decimal {
  return Decimal.fromNumber(50 * 2 ** currentRank);
}

/** Multiplicador efetivo de ◆ por marco: 2^rank. */
export function getMilestoneRewardMultiplier(rank: number): number {
  return 2 ** Math.max(0, rank);
}
