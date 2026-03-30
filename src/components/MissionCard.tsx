import { useState } from "react";
import Decimal from "break_eternity.js";
import { useGameSelector, useGameDispatch } from "@/store/useGameStore";
import { getVisibleMissions, getRankProgress } from "@/engine/missions";
import type { MissionDef, MissionReward } from "@/engine/missions";
import { GENERATOR_DEFS } from "@/engine/constants";
import type { GeneratorId } from "@/engine/constants";
import { formatNumber } from "@/utils/format";
import { useT } from "@/locale";
import { generateMissionCards, parseCardKey, CARD_RARITY } from "@/engine/cards";
import type { CardRarity } from "@/engine/cards";

function RewardBadge({ reward }: { reward: MissionReward }) {
  const t = useT();
  switch (reward.type) {
    case "baseResource":
      return (
        <span className="flex w-full items-center justify-center gap-1 rounded bg-zinc-800 px-2 py-1 text-xs font-semibold text-cyan-300">
          <span aria-hidden>●</span> {formatNumber(Decimal.fromNumber(reward.amount))} {t.missions.resource}
        </span>
      );
    case "tickets":
      return (
        <span className="flex w-full items-center justify-center gap-1 rounded bg-zinc-800 px-2 py-1 text-xs font-semibold text-amber-300">
          <span aria-hidden>▲</span> {formatNumber(Decimal.fromNumber(reward.amount))}
        </span>
      );
    case "milestoneCurrency":
      return (
        <span className="flex w-full items-center justify-center gap-1 rounded bg-zinc-800 px-2 py-1 text-xs font-semibold text-violet-300">
          <span aria-hidden>◆</span> {formatNumber(Decimal.fromNumber(reward.amount))}
        </span>
      );
    case "generators": {
      const num = reward.generatorId.replace("generator", "");
      const def = GENERATOR_DEFS[reward.generatorId];
      return (
        <span className="flex w-full items-center justify-center gap-1 rounded bg-zinc-800 px-2 py-1 text-xs font-semibold text-red-300">
          {formatNumber(Decimal.fromNumber(reward.amount))}× {def?.name ?? `Gen ${num}`}
        </span>
      );
    }
  }
}

function GeneratorBadge({ num }: { num: string }) {
  return (
    <span className="btn-3d--red inline-flex h-5 w-5 items-center justify-center rounded bg-red-600 text-[10px] font-bold text-white align-middle">
      {num}
    </span>
  );
}

function getObjectiveContent(mission: MissionDef, t: ReturnType<typeof useT>): React.ReactNode {
  const obj = mission.objective;
  const fmt = (n: number) => formatNumber(Decimal.fromNumber(n));
  switch (obj.type) {
    case "generatorCount": {
      const num = obj.generatorId.replace("generator", "");
      return (
        <span className="inline-flex items-center gap-1">
          {t.missions.generatorCount(fmt(obj.count))} <GeneratorBadge num={num} />
        </span>
      );
    }
    case "milestoneCurrencyTotal":
      return (
        <span>
          {t.missions.milestoneCurrencyCollect(fmt(obj.count))} <span className="text-violet-400">◆</span> {t.missions.milestoneCurrencySuffix}
        </span>
      );
    case "baseResourceTotal":
      return (
        <span>
          {t.missions.baseResourceAccumulate(fmt(obj.count))} <span className="text-cyan-400">●</span> {t.missions.baseResourceSuffix}
        </span>
      );
  }
}

interface MissionProgress {
  mission: MissionDef;
  progress: number;
  total: number;
  isComplete: boolean;
}

