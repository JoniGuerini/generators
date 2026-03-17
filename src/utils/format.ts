import Decimal from "break_eternity.js";

/** Sufixos padrão até decilhão (Dc). */
const SUFFIXES_UP_TO_DC = [
  "",
  "k",
  "M",
  "B",
  "T",
  "Qa",
  "Qi",
  "Sx",
  "Sp",
  "Oc",
  "No",
  "Dc",
];

/** Índice a partir do qual usamos representação por letras (AAAAA, AAAAB, …). */
const LETTER_TIER_START = 12;

/** Quantidade de sufixos por letras: 26^5 = AAAAA até ZZZZZ. */
const LETTER_TIER_COUNT = 26 ** 5;

/** Expoente (log10) máximo para 999 ZZZZZ; acima disso usamos formatação da break_eternity. */
const MAX_LETTER_EXP = 33 + 3 * (LETTER_TIER_START + LETTER_TIER_COUNT);

/**
 * Converte índice da faixa (0 = AAAAA, 1 = AAAAB, …, 26^5-1 = ZZZZZ) em string de 5 letras.
 * Ordem: unidade (d0) à direita, varia primeiro; então d1, d2, d3, d4 da esquerda para direita.
 */
function letterCodeFromIndex(index: number): string {
  const i = Math.max(0, Math.min(index, LETTER_TIER_COUNT - 1));
  const d0 = i % 26;
  const d1 = Math.floor(i / 26) % 26;
  const d2 = Math.floor(i / 26 ** 2) % 26;
  const d3 = Math.floor(i / 26 ** 3) % 26;
  const d4 = Math.floor(i / 26 ** 4) % 26;
  return (
    String.fromCharCode(65 + d4) +
    String.fromCharCode(65 + d3) +
    String.fromCharCode(65 + d2) +
    String.fromCharCode(65 + d1) +
    String.fromCharCode(65 + d0)
  );
}

/**
 * Formata um Decimal:
 * - Até decilhão (Dc): estilo 1, 10, 100, 1 k, … 999 Dc.
 * - Depois: 1 AAAAA … 999 AAAAA, 1 AAAAB … 999 AAAAB, … até 999 ZZZZZ.
 * - Acima de 999 ZZZZZ: formatação padrão da biblioteca break_eternity (ex.: 1.5e50).
 */
export function formatNumber(value: Decimal): string {
  if (value.lt(Decimal.dZero)) {
    return "- " + formatNumber(Decimal.neg(value));
  }
  if (value.lt(Decimal.fromNumber(1000))) {
    // Usa round em vez de floor para evitar 399.999... virar 399
    const n = Math.round(value.toNumber());
    return String(n);
  }

  const log10 = value.log10();
  const expNum = log10.toNumber();
  if (!Number.isFinite(expNum) || expNum > MAX_LETTER_EXP) {
    return value.toString();
  }

  const suffixIndex = Math.floor(expNum / 3);
  const scale = Decimal.pow(Decimal.fromNumber(10), Decimal.fromNumber(suffixIndex * 3));
  const scaled = value.div(scale);
  const num = scaled.toNumber();

  let digits: string;
  if (num >= 100) digits = Math.floor(num).toString();
  else if (num >= 10) digits = num.toFixed(1).replace(/\.0$/, "");
  else if (num >= 1) digits = num.toFixed(2).replace(/\.?0+$/, "");
  else digits = num.toFixed(2);

  let suffix: string;
  if (suffixIndex < LETTER_TIER_START) {
    suffix = SUFFIXES_UP_TO_DC[suffixIndex] ?? "";
  } else {
    const letterIndex = suffixIndex - LETTER_TIER_START;
    suffix = letterCodeFromIndex(letterIndex);
  }

  return suffix ? `${digits} ${suffix}` : digits;
}

/**
 * Formata duração em segundos usando no máximo 2 unidades (as duas maiores).
 * Ex.: 45s → "45s", 64s → "1m 4s", 125s → "2m 5s", 3661s → "1h 1m", 12d+ → "12 days 3h"
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0s";
  const s = Math.floor(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const secRem = s % 60;
  if (m < 60) return secRem > 0 ? `${m}m ${secRem}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const minRem = m % 60;
  if (h < 24) {
    return minRem > 0 ? `${h}h ${minRem}m` : `${h}h`;
  }
  const d = Math.floor(h / 24);
  const hRem = h % 24;
  const daysStr = d === 1 ? "1 day" : `${d} days`;
  return hRem > 0 ? `${daysStr} ${hRem}h` : daysStr;
}
