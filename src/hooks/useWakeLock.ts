import { useEffect } from "react";

/**
 * Mantém a tela ligada (evita modo descanso) enquanto a aba/janela do jogo estiver visível.
 * Usa a Screen Wake Lock API (comportamento similar a players de vídeo).
 */
export function useWakeLock() {
  useEffect(() => {
    const nav = typeof navigator !== "undefined" ? navigator : null;
    const hasWakeLock = nav && "wakeLock" in nav && typeof (nav as Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> } }).wakeLock?.request === "function";
    if (!hasWakeLock) return;

    let sentinel: WakeLockSentinel | null = null;

    async function requestLock() {
      if (document.visibilityState !== "visible") return;
      try {
        sentinel = await (nav as Navigator & { wakeLock: { request: (type: "screen") => Promise<WakeLockSentinel> } }).wakeLock.request("screen");
        sentinel.addEventListener("release", () => {
          sentinel = null;
        });
      } catch {
        // Ignora: API não suportada, usuário negou ou contexto inválido
      }
    }

    function releaseLock() {
      if (sentinel) {
        sentinel.release().catch(() => {});
        sentinel = null;
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        requestLock();
      } else {
        releaseLock();
      }
    }

    if (document.visibilityState === "visible") {
      requestLock();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      releaseLock();
    };
  }, []);
}
