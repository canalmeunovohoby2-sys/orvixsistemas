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
            Aprenda a operar os recursos avançados de Caixa, Estoque e Crediário.
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
                    <li className="flex items-center gap-3 px-3 py-2"><Key>F4</Key><span>Destaca o bloco de <strong className="text-foreground">formas de pagamento</strong>.</span></li>
                    <li className="flex items-center gap-3 px-3 py-2"><Key>F12</Key><span className="text-foreground">Conclui a venda.</span></li>
                    <li className="flex items-center gap-3 px-3 py-2"><Key>Enter</Key><span>Conclui a venda quando o valor está <strong className="text-emerald-500">quitado</strong>.</span></li>
                    <li className="flex items-center gap-3 px-3 py-2"><Key>Esc</Key><span>Fecha qualquer painel aberto (desconto / pagamento).</span></li>
                  </ul>
                </Section>

                <Section title="Lógica de split de pagamento">
                  <p>
                    Ao clicar em uma forma de pagamento (Dinheiro, Pix, Crédito, Débito, Crediário), o sistema adiciona automaticamente
                    uma parcela já <strong className="text-foreground">preenchida com o valor exato restante</strong> para quitar a venda.
                  </p>
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

            {/* Clientes / Crediário */}
            <AccordionItem value="crediario" className="border border-border rounded-lg bg-card px-4">
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <span className="flex items-center gap-2 font-semibold">
                  <span aria-hidden>👥</span> Clientes &amp; Regras do Crediário
                  <Badge variant="secondary" className="ml-2 font-mono text-[10px]">fiado seguro</Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 space-y-5 text-sm text-muted-foreground">
                <Section title="Vendas no Crediário">
                  <p>
                    Para vender no fiado o operador <strong className="text-foreground">deve obrigatoriamente</strong> buscar e vincular o cliente
                    (por nome ou CNPJ) no PDV antes de fechar a transação. O sistema lê o
                    <strong className="text-foreground"> saldo devedor</strong> e o <strong className="text-foreground">limite disponível</strong> em tempo real.
                  </p>
                </Section>

                <Section title="Bloqueio automático de limite">
                  <Tip tone="danger">
                    Se a venda atual <strong>estourar o limite de crédito</strong> configurado para o cliente, o botão
                    <Badge variant="destructive" className="mx-1 align-middle">Crediário</Badge> é desabilitado e o sistema
                    bloqueia a transação emitindo um toast crítico com o valor disponível restante.
                  </Tip>
                </Section>

                <Section title="Amortização FIFO e quitação">
                  <p>
                    Na aba <strong className="text-foreground">Clientes</strong>, ao clicar no nome do devedor, um drawer abre o histórico de débitos.
                    O botão <Badge className="mx-1 align-middle">💸 Receber Pagamento</Badge> abate o saldo seguindo a regra
                    <strong className="text-foreground"> FIFO</strong> — pagando a dívida mais antiga primeiro.
                    Use o atalho <Badge variant="outline" className="mx-1 align-middle">Quitar tudo</Badge> para liquidar
                    todo o saldo devedor em um clique.
                  </p>
                </Section>

                <Section title="Como remover registros">
                  <Tip tone="danger">
                    💡 <strong className="text-foreground">Como remover registros:</strong> para excluir um cliente, clique no
                    ícone da <strong className="text-primary">lixeira vermelha</strong> na linha correspondente e confirme no
                    aviso de segurança. <strong className="text-foreground">Atenção:</strong> clientes com dívidas ativas exibirão
                    um alerta financeiro crítico antes da confirmação — a remoção apaga o histórico de débitos permanentemente.
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
                    <li className="flex items-center justify-between px-3 py-2"><span>💵 Dinheiro / Crediário</span><Badge variant="outline" className="font-mono">sem taxa</Badge></li>
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