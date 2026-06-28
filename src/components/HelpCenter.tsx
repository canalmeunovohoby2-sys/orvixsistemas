import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded border border-border bg-secondary text-foreground text-[11px] font-mono font-semibold shadow-sm">
      {children}
    </kbd>
  );
}

function Tip({ tone = "info", children }: { tone?: "info" | "warn" | "danger" | "ok"; children: React.ReactNode }) {
  const cls = {
    info: "border-sky-500/30 bg-sky-500/5 text-foreground",
    warn: "border-amber-500/40 bg-amber-500/5 text-foreground",
    danger: "border-primary/40 bg-primary/[0.07] text-foreground",
    ok: "border-emerald-500/30 bg-emerald-500/5 text-foreground",
  }[tone];
  return (
    <div className={`rounded-md border ${cls} px-3 py-2 text-[13px] leading-relaxed`}>
      {children}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-secondary border border-border font-mono text-[12px]">
      {children}
    </code>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{title}</h4>
      {children}
    </div>
  );
}

export function HelpCenter() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Central de ajuda"
          title="Central de Ajuda (Manual operacional)"
          className="w-10 h-10 rounded-md hover:bg-accent grid place-items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl lg:max-w-2xl p-0 flex flex-col bg-background"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border text-left">
          <SheetTitle className="text-xl font-bold tracking-tight">
            📖 Central de Ajuda &amp; Manual Operacional do Sistema
          </SheetTitle>
          <SheetDescription className="text-sm">
            Aprenda a operar os recursos avançados de Caixa e Estoque.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <Accordion type="single" collapsible defaultValue="pdv" className="space-y-2">
            {/* PDV */}
            <AccordionItem value="pdv" className="border border-border rounded-lg bg-card px-4 data-[state=open]:bg-card">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="flex items-center gap-2 font-semibold">
                  <span aria-hidden>🛒</span> Frente de Caixa &amp; PDV de Balcão
                  <Badge variant="secondary" className="ml-2 font-mono text-[10px]">teclado</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 space-y-5 text-sm text-muted-foreground">
                <Section title="Atalhos do sistema">
                  <p>O caixa é operado por listeners de teclado globais — você não precisa do mouse para concluir vendas.</p>
                  <ul className="rounded-lg border border-border divide-y divide-border bg-secondary/40">
                    <li className="flex items-center gap-3 px-3 py-2"><Key>F1</Key><span>Foca no campo de <strong className="text-foreground">busca de produtos</strong> (EAN ou nome).</span></li>
                    <li className="flex items-center gap-3 px-3 py-2"><Key>F2</Key><span>Abre o painel de <strong className="text-foreground">desconto em R$</strong> (valor fixo abatido do total).</span></li>
                    <li className="flex items-center gap-3 px-3 py-2"><Key>F3</Key><span>Foca a <strong className="text-foreground">quantidade do último item</strong> do carrinho (valor pré-selecionado — basta digitar por cima). <Key>Enter</Key> confirma e devolve o foco ao leitor.</span></li>
                    <li className="flex items-center gap-3 px-3 py-2"><Key>F4</Key><span>Ativa o <strong className="text-foreground">modo seleção de pagamento</strong> — em seguida tecle <Key>1</Key>/<Key>2</Key>/<Key>3</Key>/<Key>4</Key> para escolher Dinheiro/Pix/Crédito/Débito.</span></li>
                    <li className="flex items-center gap-3 px-3 py-2"><Key>F8</Key><span className="text-primary font-semibold">Cancela a venda em andamento</span><span>(abre confirmação crítica).</span></li>
                    <li className="flex items-center gap-3 px-3 py-2"><Key>F9</Key><span className="text-primary font-semibold">Estorna o último item</span><span>do carrinho instantaneamente — sem confirmação.</span></li>
                    <li className="flex items-center gap-3 px-3 py-2"><Key>F12</Key><span className="text-foreground">Conclui a venda.</span></li>
                    <li className="flex items-center gap-3 px-3 py-2"><Key>Enter</Key><span>Conclui a venda quando o valor está <strong className="text-emerald-500">quitado</strong>.</span></li>
                    <li className="flex items-center gap-3 px-3 py-2"><Key>Esc</Key><span>Fecha qualquer painel aberto (desconto / pagamento).</span></li>
                  </ul>
                </Section>

                <Section title="Estorno e cancelamento">
                  <Tip tone="danger">
                    ❌ <strong className="text-foreground">Cancelar Venda Completa:</strong> pressione <Key>F8</Key> ou clique em
                    <Badge variant="outline" className="mx-1 align-middle text-primary border-primary/60">Cancelar Venda</Badge>
                    para limpar todo o caixa — itens, desconto e splits de pagamento são zerados após a confirmação no modal.
                  </Tip>
                  <Tip tone="warn">
                    🗑️ <strong className="text-foreground">Remover Item do Carrinho:</strong> se o cliente desistir de apenas um
                    produto, clique no ícone da <strong className="text-primary">lixeira vermelha</strong> na linha do item dentro
                    do carrinho para estorná-lo individualmente. O sistema recalculará o valor total líquido na hora — e, se o
                    novo total ficar menor do que o já recebido, os splits de pagamento são limpos automaticamente para que você
                    reajuste o troco/recebimento.
                  </Tip>
                  <Tip tone="info">
                    ⌨️ <strong className="text-foreground">Estorno-Relâmpago do Último Item (F9):</strong> errou o último bip?
                    Pressione <Key>F9</Key> para remover na hora o produto mais recente do carrinho — sem modal, sem mouse.
                    Ideal para corrigir leituras duplicadas do scanner.
                  </Tip>
                  <Tip tone="info">
                    🔢 <strong className="text-foreground">Ajuste-Relâmpago de Quantidade (F3):</strong> após bipar, pressione
                    <Key>F3</Key> para saltar direto ao campo de quantidade do último item — o valor já vem selecionado, então
                    digite o novo número (ex.: <Code>5</Code> ou <Code>2.5</Code> para itens fracionados) e tecle <Key>Enter</Key>.
                    O foco retorna automaticamente ao leitor para o próximo produto.
                  </Tip>
                </Section>

                <Section title="Leitor de código de barras">
                  <Tip tone="info">
                    ⚡ <strong className="text-foreground">Passar Vendas com Leitor:</strong> com a tela de Vendas aberta, basta
                    usar seu leitor de código de barras diretamente nos itens. O sistema localizará o produto automaticamente,
                    jogará no carrinho com quantidade <Code>1</Code> e deixará o campo limpo para o próximo bip, garantindo
                    agilidade máxima no balcão.
                  </Tip>
                  <p>
                    O input principal detecta strings numéricas de <Code>13 dígitos</Code> (padrão EAN/GTIN) ou o gatilho de
                    <Code>Enter</Code> enviado pela maioria dos leitores de mão. Itens fracionados entram com qtd <Code>1</Code> —
                    ajuste o decimal direto no carrinho se precisar (ex.: <Code>1.250</Code> kg).
                  </p>
                  <Tip tone="danger">
                    Se o código não estiver cadastrado, o sistema avisa: <em>"Produto com este código de barras não encontrado.
                    Cadastre-o na aba de Produtos antes de vender."</em>
                  </Tip>
                </Section>

                <Section title="Lógica de split de pagamento">
                  <p>
                    Ao clicar em uma forma de pagamento (Dinheiro, Pix, Crédito, Débito), o sistema adiciona automaticamente
                    uma parcela já <strong className="text-foreground">preenchida com o valor exato restante</strong> para quitar a venda.
                  </p>
                  <Tip tone="info">
                    ⚡ <strong className="text-foreground">Seleção 100% por teclado (F4 + 1–4):</strong> pressione <Key>F4</Key> para
                    destacar o bloco de pagamentos — badges numéricos aparecem dentro de cada botão. Em seguida, tecle
                    <Key>1</Key> Dinheiro, <Key>2</Key> Pix, <Key>3</Key> Crédito (abre o seletor de parcelas) ou <Key>4</Key> Débito.
                    O split é inserido com o saldo exato restante, o modo de seleção fecha e o foco volta para o leitor de código.
                    Tecle <Key>Esc</Key> a qualquer momento para sair sem adicionar parcela. Funciona com o teclado numérico (numpad).
                  </Tip>
                  <div className="grid grid-cols-2 gap-2">
                    <Tip tone="danger"><strong className="text-primary">Falta R$ X</strong> — pagamento incompleto, o botão de concluir fica bloqueado.</Tip>
                    <Tip tone="ok"><strong className="text-emerald-500">Quitado</strong> — o total foi atingido e a venda pode ser finalizada.</Tip>
                  </div>
                </Section>

                <Section title="Quantidades decimais">
                  <p>
                    O campo de quantidade no carrinho respeita a <strong className="text-foreground">unidade de medida</strong> do produto.
                    Itens fracionáveis (<Code>m</Code>, <Code>m²</Code>, <Code>m³</Code>, <Code>kg</Code>, <Code>L</Code>) aceitam frações
                    de até <Code>0.01</Code> — por exemplo, <Code>1.250</Code> kg de produto a granel ou <Code>2.5</Code> m de tecido.
                    Itens vendidos em caixas/unidades (<Code>un</Code>) travam em números inteiros.
                  </p>
                </Section>

                <Section title="Vendas parceladas no Crédito">
                  <Tip tone="info">
                    💳 <strong className="text-foreground">Vendas Parceladas no Crédito:</strong> ao selecionar <Badge variant="outline" className="mx-1 align-middle">Crédito</Badge>
                    no pagamento, o sistema define <strong className="text-foreground">1x (à vista)</strong> automaticamente. Caso o cliente
                    parcele na maquininha, altere o seletor <Badge variant="secondary" className="mx-1 align-middle">Parcelas</Badge> no carrinho
                    para até <Code>12x</Code>. Isso alimenta automaticamente a sua <strong className="text-foreground">previsão de faturamento futuro</strong>
                    na aba <Badge className="mx-1 align-middle">Relatórios</Badge>.
                  </Tip>
                </Section>
              </AccordionContent>
            </AccordionItem>

            {/* Produtos / Estoque */}
            <AccordionItem value="estoque" className="border border-border rounded-lg bg-card px-4">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="flex items-center gap-2 font-semibold">
                  <span aria-hidden>📦</span> Cadastro de Produtos &amp; Estoque Fracionado
                  <Badge variant="secondary" className="ml-2 font-mono text-[10px]">unidades</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 space-y-5 text-sm text-muted-foreground">
                <Section title="Cadastro rápido por código de barras">
                  <Tip tone="ok">
                    ⚡ <strong className="text-foreground">Cadastro em Segundos:</strong> no formulário de Novo Produto,
                    bipe o código de barras ou clique no ícone da <strong className="text-foreground">câmera</strong> para
                    escanear pelo celular. O sistema consultará o catálogo online e preencherá <strong className="text-foreground">Nome, Marca
                    e Categoria</strong> automaticamente. Você só precisa definir os preços e a quantidade de estoque!
                  </Tip>
                  <Tip tone="warn">
                    Se o código não estiver na base pública, o sistema avisa: <em>"Produto não encontrado na base pública.
                    Deseja cadastrar manualmente?"</em> — todos os campos ficam liberados para você concluir o cadastro sem travar.
                  </Tip>
                </Section>

                <Section title="Unidades de medida cadastradas">
                  <p>O cadastro de produto exige <strong className="text-foreground">obrigatoriamente</strong> uma unidade de medida.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["un", "m", "m²", "m³", "kg", "L"].map((u) => (
                      <Badge key={u} variant="outline" className="font-mono">{u}</Badge>
                    ))}
                  </div>
                  <p>
                    O sistema gerencia o <Code>step</Code> de entrada com base na unidade:
                    <strong className="text-foreground"> un</strong> trava em <Code>step=1</Code> (inteiros);
                    as demais liberam <Code>step=0.01</Code> com <Code>inputMode=&quot;decimal&quot;</Code> para teclado numérico em dispositivos móveis.
                  </p>
                </Section>

                <Section title="Lógica de estoque mínimo (QA visível)">
                  <Tip tone="danger">
                    Quando a <strong>quantidade atual ≤ estoque mínimo</strong>, o sistema aplica automaticamente uma
                    badge <Badge variant="destructive" className="ml-0.5 mr-1 align-middle">Baixo</Badge> e tinge as linhas
                    das tabelas com <Code>bg-primary/5</Code> para auditoria imediata.
                  </Tip>
                </Section>

                <Section title="Lista de compras rápida">
                  <p>
                    Na tela de <strong className="text-foreground">Estoque</strong>, ative o interruptor
                    <Badge variant="destructive" className="mx-1 align-middle">⚠️ Necessita Reposição</Badge>
                    para isolar em um clique apenas os produtos críticos e gerar a lista de pedidos para os fornecedores.
                  </p>
                </Section>

                <Section title="Como remover registros">
                  <Tip tone="danger">
                    💡 <strong className="text-foreground">Como remover registros:</strong> para excluir um produto, clique no
                    ícone da <strong className="text-primary">lixeira vermelha</strong> na linha correspondente e confirme no
                    aviso de segurança. A ação é permanente e o item sai do inventário imediatamente.
                  </Tip>
                </Section>
              </AccordionContent>
            </AccordionItem>

            {/* Relatórios */}
            <AccordionItem value="relatorios" className="border border-border rounded-lg bg-card px-4">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="flex items-center gap-2 font-semibold">
                  <span aria-hidden>📊</span> Auditoria Financeira &amp; Fechamento de Caixa
                  <Badge variant="secondary" className="ml-2 font-mono text-[10px]">relatórios</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 space-y-5 text-sm text-muted-foreground">
                <Section title="Bruto vs líquido — taxas reais">
                  <p>
                    A seção <strong className="text-foreground">Fechamento de Caixa do Dia</strong> lê apenas as vendas
                    <strong className="text-foreground"> concluídas</strong> e calcula o valor líquido que deve constar fisicamente na gaveta,
                    aplicando os descontos reais das maquininhas do mercado:
                  </p>
                  <ul className="rounded-lg border border-border divide-y divide-border bg-secondary/40 text-foreground">
                    <li className="flex items-center justify-between px-3 py-2"><span>💳 Cartão de Crédito</span><Badge variant="destructive" className="font-mono">−3.2%</Badge></li>
                    <li className="flex items-center justify-between px-3 py-2"><span>💳 Cartão de Débito</span><Badge variant="destructive" className="font-mono">−1.5%</Badge></li>
                    <li className="flex items-center justify-between px-3 py-2"><span>📲 Pix</span><Badge variant="destructive" className="font-mono">−0.99%</Badge></li>
                    <li className="flex items-center justify-between px-3 py-2"><span>💵 Dinheiro</span><Badge variant="outline" className="font-mono">sem taxa</Badge></li>
                  </ul>
                </Section>

                <Section title="Curva ABC e rankings de giro">
                  <p>
                    Use o bloco de <strong className="text-foreground">Curva ABC</strong> para identificar:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <Tip tone="info"><strong className="text-foreground">Top 5 por volume</strong> — produtos com maior giro físico (respeitando a unidade fracionada).</Tip>
                    <Tip tone="ok"><strong className="text-foreground">Top 5 por receita líquida</strong> — produtos que mais entram caixa líquido.</Tip>
                  </div>
                  <p>As barras proporcionais ao topo do ranking facilitam a tomada de decisão sobre compras e promoções.</p>
                </Section>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <p className="mt-6 text-[11px] text-muted-foreground text-center">
            Versão do manual sincronizada com a release atual do Meu Saas.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}