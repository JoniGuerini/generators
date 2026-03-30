import Decimal from "break_eternity.js";

export const LINE_COUNT = 10;
export const GENERATORS_PER_LINE = 10;

export type GeneratorId = string;

export function makeGeneratorId(line: number, gen: number): GeneratorId {
  return `l${line}g${gen}`;
}

export function parseGeneratorId(id: GeneratorId): { line: number; gen: number } {
  const match = id.match(/^l(\d+)g(\d+)$/);
  if (!match) throw new Error(`Invalid generator ID: ${id}`);
  return { line: parseInt(match[1], 10), gen: parseInt(match[2], 10) };
}

export interface GeneratorDef {
  id: GeneratorId;
  name: string;
  line: number;
  genNumber: number;
  cycleTimeSeconds: number;
  productionPerCycle: Decimal;
  cost: Decimal;
  produces: GeneratorId | "base";
  costPreviousGenerator: Decimal;
  unlockRequirement: Decimal;
}

const BASE_CYCLE_TIMES = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
const BASE_PRODUCTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const BASE_COSTS: Decimal[] = [
  Decimal.fromNumber(10),
  Decimal.fromNumber(100),
  Decimal.fromNumber(10_000),
  Decimal.fromNumber(10_000_000),
  Decimal.fromNumber(100_000_000_000),
  Decimal.pow(10, 16),
  Decimal.pow(10, 22),
  Decimal.pow(10, 29),
  Decimal.pow(10, 37),
  Decimal.pow(10, 46),
];
const BASE_PREV_GEN_COSTS: Decimal[] = [
  Decimal.dZero,
  Decimal.fromNumber(10),
  Decimal.fromNumber(50),
  Decimal.fromNumber(100),
  Decimal.fromNumber(1_000),
  Decimal.fromNumber(100_000),
  Decimal.pow(10, 6),
  Decimal.pow(10, 7),
  Decimal.pow(10, 8),
  Decimal.pow(10, 9),
];

const UNLOCK_REQUIREMENTS: Decimal[] = [
  Decimal.dZero,
  Decimal.fromNumber(25),
  Decimal.fromNumber(125),
  Decimal.fromNumber(250),
  Decimal.fromNumber(2_500),
  Decimal.fromNumber(250_000),
  Decimal.pow(10, 6).mul(2.5),
  Decimal.pow(10, 7).mul(2.5),
  Decimal.pow(10, 8).mul(2.5),
  Decimal.pow(10, 9).mul(2.5),
];

export const GENERATOR_IDS: GeneratorId[] = [];
export const LINE_GENERATOR_IDS: GeneratorId[][] = [];
export const GENERATOR_DEFS: Record<GeneratorId, GeneratorDef> = {};

for (let line = 1; line <= LINE_COUNT; line++) {
  const lineIds: GeneratorId[] = [];
  const cycleMultiplier = Math.pow(2, line - 1);
  const prodMultiplier = Math.pow(3, line - 1);

  for (let gen = 1; gen <= GENERATORS_PER_LINE; gen++) {
    const id = makeGeneratorId(line, gen);
    GENERATOR_IDS.push(id);
    lineIds.push(id);

    GENERATOR_DEFS[id] = {
      id,
      name: `Gerador ${gen}`,
      line,
      genNumber: gen,
      cycleTimeSeconds: BASE_CYCLE_TIMES[gen - 1] * cycleMultiplier,
      productionPerCycle: Decimal.fromNumber(BASE_PRODUCTIONS[gen - 1] * prodMultiplier),
      cost: BASE_COSTS[gen - 1],
      produces: gen === 1 ? "base" : makeGeneratorId(line, gen - 1),
      costPreviousGenerator: BASE_PREV_GEN_COSTS[gen - 1],
      unlockRequirement: UNLOCK_REQUIREMENTS[gen - 1],
    };
  }

  LINE_GENERATOR_IDS.push(lineIds);
}

export function getUnlockRequirement(id: GeneratorId): { previousGenId: GeneratorId | null; required: Decimal } {
  const { line, gen } = parseGeneratorId(id);
  if (gen <= 1) return { previousGenId: null, required: Decimal.dZero };
  return { previousGenId: makeGeneratorId(line, gen - 1), required: GENERATOR_DEFS[id].unlockRequirement };
}

export function getLineGeneratorIds(line: number): GeneratorId[] {
  return LINE_GENERATOR_IDS[line - 1] ?? [];
}

export const LINE_COLORS = [
  "red", "blue", "green", "amber", "violet",
  "cyan", "orange", "pink", "indigo", "lime",
] as const;
export type LineColor = (typeof LINE_COLORS)[number];

export function getLineColor(line: number): LineColor {
  return LINE_COLORS[(line - 1) % LINE_COLORS.length];
}

export const LINE_COLOR_CLASSES: Record<LineColor, { bg: string; btn3d: string; text: string; textDark: string }> = {
  red:    { bg: "bg-red-600",    btn3d: "btn-3d--red",    text: "text-red-400",    textDark: "text-red-700" },
  blue:   { bg: "bg-blue-600",   btn3d: "btn-3d--blue",   text: "text-blue-400",   textDark: "text-blue-700" },
  green:  { bg: "bg-green-600",  btn3d: "btn-3d--green-badge", text: "text-green-400", textDark: "text-green-700" },
  amber:  { bg: "bg-amber-500",  btn3d: "btn-3d--amber",  text: "text-amber-400",  textDark: "text-amber-700" },
  violet: { bg: "bg-violet-600", btn3d: "btn-3d--violet", text: "text-violet-400", textDark: "text-violet-700" },
  cyan:   { bg: "bg-cyan-600",   btn3d: "btn-3d--cyan",   text: "text-cyan-400",   textDark: "text-cyan-700" },
  orange: { bg: "bg-orange-500", btn3d: "btn-3d--orange", text: "text-orange-400", textDark: "text-orange-700" },
  pink:   { bg: "bg-pink-600",   btn3d: "btn-3d--pink",   text: "text-pink-400",   textDark: "text-pink-700" },
  indigo: { bg: "bg-indigo-600", btn3d: "btn-3d--indigo", text: "text-indigo-400", textDark: "text-indigo-700" },
  lime:   { bg: "bg-lime-600",   btn3d: "btn-3d--lime",   text: "text-lime-400",   textDark: "text-lime-700" },
};
