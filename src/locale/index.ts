import { useSyncExternalStore } from "react";
import { ptBR, type Translations } from "./pt-BR";
import { en } from "./en";

export type Locale = "pt-BR" | "en";

const LOCALES: Record<Locale, Translations> = {
  "pt-BR": ptBR,
  en,
};

export const LOCALE_OPTIONS: { value: string; label: string }[] = [
  { value: "pt-BR", label: "Português (BR)" },
  { value: "en", label: "English" },
];

let currentLocale: Locale = "pt-BR";
let currentT: Translations = ptBR;
const listeners = new Set<() => void>();

export function setAppLocale(locale: Locale) {
  if (locale === currentLocale) return;
  if (!(locale in LOCALES)) return;
  currentLocale = locale;
  currentT = LOCALES[locale];
  for (const listener of listeners) listener();
}

export function getAppLocale(): Locale {
  return currentLocale;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Translations {
  return currentT;
}

export function useT(): Translations {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function t(): Translations {
  return currentT;
}

export type { Translations };
