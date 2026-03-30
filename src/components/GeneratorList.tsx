import Decimal from "break_eternity.js";
import { useGameSelector, useGameDispatch } from "@/store/useGameStore";
import { getVisibleGeneratorIds } from "@/store/gameState";
import { getCurrentMilestoneCount, getCoinsFromClaiming } from "@/utils/milestones";
import { getMilestoneRewardMultiplier } from "@/engine/upgrades";
import { formatNumber } from "@/utils/format";
import { useT } from "@/locale";
import { LINE_COUNT, LINE_COLOR_CLASSES, getLineColor, parseGeneratorId } from "@/engine/constants";
import { GeneratorRow } from "./GeneratorRow";
import { MissionCard } from "./MissionCard";

function LineSelector() {
  const dispatch = useGameDispatch();
  const activeLine = useGameSelector((s) => s.activeLine);

  return (
    <div className="flex w-full gap-1.5">
      {Array.from({ length: LINE_COUNT }, (_, i) => {
        const line = i + 1;
        const color = getLineColor(line);
        const classes = LINE_COLOR_CLASSES[color];
        const isActive = line === activeLine;
        return (
          <button
            key={line}
            type="button"
            onClick={() => dispatch({ type: "SET_ACTIVE_LINE", line })}
            className={`btn-3d flex h-7 flex-1 items-center justify-center rounded text-xs font-bold text-white ${
              isActive
                ? `${classes.btn3d} ${classes.bg}`
                : "btn-3d--zinc bg-zinc-700 text-zinc-500 opacity-60 hover:opacity-100"
            }`}
          >
            {line}
          </button>
        );
      })}
    </div>
  );
}

export function GeneratorList() {
  const activeLine = useGameSelector((s) => s.activeLine);
  const visibleIds = useGameSelector(
    (s) => getVisibleGeneratorIds(s, activeLine),
    (a, b) => a.join() === b.join()
  );
  const dispatch = useGameDispatch();
  const t = useT();

  const totalPending = useGameSelector((state) => {
    let coins = Decimal.dZero;
    for (const gen of state.generators) {
      const currentCount = getCurrentMilestoneCount(gen.quantity);
      if (currentCount <= gen.claimedMilestoneIndex) continue;
      const generatorNumber = parseGeneratorId(gen.id).gen;
      coins = coins.add(
        getCoinsFromClaiming(generatorNumber, gen.claimedMilestoneIndex, currentCount)
      );
    }
    const mult = getMilestoneRewardMultiplier(state.upgradeMilestoneDoublerRank);
    return mult > 1 ? coins.mul(mult) : coins;
  }, (a, b) => a.equals(b));

  const hasPending = totalPending.gt(Decimal.dZero);

  return (
    <div className="flex min-w-0 flex-col gap-3 pt-2.5">
      <MissionCard />
      <LineSelector />
      <ul className="flex min-w-0 flex-col gap-3">
        {visibleIds.map((id) => (
          <li key={id}>
            <GeneratorRow id={id} />
          </li>
        ))}
      </ul>
      <div className="flex min-w-0 flex-nowrap items-center gap-2">
        <div className="w-[40px] shrink-0" />
        <div className="w-[72px] shrink-0" />
        <button
          type="button"
          onClick={() => dispatch({ type: "CLAIM_ALL_MILESTONES" })}
          disabled={!hasPending}
          className={`btn-3d flex h-[40px] min-w-0 flex-1 items-center justify-center rounded-md text-sm font-medium ${
            hasPending
              ? "btn-3d--purple bg-purple-600 text-white hover:bg-purple-500"
              : "btn-3d--zinc bg-zinc-700 text-zinc-500 cursor-default"
          }`}
        >
          <span className="text-sm font-medium">
            {hasPending
              ? t.generatorList.claimAll(formatNumber(totalPending))
              : t.generatorList.noPending}
          </span>
        </button>
        <div className="w-[160px] shrink-0" />
      </div>
    </div>
  );
}
