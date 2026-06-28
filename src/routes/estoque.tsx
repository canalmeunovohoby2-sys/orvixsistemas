import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { MOVEMENTS, PRODUCTS, type Movement } from "@/lib/mock-data";
import { ArrowDown, ArrowUp, RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque — Meu Saas" },
      { name: "description", content: "Movimentações de estoque, entradas, saídas, ajustes e relatórios de inventário em tempo real." },
      { property: "og:title", content: "Estoque — Meu Saas" },
      { property: "og:description", content: "Movimentações e inventário em tempo real." },
      { property: "og:url", content: "/estoque" },
    ],
    links: [{ rel: "canonical", href: "/estoque" }],
  }),
  component: EstoquePage,
});

function EstoquePage() {
  const totalEntradas = MOVEMENTS.filter(m => m.type === "Entrada").reduce((a, m) => a + m.qty, 0);
  const totalSaidas = MOVEMENTS.filter(m => m.type === "Saída").reduce((a, m) => a + m.qty, 0);
  const totalAjustes = MOVEMENTS.filter(m => m.type === "Ajuste").length;

  const cols: Column<Movement>[] = [
    { key: "id", label: "Mov.", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "date", label: "Data", render: (r) => new Date(r.date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) },
    { key: "product", label: "Produto" },
    { key: "type", label: "Tipo", render: (r) => (
        <StatusBadge kind={r.type === "Entrada" ? "success" : r.type === "Saída" ? "danger" : "info"}>{r.type}</StatusBadge>
      ) },
    { key: "qty", label: "Quantidade", align: "right", render: (r) => <span className="font-semibold">{r.qty}</span> },
    { key: "user", label: "Usuário", render: (r) => <span className="text-muted-foreground">{r.user}</span> },
  ];

  return (
    <AppShell title="Movimentações de Estoque" breadcrumb={["Meu Saas", "Estoque"]}>
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard icon={ArrowDown} label="Entradas (30d)" value={totalEntradas} tone="success" />
        <SummaryCard icon={ArrowUp} label="Saídas (30d)" value={totalSaidas} tone="danger" />
        <SummaryCard icon={RefreshCcw} label="Ajustes" value={totalAjustes} tone="info" />
      </section>

      <DataTable<Movement>
        rows={MOVEMENTS}
        columns={cols}
        searchKeys={["product", "user", "id"]}
        pageSize={10}
      />

      <section className="mt-8">
        <h2 className="text-xl font-bold mb-3">Resumo do inventário</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-4 py-3 text-left">Produto</th>
                <th scope="col" className="px-4 py-3 text-right">Estoque atual</th>
                <th scope="col" className="px-4 py-3 text-right">Mínimo</th>
                <th scope="col" className="px-4 py-3 text-left">Situação</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.slice(0, 8).map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-right">{p.stock}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{p.minStock}</td>
                  <td className="px-4 py-3">
                    {p.stock <= p.minStock ? (
                      <StatusBadge kind="danger">Repor urgente</StatusBadge>
                    ) : p.stock <= p.minStock * 2 ? (
                      <StatusBadge kind="warn">Atenção</StatusBadge>
                    ) : (
                      <StatusBadge kind="success">Adequado</StatusBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }: { icon: typeof ArrowDown; label: string; value: number; tone: "success" | "danger" | "info" }) {
  const toneMap = {
    success: "bg-emerald-500/15 text-emerald-400",
    danger: "bg-primary/15 text-primary",
    info: "bg-sky-500/15 text-sky-400",
  };
  return (
    <article className="glass rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value.toLocaleString("pt-BR")}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg grid place-items-center ${toneMap[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </article>
  );
}