function DialogRewardBadge({ reward }: { reward: MissionReward }) {
  const t = useT();
  const fmt = (n: number) => formatNumber(Decimal.fromNumber(n));
  switch (reward.type) {
    case "baseResource":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2">
          <span className="text-lg text-cyan-400" aria-hidden>●</span>
          <span className="text-sm font-semibold text-cyan-300">+{fmt(reward.amount)} {t.missions.resource}</span>
        </div>
      );
    case "tickets":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2">
          <span className="text-lg text-amber-400" aria-hidden>▲</span>
          <span className="text-sm font-semibold text-amber-300">+{fmt(reward.amount)} Tickets</span>
        </div>
      );
    case "milestoneCurrency":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2">
          <span className="text-lg text-violet-400" aria-hidden>◆</span>
          <span className="text-sm font-semibold text-violet-300">+{fmt(reward.amount)}</span>
        </div>
      );
    case "generators": {
      const def = GENERATOR_DEFS[reward.generatorId];
      const num = reward.generatorId.replace("generator", "");
      return (
        <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2">
          <GeneratorBadge num={num} />
          <span className="text-sm font-semibold text-red-300">+{fmt(reward.amount)} {def?.name ?? `Gen ${num}`}</span>
        </div>
      );
    }
  }
}

const RARITY_TEXT_COLOR: Record<CardRarity, string> = {
  common: "text-zinc-400",
  uncommon: "text-green-400",
  rare: "text-violet-400",
};

function CardRewardBadge({ cardKey, count, t }: { cardKey: string; count: number; t: ReturnType<typeof useT> }) {
  const { type, generatorId } = parseCardKey(cardKey);
  const rarity = CARD_RARITY[type];
  const color = RARITY_TEXT_COLOR[rarity];
  const typeName = t.cards[type] ?? type;
  const genNum = generatorId ? generatorId.replace("generator", "") : null;
  const label = genNum ? `${typeName} — ${t.cards.generator} ${genNum}` : typeName;

  return (
    <div className={`flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5`}>
      <span className={`flex-1 text-xs font-medium ${color}`}>{label}</span>
      <span className={`text-xs font-bold ${color}`}>×{count}</span>
    </div>
  );
}

interface ClaimData {
  mission: MissionDef;
  cards: Record<string, number>;
}

