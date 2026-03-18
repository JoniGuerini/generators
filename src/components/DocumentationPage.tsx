
export function DocumentationPage() {
  return (
    <div className="mx-auto max-w-4xl p-6 text-zinc-300">
      <h1 className="mb-6 border-b border-zinc-700 pb-2 text-3xl font-bold text-zinc-100">
        Documentação do Jogo
      </h1>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-amber-500">O Básico</h2>
        <p className="mb-3">
          O principal objetivo do jogo é acumular <strong>Recurso Base (●)</strong> através de Geradores. O progresso é infinito, baseado na compra de geradores cada vez mais poderosos, e é medido pela capacidade de alcançar valores inimagináveis (utilizando <code className="rounded bg-zinc-700 px-1 text-sm text-pink-400">break_eternity.js</code> para lidar com números absurdamente grandes).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-cyan-400">As Moedas</h2>
        
        <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
          <h3 className="mb-2 text-xl font-semibold text-cyan-300">● Recurso Base</h3>
          <p className="mb-2">É o recurso principal do jogo. Usado para comprar o Seu <strong>Gerador 1</strong> e para realizar trocas (Trades).</p>
          <ul className="list-inside list-disc space-y-1 pl-2 text-zinc-400">
            <li><strong>Como Obter:</strong> É gerado exclusivamente pelo <strong>Gerador 1</strong>.</li>
            <li><strong>Valor Inicial:</strong> Começa com 10 no início da jornada.</li>
          </ul>
        </div>

        <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
          <h3 className="mb-2 text-xl font-semibold text-amber-300">▲ Moeda de Compra (Tickets)</h3>
          <p className="mb-2">Usada exclusivamente como limite/custo de tempo para comprar Geradores. Todo gerador consome 1 Ticket por unidade comprada, o que atua como um limitador da velocidade em que você pode acumular sua fábrica.</p>
          <ul className="list-inside list-disc space-y-1 pl-2 text-zinc-400">
            <li><strong>Como Obter:</strong> A partir do momento em que você possui pelo menos 1 gerador, você começa a gerar 1 Ticket por segundo.</li>
            <li><strong>Aumentando Ganho:</strong> O ganho pode ser aumentado através das melhorias "Aumentar produção (+1/s)" ou "Dobrar Tickets gerados (x2)", e através de Trocas com o Recurso Base.</li>
            <li><strong>Sistemas Offlines:</strong> Essa moeda é gerada passivamente também enquanto você está offline!</li>
          </ul>
        </div>

        <div className="mb-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
          <h3 className="mb-2 text-xl font-semibold text-purple-300">◆ Moeda de Marcos (Melhorias)</h3>
          <p className="mb-2">Moeda premium usada para comprar as Melhorias (Upgrades) no menu "Melhorias". Utilizada para reduzir tempo de ciclos, aumentar produção global, ou reduzir os custos.</p>
          <ul className="list-inside list-disc space-y-1 pl-2 text-zinc-400">
            <li><strong>Como Obter:</strong> Exclusivamente através da coleta de <strong>Marcos (Milestones)</strong> nos geradores.</li>
            <li><strong>A recompensa de resgate:</strong> Ao atingir fatores de <code className="text-pink-300">10^x</code> de um gerador (10, 100, 1.000, 10.000, etc.), o marco fica disponível. A moeda ganha escala de acordo com o Número do Gerador e o Nível do Marco. <br/><span className="text-sm italic text-zinc-500">Ex: Marco nível 3 do Gerador 5 fornecerá (Número do Gerador: 5) + (Nível do Marco: 3) - 1 = 7 Moedas ◆.</span></li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-green-400">Os Geradores</h2>
        <p className="mb-3">Existem 20 Tiers de Geradores. Cada Gerador (exceto o Gerador 1) existe para alimentar o gerador anterior a ele. Essa cadeia exponencial cria o crescimento logarítmico do jogo.</p>
        
        <ul className="mb-4 list-inside list-disc space-y-2 text-zinc-400">
          <li><strong>Gerador 1:</strong> O único que produz o <strong>Recurso Base (●)</strong>. Custa 10 Recurso Base (e 1 Ticket ▲). Produz 3 Recurso Base a cada 2 segundos.</li>
          <li><strong>Gerador 2 até o 20:</strong> Produzem as unidades do Gerador <strong>X-1</strong> diretamente. Por exemplo: O Gerador 2 produz "Geradores 1". O Gerador 20 produz "Geradores 19".</li>
          <li><strong>Tempo de Ciclo:</strong> Cada novo Tier de Gerador leva o DOBRO de tempo do que o Gerador anterior para completar seu ciclo produtivo. (Gen 1 = 2s, Gen 2 = 4s, Gen 3 = 8s... Gen 20 = 12 dias!). Isso pode ser reduzido até um limite de 0.1s com upgrades.</li>
          <li><strong>Custo em Cascatas:</strong> Para comprar um Gerador, você paga 1 Ticket ▲, um valor em Recurso Base (●), E UM VALOR do seu Gerador Anterior. <br/><span className="text-sm italic text-zinc-500">Ex: Gerador 3 requer 10.000 (●), 50 Geradores 2, e 1 Ticket ▲. Isso força você a esperar os geradores procriarem antes de subir de Tier!</span></li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-bold text-pink-400">Melhorias (Upgrades)</h2>
        <p className="mb-3">A tela de "Melhorias" utiliza a Moeda de Marco (◆) para acelerar enormemente sua progressão. As opções incluem:</p>

        <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded border border-zinc-700 bg-zinc-800 p-3">
              <h4 className="font-bold text-zinc-200">Reduzir Tempo de Ciclo</h4>
              <p className="text-sm text-zinc-400">Exclusivo para cada gerador. Corta o tempo útil do ciclo pela Metade (÷2). O custo dobra a cada nível (1, 2, 4, 8...). O limite para todos é que não pode ser mais rápido do que 0.1s por ciclo.</p>
            </div>
            <div className="rounded border border-zinc-700 bg-zinc-800 p-3">
              <h4 className="font-bold text-zinc-200">Dobrar Produção</h4>
              <p className="text-sm text-zinc-400">Exclusivo para cada gerador. Multiplica os lucros de unidades por ciclo (x2). O custo dobra a cada nível (1, 2, 4, 8...). Níveis Infinitos.</p>
            </div>
            <div className="rounded border border-zinc-700 bg-zinc-800 p-3">
              <h4 className="font-bold text-zinc-200">Ganho de Tickets (+1/s)</h4>
              <p className="text-sm text-zinc-400">Melhoria Global. Adiciona +1 a geração base de Tickets ▲ por segundo. Custo em ◆: 1, 2, 4, 8… (dobra a cada ranque). Níveis infinitos.</p>
            </div>
            <div className="rounded border border-zinc-700 bg-zinc-800 p-3">
              <h4 className="font-bold text-zinc-200">Multiplicar Tickets (x2)</h4>
              <p className="text-sm text-zinc-400">Melhoria Global. Dobra todo o ganho de Tickets ▲ por segundo. Custo em ◆: 1, 4, 16, 64… (quadruplica a cada ranque). Níveis infinitos.</p>
            </div>
            <div className="rounded border border-zinc-700 bg-zinc-800 p-3 md:col-span-2">
              <h4 className="font-bold text-zinc-200">Mitade dos Custos</h4>
              <p className="text-sm text-zinc-400">Melhoria Global. Esmaga o preço total em Recurso Base E o custo em Unidades do pre-requisito (Gen anterior) pela metade (÷2). Custa (50 * 2^nivel). Especialmente poderoso para acessar Gen 15 ao 20 mais rapidamente.</p>
            </div>
            <div className="rounded border border-zinc-700 bg-zinc-800 p-3 md:col-span-2">
              <h4 className="font-bold text-zinc-200">Trocar Base por Tickets (Trades)</h4>
              <p className="text-sm text-zinc-400">Melhoria Global. Esta opção não consome moedas ◆. Para liberar, você sacrifíca Recurso Base (●) em troca de um ganho permanente de +1 Ticket ▲/s na geração passiva. O preço cresce vertiginosamente a cada vez que é comprado (500, 5k, 5M, 5B, 5T...).</p>
            </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-indigo-400">Simulação Offline</h2>
        <p className="mb-3 text-zinc-400">O jogo calcula o seu progresso enquanto a aba estava fechada. Como geradores superiores criam geradores inferiores (que por sua vez geram recurso base), a matemática offline de múltiplas camadas de geração utiliza as mesmas fórmulas em loop limitando ticks por intervalo para criar uma previsão hiper-realista do que você teria gerado nas horas que ficou fora, incluindo o bônus dos geradores recém-nascidos atuando no espaço temporal.</p>
      </section>

    </div>
  );
}
