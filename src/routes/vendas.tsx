import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import {
  BRL, PRODUCTS, SALES, CUSTOMERS,
  addCreditDebt, formatQty, isFractional,
  type Product, type Sale,
} from "@/lib/mock-data";
import { useMockStore } from "@/hooks/use-mock-store";
import { AlertTriangle, Banknote, CreditCard, CheckCircle2, Percent, QrCode, Receipt, Search, Trash2, User, Wallet, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const Route = createFileRoute("/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas (PDV) — Meu Saas" },
      { name: "description", content: "PDV ultra-rápido com atalhos F1/F2/F4/F12, desconto em R$ ou %, múltiplas formas de pagamento e quantidade decimal." },
      { property: "og:title", content: "Vendas (PDV) — Meu Saas" },
      { property: "og:description", content: "Frente de caixa com atalhos de teclado e pagamento dividido." },
      { property: "og:url", content: "/vendas" },
    ],
    links: [{ rel: "canonical", href: "/vendas" }],
  }),
  component: VendasPage,
});

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  unit: Product["unit"];
  stock: number;
};

type PaymentMethod = "Dinheiro" | "Pix" | "Crédito" | "Débito" | "Crediário";
const PAYMENT_METHODS: { id: PaymentMethod; icon: typeof Banknote }[] = [
  { id: "Dinheiro", icon: Banknote },
  { id: "Pix", icon: QrCode },
  { id: "Crédito", icon: CreditCard },
  { id: "Débito", icon: CreditCard },
  { id: "Crediário", icon: Wallet },
];

type Split = { method: PaymentMethod; amount: number };

