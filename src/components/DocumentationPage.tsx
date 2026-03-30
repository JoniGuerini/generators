import { useState } from "react";
import { useT } from "@/locale";

type DocsTab = "basics" | "currencies" | "generators" | "upgrades";

function H({ html }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn-3d flex-1 rounded-lg px-4 py-2.5 text-sm font-medium ${
        active
          ? "btn-3d--violet bg-violet-600 text-white"
          : "btn-3d--zinc bg-zinc-700 text-zinc-400 hover:bg-zinc-600 hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="btn-3d--zinc rounded-lg bg-zinc-700 p-4">
      {children}
    </div>
  );
}

function BasicsTab() {
  const t = useT();
  return (
    <div className="space-y-4">
      <p><H html={t.docs.basicsText} /></p>
      <Card>
        <h3 className="mb-2 text-lg font-semibold text-indigo-300">{t.docs.offlineTitle}</h3>
        <p className="text-sm text-zinc-400">{t.docs.offlineText}</p>
      </Card>
    </div>
  );
}

function CurrenciesTab() {
  const t = useT();
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-2 text-lg font-semibold text-cyan-300">{t.docs.baseResourceTitle}</h3>
        <p className="mb-2"><H html={t.docs.baseResourceDesc} /></p>
        <ul className="list-inside list-disc space-y-1 pl-2 text-sm text-zinc-400">
          <li><H html={t.docs.baseResourceHow} /></li>
          <li><H html={t.docs.baseResourceInit} /></li>
        </ul>
      </Card>
      <Card>
        <h3 className="mb-2 text-lg font-semibold text-amber-300">{t.docs.ticketsTitle}</h3>
        <p className="mb-2"><H html={t.docs.ticketsDesc} /></p>
        <ul className="list-inside list-disc space-y-1 pl-2 text-sm text-zinc-400">
          <li><H html={t.docs.ticketsHow} /></li>
          <li><H html={t.docs.ticketsIncrease} /></li>
          <li><H html={t.docs.ticketsOffline} /></li>
        </ul>
      </Card>
      <Card>
        <h3 className="mb-2 text-lg font-semibold text-purple-300">{t.docs.milestonesTitle}</h3>
        <p className="mb-2"><H html={t.docs.milestonesDesc} /></p>
        <ul className="list-inside list-disc space-y-1 pl-2 text-sm text-zinc-400">
          <li><H html={t.docs.milestonesHow} /></li>
          <li>
            <H html={t.docs.milestonesReward} />
            <br />
            <span className="text-xs italic text-zinc-500">{t.docs.milestonesExample}</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}

function GeneratorsTab() {
  const t = useT();
  return (
    <div className="space-y-4">
      <p><H html={t.docs.generatorsIntro} /></p>
      <Card>
        <ul className="list-inside list-disc space-y-3 text-sm text-zinc-400">
          <li><H html={t.docs.gen1} /></li>
          <li><H html={t.docs.gen2to20} /></li>
          <li><H html={t.docs.cycleTime} /></li>
          <li>
            <H html={t.docs.cascadeCost} />
            <br />
            <span className="text-xs italic text-zinc-500">{t.docs.cascadeCostExample}</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}

function UpgradesTab() {
  const t = useT();
  return (
    <div className="space-y-4">
      <p><H html={t.docs.upgradesIntro} /></p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <h4 className="mb-1 font-bold text-zinc-200">{t.docs.upgCycleTitle}</h4>
          <p className="text-sm text-zinc-400">{t.docs.upgCycleDesc}</p>
        </Card>
        <Card>
          <h4 className="mb-1 font-bold text-zinc-200">{t.docs.upgProdTitle}</h4>
          <p className="text-sm text-zinc-400">{t.docs.upgProdDesc}</p>
        </Card>
        <Card>
          <h4 className="mb-1 font-bold text-zinc-200">{t.docs.upgTicketRateTitle}</h4>
          <p className="text-sm text-zinc-400">{t.docs.upgTicketRateDesc}</p>
        </Card>
        <Card>
          <h4 className="mb-1 font-bold text-zinc-200">{t.docs.upgTicketMultTitle}</h4>
          <p className="text-sm text-zinc-400">{t.docs.upgTicketMultDesc}</p>
        </Card>
        <div className="sm:col-span-2">
          <Card>
            <h4 className="mb-1 font-bold text-zinc-200">{t.docs.upgHalfCostTitle}</h4>
            <p className="text-sm text-zinc-400">{t.docs.upgHalfCostDesc}</p>
          </Card>
        </div>
        <div className="sm:col-span-2">
          <Card>
            <h4 className="mb-1 font-bold text-zinc-200">{t.docs.upgTradeTitle}</h4>
            <p className="text-sm text-zinc-400">{t.docs.upgTradeDesc}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function DocumentationPage() {
  const t = useT();
  const [tab, setTab] = useState<DocsTab>("basics");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pt-3 pb-2">
        <h1 className="mb-3 text-lg font-bold text-zinc-100">{t.docs.title}</h1>
        <div className="flex gap-2">
          <TabButton active={tab === "basics"} label={t.docs.tabBasics} onClick={() => setTab("basics")} />
          <TabButton active={tab === "currencies"} label={t.docs.tabCurrencies} onClick={() => setTab("currencies")} />
          <TabButton active={tab === "generators"} label={t.docs.tabGenerators} onClick={() => setTab("generators")} />
          <TabButton active={tab === "upgrades"} label={t.docs.tabUpgrades} onClick={() => setTab("upgrades")} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2 text-zinc-300">
        {tab === "basics" && <BasicsTab />}
        {tab === "currencies" && <CurrenciesTab />}
        {tab === "generators" && <GeneratorsTab />}
        {tab === "upgrades" && <UpgradesTab />}
      </div>
    </div>
  );
}
