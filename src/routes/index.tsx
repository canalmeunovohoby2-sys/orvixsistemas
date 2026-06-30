import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import {
  BRL, KPIS, PRODUCTS, SALES, SALES_BY_DAY, TOP_PRODUCTS, CATEGORY_SHARE,
  formatQty, type Sale,
} from "@/lib/mock-data";
import { useMockStore } from "@/hooks/use-mock-store";
import { useSaaS } from "@/lib/saas-context";
import { motion } from "framer-motion";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Boxes, AlertTriangle, PackageX, Sparkles, Sun, DoorClosed } from "lucide-react";
import { PlanDaysLeftBadge } from "@/components/PlanDaysLeftBadge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Meu Saas" },
      { name: "description", content: "Visão geral de vendas, lucro, estoque e produtos críticos em tempo real no Meu Saas." },
      { property: "og:title", content: "Dashboard — Meu Saas" },
      { property: "og:description", content: "Visão geral de vendas, lucro, estoque e produtos críticos." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: () => (<RoleGuard allow={["admin"]}><DashboardPage /></RoleGuard>),
});

const CHART_COLORS = ["#8B0000", "#5A8FB8", "#5BA67C", "#C9A961", "#8B6F8E"];

// Mesmas chaves usadas pelo PDV (src/routes/vendas.tsx) para persistir o
// histórico de turnos fechados. Mantemos aqui apenas o leitor — a escrita
// continua exclusiva do PDV.
type ShiftPaymentKey = "Dinheiro" | "Pix" | "Crédito" | "Débito" | "Crediário";
type ShiftHistoryEntry = {
  id: string;
  cid: string;
  userId: string;
  userName: string;
  openedAt: number;
  closedAt?: number;
  openingFloat: number;
  closingCash?: number;
  sales: { ts: number; method: ShiftPaymentKey; amount: number }[];
};
const SHIFT_HISTORY_KEY = (cid: string) => `orvix_pdv_shifts_history_${cid}`;
const ACTIVE_SHIFT_PREFIX = (cid: string) => `orvix_pdv_shift_${cid}_`;

function loadShiftHistory(cid: string | null): ShiftHistoryEntry[] {
  if (!cid || typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SHIFT_HISTORY_KEY(cid));
    return raw ? (JSON.parse(raw) as ShiftHistoryEntry[]) : [];
  } catch { return []; }
}

/**
 * Lê todos os turnos ATIVOS (não fechados) da empresa no localStorage.
 * O PDV grava um turno por (cid + userId), então pode haver múltiplos
 * caixas abertos em paralelo.
 */
function loadActiveShifts(cid: string | null): ShiftHistoryEntry[] {
  if (!cid || typeof window === "undefined") return [];
  const prefix = ACTIVE_SHIFT_PREFIX(cid);
  const out: ShiftHistoryEntry[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      try {
        const s = JSON.parse(raw) as ShiftHistoryEntry;
        if (!s.closedAt) out.push(s);
      } catch {}
    }
  } catch {}
  return out;
}

function isSameLocalDay(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear()
    && d.getMonth() === ref.getMonth()
    && d.getDate() === ref.getDate();
}

