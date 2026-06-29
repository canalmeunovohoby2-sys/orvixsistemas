import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { AppShell } from "@/components/AppShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { BRL, KPIS, SALES, SALES_BY_DAY, TOP_PRODUCTS, CATEGORY_SHARE, type Sale } from "@/lib/mock-data";
import { motion } from "framer-motion";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, Boxes, AlertTriangle } from "lucide-react";

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

const KPI_CARDS = [
  { label: "Vendas (mês)", value: BRL(KPIS.vendasMes), trend: 12.4, icon: DollarSign, positive: true },
  { label: "Lucro (mês)", value: BRL(KPIS.lucroMes), trend: 8.1, icon: TrendingUp, positive: true },
  { label: "Itens em Estoque", value: KPIS.itensEstoque.toLocaleString("pt-BR"), trend: -2.3, icon: Boxes, positive: false },
  { label: "Estoque Baixo", value: String(KPIS.estoqueBaixo), trend: 4, icon: AlertTriangle, positive: false, alert: true },
];

const CHART_COLORS = ["#8B0000", "#5A8FB8", "#5BA67C", "#C9A961", "#8B6F8E"];

function DashboardPage() {
  const recent = SALES.slice(0, 6);

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
      {/* KPIs */}
      <section aria-labelledby="kpis" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <h2 id="kpis" className="sr-only">Indicadores</h2>
        {KPI_CARDS.map((k, i) => (
          <motion.article
            key={k.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="glass rounded-xl p-5"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{k.label}</p>
              <div className={`w-9 h-9 rounded-lg grid place-items-center ${k.alert ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"}`}>
                <k.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">{k.value}</p>
            <p className={`mt-1 inline-flex items-center gap-1 text-xs font-medium ${k.positive ? "text-emerald-400" : "text-primary"}`}>
              {k.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(k.trend)}% vs mês anterior
            </p>
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
              <AreaChart data={SALES_BY_DAY}>
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
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={CATEGORY_SHARE} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {CATEGORY_SHARE.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <section aria-labelledby="top-produtos" className="glass rounded-xl p-5">
          <h2 id="top-produtos" className="text-base font-semibold mb-1">Produtos mais vendidos</h2>
          <p className="text-xs text-muted-foreground mb-3">Unidades · mês atual</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TOP_PRODUCTS} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#888" fontSize={10} tickLine={false} axisLine={false} width={130} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="vendas" fill="#8B0000" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
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
    </AppShell>
  );
}
