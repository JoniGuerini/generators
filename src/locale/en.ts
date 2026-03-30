import type { Translations } from "./pt-BR";

export const en: Translations = {
  header: {
    resource: "Resource",
    resourceTooltip: "Base Resource",
    tickets: "Tickets",
    ticketsTooltip: "Purchase Currency",
    upgrades: "Upgrades",
    upgradesTooltip: "Milestone Currency",
    fps: "FPS",
    fpsTooltip: "Frames per second",
  },
  footer: {
    upgrades: "Upgrades",
    missions: "Missions",
    back: "Back",
  },
  settings: {
    menu: "Menu",
    general: "General",
    sounds: "Sounds",
    game: "Game",
    language: "Language",
    showFps: "Show FPS",
    showFpsDesc: "Display frames-per-second counter",
    documentation: "Documentation",
    documentationDesc: "Game rules and mechanics",
    resetSettings: "Reset Settings",
    resetSettingsDesc: "Restore all options to default",
    sfxEnabled: "Sound Effects",
    sfxEnabledDesc: "Play sounds on button clicks",
    volume: "Volume",
    style: "Style",
    resetGame: "Reset Game",
    resetGameDesc: "Erase all progress and start over",
    resetConfirmText: "Are you sure? All progress will be lost.",
    confirm: "Confirm",
    cancel: "Cancel",
  },
  sound: {
    soft: "Soft",
    mechanical: "Mechanical",
  },
  buyMode: {
    ariaLabel: "Amount to buy per click",
    marco: "Milestone",
    proximo: "Next",
  },
  generator: {
    lockedTitle: "Locked generator — buy to unlock",
    buyToUnlock: "Buy to unlock",
    resource: "Resource",
    tickets: "Tickets",
    generator: "Generator",
    buy: "Buy",
    ready: "✓ Ready",
    holdToBuy: "Click or hold to buy in bulk",
    currentQty: "Current quantity",
    nextMilestone: "Next milestone",
    claimMilestones: (count: number, coins: string) =>
      `Click to claim ${count} milestone${count !== 1 ? "s" : ""} (◆ ${coins})`,
    buyGeneratorAria: "Buy generator",
    buyUnlockAria: "Buy generator to unlock",
  },
  generatorList: {
    claimAll: (points: string) => `Claim ${points} milestone points`,
    noPending: "No pending milestones",
  },
  offline: {
    title: "Welcome back!",
    awayFor: "You were away for",
    offlineGains: "Resources earned offline",
    resource: "Resource",
    tickets: "Tickets",
    pendingUpgrades: "Pending upgrades",
    claimAndContinue: "Claim and continue",
    continue: "Continue",
  },
  missions: {
    title: "Mission",
    reward: "Reward",
    claim: "Claim",
    resource: "Resource",
    rank: "Rank",
    rankMax: "Max",
    rankUp: "Rank Up!",
    completed: "Mission Complete!",
    cardsReward: "Upgrade Cards",
    pageTitle: "All Missions",
    allCompleted: "All missions for this rank have been completed!",
    generatorCount: (count: string) =>
      `Have ${count}`,
    milestoneCurrencyTotal: (count: string) =>
      `Collect ${count} ◆ Upgrades`,
    milestoneCurrencyCollect: (count: string) => `Collect ${count}`,
    milestoneCurrencySuffix: "Upgrades",
    baseResourceTotal: (amount: string) =>
      `Accumulate ${amount} ● Resource`,
    baseResourceAccumulate: (amount: string) => `Accumulate ${amount}`,
    baseResourceSuffix: "Resource",
  },
  cards: {
    cycleSpeed: "Cycle Time",
    production: "Production",
    critChance: "Crit Chance",
    critMultiplier: "Crit Efficiency",
    ticketMultiplier: "Multiply Tickets",
    generatorCostHalf: "Cost ÷2",
    milestoneDoubler: "Double ◆",
    generator: "Generator",
    common: "Common",
    uncommon: "Uncommon",
    rare: "Rare",
    needed: "needed",
  },
  upgradesPage: {
    generators: "Generators",
    tickets: "Tickets",
    maxed: "Max.",
    rank: "rank",
    ticketsPerSecond: "Tickets per second",
    doubleProduction: "Double production",
    tradeForTickets: "Trade resource for +1 ▲/s",
    tradesDone: "trades done",
    halfCostAll: "Cost ÷2 (all generators)",
    doubleMilestoneReward: "Double ◆ per milestone",
    perGenerator: "Per generator",
    cycleTime: "Cycle time",
    productionPerCycle: "Production per cycle",
    critChance: "Crit chance",
    critEfficiency: "Crit efficiency",
    holdToBuy: "hold to buy in bulk",
  },
  docs: {
    title: "Game Documentation",
    tabBasics: "Basics",
    tabCurrencies: "Currencies",
    tabGenerators: "Generators",
    tabUpgrades: "Upgrades",
    tabCards: "Cards",
    basicsTitle: "The Basics",
    basicsText:
      'The main goal is to accumulate <strong>Base Resource (●)</strong> through Generators. Progress is infinite, based on buying increasingly powerful generators, measured by the ability to reach unimaginable numbers (using <code class="rounded bg-zinc-700 px-1 text-sm text-pink-400">break_eternity.js</code> to handle absurdly large numbers).',
    currenciesTitle: "Currencies",
    baseResourceTitle: "● Base Resource",
    baseResourceDesc:
      "The main resource of the game. Used to buy your <strong>Generator 1</strong> and to perform trades.",
    baseResourceHow: "<strong>How to Obtain:</strong> Generated exclusively by <strong>Generator 1</strong>.",
    baseResourceInit: "<strong>Starting Value:</strong> Starts with 10 at the beginning.",
    ticketsTitle: "▲ Purchase Currency (Tickets)",
    ticketsDesc:
      "Used exclusively as a time-cost to buy Generators. Every generator costs 1 Ticket per unit, acting as a limiter on how fast you can grow.",
    ticketsHow:
      "<strong>How to Obtain:</strong> Once you own at least 1 generator, you start generating 1 Ticket per second.",
    ticketsIncrease:
      '<strong>Increasing Gain:</strong> Can be increased via the "Increase production (+1/s)" or "Double Tickets generated (x2)" upgrades, and through Base Resource trades.',
    ticketsOffline:
      "<strong>Offline Systems:</strong> This currency is also passively generated while you are offline!",
    milestonesTitle: "◆ Milestone Currency (Upgrades)",
    milestonesDesc:
      'Premium currency used to buy Upgrades in the "Upgrades" menu. Used to reduce cycle times, increase global production, or reduce costs.',
    milestonesHow:
      "<strong>How to Obtain:</strong> Exclusively through collecting <strong>Milestones</strong> from generators.",
    milestonesReward:
      'Claim reward: When reaching factors of <code class="text-pink-300">10^x</code> of a generator (10, 100, 1,000, 10,000, etc.), the milestone becomes available. The currency earned scales with Generator Number and Milestone Level.',
    milestonesExample:
      "E.g.: Milestone level 3 of Generator 5 yields (Generator Number: 5) + (Milestone Level: 3) - 1 = 7 ◆ Coins.",
    generatorsTitle: "Generators",
    generatorsIntro:
      "There are 20 Generator Tiers. Each Generator (except Generator 1) feeds the generator before it. This exponential chain creates the logarithmic growth of the game.",
    gen1: "<strong>Generator 1:</strong> The only one that produces <strong>Base Resource (●)</strong>. Costs 10 Base Resource (and 1 Ticket ▲). Produces 3 Base Resource every 2 seconds.",
    gen2to20:
      '<strong>Generator 2 to 20:</strong> Produce units of Generator <strong>X-1</strong> directly. For example: Generator 2 produces "Generator 1s". Generator 20 produces "Generator 19s".',
    cycleTime:
      "<strong>Cycle Time:</strong> Each new Generator Tier takes DOUBLE the time of the previous one to complete its cycle. (Gen 1 = 2s, Gen 2 = 4s, Gen 3 = 8s... Gen 20 = 12 days!). This can be reduced to a minimum of 0.1s with upgrades.",
    cascadeCost:
      "<strong>Cascade Cost:</strong> To buy a Generator, you pay 1 Ticket ▲, a Base Resource (●) amount, AND a cost in Previous Generator units.",
    cascadeCostExample:
      "E.g.: Generator 3 requires 10,000 (●), 50 Generator 2s, and 1 Ticket ▲. This forces you to wait for generators to multiply before advancing!",
    upgradesTitle: "Upgrades",
    upgradesIntro:
      'The "Upgrades" screen uses Milestone Currency (◆) to greatly accelerate your progression. Options include:',
    upgCycleTitle: "Reduce Cycle Time",
    upgCycleDesc:
      "Per-generator. Cuts cycle time in half (÷2). Cost doubles each level (1, 2, 4, 8...). Minimum cycle time is 0.1s.",
    upgProdTitle: "Double Production",
    upgProdDesc:
      "Per-generator. Doubles output per cycle (x2). Cost doubles each level (1, 2, 4, 8...). Infinite levels.",
    upgTicketRateTitle: "Ticket Rate (+1/s)",
    upgTicketRateDesc:
      "Global. Adds +1 to base Ticket ▲ generation per second. Cost in ◆: 1, 2, 4, 8… (doubles each rank). Infinite levels.",
    upgTicketMultTitle: "Multiply Tickets (x2)",
    upgTicketMultDesc:
      "Global. Doubles all Ticket ▲ per second generation. Cost in ◆: 1, 4, 16, 64… (quadruples each rank). Infinite levels.",
    upgHalfCostTitle: "Half All Costs",
    upgHalfCostDesc:
      "Global. Halves the Base Resource cost AND the Previous Generator cost (÷2). Costs (50 * 2^level). Especially powerful for reaching Gen 15-20.",
    upgTradeTitle: "Trade Base for Tickets",
    upgTradeDesc:
      "Global. Does not consume ◆. You sacrifice Base Resource (●) for a permanent +1 Ticket ▲/s passive gain. Price scales dramatically (500, 5k, 5M, 5B, 5T...).",
    offlineTitle: "Offline Simulation",
    offlineText:
      "The game calculates your progress while the tab was closed. Since higher generators create lower generators (which in turn generate base resource), the offline math uses the same formulas in a loop to create a hyper-realistic prediction of what you would have generated during your time away.",
    cardsIntro:
      "To buy upgrades, in addition to spending <strong>◆ Milestone Currency</strong>, you need specific <strong>Cards</strong> for that upgrade. Cards are obtained as rewards from completing missions.",
    cardsHowTitle: "How to Get Cards",
    cardsHowDesc:
      "Each completed mission grants <strong>2 to 4 random cards</strong>. Cards are only drawn for <strong>generators you have already unlocked</strong> (purchased at least 1 unit). Global cards (Cost ÷2, Double ◆, Multiply Tickets) can appear regardless.",
    cardsNeededTitle: "Cards Needed per Rank",
    cardsNeededDesc:
      "The number of cards needed to rank up an upgrade grows progressively:",
    cardsTableRank: "Rank",
    cardsTableNeeded: "Cards Needed",
    cardsRarityTitle: "Rarities",
    cardsRarityDesc:
      "Each card has a rarity that determines its drop probability:",
    cardsTableRarity: "Rarity",
    cardsTableChance: "Chance",
    cardsTableTypes: "Types",
    cardsCommon: "Common",
    cardsCommonTypes: "Cycle Time, Production",
    cardsUncommon: "Uncommon",
    cardsUncommonTypes: "Crit Chance",
    cardsRare: "Rare",
    cardsRareTypes: "Crit Efficiency, Cost ÷2, Double ◆, Multiply Tickets",
    cardsRulesTitle: "Important Rules",
    cardsRule1: "Each card is specific: a Cycle Time card for Generator 1 only works for that exact upgrade.",
    cardsRule2: "Missions only grant cards for generators the player has already unlocked.",
    cardsRule3: "Cards are consumed when purchasing the upgrade.",
  },
} as const;
