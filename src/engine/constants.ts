import Decimal from "break_eternity.js";

export const GENERATOR_IDS = [
  "generator1",
  "generator2",
  "generator3",
  "generator4",
  "generator5",
  "generator6",
  "generator7",
  "generator8",
  "generator9",
  "generator10",
] as const;
export type GeneratorId = (typeof GENERATOR_IDS)[number];

export interface GeneratorDef {
  id: GeneratorId;
  name: string;
  cycleTimeSeconds: number;
  productionPerCycle: Decimal;
  cost: Decimal;
  /** id do gerador produzido ("base" = recurso base) */
  produces: GeneratorId | "base";
  /** Custo em unidades do gerador anterior (0 para Gerador 1). */
  costPreviousGenerator: Decimal;
}

export const GENERATOR_DEFS: Record<GeneratorId, GeneratorDef> = {
  generator1: {
    id: "generator1",
    name: "Gerador 1",
    cycleTimeSeconds: 2,
    productionPerCycle: Decimal.fromNumber(3),
    cost: Decimal.fromNumber(10),
    produces: "base",
    costPreviousGenerator: Decimal.dZero,
  },
  generator2: {
    id: "generator2",
    name: "Gerador 2",
    cycleTimeSeconds: 4,
    productionPerCycle: Decimal.fromNumber(4),
    cost: Decimal.fromNumber(100),
    produces: "generator1",
    costPreviousGenerator: Decimal.fromNumber(10),
  },
  generator3: {
    id: "generator3",
    name: "Gerador 3",
    cycleTimeSeconds: 8,
    productionPerCycle: Decimal.fromNumber(5),
    cost: Decimal.fromNumber(10000),
    produces: "generator2",
    costPreviousGenerator: Decimal.fromNumber(50),
  },
  generator4: {
    id: "generator4",
    name: "Gerador 4",
    cycleTimeSeconds: 16,
    productionPerCycle: Decimal.fromNumber(6),
    cost: Decimal.fromNumber(10000000),
    produces: "generator3",
    costPreviousGenerator: Decimal.fromNumber(100),
  },
  generator5: {
    id: "generator5",
    name: "Gerador 5",
    cycleTimeSeconds: 32,
    productionPerCycle: Decimal.fromNumber(7),
    cost: Decimal.fromNumber(100000000000),
    produces: "generator4",
    costPreviousGenerator: Decimal.fromNumber(1000),
  },
  generator6: {
    id: "generator6",
    name: "Gerador 6",
    cycleTimeSeconds: 64,
    productionPerCycle: Decimal.fromNumber(8),
    cost: Decimal.pow(10, 16),
    produces: "generator5",
    costPreviousGenerator: Decimal.fromNumber(100000),
  },
  generator7: {
    id: "generator7",
    name: "Gerador 7",
    cycleTimeSeconds: 128,
    productionPerCycle: Decimal.fromNumber(9),
    cost: Decimal.pow(10, 22),
    produces: "generator6",
    costPreviousGenerator: Decimal.pow(10, 6),
  },
  generator8: {
    id: "generator8",
    name: "Gerador 8",
    cycleTimeSeconds: 256,
    productionPerCycle: Decimal.fromNumber(10),
    cost: Decimal.pow(10, 29),
    produces: "generator7",
    costPreviousGenerator: Decimal.pow(10, 7),
  },
  generator9: {
    id: "generator9",
    name: "Gerador 9",
    cycleTimeSeconds: 512,
    productionPerCycle: Decimal.fromNumber(11),
    cost: Decimal.pow(10, 37),
    produces: "generator8",
    costPreviousGenerator: Decimal.pow(10, 8),
  },
  generator10: {
    id: "generator10",
    name: "Gerador 10",
    cycleTimeSeconds: 1024,
    productionPerCycle: Decimal.fromNumber(12),
    cost: Decimal.pow(10, 46),
    produces: "generator9",
    costPreviousGenerator: Decimal.pow(10, 9),
  },
};
