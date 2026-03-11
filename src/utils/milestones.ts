import Decimal from "break_eternity.js";

const TEN = Decimal.fromNumber(10);

/** Quantos marcos já foram atingidos pela quantidade (10, 100, 1k, ...). 0 = nenhum. */
export function getCurrentMilestoneCount(quantity: Decimal): number {
  if (quantity.lt(TEN)) return 0;
  const log10 = quantity.log10().toNumber();
  if (!Number.isFinite(log10)) return 0;
  return Math.max(0, Math.floor(log10));
}

/** Progresso 0..1 em direção ao próximo marco (após o último já resgatado). */
export function getProgressToNextMilestone(
  quantity: Decimal,
  claimedMilestoneIndex: number
): number {
  const next = Decimal.pow(TEN, claimedMilestoneIndex + 1);
  if (quantity.gte(next)) return 1;
  const prev = claimedMilestoneIndex === 0 ? Decimal.dZero : Decimal.pow(TEN, claimedMilestoneIndex);
  const range = next.sub(prev);
  if (range.lte(Decimal.dZero)) return 0;
  const p = quantity.sub(prev).div(range).toNumber();
  return Math.max(0, Math.min(1, p));
}

/** Progresso 0..1 em direção ao próximo marco ainda não atingido (sempre baseado na quantidade atual, independente de resgates). */
export function getProgressTowardNextUnreachedMilestone(quantity: Decimal): number {
  const currentCount = getCurrentMilestoneCount(quantity);
  const next = Decimal.pow(TEN, currentCount + 1);
  if (quantity.gte(next)) return 1;
  const prev = currentCount === 0 ? Decimal.dZero : Decimal.pow(TEN, currentCount);
  const range = next.sub(prev);
  if (range.lte(Decimal.dZero)) return 0;
  const p = quantity.sub(prev).div(range).toNumber();
  return Math.max(0, Math.min(1, p));
}

/** Moedas ao resgatar: do marco (claimed+1) até current. Gerador N: marco 1 → N pts, marco 2 → N+1, marco 3 → N+2, ... */
export function getCoinsFromClaiming(
  generatorNumber: number,
  claimedMilestoneIndex: number,
  currentMilestoneCount: number
): Decimal {
  if (currentMilestoneCount <= claimedMilestoneIndex) return Decimal.dZero;
  let sum = 0;
  for (let j = claimedMilestoneIndex + 1; j <= currentMilestoneCount; j++) {
    sum += generatorNumber + j - 1;
  }
  return Decimal.fromNumber(sum);
}

/** Valor do próximo marco (10, 100, 1k, ...) para exibição (por índice de resgate). */
export function getNextMilestoneThreshold(claimedMilestoneIndex: number): Decimal {
  return Decimal.pow(TEN, claimedMilestoneIndex + 1);
}

/** Índice (1-based) do marco alvo: avança quando quantity >= 10^target; nunca diminui. */
export function advanceMilestoneTargetIndex(
  quantity: Decimal,
  currentTargetIndex: number
): number {
  let idx = currentTargetIndex;
  while (quantity.gte(Decimal.pow(TEN, idx))) idx += 1;
  return idx;
}

/** Progresso 0..1 em direção ao marco alvo (currentMilestoneTargetIndex). Não recua quando a quantidade diminui. */
export function getProgressTowardTarget(
  quantity: Decimal,
  currentMilestoneTargetIndex: number
): number {
  const next = Decimal.pow(TEN, currentMilestoneTargetIndex);
  const prev =
    currentMilestoneTargetIndex <= 1 ? Decimal.dZero : Decimal.pow(TEN, currentMilestoneTargetIndex - 1);
  if (quantity.gte(next)) return 1;
  const range = next.sub(prev);
  if (range.lte(Decimal.dZero)) return 0;
  const p = quantity.sub(prev).div(range).toNumber();
  return Math.max(0, Math.min(1, p));
}

/** Valor do marco alvo para exibição (por currentMilestoneTargetIndex). */
export function getNextMilestoneThresholdFromTarget(currentMilestoneTargetIndex: number): Decimal {
  return Decimal.pow(TEN, currentMilestoneTargetIndex);
}
