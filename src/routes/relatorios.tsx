import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { BRL, SALES_BY_DAY, TOP_PRODUCTS } from "@/lib/mock-data";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Download } from "lucide-react";

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
  component: RelatoriosPage,
});

function RelatoriosPage() {
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <section className="glass rounded-xl p-5">
          <h2 className="text-base font-semibold mb-1">Evolução de vendas</h2>
          <p className="text-xs text-muted-foreground mb-3">Últimos 14 dias</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SALES_BY_DAY}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => BRL(v)} />
                <Line type="monotone" dataKey="vendas" stroke="#8B0000" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="lucro" stroke="#5BA67C" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="glass rounded-xl p-5">
          <h2 className="text-base font-semibold mb-1">Ranking de produtos</h2>
          <p className="text-xs text-muted-foreground mb-3">Unidades vendidas no período</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TOP_PRODUCTS}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="vendas" fill="#8B0000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="glass rounded-xl p-5">
        <h2 className="text-base font-semibold mb-3">Indicadores estratégicos</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { l: "Ticket médio", v: "R$ 384,20" },
            { l: "Margem bruta", v: "32,4%" },
            { l: "Giro de estoque", v: "4,8x" },
            { l: "Ruptura", v: "2,1%" },
            { l: "Vendas concluídas", v: "94%" },
            { l: "Devoluções", v: "1,3%" },
            { l: "Conversão PDV", v: "87%" },
            { l: "Itens críticos", v: "12" },
          ].map((k) => (
            <div key={k.l} className="p-4 rounded-lg bg-secondary/60 border border-border">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{k.l}</p>
              <p className="mt-1.5 text-xl font-bold">{k.v}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
