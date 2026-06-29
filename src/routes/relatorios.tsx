import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { BRL, PRODUCTS, SALES, SALES_BY_DAY, formatQty, type Product } from "@/lib/mock-data";
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Banknote, CreditCard, Download, QrCode, Sparkles, TrendingUp, Trophy, Wallet } from "lucide-react";
import { useMockStore } from "@/hooks/use-mock-store";

export const Route = createFileRoute("/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Meu Saas" },
      { name: "description", content: "Relatórios analíticos de vendas, performance de produtos, lucratividade e tendências de estoque." },
      { property: "og:title", content: "Relatórios — Meu Saas" },
      { property: "og:description", content: "Análises e relatórios estratégicos." },
      { property: "og:url", content: "/relatorios" },
    ],
    links: [{ rel: "canonical", href: "/relatorios" }],
  }),
  component: () => (<RoleGuard allow={["admin"]}><RelatoriosPage /></RoleGuard>),
});

type PaymentRow = {
  method: "Dinheiro" | "Pix" | "Crédito" | "Débito";
  icon: typeof Banknote;
  bruto: number;
  liquido: number;
  count: number;
};

function RelatoriosPage() {
  useMockStore();
  const { closing, totals, abc, forecast } = useMemo(() => computeReport(), [SALES.length]);

  return (
    <AppShell title="Relatórios" breadcrumb={["Meu Saas", "Relatórios"]}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {["Diário", "Semanal", "Mensal", "Anual"].map((t, i) => (
            <button key={t} className={`h-9 px-3 rounded-md text-xs font-medium border transition ${i === 2 ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border hover:bg-accent"}`}>{t}</button>
          ))}
        </div>
        <button className="h-9 px-3 inline-flex items-center gap-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold">
          <Download className="w-4 h-4" /> Exportar PDF
        </button>
      </div>

      {/* ─── Fechamento de caixa ─── */}
      <CashClosing closing={closing} totals={totals} />

      {/* ─── Faturamento e Lucro Real ─── */}
      <ProfitPanel totals={totals} />

      {/* ─── Previsão de recebimento futuro ─── */}
      <Forecast forecast={forecast} />

      {/* ─── Curva ABC ─── */}
      <CurvaABC abc={abc} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <section className="glass rounded-xl p-5">
          <h2 className="text-base font-semibold mb-1">Evolução de vendas</h2>
          <p className="text-xs text-muted-foreground mb-3">Últimos 14 dias</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SALES_BY_DAY}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--foreground)" }}
                  formatter={(v: number) => BRL(v)}
                />
                <Line type="monotone" dataKey="vendas" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="lucro" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass rounded-xl p-5">
          <h2 className="text-base font-semibold mb-1">Indicadores estratégicos</h2>
          <p className="text-xs text-muted-foreground mb-3">Snapshot do mês corrente</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { l: "Ticket médio", v: BRL(totals.ticketMedio), tone: "primary" as const },
              { l: "Margem bruta", v: "32,4%", tone: "success" as const },
              { l: "Giro de estoque", v: "4,8x" },
              { l: "Ruptura", v: "2,1%", tone: "primary" as const },
              { l: "Vendas concluídas", v: `${totals.qtdVendas}` },
              { l: "Lucro operacional", v: BRL(totals.lucroOp), tone: "success" as const },
              { l: "Conversão PDV", v: "87%" },
              { l: "Itens críticos", v: String(PRODUCTS.filter(p => p.stock <= p.minStock).length), tone: "primary" as const },
            ].map((k) => (
              <div key={k.l} className="p-3 rounded-lg bg-secondary/60 border border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{k.l}</p>
                <p className={`mt-1 text-lg font-bold tabular-nums ${k.tone === "primary" ? "text-primary" : k.tone === "success" ? "text-emerald-500" : ""}`}>{k.v}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

/* ─────────────── Future receivables forecast ─────────────── */

type ForecastMonth = { key: string; label: string; amount: number; saleCount: number };

function Forecast({ forecast }: { forecast: { months: ForecastMonth[]; total: number; salesParceladas: number } }) {
  const { months, total, salesParceladas } = forecast;
  const max = Math.max(1, ...months.map((m) => m.amount));
  return (
    <section aria-labelledby="forecast" className="glass rounded-xl p-5 mb-6 border border-border">
      <header className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h2 id="forecast" className="text-base font-semibold inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> 🔮 Previsão de Recebimento Futuro
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Parcelas líquidas de cartão de crédito já garantidas pelas vendas concluídas · {salesParceladas} venda(s) parcelada(s)
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">A receber (total)</p>
          <p className="text-xl font-bold tabular-nums text-emerald-500">{BRL(total)}</p>
        </div>
      </header>

      {months.length === 0 ? (
        <p className="text-sm text-muted-foreground italic px-1">
          Nenhuma venda parcelada no crédito ainda. Ao registrar uma venda em <strong className="not-italic text-foreground">2x ou mais</strong> no PDV,
          o fluxo futuro aparece automaticamente aqui.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {months.map((m) => {
            const pct = (m.amount / max) * 100;
            return (
              <li key={m.key} className="p-3 rounded-lg bg-secondary/50 border border-border flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{m.label}</p>
                  <p className="text-[10px] tabular-nums text-muted-foreground">{m.saleCount}×</p>
                </div>
                <p className="text-sm font-bold tabular-nums text-emerald-500">{BRL(m.amount)}</p>
                <div className="h-1.5 w-full bg-background/60 rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500/60 to-emerald-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-[11px] text-muted-foreground italic">
        Cálculo simulado: valor líquido (bruto − taxa de crédito 3,2%) dividido pelas parcelas, com cada parcela caindo a cada 30 dias.
      </p>
    </section>
  );
}

/* ─────────────── Cash closing ─────────────── */

function ProfitPanel({ totals }: { totals: ReturnType<typeof computeReport>["totals"] }) {
  const items = [
    { label: "Faturamento Bruto", value: BRL(totals.bruto), hint: `${totals.qtdVendas} venda(s) concluída(s)`, tone: "default" as const },
    { label: "Custo dos Produtos", value: BRL(totals.custoReal), hint: "Soma do preço de custo × quantidade", tone: "warn" as const },
    { label: "Lucro Real", value: BRL(totals.lucroReal), hint: `Margem real ${totals.margemReal.toFixed(1)}%`, tone: "success" as const },
    { label: "Ticket Médio", value: BRL(totals.ticketMedio), hint: "Faturamento ÷ nº de vendas", tone: "default" as const },
  ];
  return (
    <section aria-labelledby="profit" className="glass rounded-xl p-5 mb-6 border border-border">
      <header className="mb-5">
        <h2 id="profit" className="text-base font-semibold inline-flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Faturamento & Lucro Real
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Lucro calculado item a item (preço de venda − preço de custo cadastrado no produto).
        </p>
      </header>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((k) => (
          <div key={k.label} className="p-3 rounded-lg bg-secondary/60 border border-border">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{k.label}</p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${
              k.tone === "success" ? "text-emerald-500" : k.tone === "warn" ? "text-amber-500" : ""
            }`}>{k.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{k.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CashClosing({ closing, totals }: { closing: PaymentRow[]; totals: ReturnType<typeof computeReport>["totals"] }) {
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  return (
    <section aria-labelledby="cash" className="glass rounded-xl p-5 mb-6 border border-border">
      <header className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h2 id="cash" className="text-base font-semibold inline-flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" /> Fechamento de Caixa do Dia
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{today} · {totals.qtdVendas} venda(s) concluída(s)</p>
        </div>
        <div className="flex gap-3 text-right">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Bruto</p>
            <p className="text-xl font-bold tabular-nums">{BRL(totals.bruto)}</p>
          </div>
          <div className="border-l border-border pl-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Líquido</p>
            <p className="text-xl font-bold tabular-nums text-emerald-500">{BRL(totals.liquido)}</p>
          </div>
        </div>
      </header>

      <ul className="space-y-2">
        {closing.map((row) => {
          const Icon = row.icon;
          const pct = totals.bruto > 0 ? (row.bruto / totals.bruto) * 100 : 0;
          return (
            <li key={row.method} className="p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="inline-flex items-center gap-2">
                  <span className="w-8 h-8 grid place-items-center rounded-md bg-primary/15 text-primary">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{row.method}</p>
                    <p className="text-[11px] text-muted-foreground">{row.count} transação(ões) · {pct.toFixed(1)}% do bruto</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums">{BRL(row.bruto)}</p>
                  <p className="text-[11px] text-emerald-500 tabular-nums">líq. {BRL(row.liquido)}</p>
                </div>
              </div>
              <div className="h-1.5 w-full bg-background/60 rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-[11px] text-muted-foreground italic">
        Confira o valor em <strong className="text-foreground not-italic">Dinheiro</strong> registrado acima com o caixa físico antes de fechar.
      </p>
    </section>
  );
}

/* ─────────────── ABC curve ─────────────── */

type ABCRow = { id: string; name: string; unit: Product["unit"]; qty: number; receita: number };

function CurvaABC({ abc }: { abc: { byVolume: ABCRow[]; byReceita: ABCRow[] } }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
      <RankingCard
        title="Top 5 — Mais Vendidos (volume)"
        subtitle="Quantidade total vendida no período, respeitando a unidade"
        icon={Trophy}
        rows={abc.byVolume}
        valueRender={(r) => (
          <span className="tabular-nums">
            {formatQty(r.qty, r.unit)} <span className="text-[10px] text-muted-foreground font-normal">{r.unit}</span>
          </span>
        )}
        max={Math.max(...abc.byVolume.map((r) => r.qty))}
        bar={(r) => r.qty}
      />
      <RankingCard
        title="Top 5 — Maior Receita Líquida"
        subtitle="Quantidade × preço de venda, após descontos médios"
        icon={TrendingUp}
        rows={abc.byReceita}
        valueRender={(r) => <span className="tabular-nums text-emerald-500 font-bold">{BRL(r.receita)}</span>}
        max={Math.max(...abc.byReceita.map((r) => r.receita))}
        bar={(r) => r.receita}
      />
    </div>
  );
}

function RankingCard({
  title, subtitle, icon: Icon, rows, valueRender, max, bar,
}: {
  title: string;
  subtitle: string;
  icon: typeof Trophy;
  rows: ABCRow[];
  valueRender: (r: ABCRow) => React.ReactNode;
  max: number;
  bar: (r: ABCRow) => number;
}) {
  return (
    <section className="glass rounded-xl p-5 border border-border">
      <header className="mb-4">
        <h2 className="text-base font-semibold inline-flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" /> {title}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </header>
      <ol className="space-y-3">
        {rows.map((r, i) => {
          const pct = max > 0 ? (bar(r) / max) * 100 : 0;
          return (
            <li key={r.id} className="flex items-center gap-3">
              <span className="w-7 h-7 shrink-0 grid place-items-center rounded-md bg-secondary border border-border text-xs font-bold tabular-nums">
                {i + 1}º
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium truncate">{r.name}</p>
                  <p className="text-sm shrink-0">{valueRender(r)}</p>
                </div>
                <div className="h-1.5 w-full bg-background/60 rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-primary/80 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/* ─────────────── Derivations ─────────────── */

function computeReport() {
  const concluded = SALES.filter((s) => s.status === "concluida");

  // Map mock's native methods into the PDV's 4 (Cartão → 60% Crédito + 40% Débito).
  const buckets: Record<PaymentRow["method"], { bruto: number; count: number }> = {
    Dinheiro: { bruto: 0, count: 0 },
    Pix: { bruto: 0, count: 0 },
    Crédito: { bruto: 0, count: 0 },
    Débito: { bruto: 0, count: 0 },
  };
  for (const s of concluded) {
    if (s.payment === "Dinheiro") {
      buckets.Dinheiro.bruto += s.total; buckets.Dinheiro.count += 1;
    } else if (s.payment === "Pix") {
      buckets.Pix.bruto += s.total; buckets.Pix.count += 1;
    } else {
      buckets.Crédito.bruto += s.total * 0.6; buckets.Crédito.count += 1;
      buckets.Débito.bruto += s.total * 0.4; buckets.Débito.count += 1;
    }
  }
  // Net = bruto − taxa (Crédito 3.2%, Débito 1.5%, Pix 0.99%, Dinheiro 0%).
  const fee: Record<PaymentRow["method"], number> = { Dinheiro: 0, Pix: 0.0099, Crédito: 0.032, Débito: 0.015 };
  const icons: Record<PaymentRow["method"], typeof Banknote> = {
    Dinheiro: Banknote, Pix: QrCode, Crédito: CreditCard, Débito: CreditCard,
  };
  const closing: PaymentRow[] = (Object.keys(buckets) as PaymentRow["method"][]).map((m) => ({
    method: m,
    icon: icons[m],
    bruto: +buckets[m].bruto.toFixed(2),
    liquido: +(buckets[m].bruto * (1 - fee[m])).toFixed(2),
    count: buckets[m].count,
  })).sort((a, b) => b.bruto - a.bruto);

  const bruto = closing.reduce((a, c) => a + c.bruto, 0);
  const liquido = closing.reduce((a, c) => a + c.liquido, 0);
  const qtdVendas = concluded.length;
  const ticketMedio = qtdVendas > 0 ? bruto / qtdVendas : 0;

  // Lucro REAL = bruto − custo de cada item vendido.
  // Para vendas seedadas sem `cost`, usa aproximação de 65% do total como custo.
  const custoReal = concluded.reduce(
    (a, s) => a + (typeof s.cost === "number" ? s.cost : s.total * 0.65),
    0,
  );
  const lucroReal = bruto - custoReal;
  const margemReal = bruto > 0 ? (lucroReal / bruto) * 100 : 0;

  // ABC curve — synthesize per-product 30d sales from a deterministic seed.
  const abcRows: ABCRow[] = PRODUCTS.map((p, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    const factor = seed / 233280;
    const baseQty = 5 + Math.round(factor * 145);
    const qty = p.unit === "un"
      ? baseQty
      : +(baseQty * (0.5 + factor * 1.5)).toFixed(2);
    return { id: p.id, name: p.name, unit: p.unit, qty, receita: +(qty * p.salePrice * 0.96).toFixed(2) };
  });

  const byVolume = [...abcRows].sort((a, b) => b.qty - a.qty).slice(0, 5);
  const byReceita = [...abcRows].sort((a, b) => b.receita - a.receita).slice(0, 5);

  return {
    closing,
    totals: {
      bruto, liquido, qtdVendas, ticketMedio,
      lucroOp: liquido * 0.324,
      custoReal: +custoReal.toFixed(2),
      lucroReal: +lucroReal.toFixed(2),
      margemReal: +margemReal.toFixed(1),
    },
    abc: { byVolume, byReceita },
    forecast: computeForecast(),
  };
}

function computeForecast(): { months: ForecastMonth[]; total: number; salesParceladas: number } {
  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const buckets = new Map<string, { amount: number; saleCount: number; date: Date }>();
  let salesParceladas = 0;

  for (const s of SALES) {
    if (s.status !== "concluida") continue;
    if (s.payment !== "Cartão") continue;
    const n = s.installments ?? 1;
    if (n <= 1) continue;
    salesParceladas += 1;
    const liquido = s.total * (1 - 0.032);
    const perParcel = +(liquido / n).toFixed(2);
    const saleDate = new Date(s.date);
    for (let i = 1; i <= n; i++) {
      const due = new Date(saleDate);
      due.setMonth(due.getMonth() + i);
      const key = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}`;
      // Apenas meses futuros (descarta parcelas que já venceram).
      if (key <= thisMonthKey) continue;
      const b = buckets.get(key) ?? { amount: 0, saleCount: 0, date: new Date(due.getFullYear(), due.getMonth(), 1) };
      b.amount = +(b.amount + perParcel).toFixed(2);
      b.saleCount += 1;
      buckets.set(key, b);
    }
  }

  const months: ForecastMonth[] = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 12)
    .map(([key, v]) => ({
      key,
      label: v.date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", ""),
      amount: v.amount,
      saleCount: v.saleCount,
    }));

  const total = months.reduce((a, m) => a + m.amount, 0);
  return { months, total, salesParceladas };
}
