import Decimal from "break_eternity.js";
import type { GameState } from "@/store/gameState";
import { GENERATOR_DEFS, GENERATOR_IDS, type GeneratorId } from "@/engine/constants";
import { getEffectiveGeneratorCost } from "@/engine/upgrades";
import { getNextMilestoneFromQuantity } from "@/utils/milestones";
import type { BuyMode } from "@/contexts/BuyModeContext";

/**
 * Para o modo "proximo": quantas unidades do gerador atual são necessárias
 * para comprar 1 do próximo gerador (considerando upgrade de custo).
 * Retorna null se não houver próximo gerador.
 */
export function getNextGeneratorCostInCurrent(
  id: GeneratorId,
  upgradeGeneratorCostHalfRank: number
): Decimal | null {
  const idx = GENERATOR_IDS.indexOf(id);
  if (idx < 0 || idx >= GENERATOR_IDS.length - 1) return null;
  const nextId = GENERATOR_IDS[idx + 1];
  const nextDef = GENERATOR_DEFS[nextId];
  if (nextDef.costPreviousGenerator.lte(Decimal.dZero)) return null;
  return getEffectiveGeneratorCost(nextDef.costPreviousGenerator, upgradeGeneratorCostHalfRank);
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
  const effectiveCost = getEffectiveGeneratorCost(def.cost, half);
  const effectiveCostPrev = getEffectiveGeneratorCost(
    def.costPreviousGenerator,
    half
  );
  const baseResource = state.baseResource;
  const ticketCurrency = state.ticketCurrency;
  const prevGenQuantity =
    def.produces !== "base"
      ? state.generators.find((g) => g.id === def.produces)?.quantity
      : undefined;

  const maxByBase = baseResource.div(effectiveCost).floor();
  const maxByTickets = ticketCurrency.floor();
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
    Decimal.gte(baseResource, effectiveCost) &&
    Decimal.gte(ticketCurrency, Decimal.dOne) &&
    hasEnoughPrev;

  const quantity = gen.quantity;
  const nextGenCost = buyMode === "proximo"
    ? getNextGeneratorCostInCurrent(id, half)
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
