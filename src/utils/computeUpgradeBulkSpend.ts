import Decimal from "break_eternity.js";
import type { UpgradeBuyMode } from "@/contexts/BuyModeContext";
import { GENERATOR_DEFS, parseGeneratorId, type GeneratorId } from "@/engine/constants";
import {
  getMaxCycleSpeedRank,
  getUpgradeCostCycleSpeed,
  getUpgradeCostProduction,
  getUpgradeCostGeneratorCostHalf,
  getUpgradeCostTicketMultiplier,
  getUpgradeCostTicketTradeDoubler,
  getUpgradeCostMilestoneDoubler,
  getUpgradeCostGlobalProductionDoubler,
  getUpgradeCostLineProductionDoubler,
  getUpgradeCostLineCostHalf,
  getUpgradeCostCritChance,
  getUpgradeCostCritMultiplier,
  MAX_CRIT_CHANCE_RANK,
} from "@/engine/upgrades";
import { ABSOLUTE_CAP } from "@/utils/upgradeBulkPurchase";

export interface UpgradeBulkCostInput {
  milestoneCurrency: Decimal;
  upgradeTicketMultiplierRank: number;
  upgradeTicketTradeDoublerRank: number;
  upgradeGeneratorCostHalfRank: number;
  upgradeMilestoneDoublerRank: number;
  upgradeGlobalProductionDoublerRank: number;
  upgradeLineProductionDoublerRanks: Record<number, number>;
  upgradeLineCostHalfRanks: Record<number, number>;
  generators: Array<{
    id: GeneratorId;
    upgradeCycleSpeedRank: number;
    upgradeProductionRank: number;
    upgradeCritChanceRank: number;
    upgradeCritMultiplierRank: number;
  }>;
}

export interface BulkSpendPreview {
  /** Soma ◆ do lote: em 10x/50x = custo dos N níveis (sem olhar carteira); em 100% = só o que será gasto. */
  total: Decimal;
  /** Níveis no lote (N ou menos se teto de ranque). */
  count: number;
  /** Próximo custo unitário (quando count === 0). */
  firstCost: Decimal | null;
  /** 100% = pode comprar quantidade parcial; 1x/10x/50x = só compra o lote inteiro se tiver ◆ para `total`. */
  isFlexibleBatch: boolean;
}

function fixedBatchN(mode: UpgradeBuyMode): number {
  switch (mode) {
    case "1x":
      return 1;
    case "10x":
      return 10;
    case "50x":
      return 50;
    default:
      return 1;
  }
}

/** Soma os próximos custos até `maxSteps` ou bloqueio — sem verificar ◆ (preço cheio do lote). */
function sumNextNCostsNoCurrency(
  maxSteps: number,
  peekCost: () => Decimal | null,
  isBlocked: () => boolean,
  advance: () => void,
): { total: Decimal; count: number } {
  let total = Decimal.dZero;
  let count = 0;
  const cap = Math.min(Math.max(1, maxSteps), ABSOLUTE_CAP);
  while (count < cap) {
    if (isBlocked()) break;
    const c = peekCost();
    if (c == null || !c.gt(Decimal.dZero)) break;
    total = total.add(c);
    advance();
    count++;
  }
  return { total, count };
}

/** 100%: gasta ◆ até acabar ou atingir teto de passos. */
function sumConsecutiveCostsWithCurrency(
  currency: Decimal,
  maxSteps: number,
  peekCost: () => Decimal | null,
  isBlocked: () => boolean,
  advance: () => void,
): { total: Decimal; count: number } {
  let total = Decimal.dZero;
  let rem = currency;
  let count = 0;
  const cap = Math.min(Math.max(1, maxSteps), ABSOLUTE_CAP);
  while (count < cap) {
    if (isBlocked()) break;
    const c = peekCost();
    if (c == null || !c.gt(Decimal.dZero)) break;
    if (rem.lt(c)) break;
    total = total.add(c);
    rem = rem.sub(c);
    advance();
    count++;
  }
  return { total, count };
}

