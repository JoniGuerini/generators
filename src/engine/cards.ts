import type { GeneratorId } from "./constants";

export type CardRarity = "common" | "uncommon" | "rare";

export type UpgradeCardType =
  | "cycleSpeed"
  | "production"
  | "critChance"
  | "critMultiplier"
  | "ticketMultiplier"
  | "generatorCostHalf"
  | "milestoneDoubler";

export const PER_GENERATOR_CARD_TYPES: UpgradeCardType[] = [
  "cycleSpeed",
  "production",
  "critChance",
  "critMultiplier",
];

export const GLOBAL_CARD_TYPES: UpgradeCardType[] = [
  "ticketMultiplier",
  "generatorCostHalf",
  "milestoneDoubler",
];

export const CARD_RARITY: Record<UpgradeCardType, CardRarity> = {
  cycleSpeed: "common",
  production: "common",
  critChance: "uncommon",
  critMultiplier: "rare",
  ticketMultiplier: "rare",
  generatorCostHalf: "rare",
  milestoneDoubler: "rare",
};

const RARITY_WEIGHTS: [CardRarity, number][] = [
  ["common", 80],
  ["uncommon", 15],
  ["rare", 5],
];

export function getCardKey(type: UpgradeCardType, generatorId?: GeneratorId): string {
  if (PER_GENERATOR_CARD_TYPES.includes(type) && generatorId) {
    return `${type}:${generatorId}`;
  }
  return type;
}

export function parseCardKey(key: string): { type: UpgradeCardType; generatorId?: GeneratorId } {
  const idx = key.indexOf(":");
  if (idx === -1) return { type: key as UpgradeCardType };
  return {
    type: key.slice(0, idx) as UpgradeCardType,
    generatorId: key.slice(idx + 1) as GeneratorId,
  };
}

/** Cartas necessárias para subir do rank atual para o próximo (2, 4, 8, 16…). */
export function getCardsNeeded(currentRank: number): number {
  return Math.pow(2, currentRank + 1);
}

function pickRarity(): CardRarity {
  const total = RARITY_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of RARITY_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return "common";
}

function pickCardType(rarity: CardRarity, hasGenerators: boolean): UpgradeCardType | null {
  const all = [...PER_GENERATOR_CARD_TYPES, ...GLOBAL_CARD_TYPES];
  const available = all.filter((t) => {
    if (CARD_RARITY[t] !== rarity) return false;
    if (PER_GENERATOR_CARD_TYPES.includes(t) && !hasGenerators) return false;
    return true;
  });
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

/** Gera 2-4 cartas aleatórias. Apenas geradores desbloqueados participam. */
export function generateMissionCards(ownedGeneratorIds: GeneratorId[]): Record<string, number> {
  const count = 2 + Math.floor(Math.random() * 3);
  const cards: Record<string, number> = {};
  const hasGens = ownedGeneratorIds.length > 0;

  for (let i = 0; i < count; i++) {
    const rarity = pickRarity();
    const cardType = pickCardType(rarity, hasGens);
    if (!cardType) continue;

    let key: string;
    if (PER_GENERATOR_CARD_TYPES.includes(cardType)) {
      const genId = ownedGeneratorIds[Math.floor(Math.random() * ownedGeneratorIds.length)];
      key = getCardKey(cardType, genId);
    } else {
      key = getCardKey(cardType);
    }
    cards[key] = (cards[key] || 0) + 1;
  }
  return cards;
}
