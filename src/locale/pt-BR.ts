export const ptBR = {
  header: {
    resource: "Recurso Total",
    resourceTooltip: "Soma de recursos de todas as linhas",
    tickets: "Tickets",
    ticketsTooltip: "Moeda de Compra",
    upgrades: "Melhorias",
    upgradesTooltip: "Moeda de Marcos",
    level: "Nível",
    levelTooltip: "Total de geradores em produção",
    fps: "FPS",
    fpsTooltip: "Frames por segundo",
  },
  footer: {
    upgrades: "Melhorias",
    trades: "Trocas",
    back: "Voltar",
  },
  tradesPage: {
    tradeAll: "Realizar todas as trocas",
    noTrades: "Nenhuma troca disponível",
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
    resetGame: "Resetar Jogo",
    resetGameDesc: "Apaga todo o progresso e recomeça do zero",
    resetConfirmText: "Tem certeza? Todo o progresso será perdido.",
    confirm: "Confirmar",
    cancel: "Cancelar",
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
  upgradesPage: {
    general: "Geral",
    generators: "Geradores",
    tickets: "Tickets",
    maxed: "Máx.",
    ticketsPerSecond: "Tickets por segundo",
    doubleProduction: "Dobrar produção",
    tradeForTickets: "Trocar recurso por +1 ▲/s",
    tradesDone: "trocas feitas",
    halfCostAll: "Custo ÷2 (todos os geradores)",
    doubleTradeValue: "Dobrar ▲/s por troca",
    perTrade: "por troca",
    doubleProductionGlobal: "Dobrar produção (todos os geradores)",
    doubleProductionLine: "Dobrar produção (linha)",
    doubleMilestoneReward: "Dobrar ◆ por marco",
    perGenerator: "Por gerador",
    cycleTime: "Tempo de ciclo",
    productionPerCycle: "Produção por ciclo",
    critChance: "Chance de crítico",
    critEfficiency: "Eficiência do crítico",
    holdToBuy: "segure para comprar em série",
    lineLockedShort: "bloq.",
    lineLockedDesc: "Desbloqueie esta linha para acessar as melhorias",
    genLockedDesc: "Desbloqueie este gerador para acessar as melhorias",
    tradeLineLockedDesc: "Desbloqueie esta linha para realizar trocas",
    requiresGen: (gen: number, line: number) => `Requer Gerador ${gen} da Linha ${line}`,
  },
  docs: {
    title: "Documentação do Jogo",
    tabBasics: "Básico",
    tabCurrencies: "Moedas",
    tabGenerators: "Geradores",
    tabUpgrades: "Melhorias",
    tabLines: "Linhas",
    basicsTitle: "O Básico",
    basicsText:
      'O jogo possui <strong>10 linhas de produção</strong>, cada uma com <strong>10 geradores</strong>, totalizando 100 geradores. Cada linha possui sua própria cor e produz seu próprio recurso. O objetivo é expandir todas as linhas, comprando geradores cada vez mais poderosos. Seu <strong>Nível</strong> (exibido no header) é a soma de todos os geradores que você possui em produção (máximo 100).',
    currenciesTitle: "As Moedas",
    baseResourceTitle: "● Recurso (por linha)",
    baseResourceDesc:
      "Cada linha de produção gera seu próprio recurso exclusivo (representado por ● na cor da linha). Esse recurso é usado para comprar geradores daquela linha e para realizar trocas.",
    baseResourceHow: "<strong>Como Obter:</strong> Gerado pelo <strong>Gerador 1</strong> de cada linha. No início, clique no badge do Gerador 1 para produzir manualmente; a produção automática começa ao comprar a primeira unidade.",
    baseResourceInit: "<strong>Recurso Total (Σ):</strong> O header exibe a soma de recursos de todas as linhas.",
    ticketsTitle: "▲ Tickets",
    ticketsDesc:
      "Moeda universal usada para comprar geradores em todas as linhas. O custo em tickets escala com a linha: <strong>Linha 1 = 1 ticket</strong>, Linha 2 = 2 tickets, até Linha 10 = 10 tickets por gerador.",
    ticketsHow:
      "<strong>Como Obter:</strong> Ao possuir pelo menos 1 gerador, você gera 1 Ticket por segundo automaticamente.",
    ticketsIncrease:
      '<strong>Aumentando Ganho:</strong> Trocas de recurso por ▲/s (menu "Trocas"), melhorias "Dobrar produção de ▲/s (×2)" e "Dobrar ▲/s por troca".',
    ticketsOffline:
      "<strong>Offline:</strong> Tickets são gerados passivamente enquanto você está offline.",
    milestonesTitle: "◆ Moeda de Marcos",
    milestonesDesc:
      'Usada para comprar melhorias no menu "Melhorias". Obtida através da coleta de marcos nos geradores.',
    milestonesHow:
      '<strong>Como Obter:</strong> Ao atingir fatores de <code class="text-pink-300">10^x</code> de um gerador (10, 100, 1k, 10k…), um marco fica disponível para coleta.',
    milestonesReward:
      "<strong>Recompensa:</strong> Escala com o número do gerador e o nível do marco. Fórmula: (Nº do Gerador) + (Nível do Marco) - 1.",
    milestonesExample:
      "Ex: Marco nível 3 do Gerador 5 = 5 + 3 - 1 = 7 ◆.",
    generatorsTitle: "Os Geradores",
    generatorsIntro:
      "Cada linha de produção tem 10 geradores. O Gerador 1 produz o recurso da linha. Geradores 2-10 produzem unidades do gerador anterior, criando uma cadeia exponencial de crescimento.",
    gen1: "<strong>Gerador 1:</strong> Produz o <strong>recurso da linha</strong>. No início ele vem desbloqueado — clique no badge para produzir manualmente. Após comprar a primeira unidade, a produção é automática.",
    gen2to20:
      "<strong>Geradores 2 a 10:</strong> Produzem unidades do gerador anterior. Ex: Gerador 3 produz unidades do Gerador 2. Para desbloquear a compra de um gerador, é preciso ter uma certa quantidade do gerador anterior.",
    cycleTime:
      "<strong>Tempo de Ciclo:</strong> Cada tier leva o DOBRO do tempo do anterior (Gen 1 = 2s, Gen 2 = 4s… Gen 10 = ~17 min). Entre linhas, o tempo também dobra (Linha 2 tem o dobro da Linha 1). Pode ser reduzido até 0.1s com melhorias.",
    cascadeCost:
      "<strong>Custo em Cascata:</strong> Cada gerador custa recurso da linha, tickets (N por unidade na Linha N), e unidades do gerador anterior.",
    cascadeCostExample:
      "Ex: Gerador 3 da Linha 2 requer recurso azul, 2 tickets ▲, e unidades do Gerador 2.",
    upgradesTitle: "Melhorias",
    upgradesIntro:
      'O menu "Melhorias" usa ◆ para acelerar sua progressão. Divididas em 3 abas:',
    upgCycleTitle: "Reduzir Tempo de Ciclo",
    upgCycleDesc:
      "Por gerador. Corta o tempo de ciclo pela metade (÷2). Custo: 1, 2, 4, 8… ◆. Limite: 0.1s por ciclo.",
    upgProdTitle: "Dobrar Produção",
    upgProdDesc:
      "Por gerador. Dobra a produção por ciclo (×2). Custo: 1, 2, 4, 8… ◆. Ranques infinitos.",
    upgCritChanceTitle: "Chance de Crítico",
    upgCritChanceDesc:
      "Por gerador. Cada ranque adiciona 2.5% de chance de crítico (máx. 100% com 40 ranques). Custo: 1, 2, 4, 8… ◆.",
    upgCritMultTitle: "Eficiência do Crítico",
    upgCritMultDesc:
      "Por gerador. Aumenta o multiplicador de dano crítico (×2, ×4, ×6…). Custo: 1, 2, 4, 8… ◆. Ranques infinitos.",
    upgTicketMultTitle: "Dobrar produção de ▲/s (×2)",
    upgTicketMultDesc:
      "Global. Dobra toda a geração de tickets por segundo. Custo: 1, 4, 16, 64… ◆ (quadruplica por ranque). Ranques infinitos.",
    upgTradeDoublerTitle: "Dobrar ▲/s por troca",
    upgTradeDoublerDesc:
      "Global. Dobra o valor de ▲/s que cada troca concede (1→2→4→8…). Custo: 1, 2, 4, 8… ◆.",
    upgHalfCostTitle: "Custo ÷2 (todos os geradores)",
    upgHalfCostDesc:
      "Global. Reduz pela metade o custo em recurso e em geradores anteriores. Custo: 1, 2, 4, 8… ◆.",
    upgMilestoneDoublerTitle: "Dobrar ◆ por marco",
    upgMilestoneDoublerDesc:
      "Global. Dobra a recompensa de ◆ ao coletar marcos. Custo: 2, 8, 32, 128… ◆ (quadruplica por ranque).",
    upgTradeTitle: "Trocas (menu Trocas)",
    upgTradeDesc:
      "10 trocas independentes, uma por linha. Sacrifique recurso da linha por um ganho permanente de ▲/s. O custo cresce a cada troca (500, 5k, 5M, 5B…). Não consome ◆.",
    linesTitle: "Linhas de Produção",
    linesIntro:
      "O jogo possui <strong>10 linhas de produção</strong>, cada uma com sua <strong>cor</strong>, <strong>recurso exclusivo</strong> e características únicas. Linhas superiores são mais lentas porém muito mais produtivas por ciclo.",
    linesScaling: "Escalonamento entre linhas",
    linesScalingCycle: "Tempo de ciclo",
    linesScalingCycleDesc: "Cada linha seguinte tem o <strong>dobro</strong> do tempo de ciclo da anterior. Linha 1 começa com 2s no Gen 1, Linha 2 com 4s, Linha 10 com ~17 min.",
    linesScalingProd: "Produção por ciclo",
    linesScalingProdDesc: "Cada linha seguinte produz o <strong>triplo</strong> por ciclo. Linha 1 produz 3/ciclo no Gen 1, Linha 2 produz 9, Linha 10 produz 59.049.",
    linesScalingTickets: "Custo em tickets",
    linesScalingTicketsDesc: "Linha N consome <strong>N tickets</strong> por gerador comprado. Linha 1 = 1▲, Linha 5 = 5▲, Linha 10 = 10▲.",
    linesScalingResource: "Recurso exclusivo",
    linesScalingResourceDesc: "Cada linha produz e consome seu próprio recurso. Geradores da linha vermelha usam recurso vermelho, geradores da linha azul usam recurso azul, e assim por diante.",
    linesUnlockTitle: "Desbloqueio de linhas",
    linesUnlock: "A <strong>Linha 1</strong> começa desbloqueada. Para desbloquear a <strong>Linha N</strong>, é preciso possuir pelo menos <strong>1 unidade do Gerador N da Linha N-1</strong>.",
    linesUnlockExample: "Ex: Para desbloquear a Linha 3, você precisa de 1 Gerador 3 da Linha 2. Para desbloquear a Linha 6, precisa de 1 Gerador 6 da Linha 5.",
    lineNames: [
      "Vermelha", "Azul", "Verde", "Âmbar", "Violeta",
      "Ciano", "Laranja", "Rosa", "Índigo", "Lima",
    ] as unknown as string,
    lineLabel: "Linha",
    lineTickets: "tickets/gerador",
    lineCycleGen1: "Ciclo Gen 1",
    lineProdGen1: "Prod. Gen 1",
    offlineTitle: "Simulação Offline",
    offlineText:
      "O jogo calcula seu progresso enquanto a aba esteve fechada, simulando todas as camadas de produção e acumulando recursos, tickets e marcos de todas as linhas ativas.",
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
