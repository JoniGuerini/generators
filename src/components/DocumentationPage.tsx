import { useT } from "@/locale";

function H({ html }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function DocumentationPage() {
  const t = useT();

  return (
    <div className="mx-auto max-w-4xl p-6 text-zinc-300">
      <h1 className="mb-6 border-b border-zinc-700 pb-2 text-3xl font-bold text-zinc-100">
        {t.docs.title}
      </h1>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-amber-500">{t.docs.basicsTitle}</h2>
        <p className="mb-3">
          <H html={t.docs.basicsText} />
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-cyan-400">{t.docs.currenciesTitle}</h2>

        <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
          <h3 className="mb-2 text-xl font-semibold text-cyan-300">{t.docs.baseResourceTitle}</h3>
          <p className="mb-2"><H html={t.docs.baseResourceDesc} /></p>
          <ul className="list-inside list-disc space-y-1 pl-2 text-zinc-400">
            <li><H html={t.docs.baseResourceHow} /></li>
            <li><H html={t.docs.baseResourceInit} /></li>
          </ul>
        </div>

        <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
          <h3 className="mb-2 text-xl font-semibold text-amber-300">{t.docs.ticketsTitle}</h3>
          <p className="mb-2"><H html={t.docs.ticketsDesc} /></p>
          <ul className="list-inside list-disc space-y-1 pl-2 text-zinc-400">
            <li><H html={t.docs.ticketsHow} /></li>
            <li><H html={t.docs.ticketsIncrease} /></li>
            <li><H html={t.docs.ticketsOffline} /></li>
          </ul>
        </div>

        <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
          <h3 className="mb-2 text-xl font-semibold text-purple-300">{t.docs.milestonesTitle}</h3>
          <p className="mb-2"><H html={t.docs.milestonesDesc} /></p>
          <ul className="list-inside list-disc space-y-1 pl-2 text-zinc-400">
            <li><H html={t.docs.milestonesHow} /></li>
            <li>
              <H html={t.docs.milestonesReward} />
              <br />
              <span className="text-sm italic text-zinc-500">{t.docs.milestonesExample}</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-green-400">{t.docs.generatorsTitle}</h2>
        <p className="mb-3"><H html={t.docs.generatorsIntro} /></p>

        <ul className="mb-4 list-inside list-disc space-y-2 text-zinc-400">
          <li><H html={t.docs.gen1} /></li>
          <li><H html={t.docs.gen2to20} /></li>
          <li><H html={t.docs.cycleTime} /></li>
          <li>
            <H html={t.docs.cascadeCost} />
            <br />
            <span className="text-sm italic text-zinc-500">{t.docs.cascadeCostExample}</span>
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-pink-400">{t.docs.upgradesTitle}</h2>
        <p className="mb-3"><H html={t.docs.upgradesIntro} /></p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded border border-zinc-700 bg-zinc-800 p-3">
            <h4 className="font-bold text-zinc-200">{t.docs.upgCycleTitle}</h4>
            <p className="text-sm text-zinc-400">{t.docs.upgCycleDesc}</p>
          </div>
          <div className="rounded border border-zinc-700 bg-zinc-800 p-3">
            <h4 className="font-bold text-zinc-200">{t.docs.upgProdTitle}</h4>
            <p className="text-sm text-zinc-400">{t.docs.upgProdDesc}</p>
          </div>
          <div className="rounded border border-zinc-700 bg-zinc-800 p-3">
            <h4 className="font-bold text-zinc-200">{t.docs.upgTicketRateTitle}</h4>
            <p className="text-sm text-zinc-400">{t.docs.upgTicketRateDesc}</p>
          </div>
          <div className="rounded border border-zinc-700 bg-zinc-800 p-3">
            <h4 className="font-bold text-zinc-200">{t.docs.upgTicketMultTitle}</h4>
            <p className="text-sm text-zinc-400">{t.docs.upgTicketMultDesc}</p>
          </div>
          <div className="rounded border border-zinc-700 bg-zinc-800 p-3 md:col-span-2">
            <h4 className="font-bold text-zinc-200">{t.docs.upgHalfCostTitle}</h4>
            <p className="text-sm text-zinc-400">{t.docs.upgHalfCostDesc}</p>
          </div>
          <div className="rounded border border-zinc-700 bg-zinc-800 p-3 md:col-span-2">
            <h4 className="font-bold text-zinc-200">{t.docs.upgTradeTitle}</h4>
            <p className="text-sm text-zinc-400">{t.docs.upgTradeDesc}</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-indigo-400">{t.docs.offlineTitle}</h2>
        <p className="mb-3 text-zinc-400">{t.docs.offlineText}</p>
      </section>
    </div>
  );
}
