import { useEffect } from "react";
import {
  playClickDown,
  playClickUp,
  setSfxEnabled,
  setSfxVolume,
  setSfxStyle,
} from "@/utils/sound";
import { setAppLocale } from "@/locale";
import type { Locale } from "@/locale";

interface SoundOptions {
  sfxEnabled: boolean;
  sfxVolume: number;
  sfxStyle: string;
  locale: string;
}

export function useButtonSounds(options: SoundOptions) {
  useEffect(() => {
    setSfxEnabled(options.sfxEnabled);
    setSfxVolume(options.sfxVolume);
    setSfxStyle(options.sfxStyle);
    setAppLocale(options.locale as Locale);
  }, [options.sfxEnabled, options.sfxVolume, options.sfxStyle, options.locale]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("button")) playClickDown();
    }
    function onPointerUp(e: PointerEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("button")) playClickUp();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, []);
}