function VendasPage() {
  useMockStore();
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [discountMode, setDiscountMode] = useState<"valor" | "percent">("percent");
  const [splits, setSplits] = useState<Split[]>([]);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [customerId, setCustomerId] = useState<string>("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);

  const customer = customerId ? CUSTOMERS.find((c) => c.id === customerId) ?? null : null;
  const customerMatches = useMemo(() => {
    const n = customerQuery.toLowerCase().trim();
    if (!n) return CUSTOMERS.slice(0, 6);
    return CUSTOMERS.filter((c) => c.name.toLowerCase().includes(n) || c.doc.includes(n)).slice(0, 6);
  }, [customerQuery]);

  const searchRef = useRef<HTMLInputElement>(null);
  const discountRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!q) return [] as Product[];
    const n = q.toLowerCase();
    return PRODUCTS.filter((p) => p.name.toLowerCase().includes(n) || p.ean.includes(q)).slice(0, 6);
  }, [q]);

  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const discountValue = Math.min(
    subtotal,
    discountMode === "percent" ? subtotal * (discount / 100) : discount,
  );
  const total = Math.max(0, subtotal - discountValue);
  const paid = splits.reduce((a, s) => a + s.amount, 0);
  const remaining = +(total - paid).toFixed(2);

  // Credit limit check — sum of crediário splits + customer's current debt vs limit
  const credInSplits = splits.filter((s) => s.method === "Crediário").reduce((a, s) => a + s.amount, 0);
  const projectedDebt = customer ? customer.currentDebt + credInSplits : 0;
  const creditAvailable = customer ? Math.max(0, customer.creditLimit - customer.currentDebt - credInSplits) : 0;
  const creditBlocked = !!customer && customer.creditLimit > 0 && projectedDebt >= customer.creditLimit;

  const add = useCallback((p: Product) => {
    setCart((c) => {
      const ex = c.find((x) => x.id === p.id);
      const step = isFractional(p.unit) ? 1 : 1;
      if (ex) return c.map((x) => (x.id === p.id ? { ...x, qty: +(x.qty + step).toFixed(3) } : x));
      return [...c, { id: p.id, name: p.name, price: p.salePrice, qty: 1, unit: p.unit, stock: p.stock }];
    });
    setQ("");
  }, []);

  const setQty = (id: string, raw: string) => {
    setCart((c) =>
      c.map((x) => {
        if (x.id !== id) return x;
        const parsed = parseFloat(raw.replace(",", "."));
        if (isNaN(parsed) || parsed < 0) return { ...x, qty: 0 };
        const qty = isFractional(x.unit) ? +parsed.toFixed(3) : Math.max(1, Math.floor(parsed));
        return { ...x, qty };
      }),
    );
  };

  const finalize = useCallback(() => {
    if (cart.length === 0) return toast.error("Carrinho vazio.");
    if (paid + 0.01 < total) return toast.error(`Pagamento incompleto. Falta ${BRL(remaining)}.`);

    const credAmount = splits.filter((s) => s.method === "Crediário").reduce((a, s) => a + s.amount, 0);
    if (credAmount > 0) {
      if (!customer) {
        return toast.error("Selecione um cliente para vendas no Crediário.");
      }
      if (customer.creditLimit > 0 && customer.currentDebt + credAmount > customer.creditLimit + 0.0001) {
        return toast.error("Limite de crédito excedido", {
          description: `Disponível: ${BRL(Math.max(0, customer.creditLimit - customer.currentDebt))}`,
        });
      }
    }

    // Decrement stock
    cart.forEach((item) => {
      const p = PRODUCTS.find((pp) => pp.id === item.id);
      if (p) p.stock = +Math.max(0, p.stock - item.qty).toFixed(3);
    });

    // Register credit debt against customer
    if (credAmount > 0 && customer) {
      const ref = `V${20300 + Math.floor(Math.random() * 9999)}`;
      addCreditDebt(customer.id, credAmount, ref);
    }

    toast.success(`Venda concluída — ${BRL(total)}`, {
      description: `${cart.length} item(ns) · ${splits.map((s) => s.method).join(" + ") || "—"}${customer ? ` · ${customer.name}` : ""}`,
    });
    setCart([]);
    setSplits([]);
    setDiscount(0);
    setShowDiscount(false);
    setShowPayment(false);
    setCustomerId("");
    setCustomerQuery("");
  }, [cart, paid, total, remaining, splits, customer]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "F1") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (e.key === "F2") {
        e.preventDefault();
        setShowDiscount(true);
        setTimeout(() => discountRef.current?.focus(), 50);
      } else if (e.key === "F4") {
        e.preventDefault();
        setShowPayment(true);
      } else if (e.key === "F12") {
        e.preventDefault();
        finalize();
      } else if (e.key === "Enter" && !isTyping && cart.length > 0 && remaining <= 0.01) {
        e.preventDefault();
        finalize();
      } else if (e.key === "Escape") {
        setShowDiscount(false);
        setShowPayment(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [finalize, cart.length, remaining]);

  const addSplit = (method: PaymentMethod, amount: number) => {
    if (amount <= 0) return;
    if (method === "Crediário") {
      if (!customer) {
        return toast.error("Selecione um cliente para usar o Crediário.");
      }
      if (customer.creditLimit > 0) {
        const available = Math.max(0, customer.creditLimit - customer.currentDebt - credInSplits);
        if (amount > available + 0.0001) {
          return toast.error("Limite de crédito excedido", {
            description: `Disponível para ${customer.name}: ${BRL(available)}`,
          });
        }
      }
    }
    setSplits((s) => [...s, { method, amount: +amount.toFixed(2) }]);
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
    <AppShell title="Frente de Caixa (PDV)" breadcrumb={["Meu Saas", "Vendas"]}>
      <section aria-labelledby="pdv" className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <h2 id="pdv" className="sr-only">Ponto de venda</h2>

        {/* LEFT: Search + Cart */}
        <div className="lg:col-span-3 glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">Adicionar produto</h3>
            <kbd className="px-2 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono text-muted-foreground">F1</kbd>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && results[0]) { e.preventDefault(); add(results[0]); } }}
              placeholder="EAN ou nome do produto... (F1)"
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
                        <p className="text-xs text-muted-foreground font-mono">
                          {p.ean} · estoque {formatQty(p.stock, p.unit)} {p.unit}
                        </p>
                      </div>
                      <span className="font-semibold text-primary shrink-0 ml-3">{BRL(p.salePrice)}</span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>

          <div className="mt-5">
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Carrinho ({cart.length})</h4>
            <ul className="rounded-lg border border-border divide-y divide-border bg-card">
              {cart.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Carrinho vazio — pressione F1 e busque um produto</li>}
              {cart.map((item) => (
                <li key={item.id} className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{BRL(item.price)} / {item.unit}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={item.qty}
                      step={isFractional(item.unit) ? "0.01" : "1"}
                      min={isFractional(item.unit) ? "0" : "1"}
                      inputMode="decimal"
                      onChange={(e) => setQty(item.id, e.target.value)}
                      aria-label={`Quantidade em ${item.unit}`}
                      className="w-20 h-8 text-right tabular-nums px-2 rounded border border-border bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                    />
                    <span className="text-[11px] font-mono text-muted-foreground w-6">{item.unit}</span>
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

        {/* RIGHT: Summary */}
        <aside className="lg:col-span-2 glass rounded-xl p-5 flex flex-col">
          <h3 className="text-base font-semibold mb-1">Resumo da venda</h3>
          <p className="text-xs text-muted-foreground mb-5">{cart.reduce((a, c) => a + c.qty, 0).toLocaleString("pt-BR")} item(ns)</p>

          {/* Customer selector */}
          <div className="mb-4">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente</label>
            {customer ? (
              <div className="mt-1 rounded-md border border-border bg-secondary/60 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{customer.name}</p>
                    <p className="text-[11px] font-mono text-muted-foreground">{customer.doc}</p>
                  </div>
                  <button onClick={() => { setCustomerId(""); setCustomerQuery(""); }} aria-label="Remover cliente" className="text-muted-foreground hover:text-primary">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {customer.creditLimit > 0 && (
                  <div className="mt-2 text-[11px] flex items-center justify-between text-muted-foreground">
                    <span>Crédito disponível</span>
                    <span className={`font-semibold tabular-nums ${creditAvailable <= 0 ? "text-primary" : "text-emerald-500"}`}>
                      {BRL(creditAvailable)} <span className="opacity-60">/ {BRL(customer.creditLimit)}</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative mt-1">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={customerQuery}
                  onChange={(e) => { setCustomerQuery(e.target.value); setCustomerOpen(true); }}
                  onFocus={() => setCustomerOpen(true)}
                  onBlur={() => setTimeout(() => setCustomerOpen(false), 150)}
                  placeholder="Consumidor (opcional)..."
                  className="w-full h-9 pl-8 pr-3 rounded-md bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <AnimatePresence>
                  {customerOpen && customerMatches.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="absolute z-10 mt-1 w-full rounded-md border border-border bg-card divide-y divide-border shadow-lg max-h-64 overflow-auto"
                    >
                      {customerMatches.map((c) => (
                        <li key={c.id}>
                          <button
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { setCustomerId(c.id); setCustomerQuery(""); setCustomerOpen(false); }}
                            className="w-full text-left p-2.5 hover:bg-accent transition flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{c.name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{c.doc}</p>
                            </div>
                            {c.currentDebt > 0 && (
                              <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 tabular-nums">
                                deve {BRL(c.currentDebt)}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{BRL(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground inline-flex items-center gap-1">
                Desconto
                <kbd className="px-1.5 py-0 rounded bg-secondary border border-border text-[10px] font-mono">F2</kbd>
              </dt>
              <dd className="tabular-nums text-primary">{discountValue > 0 ? `− ${BRL(discountValue)}` : "—"}</dd>
            </div>
          </dl>

          <AnimatePresence>
            {showDiscount && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="mt-3 rounded-lg border border-border bg-secondary/50 p-3 overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setDiscountMode("percent")}
                    className={`flex-1 h-8 rounded text-xs font-semibold inline-flex items-center justify-center gap-1 ${discountMode === "percent" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}
                  ><Percent className="w-3 h-3" /> Porcentagem</button>
                  <button
                    onClick={() => setDiscountMode("valor")}
                    className={`flex-1 h-8 rounded text-xs font-semibold ${discountMode === "valor" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}
                  >R$ Valor fixo</button>
                </div>
                <input
                  ref={discountRef}
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder={discountMode === "percent" ? "Ex: 10 (= 10%)" : "Ex: 25.50"}
                  className="w-full h-9 px-3 rounded bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="my-4 border-t border-border" />
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-3xl font-bold tracking-tight tabular-nums">{BRL(total)}</p>
          </div>

          {/* Splits */}
          {splits.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {splits.map((s, i) => (
                <li key={i} className="flex items-center justify-between text-xs bg-secondary/60 border border-border rounded px-2.5 py-1.5">
                  <span className="font-semibold">{s.method}</span>
                  <span className="flex items-center gap-2 tabular-nums">
                    {BRL(s.amount)}
                    <button onClick={() => setSplits((arr) => arr.filter((_, j) => j !== i))} aria-label="Remover" className="text-muted-foreground hover:text-primary">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </li>
              ))}
              <li className={`flex justify-between text-xs px-2.5 ${remaining > 0.01 ? "text-primary font-bold" : "text-emerald-500 font-semibold"}`}>
                <span>{remaining > 0.01 ? "Falta" : "Quitado"}</span>
                <span className="tabular-nums">{BRL(Math.max(0, remaining))}</span>
              </li>
            </ul>
          )}

          {creditBlocked && (
            <div className="mt-3 flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                <strong>Limite de crédito excedido.</strong> O cliente {customer?.name} ultrapassou o limite de {BRL(customer?.creditLimit ?? 0)}. Solicite quitação parcial ou utilize outra forma de pagamento.
              </p>
            </div>
          )}

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forma de pagamento</p>
              <kbd className="px-2 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono text-muted-foreground">F4</kbd>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {PAYMENT_METHODS.map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => addSplit(id, remaining > 0 ? remaining : total)}
                  disabled={cart.length === 0 || (id === "Crediário" && (creditBlocked || !customer))}
                  title={id === "Crediário" && !customer ? "Selecione um cliente" : id === "Crediário" && creditBlocked ? "Limite excedido" : undefined}
                  className={`flex flex-col items-center gap-1 py-2 rounded-md bg-secondary border text-[10px] font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${showPayment ? "border-primary/60 ring-1 ring-primary/40" : "border-border"} hover:border-primary hover:bg-accent`}
                >
                  <Icon className="w-4 h-4" /> {id}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={finalize}
            disabled={cart.length === 0}
            className="mt-3 h-12 rounded-md bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-bold shadow-[0_0_24px_-6px_rgba(139,0,0,0.8)] inline-flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Finalizar venda
            <kbd className="ml-1 px-1.5 py-0.5 rounded bg-primary-foreground/15 text-[10px] font-mono">F12</kbd>
          </button>
        </aside>
      </section>

      {/* Shortcut legend bar */}
      <div className="mb-8 rounded-lg border border-border bg-card/60 px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><Receipt className="w-3.5 h-3.5" /> Atalhos:</span>
        <Shortcut keyLabel="F1" desc="Buscar" />
        <Shortcut keyLabel="F2" desc="Desconto" />
        <Shortcut keyLabel="F4" desc="Pagamento" />
        <Shortcut keyLabel="F12" desc="Concluir" />
        <Shortcut keyLabel="Enter" desc="Concluir (quitado)" />
        <Shortcut keyLabel="Esc" desc="Fechar painel" />
      </div>

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

function Shortcut({ keyLabel, desc }: { keyLabel: string; desc: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border font-mono text-[10px] text-foreground">{keyLabel}</kbd>
      {desc}
    </span>
  );
}