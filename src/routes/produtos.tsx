import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { BRL, PRODUCTS, UNITS, formatQty, isFractional, type Product, type Unit } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Plus, X } from "lucide-react";

export const Route = createFileRoute("/produtos")({
  head: () => ({
    meta: [
      { title: "Produtos — Meu Saas" },
      { name: "description", content: "Cadastro e gerenciamento de produtos: EAN, preços, estoque atual e mínimo, fornecedor e categoria." },
      { property: "og:title", content: "Produtos — Meu Saas" },
      { property: "og:description", content: "Cadastro completo de produtos e inventário." },
      { property: "og:url", content: "/produtos" },
    ],
    links: [{ rel: "canonical", href: "/produtos" }],
  }),
  component: ProdutosPage,
});

function ProdutosPage() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "low" | "inactive">("all");

  const rows = PRODUCTS.filter((p) => {
    if (filter === "low") return p.stock <= p.minStock;
    if (filter === "inactive") return p.status === "inativo";
    return true;
  });

  const cols: Column<Product>[] = [
    { key: "ean", label: "EAN", render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.ean}</span> },
    { key: "name", label: "Produto", render: (r) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{r.name}</span>
          {r.stock <= r.minStock && (
            <span title="Estoque abaixo do mínimo" className="inline-flex items-center gap-1 rounded-md bg-primary/15 text-primary border border-primary/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3" aria-hidden /> Baixo
            </span>
          )}
        </div>
      ),
    },
    { key: "category", label: "Categoria" },
    { key: "unit", label: "Unidade", render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.unit}</span> },
    { key: "costPrice", label: "Custo", align: "right", render: (r) => BRL(r.costPrice) },
    { key: "salePrice", label: "Venda", align: "right", render: (r) => <span className="font-semibold">{BRL(r.salePrice)}</span> },
    { key: "stock", label: "Estoque", align: "right", render: (r) => (
        <span className={r.stock <= r.minStock ? "text-primary font-semibold" : ""}>
          {formatQty(r.stock, r.unit)} <span className="text-[10px] text-muted-foreground font-normal">{r.unit}</span>
        </span>
      ),
    },
    { key: "status", label: "Status", render: (r) => (
        <StatusBadge kind={r.status === "ativo" ? "success" : "warn"}>
          {r.status === "ativo" ? "Ativo" : "Inativo"}
        </StatusBadge>
      ),
    },
  ];

  return (
    <AppShell title="Gestão de Produtos" breadcrumb={["Meu Saas", "Produtos"]}>
      <DataTable<Product>
        rows={rows}
        columns={cols}
        searchKeys={["name", "ean", "category", "supplier"]}
        pageSize={10}
        rowClassName={(r) => (r.stock <= r.minStock ? "bg-primary/5 hover:bg-primary/10" : "")}
        toolbar={
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all" as const, label: `Todos (${PRODUCTS.length})` },
              { id: "low" as const, label: `Estoque baixo (${PRODUCTS.filter(p => p.stock <= p.minStock).length})` },
              { id: "inactive" as const, label: "Inativos" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`h-9 px-3 rounded-md text-xs font-medium border transition-colors ${
                  filter === f.id ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border hover:bg-accent"
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => setOpen(true)}
              className="ml-auto h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold shadow-[0_0_20px_-6px_rgba(139,0,0,0.7)]"
            >
              <Plus className="w-4 h-4" /> Novo produto
            </button>
          </div>
        }
      />

      <AnimatePresence>
        {open && <ProductDrawer onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </AppShell>
  );
}

function ProductDrawer({ onClose }: { onClose: () => void }) {
  const [unit, setUnit] = useState<Unit>("un");
  const decimalStep = isFractional(unit) ? "0.01" : "1";
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-50"
      />
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="fixed top-0 right-0 bottom-0 w-full max-w-md z-50 bg-card border-l border-border shadow-2xl flex flex-col"
        role="dialog" aria-label="Novo produto"
      >
        <header className="h-16 px-5 flex items-center justify-between border-b border-border">
          <h2 className="text-lg font-semibold">Novo produto</h2>
          <button onClick={onClose} aria-label="Fechar" className="w-9 h-9 grid place-items-center rounded-md hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        </header>
        <form className="flex-1 overflow-y-auto p-5 space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          {[
            { id: "name", label: "Nome do produto", type: "text", placeholder: "Ex: Cimento CP-II 50kg" },
            { id: "ean", label: "Código EAN", type: "text", placeholder: "7891234567890" },
            { id: "desc", label: "Descrição", type: "textarea" },
            { id: "cat", label: "Categoria", type: "select", options: ["Cimento", "Tintas", "Hidráulica", "Elétrica", "Ferragens"] },
            { id: "sup", label: "Fornecedor", type: "text" },
          ].map((f) => (
            <Field key={f.id} {...f} />
          ))}
          <div>
            <label htmlFor="unit" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Unidade de medida <span className="text-primary">*</span>
            </label>
            <select
              id="unit"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              className="w-full px-3 py-2 rounded-md bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60"
            >
              {UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {isFractional(unit)
                ? "Aceita quantidades fracionadas (ex: 2,50 ou 0,750)."
                : "Apenas quantidades inteiras (ex: 1, 2, 10)."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field id="cost" label="Preço de custo (R$)" type="number" />
            <Field id="sale" label="Preço de venda (R$)" type="number" step="0.01" min="0" />
            <Field id="stock" label={`Estoque inicial (${unit})`} type="number" step={decimalStep} min="0" />
            <Field id="min" label={`Estoque mínimo (${unit})`} type="number" step={decimalStep} min="0" />
          </div>
          <div className="pt-4 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-md border border-border hover:bg-accent text-sm font-medium">Cancelar</button>
            <button type="submit" className="flex-1 h-10 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold">Salvar produto</button>
          </div>
        </form>
      </motion.aside>
    </>
  );
}

function Field({ id, label, type, placeholder, options, step, min }: { id: string; label: string; type: string; placeholder?: string; options?: string[]; step?: string; min?: string }) {
  const base = "w-full px-3 py-2 rounded-md bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60";
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{label}</label>
      {type === "textarea" ? (
        <textarea id={id} rows={3} className={base} />
      ) : type === "select" ? (
        <select id={id} className={base}>
          {options!.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input id={id} type={type} placeholder={placeholder} step={step} min={min} inputMode={type === "number" ? "decimal" : undefined} className={base} />
      )}
    </div>
  );
}
