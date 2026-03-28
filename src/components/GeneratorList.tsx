import Decimal from "break_eternity.js";
import { useGameSelector, useGameDispatch } from "@/store/useGameStore";
import { getVisibleGeneratorIds } from "@/store/gameState";
import { getCurrentMilestoneCount, getCoinsFromClaiming } from "@/utils/milestones";
import { formatNumber } from "@/utils/format";
import { GeneratorRow } from "./GeneratorRow";

export function GeneratorList() {
  const visibleIds = useGameSelector(getVisibleGeneratorIds, (a, b) => a.join() === b.join());
  const dispatch = useGameDispatch();

  const totalPending = useGameSelector((state) => {
    let coins = Decimal.dZero;
    for (const gen of state.generators) {
      const currentCount = getCurrentMilestoneCount(gen.quantity);
      if (currentCount <= gen.claimedMilestoneIndex) continue;
      const generatorNumber = parseInt(gen.id.replace("generator", ""), 10);
      coins = coins.add(
        getCoinsFromClaiming(generatorNumber, gen.claimedMilestoneIndex, currentCount)
      );
    }
    return coins;
  }, (a, b) => a.equals(b));

  const hasPending = totalPending.gt(Decimal.dZero);

  return (
    <div className="flex min-w-0 flex-col gap-3 pt-2.5">
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
              ? <>Resgatar {formatNumber(totalPending)} pontos de marcos</>
              : "Nenhum marco pendente"}
          </span>
        </button>
        <div className="w-[160px] shrink-0" />
      </div>
    </div>
  );
}
