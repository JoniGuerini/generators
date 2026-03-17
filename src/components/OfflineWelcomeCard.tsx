import Decimal from "break_eternity.js";
import type { OfflineGains } from "@/engine/offlineProgress";
import { formatNumber, formatTime } from "@/utils/format";

interface OfflineWelcomeCardProps {
  gains: OfflineGains;
  onClose: () => void;
}

function hasAnyGain(gains: OfflineGains): boolean {
  if (gains.baseResource.gt(Decimal.dZero)) return true;
  if (gains.ticketCurrency.gt(Decimal.dZero)) return true;
  return false;
}

export function OfflineWelcomeCard({ gains, onClose }: OfflineWelcomeCardProps) {
  const showCard = hasAnyGain(gains);
  const offlineSeconds = gains.offlineTimeMs / 1000;

  if (!showCard) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="offline-welcome-title"
    >
      <div className="w-full max-w-md rounded-xl border border-zinc-600 bg-gradient-to-b from-zinc-800 to-zinc-900 shadow-2xl">
        <div className="border-b border-zinc-700 px-5 py-4">
          <h2
            id="offline-welcome-title"
            className="text-xl font-bold text-white"
          >
            Bem-vindo de volta!
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Você esteve ausente por{" "}
            <span className="font-medium text-zinc-200">
              {formatTime(offlineSeconds)}
            </span>
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="mb-3 text-sm font-medium text-zinc-400">
            Recursos gerados enquanto você estava offline:
          </p>
          <ul className="space-y-2">
            {gains.baseResource.gt(Decimal.dZero) && (
              <li className="flex items-center justify-between rounded-lg bg-zinc-700/60 px-3 py-2">
                <span className="text-zinc-300">
                  <span className="text-cyan-400" aria-hidden>●</span> Recurso base
                </span>
                <span className="font-mono font-semibold tabular-nums text-cyan-400">
                  +{formatNumber(gains.baseResource)}
                </span>
              </li>
            )}
            {gains.ticketCurrency.gt(Decimal.dZero) && (
              <li className="flex items-center justify-between rounded-lg bg-zinc-700/60 px-3 py-2">
                <span className="text-zinc-300">
                  <span className="text-amber-400" aria-hidden>▲</span> Tickets
                </span>
                <span className="font-mono font-semibold tabular-nums text-amber-400">
                  +{formatNumber(gains.ticketCurrency)}
                </span>
              </li>
            )}
          </ul>
        </div>
        <div className="border-t border-zinc-700 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-zinc-600 px-4 py-2.5 font-semibold text-white transition hover:bg-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-800"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
