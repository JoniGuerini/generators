import Decimal from "break_eternity.js";
import type { GameState } from "@/store/gameState";
import { GENERATOR_DEFS, type GeneratorId, parseGeneratorId, makeGeneratorId, GENERATORS_PER_LINE, getUnlockRequirement } from "@/engine/constants";
import { getEffectiveGeneratorCost } from "@/engine/upgrades";
import { getNextMilestoneFromQuantity } from "@/utils/milestones";
import type { BuyMode } from "@/contexts/BuyModeContext";

/**
 * Para o modo "proximo": quantas unidades do gerador atual são necessárias
 * para comprar 1 do próximo gerador (considerando upgrade de custo).
 * Retorna null se não houver próximo gerador.
 */
export function getNextGeneratorUnlockTarget(
  id: GeneratorId,
): Decimal | null {
  const { line, gen } = parseGeneratorId(id);
  if (gen >= GENERATORS_PER_LINE) return null;
  const nextId = makeGeneratorId(line, gen + 1);
  const nextDef = GENERATOR_DEFS[nextId];
  if (!nextDef || nextDef.unlockRequirement.lte(Decimal.dZero)) return null;
  return nextDef.unlockRequirement;
}

export function isLastGeneratorInLine(id: GeneratorId): boolean {
  return parseGeneratorId(id).gen >= GENERATORS_PER_LINE;
}

export function getBuyAmount(
  mode: BuyMode,
  maxAffordable: Decimal,
  quantity?: Decimal,
  nextGenCost?: Decimal | null,
): number {
  if (mode === "1x") return 1;
  if (mode === "marco") {
    if (quantity == null) return maxAffordable.gte(Decimal.dOne) ? 1 : 0;
    const nextMarco = getNextMilestoneFromQuantity(quantity);
    const toBuyDecimal = nextMarco.sub(quantity).floor();
    if (toBuyDecimal.lt(Decimal.dZero)) return maxAffordable.gte(Decimal.dOne) ? 1 : 0;
    const toBuy = Decimal.min(toBuyDecimal, maxAffordable);
    const n = toBuy.toNumber();
    if (!Number.isFinite(n) || n < 0) return 0;
    const amount = Math.min(n, Number.MAX_SAFE_INTEGER);
    if (amount === 0 && Decimal.gte(maxAffordable, Decimal.dOne)) return 1;
    return amount;
  }
  if (mode === "proximo") {
    if (quantity == null || nextGenCost == null) return maxAffordable.gte(Decimal.dOne) ? 1 : 0;
    const needed = nextGenCost.sub(quantity).ceil();
    if (needed.lte(Decimal.dZero)) return 0;
    const toBuy = Decimal.min(needed, maxAffordable);
    const n = toBuy.toNumber();
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(n, Number.MAX_SAFE_INTEGER);
  }
  const pct =
    mode === "1%" ? 0.01 : mode === "10%" ? 0.1 : mode === "50%" ? 0.5 : 1;
  const toBuyDecimal = maxAffordable.mul(pct).floor();
  const n = toBuyDecimal.toNumber();
  if (!Number.isFinite(n) || n < 0) return 0;
  const amount = Math.min(n, Number.MAX_SAFE_INTEGER);
  if (amount === 0 && Decimal.gte(maxAffordable, Decimal.dOne)) return 1;
  return amount;
}

/** Estado atual: quantidade e se pode comprar (para clique seguro / hold). */
export function computeGeneratorPurchase(
  state: GameState,
  id: GeneratorId,
  buyMode: BuyMode
): { amount: number; canPurchase: boolean } {
  const def = GENERATOR_DEFS[id];
  const gen = state.generators.find((g) => g.id === id);
  if (!gen) return { amount: 0, canPurchase: false };

  const half = state.upgradeGeneratorCostHalfRank;
  const genLine = parseGeneratorId(id).line;
  const lineHalf = state.upgradeLineCostHalfRanks[genLine] ?? 0;
  const effectiveCost = getEffectiveGeneratorCost(def.cost, half, lineHalf);
  const effectiveCostPrev = getEffectiveGeneratorCost(
    def.costPreviousGenerator,
    half,
    lineHalf
  );
  const lineResource = state.lineResources[genLine] ?? Decimal.dZero;
  const ticketCurrency = state.ticketCurrency;
  const prevGenQuantity =
    def.produces !== "base"
      ? state.generators.find((g) => g.id === def.produces)?.quantity
      : undefined;

  const ticketCostPerUnit = parseGeneratorId(id).line;
  const maxByBase = lineResource.div(effectiveCost).floor();
  const maxByTickets = ticketCurrency.div(ticketCostPerUnit).floor();
  let maxByPrev = Decimal.fromNumber(Number.MAX_SAFE_INTEGER);
  if (
    effectiveCostPrev.gt(Decimal.dZero) &&
    def.produces !== "base" &&
    prevGenQuantity
  ) {
    maxByPrev = prevGenQuantity.div(effectiveCostPrev).floor();
  }
  let maxAffordable = maxByBase;
  if (maxByTickets.lt(maxAffordable)) maxAffordable = maxByTickets;
  if (maxByPrev.lt(maxAffordable)) maxAffordable = maxByPrev;

  const hasEnoughPrev =
    effectiveCostPrev.lte(Decimal.dZero) ||
    def.produces === "base" ||
    (prevGenQuantity
      ? Decimal.gte(prevGenQuantity, effectiveCostPrev)
      : false);
  const canBuy =
    Decimal.gte(lineResource, effectiveCost) &&
    Decimal.gte(ticketCurrency, Decimal.fromNumber(ticketCostPerUnit)) &&
    hasEnoughPrev &&
    (() => {
      if (gen.everOwned) return true;
      const unlock = getUnlockRequirement(id);
      if (unlock.required.lte(Decimal.dZero)) return true;
      const uPrev = unlock.previousGenId
        ? state.generators.find((g) => g.id === unlock.previousGenId)?.quantity ?? Decimal.dZero
        : Decimal.dZero;
      return uPrev.gte(unlock.required);
    })();

  const quantity = gen.quantity;
  const nextGenCost = buyMode === "proximo"
    ? getNextGeneratorUnlockTarget(id)
    : null;
  const buyAmount = getBuyAmount(buyMode, maxAffordable, quantity, nextGenCost);
  const amountNeededForMarco =
    buyMode === "marco"
      ? getNextMilestoneFromQuantity(quantity).sub(quantity).floor()
      : null;
  const canReachMarco =
    amountNeededForMarco == null || maxAffordable.gte(amountNeededForMarco);
  const amountNeededForProximo =
    buyMode === "proximo" && nextGenCost != null
      ? nextGenCost.sub(quantity).ceil()
      : null;
  const canReachProximo =
    amountNeededForProximo == null || amountNeededForProximo.lte(Decimal.dZero) || maxAffordable.gte(amountNeededForProximo);
  const canPurchase =
    canBuy &&
    buyAmount >= 1 &&
    (buyMode !== "marco" || canReachMarco) &&
    (buyMode !== "proximo" || canReachProximo);

  return { amount: buyAmount, canPurchase };
}