function mergePreview(
  mode: UpgradeBuyMode,
  firstCost: Decimal | null,
  flexSum: { total: Decimal; count: number },
  fixedN: number,
  peekCost: () => Decimal | null,
  isBlocked: () => boolean,
  advance: () => void,
): BulkSpendPreview {
  if (mode === "100%") {
    return {
      total: flexSum.total,
      count: flexSum.count,
      firstCost,
      isFlexibleBatch: true,
    };
  }

  const sumNC = sumNextNCostsNoCurrency(fixedN, peekCost, isBlocked, advance);
  return {
    total: sumNC.total,
    count: sumNC.count,
    firstCost,
    isFlexibleBatch: false,
  };
}

/** Pode clicar: 100% = pelo menos 1 nível; fixo = lote completo e carteira cobre `total`. */
export function upgradePreviewCanBuy(p: BulkSpendPreview, currency: Decimal): boolean {
  if (p.count <= 0) return false;
  if (p.isFlexibleBatch) return true;
  return currency.gte(p.total);
}

export function computeTicketMultiplierBulkSpend(
  s: UpgradeBulkCostInput,
  mode: UpgradeBuyMode,
): BulkSpendPreview {
  let rank = s.upgradeTicketMultiplierRank;
  const first = getUpgradeCostTicketMultiplier(s.upgradeTicketMultiplierRank);
  const flex = sumConsecutiveCostsWithCurrency(
    s.milestoneCurrency,
    ABSOLUTE_CAP,
    () => getUpgradeCostTicketMultiplier(rank),
    () => false,
    () => {
      rank += 1;
    },
  );
  rank = s.upgradeTicketMultiplierRank;
  return mergePreview(mode, first, flex, fixedBatchN(mode), () =>
    getUpgradeCostTicketMultiplier(rank), () => false, () => {
    rank += 1;
  });
}

export function computeTicketTradeDoublerBulkSpend(
  s: UpgradeBulkCostInput,
  mode: UpgradeBuyMode,
): BulkSpendPreview {
  let rank = s.upgradeTicketTradeDoublerRank;
  const first = getUpgradeCostTicketTradeDoubler(s.upgradeTicketTradeDoublerRank);
  const flex = sumConsecutiveCostsWithCurrency(
    s.milestoneCurrency,
    ABSOLUTE_CAP,
    () => getUpgradeCostTicketTradeDoubler(rank),
    () => false,
    () => {
      rank += 1;
    },
  );
  rank = s.upgradeTicketTradeDoublerRank;
  return mergePreview(mode, first, flex, fixedBatchN(mode), () =>
    getUpgradeCostTicketTradeDoubler(rank), () => false, () => {
    rank += 1;
  });
}

export function computeGeneratorCostHalfBulkSpend(
  s: UpgradeBulkCostInput,
  mode: UpgradeBuyMode,
): BulkSpendPreview {
  let rank = s.upgradeGeneratorCostHalfRank;
  const first = getUpgradeCostGeneratorCostHalf(s.upgradeGeneratorCostHalfRank);
  const flex = sumConsecutiveCostsWithCurrency(
    s.milestoneCurrency,
    ABSOLUTE_CAP,
    () => getUpgradeCostGeneratorCostHalf(rank),
    () => false,
    () => {
      rank += 1;
    },
  );
  rank = s.upgradeGeneratorCostHalfRank;
  return mergePreview(mode, first, flex, fixedBatchN(mode), () =>
    getUpgradeCostGeneratorCostHalf(rank), () => false, () => {
    rank += 1;
  });
}

export function computeMilestoneDoublerBulkSpend(
  s: UpgradeBulkCostInput,
  mode: UpgradeBuyMode,
): BulkSpendPreview {
  let rank = s.upgradeMilestoneDoublerRank;
  const first = getUpgradeCostMilestoneDoubler(s.upgradeMilestoneDoublerRank);
  const flex = sumConsecutiveCostsWithCurrency(
    s.milestoneCurrency,
    ABSOLUTE_CAP,
    () => getUpgradeCostMilestoneDoubler(rank),
    () => false,
    () => {
      rank += 1;
    },
  );
  rank = s.upgradeMilestoneDoublerRank;
  return mergePreview(mode, first, flex, fixedBatchN(mode), () =>
    getUpgradeCostMilestoneDoubler(rank), () => false, () => {
    rank += 1;
  });
}

