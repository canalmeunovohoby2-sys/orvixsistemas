import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { MOVEMENTS, PRODUCTS, deleteMovement, formatQty, type Movement } from "@/lib/mock-data";
import { AlertTriangle, ArrowDown, ArrowUp, RefreshCcw } from "lucide-react";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { useMockStore } from "@/hooks/use-mock-store";
import { toast } from "sonner";

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
  component: () => (<RoleGuard allow={["admin"]}><EstoquePage /></RoleGuard>),
});

function EstoquePage() {
  useMockStore();
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
    {
      key: "actions",
      label: "",
      align: "right",
      render: (r) => (
        <div className="flex justify-end">
          <ConfirmDelete
            triggerAriaLabel={`Remover movimentação ${r.id}`}
            triggerTitle="Remover movimentação"
            title="Expurgar movimentação?"
            description={<>Deseja remover a movimentação <strong className="text-foreground">{r.id}</strong> ({r.type} · {r.product})? Esta ação é permanente e não poderá ser desfeita.</>}
            confirmLabel="Sim, remover registro"
            onConfirm={() => {
              if (deleteMovement(r.id)) toast.success(`Movimentação ${r.id} removida.`);
            }}
          />
        </div>
      ),
    },
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

      <InventorySummary />
    </AppShell>
  );
}

function InventorySummary() {
  const [onlyLow, setOnlyLow] = useState(false);
  const lowCount = PRODUCTS.filter((p) => p.stock <= p.minStock).length;
  const rows = onlyLow ? PRODUCTS.filter((p) => p.stock <= p.minStock) : PRODUCTS;

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-bold">Resumo do inventário</h2>
        <button
          onClick={() => setOnlyLow((v) => !v)}
          aria-pressed={onlyLow}
          className={`inline-flex items-center gap-2 h-9 px-3 rounded-md text-xs font-bold uppercase tracking-wider border transition-all ${
            onlyLow
              ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_-6px_rgba(139,0,0,0.7)]"
              : "bg-secondary border-border hover:bg-accent"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Necessita Reposição
          <span className={`ml-1 grid place-items-center min-w-5 h-5 px-1 rounded-full text-[10px] ${onlyLow ? "bg-primary-foreground/20" : "bg-primary/15 text-primary"}`}>
            {lowCount}
          </span>
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-4 py-3 text-left">Produto</th>
              <th scope="col" className="px-4 py-3 text-left">Un.</th>
              <th scope="col" className="px-4 py-3 text-right">Estoque atual</th>
              <th scope="col" className="px-4 py-3 text-right">Mínimo</th>
              <th scope="col" className="px-4 py-3 text-left">Situação</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Nenhum produto com estoque baixo. 🎉</td></tr>
            )}
            {rows.slice(0, 20).map((p) => {
              const low = p.stock <= p.minStock;
              return (
                <tr key={p.id} className={`border-t border-border ${low ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-accent/40"} transition-colors`}>
                  <td className="px-4 py-3 font-medium">
                    <span className={low ? "text-primary" : ""}>{p.name}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.unit}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${low ? "text-primary font-bold" : ""}`}>{formatQty(p.stock, p.unit)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatQty(p.minStock, p.unit)}</td>
                  <td className="px-4 py-3">
                    {low ? (
                      <StatusBadge kind="danger">Estoque baixo</StatusBadge>
                    ) : p.stock <= p.minStock * 2 ? (
                      <StatusBadge kind="warn">Atenção</StatusBadge>
                    ) : (
                      <StatusBadge kind="success">Adequado</StatusBadge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
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
