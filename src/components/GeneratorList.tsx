import Decimal from "break_eternity.js";
import { useGameSelector, useGameDispatch } from "@/store/useGameStore";
import { getVisibleGeneratorIds, isLineUnlocked } from "@/store/gameState";
import type { LineStats } from "@/store/gameState";
import { getCurrentMilestoneCount, getCoinsFromClaiming } from "@/utils/milestones";
import { getMilestoneRewardMultiplier } from "@/engine/upgrades";
import { formatNumber } from "@/utils/format";
import { useT } from "@/locale";
import { LINE_COUNT, LINE_COLOR_CLASSES, getLineColor, parseGeneratorId } from "@/engine/constants";
import { GeneratorRow } from "./GeneratorRow";

function LineSelector() {
  const dispatch = useGameDispatch();
  const { activeLine, unlockedLines } = useGameSelector((s) => ({
    activeLine: s.activeLine,
    unlockedLines: Array.from({ length: LINE_COUNT }, (_, i) => isLineUnlocked(s, i + 1)),
  }), (a, b) => a.activeLine === b.activeLine && a.unlockedLines.every((v, i) => v === b.unlockedLines[i]));

  return (
    <div className="flex w-full gap-1.5">
      {Array.from({ length: LINE_COUNT }, (_, i) => {
        const line = i + 1;
        const color = getLineColor(line);
        const classes = LINE_COLOR_CLASSES[color];
        const isActive = line === activeLine;
        const unlocked = unlockedLines[i];
        if (!unlocked) {
          return (
            <div
              key={line}
              className="flex h-7 flex-1 items-center justify-center rounded border border-dashed border-zinc-600 bg-zinc-800/60 text-[10px] text-zinc-600"
            >
              <span className="font-bold text-[8px] uppercase tracking-wider">bloq.</span>
            </div>
          );
        }
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

  const lineResource = useGameSelector(
    (s) => s.lineResources[activeLine] ?? Decimal.dZero,
    (a, b) => a.equals(b)
  );

  const stats: LineStats = useGameSelector(
    (s) => s.lineStats[activeLine] ?? { baseResourceProduced: Decimal.dZero, milestoneCurrencyEarned: Decimal.dZero },
    (a, b) => a.baseResourceProduced.equals(b.baseResourceProduced) && a.milestoneCurrencyEarned.equals(b.milestoneCurrencyEarned)
  );

  const lineColor = getLineColor(activeLine);
  const colorClasses = LINE_COLOR_CLASSES[lineColor];

  return (
    <div className="flex min-w-0 flex-col gap-3 pt-2.5">
      <LineSelector />
      <div className="flex items-center gap-3 rounded-lg bg-zinc-900/70 px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`text-4xl ${colorClasses.textVivid}`} aria-hidden>●</span>
          <span className="text-lg font-bold tabular-nums text-white">{formatNumber(lineResource)}</span>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs tabular-nums text-zinc-500">
          <span><span className={colorClasses.text}>●</span> {formatNumber(stats.baseResourceProduced)}</span>
          <span><span className="text-violet-400">◆</span> {formatNumber(stats.milestoneCurrencyEarned)}</span>
        </div>
      </div>
      <ul className="flex min-w-0 flex-col gap-3">
        {visibleIds.map((id) => (
          <li key={id}>
            <GeneratorRow id={id} />
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => dispatch({ type: "CLAIM_ALL_MILESTONES" })}
        disabled={!hasPending}
        className={`btn-3d flex h-[40px] w-full items-center justify-center rounded-md text-sm font-medium ${
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
    </div>
  );
}
