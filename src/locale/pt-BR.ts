export const ptBR = {
  header: {
    resource: "Recurso",
    resourceTooltip: "Recurso Base",
    tickets: "Tickets",
    ticketsTooltip: "Moeda de Compra",
    upgrades: "Melhorias",
    upgradesTooltip: "Moeda de Marcos",
    fps: "FPS",
    fpsTooltip: "Frames por segundo",
  },
  footer: {
    upgrades: "Melhorias",
    missions: "Missões",
    back: "Voltar",
  },
  settings: {
    menu: "Menu",
    general: "Geral",
    sounds: "Sons",
    game: "Jogo",
    language: "Idioma",
    showFps: "Exibir FPS",
    showFpsDesc: "Mostra o contador de frames por segundo",
    documentation: "Documentação",
    documentationDesc: "Regras e mecânicas do jogo",
    resetSettings: "Resetar Configurações",
    resetSettingsDesc: "Restaura todas as opções para o padrão",
    sfxEnabled: "Efeitos Sonoros",
    sfxEnabledDesc: "Sons ao clicar botões",
    volume: "Volume",
    style: "Estilo",
    resetGame: "Resetar Jogo",
    resetGameDesc: "Apaga todo o progresso e recomeça do zero",
    resetConfirmText: "Tem certeza? Todo o progresso será perdido.",
    confirm: "Confirmar",
    cancel: "Cancelar",
  },
  sound: {
    soft: "Suave",
    mechanical: "Mecânico",
  },
  buyMode: {
    ariaLabel: "Quantidade a comprar por clique",
    marco: "Marco",
    proximo: "Próximo",
  },
  generator: {
    lockedTitle: "Gerador bloqueado — compre para desbloquear",
    clickToProduce: "Clique para produzir manualmente",
    buyToUnlock: "Compre para desbloquear",
    resource: "Recurso",
    tickets: "Tickets",
    generator: "Gerador",
    buy: "Comprar",
    ready: "✓ Pronto",
    holdToBuy: "Clique ou segure para comprar em série",
    currentQty: "Quantidade atual",
    nextMilestone: "Próximo marco",
    claimMilestones: (count: number, coins: string) =>
      `Clique para resgatar ${count} marco${count !== 1 ? "s" : ""} (◆ ${coins})`,
    buyGeneratorAria: "Comprar gerador",
    buyUnlockAria: "Comprar gerador para desbloquear",
  },
  generatorList: {
    claimAll: (points: string) => `Resgatar ${points} pontos de marcos`,
    noPending: "Nenhum marco pendente",
  },
  offline: {
    title: "Bem-vindo de volta!",
    awayFor: "Você esteve ausente por",
    offlineGains: "Recursos gerados offline",
    resource: "Recurso",
    tickets: "Tickets",
    pendingUpgrades: "Melhorias pendentes",
    claimAndContinue: "Resgatar e continuar",
    continue: "Continuar",
  },
  missions: {
    title: "Missão",
    reward: "Recompensa",
    claim: "Resgatar",
    resource: "Recurso",
    rank: "Ranque",
    rankMax: "Máx",
    rankUp: "Subir de Ranque!",
    completed: "Missão Completa!",
    cardsReward: "Cartas de Melhoria",
    pageTitle: "Todas as Missões",
    allCompleted: "Todas as missões deste ranque foram completadas!",
    generatorCount: (count: string) =>
      `Tenha ${count}`,
    milestoneCurrencyTotal: (count: string) =>
      `Colete ${count} ◆ de Melhorias`,
    milestoneCurrencyCollect: (count: string) => `Colete ${count}`,
    milestoneCurrencySuffix: "de Melhorias",
    baseResourceTotal: (amount: string) =>
      `Acumule ${amount} ● Recurso`,
    baseResourceAccumulate: (amount: string) => `Acumule ${amount}`,
    baseResourceSuffix: "Recurso",
  },
  cards: {
    cycleSpeed: "Tempo de Ciclo",
    production: "Produção",
    critChance: "Chance de Crítico",
    critMultiplier: "Eficiência de Crítico",
    ticketMultiplier: "Multiplicar Tickets",
    generatorCostHalf: "Custo ÷2",
    milestoneDoubler: "Dobrar ◆",
    generator: "Gerador",
    common: "Comum",
    uncommon: "Incomum",
    rare: "Rara",
    needed: "necessárias",
  },
  upgradesPage: {
    general: "Geral",
    generators: "Geradores",
    tickets: "Tickets",
    maxed: "Máx.",
    rank: "ranque",
    ticketsPerSecond: "Tickets por segundo",
    doubleProduction: "Dobrar produção",
    tradeForTickets: "Trocar recurso por +1 ▲/s",
    tradesDone: "trocas feitas",
    halfCostAll: "Custo ÷2 (todos os geradores)",
    doubleMilestoneReward: "Dobrar ◆ por marco",
    perGenerator: "Por gerador",
    cycleTime: "Tempo de ciclo",
    productionPerCycle: "Produção por ciclo",
    critChance: "Chance de crítico",
    critEfficiency: "Eficiência do crítico",
    holdToBuy: "segure para comprar em série",
  },
  docs: {
    title: "Documentação do Jogo",
    tabBasics: "Básico",
    tabCurrencies: "Moedas",
    tabGenerators: "Geradores",
    tabUpgrades: "Melhorias",
    tabCards: "Cartas",
    basicsTitle: "O Básico",
    basicsText:
      'O principal objetivo do jogo é acumular <strong>Recurso Base (●)</strong> através de Geradores. O progresso é infinito, baseado na compra de geradores cada vez mais poderosos, e é medido pela capacidade de alcançar valores inimagináveis (utilizando <code class="rounded bg-zinc-700 px-1 text-sm text-pink-400">break_eternity.js</code> para lidar com números absurdamente grandes).',
    currenciesTitle: "As Moedas",
    baseResourceTitle: "● Recurso Base",
    baseResourceDesc:
      "É o recurso principal do jogo. Usado para comprar o Seu <strong>Gerador 1</strong> e para realizar trocas (Trades).",
    baseResourceHow: "<strong>Como Obter:</strong> É gerado exclusivamente pelo <strong>Gerador 1</strong>.",
    baseResourceInit: "<strong>Valor Inicial:</strong> Começa com 10 no início da jornada.",
    ticketsTitle: "▲ Moeda de Compra (Tickets)",
    ticketsDesc:
      "Usada exclusivamente como limite/custo de tempo para comprar Geradores. Todo gerador consome 1 Ticket por unidade comprada, o que atua como um limitador da velocidade em que você pode acumular sua fábrica.",
    ticketsHow:
      "<strong>Como Obter:</strong> A partir do momento em que você possui pelo menos 1 gerador, você começa a gerar 1 Ticket por segundo.",
    ticketsIncrease:
      '<strong>Aumentando Ganho:</strong> O ganho pode ser aumentado através das melhorias "Aumentar produção (+1/s)" ou "Dobrar Tickets gerados (x2)", e através de Trocas com o Recurso Base.',
    ticketsOffline:
      "<strong>Sistemas Offlines:</strong> Essa moeda é gerada passivamente também enquanto você está offline!",
    milestonesTitle: "◆ Moeda de Marcos (Melhorias)",
    milestonesDesc:
      'Moeda premium usada para comprar as Melhorias (Upgrades) no menu "Melhorias". Utilizada para reduzir tempo de ciclos, aumentar produção global, ou reduzir os custos.',
    milestonesHow:
      "<strong>Como Obter:</strong> Exclusivamente através da coleta de <strong>Marcos (Milestones)</strong> nos geradores.",
    milestonesReward:
      'A recompensa de resgate: Ao atingir fatores de <code class="text-pink-300">10^x</code> de um gerador (10, 100, 1.000, 10.000, etc.), o marco fica disponível. A moeda ganha escala de acordo com o Número do Gerador e o Nível do Marco.',
    milestonesExample:
      "Ex: Marco nível 3 do Gerador 5 fornecerá (Número do Gerador: 5) + (Nível do Marco: 3) - 1 = 7 Moedas ◆.",
    generatorsTitle: "Os Geradores",
    generatorsIntro:
      "Existem 20 Tiers de Geradores. Cada Gerador (exceto o Gerador 1) existe para alimentar o gerador anterior a ele. Essa cadeia exponencial cria o crescimento logarítmico do jogo.",
    gen1: "<strong>Gerador 1:</strong> O único que produz o <strong>Recurso Base (●)</strong>. Custa 10 Recurso Base (e 1 Ticket ▲). Produz 3 Recurso Base a cada 2 segundos.",
    gen2to20:
      '<strong>Gerador 2 até o 20:</strong> Produzem as unidades do Gerador <strong>X-1</strong> diretamente. Por exemplo: O Gerador 2 produz "Geradores 1". O Gerador 20 produz "Geradores 19".',
    cycleTime:
      "<strong>Tempo de Ciclo:</strong> Cada novo Tier de Gerador leva o DOBRO de tempo do que o Gerador anterior para completar seu ciclo produtivo. (Gen 1 = 2s, Gen 2 = 4s, Gen 3 = 8s... Gen 20 = 12 dias!). Isso pode ser reduzido até um limite de 0.1s com upgrades.",
    cascadeCost:
      "<strong>Custo em Cascatas:</strong> Para comprar um Gerador, você paga 1 Ticket ▲, um valor em Recurso Base (●), E UM VALOR do seu Gerador Anterior.",
    cascadeCostExample:
      "Ex: Gerador 3 requer 10.000 (●), 50 Geradores 2, e 1 Ticket ▲. Isso força você a esperar os geradores procriarem antes de subir de Tier!",
    upgradesTitle: "Melhorias (Upgrades)",
    upgradesIntro:
      'A tela de "Melhorias" utiliza a Moeda de Marco (◆) para acelerar enormemente sua progressão. As opções incluem:',
    upgCycleTitle: "Reduzir Tempo de Ciclo",
    upgCycleDesc:
      "Exclusivo para cada gerador. Corta o tempo útil do ciclo pela Metade (÷2). O custo dobra a cada nível (1, 2, 4, 8...). O limite para todos é que não pode ser mais rápido do que 0.1s por ciclo.",
    upgProdTitle: "Dobrar Produção",
    upgProdDesc:
      "Exclusivo para cada gerador. Multiplica os lucros de unidades por ciclo (x2). O custo dobra a cada nível (1, 2, 4, 8...). Níveis Infinitos.",
    upgTicketRateTitle: "Ganho de Tickets (+1/s)",
    upgTicketRateDesc:
      "Melhoria Global. Adiciona +1 a geração base de Tickets ▲ por segundo. Custo em ◆: 1, 2, 4, 8… (dobra a cada ranque). Níveis infinitos.",
    upgTicketMultTitle: "Multiplicar Tickets (x2)",
    upgTicketMultDesc:
      "Melhoria Global. Dobra todo o ganho de Tickets ▲ por segundo. Custo em ◆: 1, 4, 16, 64… (quadruplica a cada ranque). Níveis infinitos.",
    upgHalfCostTitle: "Mitade dos Custos",
    upgHalfCostDesc:
      "Melhoria Global. Esmaga o preço total em Recurso Base E o custo em Unidades do pre-requisito (Gen anterior) pela metade (÷2). Custa (50 * 2^nivel). Especialmente poderoso para acessar Gen 15 ao 20 mais rapidamente.",
    upgTradeTitle: "Trocar Base por Tickets (Trades)",
    upgTradeDesc:
      "Melhoria Global. Esta opção não consome moedas ◆. Para liberar, você sacrifíca Recurso Base (●) em troca de um ganho permanente de +1 Ticket ▲/s na geração passiva. O preço cresce vertiginosamente a cada vez que é comprado (500, 5k, 5M, 5B, 5T...).",
    offlineTitle: "Simulação Offline",
    offlineText:
      "O jogo calcula o seu progresso enquanto a aba estava fechada. Como geradores superiores criam geradores inferiores (que por sua vez geram recurso base), a matemática offline de múltiplas camadas de geração utiliza as mesmas fórmulas em loop limitando ticks por intervalo para criar uma previsão hiper-realista do que você teria gerado nas horas que ficou fora, incluindo o bônus dos geradores recém-nascidos atuando no espaço temporal.",
    cardsIntro:
      "Para comprar melhorias, além de gastar <strong>◆ Moedas de Marco</strong>, você precisa de <strong>Cartas</strong> específicas daquela melhoria. Cartas são obtidas como recompensa ao completar missões.",
    cardsHowTitle: "Como Obter Cartas",
    cardsHowDesc:
      "Cada missão completada concede <strong>2 a 4 cartas aleatórias</strong>. As cartas sorteadas são apenas de <strong>geradores que você já desbloqueou</strong> (comprou pelo menos 1 unidade). Cartas globais (Custo ÷2, Dobrar ◆, Multiplicar Tickets) podem aparecer independentemente.",
    cardsNeededTitle: "Cartas Necessárias por Ranque",
    cardsNeededDesc:
      "A quantidade de cartas necessárias para subir de ranque em uma melhoria cresce progressivamente:",
    cardsTableRank: "Ranque",
    cardsTableNeeded: "Cartas Necessárias",
    cardsRarityTitle: "Raridades",
    cardsRarityDesc:
      "Cada carta possui uma raridade que determina a probabilidade de drop:",
    cardsTableRarity: "Raridade",
    cardsTableChance: "Chance",
    cardsTableTypes: "Tipos",
    cardsCommon: "Comum",
    cardsCommonTypes: "Tempo de Ciclo, Produção",
    cardsUncommon: "Incomum",
    cardsUncommonTypes: "Chance de Crítico",
    cardsRare: "Rara",
    cardsRareTypes: "Eficiência de Crítico, Custo ÷2, Dobrar ◆, Multiplicar Tickets",
    cardsRulesTitle: "Regras Importantes",
    cardsRule1: "Cada carta é específica: uma carta de Tempo de Ciclo do Gerador 1 só funciona para essa melhoria exata.",
    cardsRule2: "Missões só concedem cartas de geradores que o jogador já desbloqueou.",
    cardsRule3: "As cartas são consumidas ao comprar a melhoria.",
  },
};

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => R
    : T[K] extends object
      ? DeepStringify<T[K]>
      : string;
};

export type Translations = DeepStringify<typeof ptBR>;