export function computeGlobalProductionDoublerBulkSpend(
  s: UpgradeBulkCostInput,
  mode: UpgradeBuyMode,
): BulkSpendPreview {
  let rank = s.upgradeGlobalProductionDoublerRank;
  const first = getUpgradeCostGlobalProductionDoubler(s.upgradeGlobalProductionDoublerRank);
  const flex = sumConsecutiveCostsWithCurrency(
    s.milestoneCurrency,
    ABSOLUTE_CAP,
    () => getUpgradeCostGlobalProductionDoubler(rank),
    () => false,
    () => {
      rank += 1;
    },
  );
  rank = s.upgradeGlobalProductionDoublerRank;
  return mergePreview(mode, first, flex, fixedBatchN(mode), () =>
    getUpgradeCostGlobalProductionDoubler(rank), () => false, () => {
    rank += 1;
  });
}

export function computeLineProductionDoublerBulkSpend(
  s: UpgradeBulkCostInput,
  line: number,
  mode: UpgradeBuyMode,
): BulkSpendPreview {
  let rank = s.upgradeLineProductionDoublerRanks[line] ?? 0;
  const first = getUpgradeCostLineProductionDoubler(rank);
  const flex = sumConsecutiveCostsWithCurrency(
    s.milestoneCurrency,
    ABSOLUTE_CAP,
    () => getUpgradeCostLineProductionDoubler(rank),
    () => false,
    () => {
      rank += 1;
    },
  );
  rank = s.upgradeLineProductionDoublerRanks[line] ?? 0;
  return mergePreview(mode, first, flex, fixedBatchN(mode), () =>
    getUpgradeCostLineProductionDoubler(rank), () => false, () => {
    rank += 1;
  });
}

export function computeLineCostHalfBulkSpend(
  s: UpgradeBulkCostInput,
  line: number,
  mode: UpgradeBuyMode,
): BulkSpendPreview {
  let rank = s.upgradeLineCostHalfRanks[line] ?? 0;
  const first = getUpgradeCostLineCostHalf(rank);
  const flex = sumConsecutiveCostsWithCurrency(
    s.milestoneCurrency,
    ABSOLUTE_CAP,
    () => getUpgradeCostLineCostHalf(rank),
    () => false,
    () => {
      rank += 1;
    },
  );
  rank = s.upgradeLineCostHalfRanks[line] ?? 0;
  return mergePreview(mode, first, flex, fixedBatchN(mode), () =>
    getUpgradeCostLineCostHalf(rank), () => false, () => {
    rank += 1;
  });
}

export function computeCycleSpeedBulkSpend(
  s: UpgradeBulkCostInput,
  id: GeneratorId,
  mode: UpgradeBuyMode,
): BulkSpendPreview {
  const gen = s.generators.find((g) => g.id === id);
  if (!gen) return { total: Decimal.dZero, count: 0, firstCost: null, isFlexibleBatch: mode === "100%" };
  const def = GENERATOR_DEFS[id];
  const maxRank = getMaxCycleSpeedRank(def.cycleTimeSeconds);
  const generatorNumber = parseGeneratorId(id).gen;
  let cycleRank = gen.upgradeCycleSpeedRank;
  const first =
    cycleRank >= maxRank ? null : getUpgradeCostCycleSpeed(generatorNumber, cycleRank);

  const flex = sumConsecutiveCostsWithCurrency(
    s.milestoneCurrency,
    ABSOLUTE_CAP,
    () =>
      cycleRank >= maxRank ? null : getUpgradeCostCycleSpeed(generatorNumber, cycleRank),
    () => cycleRank >= maxRank,
    () => {
      cycleRank += 1;
    },
  );

  cycleRank = gen.upgradeCycleSpeedRank;
  return mergePreview(
    mode,
    first,
    flex,
    fixedBatchN(mode),
    () =>
      cycleRank >= maxRank ? null : getUpgradeCostCycleSpeed(generatorNumber, cycleRank),
    () => cycleRank >= maxRank,
    () => {
      cycleRank += 1;
    },
  );
}