function MissionClaimDialog({ data, onClose }: { data: ClaimData; onClose: () => void }) {
  const dispatch = useGameDispatch();
  const t = useT();
  const { mission, cards } = data;

  const handleClaim = () => {
    dispatch({ type: "CLAIM_MISSION", missionId: mission.id, cards });
    onClose();
  };

  const cardEntries = Object.entries(cards);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="btn-3d--zinc mx-4 flex w-full max-w-xs flex-col gap-3 rounded-xl bg-zinc-700 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-center text-sm font-bold text-amber-400">{t.missions.completed}</h3>

        <div className="flex items-center justify-center rounded-lg bg-zinc-800 px-3 py-2">
          <p className="text-center text-xs font-medium text-zinc-300">
            {getObjectiveContent(mission, t)}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {t.missions.reward}
          </span>
          <div className="flex items-center justify-center rounded-lg bg-zinc-800/50 px-3 py-2">
            <span className="text-xs font-semibold text-amber-400">+1 XP</span>
          </div>
          {mission.rewards.map((r, i) => (
            <DialogRewardBadge key={i} reward={r} />
          ))}
        </div>

        {cardEntries.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {t.missions.cardsReward}
            </span>
            {cardEntries.map(([key, count]) => (
              <CardRewardBadge key={key} cardKey={key} count={count} t={t} />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleClaim}
          className="btn-3d btn-3d--green mt-1 flex h-8 w-full items-center justify-center rounded-lg bg-green-600 text-sm font-bold text-white hover:bg-green-500"
        >
          {t.missions.claim}
        </button>
      </div>
    </div>
  );
}

function SingleMissionCard({ data, onClaim }: { data: MissionProgress; onClaim: (mission: MissionDef) => void }) {
  const t = useT();
  const { mission, progress, total, isComplete } = data;
  const pct = total > 0 ? Math.min((progress / total) * 100, 100) : 0;

  return (
    <div className="btn-3d--zinc flex flex-col rounded-lg bg-zinc-600 px-3 py-2">
      <div className="flex h-8 items-center">
        <p className="text-xs font-medium text-zinc-300">
          {getObjectiveContent(mission, t)}
        </p>
      </div>
      {isComplete ? (
        <button
          type="button"
          onClick={() => onClaim(mission)}
          className="btn-3d btn-3d--green flex h-6 w-full items-center justify-center rounded bg-green-600 text-xs font-bold text-white hover:bg-green-500"
        >
          {t.missions.claim}
        </button>
      ) : (
        <div className="relative h-6 w-full overflow-hidden rounded bg-zinc-800">
          <div
            className="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-amber-600 to-amber-400 transition-[width] duration-300 ease-linear"
            style={{ width: `${pct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center px-2">
            <span className="text-[11px] font-semibold tabular-nums text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {formatNumber(Decimal.fromNumber(progress))} / {formatNumber(Decimal.fromNumber(total))}
            </span>
          </div>
        </div>
      )}
      <div className="mt-1.5">
        {mission.rewards.map((r, i) => (
          <RewardBadge key={i} reward={r} />
        ))}
      </div>
    </div>
  );
}

function getMissionProgress(mission: MissionDef, state: import("@/store/gameState").GameState): MissionProgress {
  const obj = mission.objective;
  let current = 0;
  let target = 0;
  if (obj.type === "generatorCount") {
    const gen = state.generators.find((g) => g.id === obj.generatorId);
    current = gen ? Math.min(gen.quantity.toNumber(), obj.count) : 0;
    target = obj.count;
  } else if (obj.type === "milestoneCurrencyTotal") {
    current = Math.min(state.milestoneCurrency.toNumber(), obj.count);
    target = obj.count;
  } else if (obj.type === "baseResourceTotal") {
    current = Math.min(state.baseResource.toNumber(), obj.count);
    target = obj.count;
  }
  return { mission, progress: current, total: target, isComplete: current >= target };
}

function RankBar() {
  const t = useT();
  const dispatch = useGameDispatch();
  const { rank, xp, xpNeeded, canRankUp } = useGameSelector((state) =>
    getRankProgress(state.rank, state.claimedMissions.length)
  );
  const maxedOut = xpNeeded === 0;
  const slots = maxedOut ? xp : xpNeeded;

  return (
    <div className="flex w-full items-center gap-2">
      <span className="btn-3d--amber inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-500 text-[10px] font-bold text-white">
        {rank}
      </span>
      {canRankUp ? (
        <button
          type="button"
          onClick={() => dispatch({ type: "RANK_UP" })}
          className="btn-3d btn-3d--green flex h-5 flex-1 items-center justify-center rounded bg-green-600 text-xs font-bold text-white hover:bg-green-500"
        >
          {t.missions.rankUp}
        </button>
      ) : (
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: slots }, (_, i) => (
            <div
              key={i}
              className={`h-5 flex-1 rounded-sm transition-colors duration-300 ${
                i < xp
                  ? "bg-amber-500"
                  : "bg-zinc-700/50"
              }`}
            />
          ))}
        </div>
      )}
      <span className="btn-3d--zinc inline-flex h-5 shrink-0 items-center justify-center rounded bg-zinc-600 px-2 text-[10px] font-bold tabular-nums text-white">
        {maxedOut ? t.missions.rankMax : `${xp}/${xpNeeded}`}
      </span>
    </div>
  );
}

export function MissionCard() {
  const [claimData, setClaimData] = useState<ClaimData | null>(null);

  const ownedGeneratorIds = useGameSelector(
    (state) => state.generators.filter((g) => g.everOwned).map((g) => g.id),
    (a, b) => a.length === b.length && a.every((id, i) => id === b[i])
  );

  const missions = useGameSelector((state) => {
    const visible = getVisibleMissions(state.claimedMissions, state.rank, 8);
    return visible.map((m) => getMissionProgress(m, state));
  }, (a, b) =>
    a.length === b.length &&
    a.every((m, i) => m.mission.id === b[i].mission.id && m.progress === b[i].progress && m.isComplete === b[i].isComplete)
  );

  const handleClaim = (mission: MissionDef) => {
    const cards = generateMissionCards(ownedGeneratorIds as GeneratorId[]);
    setClaimData({ mission, cards });
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <RankBar />
      {missions.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {missions.map((data) => (
            <SingleMissionCard key={data.mission.id} data={data} onClaim={handleClaim} />
          ))}
        </div>
      )}
      {claimData && (
        <MissionClaimDialog data={claimData} onClose={() => setClaimData(null)} />
      )}
    </div>
  );
}
