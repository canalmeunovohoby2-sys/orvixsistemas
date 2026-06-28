import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { BRL, PRODUCTS, SALES, type Sale } from "@/lib/mock-data";
import { Banknote, CreditCard, Plus, QrCode, Search, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas (PDV) — Meu Saas" },
      { name: "description", content: "Ponto de venda integrado e histórico completo de vendas com filtros, status e formas de pagamento." },
      { property: "og:title", content: "Vendas (PDV) — Meu Saas" },
      { property: "og:description", content: "PDV e histórico de vendas em tempo real." },
      { property: "og:url", content: "/vendas" },
    ],
    links: [{ rel: "canonical", href: "/vendas" }],
  }),
  component: VendasPage,
});

type CartItem = { id: string; name: string; price: number; qty: number };

function VendasPage() {
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([
    { id: "P0001", name: "Cimento CP-II 50kg", price: 38.9, qty: 4 },
    { id: "P0007", name: "Chave de Fenda 6\"", price: 22.5, qty: 2 },
  ]);

  const results = useMemo(() => {
    if (!q) return [] as typeof PRODUCTS;
    const n = q.toLowerCase();
    return PRODUCTS.filter((p) => p.name.toLowerCase().includes(n) || p.ean.includes(q)).slice(0, 6);
  }, [q]);

  const total = cart.reduce((a, c) => a + c.price * c.qty, 0);

  const add = (p: typeof PRODUCTS[number]) => {
    setCart((c) => {
      const ex = c.find((x) => x.id === p.id);
      if (ex) return c.map((x) => x.id === p.id ? { ...x, qty: x.qty + 1 } : x);
      return [...c, { id: p.id, name: p.name, price: p.salePrice, qty: 1 }];
    });
    setQ("");
  };

  const cols: Column<Sale>[] = [
    { key: "id", label: "Pedido", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "date", label: "Data", render: (r) => new Date(r.date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) },
    { key: "customer", label: "Cliente" },
    { key: "items", label: "Itens", align: "right" },
    { key: "payment", label: "Pagamento" },
    { key: "status", label: "Status", render: (r) => (
        <StatusBadge kind={r.status === "concluida" ? "success" : r.status === "pendente" ? "warn" : "danger"}>
          {r.status === "concluida" ? "Concluída" : r.status === "pendente" ? "Pendente" : "Cancelada"}
        </StatusBadge>
      ) },
    { key: "total", label: "Total", align: "right", render: (r) => <span className="font-semibold">{BRL(r.total)}</span> },
  ];

  return (
    <AppShell title="Vendas" breadcrumb={["Meu Saas", "Vendas"]}>
      {/* PDV */}
      <section aria-labelledby="pdv" className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
        <h2 id="pdv" className="sr-only">Ponto de venda</h2>

        <div className="lg:col-span-3 glass rounded-xl p-5">
          <h3 className="text-base font-semibold mb-3">Buscar produto</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Digite EAN ou nome do produto..."
              aria-label="Buscar produto"
              className="w-full h-11 pl-10 pr-3 rounded-md bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>
          <AnimatePresence>
            {results.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-2 rounded-lg border border-border bg-card divide-y divide-border max-h-72 overflow-auto"
              >
                {results.map((p) => (
                  <li key={p.id}>
                    <button onClick={() => add(p)} className="w-full flex items-center justify-between p-3 text-left hover:bg-accent/60 transition">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.ean} · estoque {p.stock}</p>
                      </div>
                      <span className="font-semibold text-primary shrink-0 ml-3">{BRL(p.salePrice)}</span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>

          <div className="mt-5">
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Carrinho</h4>
            <ul className="rounded-lg border border-border divide-y divide-border bg-card">
              {cart.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Carrinho vazio</li>}
              {cart.map((item) => (
                <li key={item.id} className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{BRL(item.price)} cada</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCart((c) => c.map((x) => x.id === item.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} aria-label="Diminuir" className="w-7 h-7 rounded border border-border hover:bg-accent">−</button>
                    <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                    <button onClick={() => setCart((c) => c.map((x) => x.id === item.id ? { ...x, qty: x.qty + 1 } : x))} aria-label="Aumentar" className="w-7 h-7 rounded border border-border hover:bg-accent">+</button>
                  </div>
                  <p className="w-24 text-right font-semibold">{BRL(item.price * item.qty)}</p>
                  <button onClick={() => setCart((c) => c.filter((x) => x.id !== item.id))} aria-label="Remover" className="w-8 h-8 grid place-items-center rounded text-muted-foreground hover:bg-primary/20 hover:text-primary">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="lg:col-span-2 glass rounded-xl p-5 flex flex-col">
          <h3 className="text-base font-semibold mb-1">Resumo da venda</h3>
          <p className="text-xs text-muted-foreground mb-5">{cart.length} item(ns)</p>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{BRL(total)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Desconto</dt><dd>—</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Impostos</dt><dd>incluso</dd></div>
          </dl>
          <div className="my-4 border-t border-border" />
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-3xl font-bold tracking-tight">{BRL(total)}</p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <PayBtn icon={Banknote} label="Dinheiro" />
            <PayBtn icon={CreditCard} label="Cartão" />
            <PayBtn icon={QrCode} label="Pix" />
          </div>
          <button className="mt-3 h-12 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_24px_-6px_rgba(139,0,0,0.8)] inline-flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Finalizar venda
          </button>
        </aside>
      </section>

      <h2 className="text-xl font-bold mb-3">Histórico de vendas</h2>
      <DataTable<Sale>
        rows={SALES}
        columns={cols}
        searchKeys={["customer", "id"]}
        pageSize={10}
      />
    </AppShell>
  );
}

function PayBtn({ icon: Icon, label }: { icon: typeof Banknote; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1 py-3 rounded-md bg-secondary border border-border hover:border-primary hover:bg-accent text-xs font-semibold transition">
      <Icon className="w-5 h-5" /> {label}
    </button>
  );
}
