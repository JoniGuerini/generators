import Decimal from "break_eternity.js";
import type { OfflineGains } from "@/engine/offlineProgress";
import { formatNumber, formatTime } from "@/utils/format";
import { useGameSelector, useGameDispatch } from "@/store/useGameStore";
import { getCurrentMilestoneCount, getCoinsFromClaiming } from "@/utils/milestones";
import { getMilestoneRewardMultiplier } from "@/engine/upgrades";
import { parseGeneratorId, getLineColor, LINE_COLOR_CLASSES } from "@/engine/constants";
import { useT } from "@/locale";

interface OfflineWelcomeCardProps {
  gains: OfflineGains;
  onClose: () => void;
}

function hasAnyGain(gains: OfflineGains): boolean {
  for (const v of Object.values(gains.lineResources)) {
    if ((v as Decimal).gt(Decimal.dZero)) return true;
  }
  if (gains.ticketCurrency.gt(Decimal.dZero)) return true;
  return false;
}

export function OfflineWelcomeCard({ gains, onClose }: OfflineWelcomeCardProps) {
  const showCard = hasAnyGain(gains);
  const offlineSeconds = gains.offlineTimeMs / 1000;
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

  if (!showCard) return null;

  const lineResourceEntries = Object.entries(gains.lineResources)
    .filter(([, v]) => (v as Decimal).gt(Decimal.dZero))
    .map(([k, v]) => ({ line: Number(k), amount: v as Decimal }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="offline-welcome-title"
    >
      <div className="w-full max-w-sm rounded-xl border border-zinc-600/80 bg-[#0D0D0D] shadow-2xl">
        <div className="px-5 py-5">
          <h2
            id="offline-welcome-title"
            className="text-lg font-bold text-white"
          >
            {t.offline.title}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {t.offline.awayFor}{" "}
            <span className="font-semibold text-white">
              {formatTime(offlineSeconds)}
            </span>
          </p>
        </div>

        <div className="px-5 pb-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            {t.offline.offlineGains}
          </p>
          <div className="space-y-2">
            {lineResourceEntries.map(({ line, amount }) => {
              const color = getLineColor(line);
              const classes = LINE_COLOR_CLASSES[color];
              return (
                <div key={line} className="flex flex-col gap-0.5 rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs ${classes.text}`} aria-hidden>●</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      {t.offline.resource} {line}
                    </span>
                  </div>
                  <span className="text-lg font-bold tabular-nums text-white">
                    +{formatNumber(amount)}
                  </span>
                </div>
              );
            })}
            {gains.ticketCurrency.gt(Decimal.dZero) && (
              <div className="flex flex-col gap-0.5 rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 text-xs" aria-hidden>▲</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{t.offline.tickets}</span>
                </div>
                <span className="text-lg font-bold tabular-nums text-white">
                  +{formatNumber(gains.ticketCurrency)}
                </span>
              </div>
            )}
            {hasPending && (
              <div className="flex flex-col gap-0.5 rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-purple-400 text-xs" aria-hidden>◆</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{t.offline.pendingUpgrades}</span>
                </div>
                <span className="text-lg font-bold tabular-nums text-white">
                  {formatNumber(totalPending)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={() => {
              if (hasPending) dispatch({ type: "CLAIM_ALL_MILESTONES" });
              onClose();
            }}
            className={`btn-3d w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white focus:outline-none ${
              hasPending
                ? "btn-3d--purple bg-purple-600 hover:bg-purple-500"
                : "btn-3d--zinc bg-zinc-700 hover:bg-zinc-600"
            }`}
          >
            {hasPending ? t.offline.claimAndContinue : t.offline.continue}
          </button>
        </div>
      </div>
    </div>
  );
}