export function DashboardPage() {
  useMockStore();
  const { company, lastSync } = useSaaS();
  const cid = company?.id ?? null;
  // Dashboard só mostra dados fictícios para empresas marcadas explicitamente
  // como demonstração (flag estável `isDemo`). Empresas reais — criadas via
  // Super Admin, webhook MP ou self-signup — começam SEMPRE zeradas, mesmo
  // após delete/recreate (a flag não é herdada por ID reciclado).
  const demo = company?.isDemo === true;

  // Em empresas reais (não-demo) os dados ficam zerados até o lojista operar o sistema.
  const tenantProducts = useMemo(
    () => (cid ? PRODUCTS.filter((p) => p.company_id === cid) : []),
    [cid],
  );
  const tenantSales = useMemo(
    () => (cid ? SALES.filter((s) => s.company_id === cid) : []),
    [cid],
  );

  const vendasMes = demo
    ? KPIS.vendasMes
    : tenantSales.filter((s) => s.status === "concluida").reduce((a, s) => a + s.total, 0);
  const lucroMes = demo
    ? KPIS.lucroMes
    : tenantSales.filter((s) => s.status === "concluida").reduce((a, s) => a + (s.total - (s.cost ?? 0)), 0);
  const itensEstoque = tenantProducts.reduce((a, p) => a + p.stock, 0);
  const estoqueBaixo = tenantProducts.filter((p) => p.stock <= p.minStock).length;

  // FATURAMENTO (HOJE): soma bruta das vendas concluídas no dia local atual.
  // Recalcula a cada minuto para virar o dia automaticamente em telas abertas.
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  // Indicador de frescor dos dados — recalculado a cada minuto via o mesmo `now`.
  const syncStatus = useMemo(() => {
    if (!lastSync) {
      return { stale: true, label: "Aguardando sincronização inicial" };
    }
    const diffMin = Math.floor((now.getTime() - lastSync.getTime()) / 60_000);
    if (diffMin > 2) {
      return { stale: true, label: `Dados atualizados há ${diffMin} minutos` };
    }
    return { stale: false, label: `Sincronizado há ${Math.max(diffMin, 0)} min` };
  }, [lastSync, now]);

  const kpiCards = [
    { label: "Faturamento (hoje)", value: BRL(faturamentoHoje), trend: 0, icon: Sun, positive: true, highlight: true },
    { label: "Vendas (mês)", value: BRL(vendasMes), trend: demo ? 12.4 : 0, icon: DollarSign, positive: true },
    { label: "Lucro (mês)", value: BRL(lucroMes), trend: demo ? 8.1 : 0, icon: TrendingUp, positive: true },
    { label: "Itens em Estoque", value: itensEstoque.toLocaleString("pt-BR"), trend: demo ? -2.3 : 0, icon: Boxes, positive: false },
    { label: "Estoque Baixo", value: String(estoqueBaixo), trend: demo ? 4 : 0, icon: AlertTriangle, positive: false, alert: true },
  ];

  // Charts: demo usa séries pré-povoadas; tenants reais começam com séries vazias (14 dias zerados).
  const salesByDay = demo
    ? SALES_BY_DAY
    : Array.from({ length: 14 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (13 - i));
        return { day: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), vendas: 0, lucro: 0 };
      });
  const topProducts = demo ? TOP_PRODUCTS : [];
  const categoryShare = demo ? CATEGORY_SHARE : [];

  const recent = tenantSales.slice(0, 6);

  // Histórico de turnos fechados (PDV) — sincroniza em tempo real via
  // 1) evento custom "orvix:shifts-updated" disparado pelo PDV na mesma aba;
  // 2) "storage" para outras abas/dispositivos do mesmo navegador.
  const [shiftsTick, setShiftsTick] = useState(0);
  useEffect(() => {
    const onLocal = (e: Event) => {
      const ce = e as CustomEvent<{ cid?: string }>;
      if (!ce.detail?.cid || ce.detail.cid === cid) setShiftsTick((t) => t + 1);
    };
    const onStorage = (e: StorageEvent) => {
      if (cid && e.key && (
        e.key === SHIFT_HISTORY_KEY(cid) || e.key.startsWith(ACTIVE_SHIFT_PREFIX(cid))
      )) setShiftsTick((t) => t + 1);
    };
    window.addEventListener("orvix:shifts-updated", onLocal as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("orvix:shifts-updated", onLocal as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, [cid]);
  const closedShifts = useMemo(
    () => loadShiftHistory(cid).filter((s) => s.closedAt).slice(0, 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cid, shiftsTick],
  );

  /**
   * FATURAMENTO (HOJE) — fonte autoritativa: TURNOS persistidos no
   * localStorage (ativos + fechados). O array `SALES` em memória é
   * limpo a cada reload da aba, o que zerava o card mesmo com vendas
   * reais registradas. Somando direto dos shifts garantimos persistência
   * entre sessões e reflete em tempo real (via `orvix:shifts-updated`).
   */
  const faturamentoHoje = useMemo(() => {
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startTs = startOfDay.getTime();
    const endTs = startTs + 86_400_000;
    const shifts = [...loadActiveShifts(cid), ...loadShiftHistory(cid)];
    let total = 0;
    for (const sh of shifts) {
      for (const s of sh.sales ?? []) {
        if (s.ts >= startTs && s.ts < endTs) total += s.amount;
      }
    }
    // Fallback adicional: vendas em memória da sessão atual (cobre
    // empresas demo, que não passam pelo fluxo de abrir turno).
    if (total === 0) {
      total = tenantSales
        .filter((s) => s.status === "concluida" && isSameLocalDay(s.date, now))
        .reduce((a, s) => a + s.total, 0);
    }
    return total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid, now, shiftsTick, tenantSales]);

  const cols: Column<Sale>[] = [
    { key: "id", label: "Pedido", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "date", label: "Data", render: (r) => new Date(r.date).toLocaleDateString("pt-BR") },
    { key: "customer", label: "Cliente" },
    { key: "payment", label: "Pagamento" },
    {
      key: "status", label: "Status", render: (r) => (
        <StatusBadge kind={r.status === "concluida" ? "success" : r.status === "pendente" ? "warn" : "danger"}>
          {r.status === "concluida" ? "Concluída" : r.status === "pendente" ? "Pendente" : "Cancelada"}
        </StatusBadge>
      ),
    },
    { key: "total", label: "Total", align: "right", render: (r) => <span className="font-semibold">{BRL(r.total)}</span> },
  ];

  return (
    <AppShell title="Dashboard" breadcrumb={["Meu Saas", "Visão Geral"]}>
      <div className="mb-4 flex justify-end">
        <PlanDaysLeftBadge />
        <span className="mx-2" />
        <span
          className={
            "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium " +
            (syncStatus.stale
              ? "border-amber-400/50 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
              : "border-border bg-muted/40 text-muted-foreground")
          }
          aria-live="polite"
        >
          <span
            className={
              "h-1.5 w-1.5 rounded-full " +
              (syncStatus.stale ? "bg-amber-500" : "bg-emerald-500")
            }
          />
          {syncStatus.label}
        </span>
      </div>
      {!demo && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-foreground">Bem-vindo(a) à sua loja na ORVIX SISTEMAS</p>
            <p className="text-muted-foreground mt-0.5">
              Sua conta começa zerada. Cadastre produtos, registre vendas no Caixa e seus indicadores aparecerão aqui em tempo real.
            </p>
          </div>
        </div>
      )}

      {/* KPIs */}
      <section aria-labelledby="kpis" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        <h2 id="kpis" className="sr-only">Indicadores</h2>
        {kpiCards.map((k, i) => (
          <motion.article
            key={k.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`glass rounded-xl p-5 ${k.highlight ? "border border-primary/40 ring-1 ring-primary/20" : ""}`}
          >
            <div className="flex items-start justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{k.label}</p>
              <div className={`w-9 h-9 rounded-lg grid place-items-center ${k.alert || k.highlight ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"}`}>
                <k.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">{k.value}</p>
            {k.highlight ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })}
              </p>
            ) : demo ? (
              <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${k.positive ? "text-emerald-400" : "text-primary"}`}>
                {k.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(k.trend)}% vs mês anterior
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Sem histórico ainda</p>
            )}
          </motion.article>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        {/* Sales chart */}
        <section aria-labelledby="vendas-periodo" className="xl:col-span-2 glass rounded-xl p-5">
          <header className="flex items-center justify-between mb-4">
            <div>
              <h2 id="vendas-periodo" className="text-base font-semibold">Vendas por período</h2>
              <p className="text-xs text-muted-foreground">Últimos 14 dias · BRL</p>
            </div>
            <select aria-label="Período" className="h-8 px-2 rounded-md bg-secondary border border-border text-xs">
              <option>14 dias</option><option>30 dias</option><option>90 dias</option>
            </select>
          </header>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByDay}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B0000" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#8B0000" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5A8FB8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#5A8FB8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => BRL(v)} />
                <Area type="monotone" dataKey="vendas" stroke="#8B0000" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="lucro" stroke="#5A8FB8" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Category share */}
        <section aria-labelledby="categorias" className="glass rounded-xl p-5">
          <h2 id="categorias" className="text-base font-semibold mb-1">Mix por categoria</h2>
          <p className="text-xs text-muted-foreground mb-3">Participação nas vendas</p>
          <div className="h-56">
            {categoryShare.length === 0 ? (
              <EmptyChart label="Nenhuma venda categorizada ainda." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryShare} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {categoryShare.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <section aria-labelledby="top-produtos" className="glass rounded-xl p-5">
          <h2 id="top-produtos" className="text-base font-semibold mb-1">Produtos mais vendidos</h2>
          <p className="text-xs text-muted-foreground mb-3">Unidades · mês atual</p>
          <div className="h-72">
            {topProducts.length === 0 ? (
              <EmptyChart label="Cadastre produtos e registre vendas no Caixa para ver o ranking." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="#888" fontSize={10} tickLine={false} axisLine={false} width={130} />
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="vendas" fill="#8B0000" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section aria-labelledby="ultimas-vendas" className="xl:col-span-2">
          <h2 id="ultimas-vendas" className="sr-only">Últimas vendas</h2>
          <DataTable<Sale>
            rows={recent}
            columns={cols}
            searchKeys={["customer", "id"]}
            pageSize={6}
          />
        </section>
      </div>

      <CriticalAlerts />
      <ClosedShiftsList shifts={closedShifts} />
    </AppShell>
  );
}

function ClosedShiftsList({ shifts }: { shifts: ShiftHistoryEntry[] }) {
  if (shifts.length === 0) {
    return (
      <section aria-labelledby="ultimos-caixas" className="glass rounded-xl p-5 mb-6">
        <header className="flex items-center gap-2 mb-3">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-secondary text-foreground">
            <DoorClosed className="w-4 h-4" />
          </span>
          <div>
            <h2 id="ultimos-caixas" className="text-base font-semibold">Últimos Caixas Fechados</h2>
            <p className="text-xs text-muted-foreground">Histórico recente de turnos encerrados no PDV</p>
          </div>
        </header>
        <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-6 text-center text-sm text-muted-foreground">
          Nenhum caixa fechado ainda. Quando um operador encerrar o turno, o resumo aparecerá aqui.
        </div>
      </section>
    );
  }
  return (
    <section aria-labelledby="ultimos-caixas" className="glass rounded-xl p-5 mb-6">
      <header className="flex items-center gap-2 mb-3">
        <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary/15 text-primary">
          <DoorClosed className="w-4 h-4" />
        </span>
        <div>
          <h2 id="ultimos-caixas" className="text-base font-semibold">Últimos Caixas Fechados</h2>
          <p className="text-xs text-muted-foreground">{shifts.length} turno(s) recente(s) · atualiza em tempo real</p>
        </div>
      </header>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2.5 text-left">Turno</th>
              <th className="px-4 py-2.5 text-left">Operador</th>
              <th className="px-4 py-2.5 text-left">Fechado às</th>
              <th className="px-4 py-2.5 text-right">Vendas</th>
              <th className="px-4 py-2.5 text-right">Total bruto</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((s, idx) => {
              const total = s.sales.reduce((a, x) => a + x.amount, 0);
              const closed = s.closedAt ? new Date(s.closedAt) : null;
              return (
                <tr key={s.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs">
                    Caixa {String(shifts.length - idx).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-2.5 font-medium">{s.userName}</td>
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                    {closed ? closed.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{s.sales.length}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold text-foreground">{BRL(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-full w-full grid place-items-center text-center px-6">
      <div>
        <div className="w-12 h-12 mx-auto rounded-full bg-secondary border border-border grid place-items-center mb-2">
          <Boxes className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground max-w-xs">{label}</p>
      </div>
    </div>
  );
}

function CriticalAlerts() {
  const { user } = useSaaS();
  const cid = user?.companyId ?? "EMP001";
  const low = useMemo(
    () => PRODUCTS.filter((p) => p.company_id === cid && p.stock <= p.minStock),
    [cid],
  );
  const categories = useMemo(
    () => Array.from(new Set(low.map((p) => p.category))).sort(),
    [low],
  );
  const [cat, setCat] = useState<string>("all");
  const rows = cat === "all" ? low : low.filter((p) => p.category === cat);

  return (
    <section aria-labelledby="alertas-criticos" className="glass rounded-xl p-5 mb-6 border border-primary/30">
      <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary/15 text-primary">
            <AlertTriangle className="w-4 h-4" />
          </span>
          <div>
            <h2 id="alertas-criticos" className="text-base font-semibold">Alertas Críticos</h2>
            <p className="text-xs text-muted-foreground">
              Produtos em estoque mínimo ou zerados · {rows.length} item(ns)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="alert-cat" className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            Categoria
          </label>
          <select
            id="alert-cat"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="h-8 px-2 rounded-md bg-secondary border border-border text-xs"
          >
            <option value="all">Todas ({low.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c} ({low.filter((p) => p.category === c).length})
              </option>
            ))}
          </select>
          <Link
            to="/estoque"
            className="h-8 inline-flex items-center px-3 rounded-md bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90"
          >
            Repor
          </Link>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-secondary/30 p-6 text-center text-sm text-muted-foreground">
          🎉 Nenhum produto crítico nesta categoria. Estoque saudável.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 text-left">Produto</th>
                <th className="px-4 py-2.5 text-left">Categoria</th>
                <th className="px-4 py-2.5 text-right">Estoque</th>
                <th className="px-4 py-2.5 text-right">Mínimo</th>
                <th className="px-4 py-2.5 text-left">Situação</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 12).map((p) => {
                const zero = p.stock <= 0;
                return (
                  <tr key={p.id} className="border-t border-border bg-primary/5 hover:bg-primary/10 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{p.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.category}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${zero ? "text-primary" : "text-primary/90"}`}>
                      {formatQty(p.stock, p.unit)} {p.unit}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {formatQty(p.minStock, p.unit)} {p.unit}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge kind="danger">
                        {zero ? (<><PackageX className="w-3 h-3 mr-1 inline" />Sem estoque</>) : "Estoque baixo"}
                      </StatusBadge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length > 12 && (
            <p className="px-4 py-2 text-[11px] text-muted-foreground border-t border-border bg-secondary/40">
              Mostrando 12 de {rows.length}. <Link to="/estoque" className="text-primary font-semibold hover:underline">Ver todos →</Link>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
