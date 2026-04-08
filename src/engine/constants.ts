import Decimal from "break_eternity.js";

export const LINE_COUNT = 20;
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
  "teal", "rose", "fuchsia", "sky", "emerald",
  "yellow", "slate", "stone", "purple2", "red2",
] as const;
export type LineColor = (typeof LINE_COLORS)[number];

export function getLineColor(line: number): LineColor {
  return LINE_COLORS[(line - 1) % LINE_COLORS.length];
}

export const LINE_COLOR_CLASSES: Record<LineColor, { bg: string; bgDark: string; btn3d: string; text: string; textVivid: string; textDark: string }> = {
  red:    { bg: "bg-red-600",    bgDark: "bg-red-900",    btn3d: "btn-3d--red",    text: "text-red-400",    textVivid: "text-red-600",    textDark: "text-red-700" },
  blue:   { bg: "bg-blue-600",   bgDark: "bg-blue-900",   btn3d: "btn-3d--blue",   text: "text-blue-400",   textVivid: "text-blue-600",   textDark: "text-blue-700" },
  green:  { bg: "bg-green-600",  bgDark: "bg-green-900",  btn3d: "btn-3d--green-badge", text: "text-green-400", textVivid: "text-green-600", textDark: "text-green-700" },
  amber:  { bg: "bg-amber-500",  bgDark: "bg-amber-800",  btn3d: "btn-3d--amber",  text: "text-amber-400",  textVivid: "text-amber-500",  textDark: "text-amber-700" },
  violet: { bg: "bg-violet-600", bgDark: "bg-violet-900", btn3d: "btn-3d--violet", text: "text-violet-400", textVivid: "text-violet-600", textDark: "text-violet-700" },
  cyan:   { bg: "bg-cyan-600",   bgDark: "bg-cyan-900",   btn3d: "btn-3d--cyan",   text: "text-cyan-400",   textVivid: "text-cyan-600",   textDark: "text-cyan-700" },
  orange: { bg: "bg-orange-500", bgDark: "bg-orange-900", btn3d: "btn-3d--orange", text: "text-orange-400", textVivid: "text-orange-500", textDark: "text-orange-700" },
  pink:   { bg: "bg-pink-600",   bgDark: "bg-pink-900",   btn3d: "btn-3d--pink",   text: "text-pink-400",   textVivid: "text-pink-600",   textDark: "text-pink-700" },
  indigo: { bg: "bg-indigo-600", bgDark: "bg-indigo-900", btn3d: "btn-3d--indigo", text: "text-indigo-400", textVivid: "text-indigo-600", textDark: "text-indigo-700" },
  lime:   { bg: "bg-lime-600",   bgDark: "bg-lime-900",   btn3d: "btn-3d--lime",   text: "text-lime-400",   textVivid: "text-lime-600",   textDark: "text-lime-700" },
  teal:    { bg: "bg-teal-600",    bgDark: "bg-teal-900",    btn3d: "btn-3d--teal",    text: "text-teal-400",    textVivid: "text-teal-600",    textDark: "text-teal-700" },
  rose:    { bg: "bg-rose-600",    bgDark: "bg-rose-900",    btn3d: "btn-3d--rose",    text: "text-rose-400",    textVivid: "text-rose-600",    textDark: "text-rose-700" },
  fuchsia: { bg: "bg-fuchsia-600", bgDark: "bg-fuchsia-900", btn3d: "btn-3d--fuchsia", text: "text-fuchsia-400", textVivid: "text-fuchsia-600", textDark: "text-fuchsia-700" },
  sky:     { bg: "bg-sky-600",     bgDark: "bg-sky-900",     btn3d: "btn-3d--sky",     text: "text-sky-400",     textVivid: "text-sky-600",     textDark: "text-sky-700" },
  emerald: { bg: "bg-emerald-600", bgDark: "bg-emerald-900", btn3d: "btn-3d--emerald", text: "text-emerald-400", textVivid: "text-emerald-600", textDark: "text-emerald-700" },
  yellow:  { bg: "bg-yellow-500",  bgDark: "bg-yellow-800",  btn3d: "btn-3d--yellow",  text: "text-yellow-400",  textVivid: "text-yellow-500",  textDark: "text-yellow-700" },
  slate:   { bg: "bg-slate-500",   bgDark: "bg-slate-800",   btn3d: "btn-3d--slate",   text: "text-slate-400",   textVivid: "text-slate-500",   textDark: "text-slate-700" },
  stone:   { bg: "bg-stone-500",   bgDark: "bg-stone-800",   btn3d: "btn-3d--stone",   text: "text-stone-400",   textVivid: "text-stone-500",   textDark: "text-stone-700" },
  purple2: { bg: "bg-purple-500",  bgDark: "bg-purple-800",  btn3d: "btn-3d--purple-dark", text: "text-purple-400", textVivid: "text-purple-500", textDark: "text-purple-700" },
  red2:    { bg: "bg-red-500",     bgDark: "bg-red-800",     btn3d: "btn-3d--red2",    text: "text-red-300",     textVivid: "text-red-500",     textDark: "text-red-600" },
};
