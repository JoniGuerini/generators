import { useEffect } from "react";
import {
  playClickDown,
  playClickUp,
  setSfxEnabled,
  setSfxVolume,
} from "@/utils/sound";
import { setAppLocale } from "@/locale";
import type { Locale } from "@/locale";

interface SoundOptions {
  sfxEnabled: boolean;
  sfxVolume: number;
  locale: string;
}

export function useButtonSounds(options: SoundOptions) {
  useEffect(() => {
    setSfxEnabled(options.sfxEnabled);
    setSfxVolume(options.sfxVolume);
    setAppLocale(options.locale as Locale);
  }, [options.sfxEnabled, options.sfxVolume, options.locale]);

  useEffect(() => {
    function isButtonEnabled(target: HTMLElement): boolean {
      const btn = target.closest("button");
      return btn != null && !btn.disabled;
    }
    function onPointerDown(e: PointerEvent) {
      if (isButtonEnabled(e.target as HTMLElement)) playClickDown();
    }
    function onPointerUp(e: PointerEvent) {
      if (isButtonEnabled(e.target as HTMLElement)) playClickUp();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, []);
}
