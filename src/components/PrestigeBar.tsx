import Decimal from "break_eternity.js";
import { useGameSelector } from "@/store/useGameStore";
import { GENERATOR_DEFS } from "@/engine/constants";
import {
  getEffectiveCycleTimeSeconds,
  getEffectiveProductionPerCycle,
} from "@/engine/upgrades";
import { formatNumber, formatTime } from "@/utils/format";
import { useT } from "@/locale";

const PRESTIGE_THRESHOLD = Decimal.pow(10, 33);

export function PrestigeBar() {
  const t = useT();
  const { baseResource, basePerSec } = useGameSelector((state) => {
    const gen1 = state.generators.find((g) => g.id === "generator1");
    let perSec = Decimal.dZero;
    if (gen1 && gen1.quantity.gt(Decimal.dZero)) {
      const def = GENERATOR_DEFS["generator1"];
      const cycleTime = getEffectiveCycleTimeSeconds(
        def.cycleTimeSeconds,
        gen1.upgradeCycleSpeedRank
      );
      const prodPerCycle = getEffectiveProductionPerCycle(
        def.productionPerCycle,
        gen1.upgradeProductionRank
      );
      if (cycleTime > 0) {
        perSec = prodPerCycle.mul(gen1.quantity).div(cycleTime);
      }
    }
    return {
      baseResource: state.baseResource,
      basePerSec: perSec,
    };
  }, (a, b) =>
    a.baseResource.equals(b.baseResource) &&
    a.basePerSec.equals(b.basePerSec)
  );

  const progress = baseResource.gte(PRESTIGE_THRESHOLD)
    ? 1
    : baseResource.div(PRESTIGE_THRESHOLD).toNumber();

  let etaText = "∞";
  if (baseResource.gte(PRESTIGE_THRESHOLD)) {
    etaText = t.prestige.ready;
  } else if (basePerSec.gt(Decimal.dZero)) {
    const remaining = PRESTIGE_THRESHOLD.sub(baseResource);
    const secondsLeft = remaining.div(basePerSec).toNumber();
    if (Number.isFinite(secondsLeft)) {
      etaText = formatTime(secondsLeft);
    }
  }

  return (
    <div className="mx-2 mt-2 flex flex-col gap-1">
      <div className="btn-3d--dark relative h-[40px] w-full overflow-hidden rounded-md bg-[#0D0D0D]">
        <div
          className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-amber-600 to-amber-400 transition-[width] duration-300"
          style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-3">
          <span className="text-sm font-semibold tabular-nums text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.9)]">
            {formatNumber(baseResource)}
          </span>
          <span className="text-sm font-medium tabular-nums text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.9)]">
            {etaText === t.prestige.ready
              ? etaText
              : etaText === "∞"
                ? "∞"
                : `≈ ${etaText}`}
          </span>
        </div>
      </div>
    </div>
  );
}
