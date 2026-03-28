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

/** Índice a partir do qual usamos representação por letras. */
const LETTER_TIER_START = 12;

/**
 * Faixas de letras progressivas: AA→ZZ (26²), AAA→ZZZ (26³), AAAA→ZZZZ (26⁴), AAAAA→ZZZZZ (26⁵).
 * Cada faixa tem count sufixos; offset acumula o total das faixas anteriores.
 */
const LETTER_BANDS = [
  { len: 2, count: 26 ** 2, offset: 0 },
  { len: 3, count: 26 ** 3, offset: 26 ** 2 },
  { len: 4, count: 26 ** 4, offset: 26 ** 2 + 26 ** 3 },
  { len: 5, count: 26 ** 5, offset: 26 ** 2 + 26 ** 3 + 26 ** 4 },
];

const LETTER_TIER_COUNT = LETTER_BANDS.reduce((s, b) => s + b.count, 0);
const MAX_LETTER_EXP = 33 + 3 * (LETTER_TIER_START + LETTER_TIER_COUNT);

/**
 * Converte índice global em sufixo de letras progressivo:
 * 0→AA, 675→ZZ, 676→AAA, …, até ZZZZZ.
 */
function letterCodeFromIndex(index: number): string {
  const i = Math.max(0, Math.min(index, LETTER_TIER_COUNT - 1));
  let band = LETTER_BANDS[0];
  for (const b of LETTER_BANDS) {
    if (i < b.offset + b.count) { band = b; break; }
  }
  const localIndex = i - band.offset;
  let code = "";
  let remainder = localIndex;
  for (let d = 0; d < band.len; d++) {
    code = String.fromCharCode(65 + (remainder % 26)) + code;
    remainder = Math.floor(remainder / 26);
  }
  return code;
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
 * Ex.: 45s → "45s", 64s → "1m 4s", 3661s → "1h 1m", 400d → "1.1 anos"
 * Para valores enormes (trilhões de anos+), usa formatNumber.
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0s";
  if (seconds < 1) {
    const rounded = parseFloat(seconds.toPrecision(2));
    return `${rounded}s`;
  }
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
  const SECONDS_PER_YEAR = 365.25 * 24 * 3600;
  if (d < 365) {
    const daysStr = d === 1 ? "1 dia" : `${d} dias`;
    return hRem > 0 ? `${daysStr} ${hRem}h` : daysStr;
  }
  const years = seconds / SECONDS_PER_YEAR;
  if (years < 1000) {
    return years < 10
      ? `${years.toFixed(1)} anos`
      : `${Math.floor(years)} anos`;
  }
  const decYears = Decimal.fromNumber(years);
  return `${formatNumber(decYears)} anos`;
}
