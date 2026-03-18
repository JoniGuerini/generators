import Decimal from "break_eternity.js";
import type { GameState } from "@/store/gameState";
import { GENERATOR_DEFS, type GeneratorId } from "@/engine/constants";
import { getEffectiveGeneratorCost } from "@/engine/upgrades";
import { getNextMilestoneFromQuantity } from "@/utils/milestones";
import type { BuyMode } from "@/contexts/BuyModeContext";

export function getBuyAmount(
  mode: BuyMode,
  maxAffordable: Decimal,
  quantity?: Decimal
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
  const buyAmount = getBuyAmount(buyMode, maxAffordable, quantity);
  const amountNeededForMarco =
    buyMode === "marco"
      ? getNextMilestoneFromQuantity(quantity).sub(quantity).floor()
      : null;
  const canReachMarco =
    amountNeededForMarco == null || maxAffordable.gte(amountNeededForMarco);
  const canPurchase =
    canBuy &&
    buyAmount >= 1 &&
    (buyMode !== "marco" || canReachMarco);

  return { amount: buyAmount, canPurchase };
}