export function computeProductionBulkSpend(
  s: UpgradeBulkCostInput,
  id: GeneratorId,
  mode: UpgradeBuyMode,
): BulkSpendPreview {
  const gen = s.generators.find((g) => g.id === id);
  if (!gen) return { total: Decimal.dZero, count: 0, firstCost: null, isFlexibleBatch: mode === "100%" };
  const generatorNumber = parseGeneratorId(id).gen;
  let prodRank = gen.upgradeProductionRank;
  const first = getUpgradeCostProduction(generatorNumber, prodRank);
  const flex = sumConsecutiveCostsWithCurrency(
    s.milestoneCurrency,
    ABSOLUTE_CAP,
    () => getUpgradeCostProduction(generatorNumber, prodRank),
    () => false,
    () => {
      prodRank += 1;
    },
  );
  prodRank = gen.upgradeProductionRank;
  return mergePreview(mode, first, flex, fixedBatchN(mode), () =>
    getUpgradeCostProduction(generatorNumber, prodRank), () => false, () => {
    prodRank += 1;
  });
}

export function computeCritChanceBulkSpend(
  s: UpgradeBulkCostInput,
  id: GeneratorId,
  mode: UpgradeBuyMode,
): BulkSpendPreview {
  const gen = s.generators.find((g) => g.id === id);
  if (!gen) return { total: Decimal.dZero, count: 0, firstCost: null, isFlexibleBatch: mode === "100%" };
  const generatorNumber = parseGeneratorId(id).gen;
  let critRank = gen.upgradeCritChanceRank;
  const first =
    critRank >= MAX_CRIT_CHANCE_RANK
      ? null
      : getUpgradeCostCritChance(generatorNumber, critRank);
  const flex = sumConsecutiveCostsWithCurrency(
    s.milestoneCurrency,
    ABSOLUTE_CAP,
    () =>
      critRank >= MAX_CRIT_CHANCE_RANK
        ? null
        : getUpgradeCostCritChance(generatorNumber, critRank),
    () => critRank >= MAX_CRIT_CHANCE_RANK,
    () => {
      critRank += 1;
    },
  );
  critRank = gen.upgradeCritChanceRank;
  return mergePreview(
    mode,
    first,
    flex,
    fixedBatchN(mode),
    () =>
      critRank >= MAX_CRIT_CHANCE_RANK
        ? null
        : getUpgradeCostCritChance(generatorNumber, critRank),
    () => critRank >= MAX_CRIT_CHANCE_RANK,
    () => {
      critRank += 1;
    },
  );
}

export function computeCritMultiplierBulkSpend(
  s: UpgradeBulkCostInput,
  id: GeneratorId,
  mode: UpgradeBuyMode,
): BulkSpendPreview {
  const gen = s.generators.find((g) => g.id === id);
  if (!gen) return { total: Decimal.dZero, count: 0, firstCost: null, isFlexibleBatch: mode === "100%" };
  const generatorNumber = parseGeneratorId(id).gen;
  let multRank = gen.upgradeCritMultiplierRank;
  const first = getUpgradeCostCritMultiplier(generatorNumber, multRank);
  const flex = sumConsecutiveCostsWithCurrency(
    s.milestoneCurrency,
    ABSOLUTE_CAP,
    () => getUpgradeCostCritMultiplier(generatorNumber, multRank),
    () => false,
    () => {
      multRank += 1;
    },
  );
  multRank = gen.upgradeCritMultiplierRank;
  return mergePreview(mode, first, flex, fixedBatchN(mode), () =>
    getUpgradeCostCritMultiplier(generatorNumber, multRank), () => false, () => {
    multRank += 1;
  });
}
