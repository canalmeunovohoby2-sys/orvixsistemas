import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import {
  BRL, PRODUCTS, SALES, commitPdvSale,
  formatQty, isFractional,
  type Product, type Sale,
} from "@/lib/mock-data";
import { useMockStore } from "@/hooks/use-mock-store";
import { useSaaS } from "@/lib/saas-context";
import { Banknote, CreditCard, CheckCircle2, QrCode, Receipt, Search, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { XCircle } from "lucide-react";

export const Route = createFileRoute("/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas (PDV) — Meu Saas" },
      { name: "description", content: "PDV ultra-rápido com atalhos F1/F2/F4/F12, desconto em R$, múltiplas formas de pagamento e quantidade decimal." },
      { property: "og:title", content: "Vendas (PDV) — Meu Saas" },
      { property: "og:description", content: "Frente de caixa com atalhos de teclado e pagamento dividido." },
      { property: "og:url", content: "/vendas" },
    ],
    links: [{ rel: "canonical", href: "/vendas" }],
  }),
  component: () => (<RoleGuard allow={["admin","cashier"]}><VendasPage /></RoleGuard>),
});

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  unit: Product["unit"];
  stock: number;
};

type PaymentMethod = "Dinheiro" | "Pix" | "Crédito" | "Débito";
const PAYMENT_METHODS: { id: PaymentMethod; icon: typeof Banknote }[] = [
  { id: "Dinheiro", icon: Banknote },
  { id: "Pix", icon: QrCode },
  { id: "Crédito", icon: CreditCard },
  { id: "Débito", icon: CreditCard },
];

// Ordem oficial dos sub-atalhos de pagamento (teclas 1–4 após F4).
const PAYMENT_HOTKEYS = ["1", "2", "3", "4"] as const;

type Split = { method: PaymentMethod; amount: number; installments?: number };

const INSTALLMENT_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

function VendasPage() {
  useMockStore();
  const { user, company } = useSaaS();
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [splits, setSplits] = useState<Split[]>([]);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const searchRef = useRef<HTMLInputElement>(null);
  const discountRef = useRef<HTMLInputElement>(null);
  const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const resultRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const confirmCancelRef = useRef<HTMLButtonElement>(null);

  const results = useMemo(() => {
    if (!q) return [] as Product[];
    const n = q.toLowerCase();
    // Lista completa filtrada — a navegação por setas faz scroll automático
    // dentro do container, então não truncamos resultados.
    return PRODUCTS.filter((p) => p.name.toLowerCase().includes(n) || p.ean.includes(q));
  }, [q]);

  // Reset do índice destacado sempre que a lista filtrada mudar.
  useEffect(() => { setHighlight(0); }, [q]);

  // Rolagem inteligente: mantém o item destacado sempre visível dentro do
  // container do dropdown ao navegar com ArrowDown/ArrowUp.
  useEffect(() => {
    if (results.length === 0) return;
    const el = resultRefs.current[highlight];
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlight, results.length]);

  const subtotal = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const discountValue = Math.min(subtotal, discount);
  const total = Math.max(0, subtotal - discountValue);
  const paid = splits.reduce((a, s) => a + s.amount, 0);
  const remaining = +(total - paid).toFixed(2);

  const add = useCallback((p: Product) => {
    setCart((c) => {
      const ex = c.find((x) => x.id === p.id);
      const step = isFractional(p.unit) ? 1 : 1;
      if (ex) return c.map((x) => (x.id === p.id ? { ...x, qty: +(x.qty + step).toFixed(3) } : x));
      return [...c, { id: p.id, name: p.name, price: p.salePrice, qty: 1, unit: p.unit, stock: p.stock }];
    });
    setQ("");
  }, []);

  /**
   * Tenta tratar a string como código de barras (EAN/GTIN). Bipou → adiciona ao
   * carrinho com qtd 1 e devolve o foco para o input limpo. Se não existir,
   * dispara aviso sutil. Retorna true se o código foi consumido como EAN.
   */
  const tryScanBarcode = useCallback((code: string): boolean => {
    const ean = code.trim();
    if (!/^\d{8,14}$/.test(ean)) return false;
    const product = PRODUCTS.find((p) => p.ean === ean);
    if (product) {
      add(product);
      toast.success(`+ ${product.name}`, { duration: 1400 });
    } else {
      setQ("");
      toast.warning("⚠️ Produto não cadastrado com este código de barras.");
    }
    // Mantém o foco para o próximo bip
    requestAnimationFrame(() => searchRef.current?.focus());
    return true;
  }, [add]);

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

    // Baixa de estoque + registro de auditoria por item (filtrado pelo company_id)
    const credSplit = splits.find((s) => s.method === "Crédito");
    const primary = splits[0]?.method ?? "Dinheiro";
    const mappedPayment: Sale["payment"] =
      primary === "Crédito" || primary === "Débito" ? "Cartão" : primary;
    commitPdvSale({
      company_id: company?.id ?? user?.companyId ?? "EMP001",
      user: user?.name ?? "operador",
      items: cart.map((c) => ({ id: c.id, name: c.name, qty: c.qty })),
      total,
      payment: mappedPayment,
      installments: credSplit?.installments ?? 1,
    });

    toast.success(`Venda concluída — ${BRL(total)}`, {
      description: `${cart.length} item(ns) · ${splits.map((s) => s.method === "Crédito" && s.installments && s.installments > 1 ? `Crédito ${s.installments}x` : s.method).join(" + ") || "—"}`,
    });
    setCart([]);
    setSplits([]);
    setDiscount(0);
    setShowDiscount(false);
    setShowPayment(false);
  }, [cart, paid, total, remaining, splits, company, user]);

  // Cancelamento total da venda (F8 / botão vermelho)
  const cancelSale = useCallback(() => {
    setCart([]);
    setSplits([]);
    setDiscount(0);
    setShowDiscount(false);
    setShowPayment(false);
    setQ("");
    setShowCancel(false);
    toast.warning("Venda cancelada. Carrinho e pagamentos foram zerados.");
    requestAnimationFrame(() => searchRef.current?.focus());
  }, []);

  // Recalculo imediato: se o total cair abaixo do já pago, limpa os splits e avisa.
  useEffect(() => {
    if (splits.length > 0 && paid > total + 0.01) {
      setSplits([]);
      toast.warning("Total recalculado abaixo do valor já recebido. Reajuste as formas de pagamento.");
    }
  }, [total, paid, splits.length]);

  const addSplit = (method: PaymentMethod, amount: number) => {
    if (amount <= 0) return;
    setSplits((s) => [
      ...s,
      { method, amount: +amount.toFixed(2), ...(method === "Crédito" ? { installments: 1 } : {}) },
    ]);
  };

  // Sub-atalho numérico após F4: insere o split com o saldo restante e
  // devolve o foco ao leitor (F1). Funciona com numpad e alfanumérico.
  const pickPaymentByHotkey = useCallback((idx: number) => {
    const method = PAYMENT_METHODS[idx]?.id;
    if (!method) return;
    if (cart.length === 0) {
      toast.info("Carrinho vazio — adicione um item antes de escolher a forma de pagamento.");
      return;
    }
    const amount = remaining > 0.01 ? remaining : total;
    if (amount <= 0) {
      toast.info("Venda já está quitada. Pressione F12 para concluir.");
      return;
    }
    addSplit(method, amount);
    toast.success(`+ ${method} · ${BRL(amount)}`, { duration: 1400 });
    setShowPayment(false);
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [cart.length, remaining, total]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      // Enquanto o modal de cancelamento está aberto, o próprio AlertDialog
      // controla Enter/Esc/Setas — não deixamos atalhos globais (F12/Enter)
      // dispararem ações concorrentes no caixa.
      if (showCancel) return;

      // 🛡️ Blindagem: bloqueia o comportamento nativo do navegador para TODAS
      // as teclas de função usadas pelo PDV antes de qualquer ramificação —
      // evita que Chrome/Firefox abram "Localizar na página" (F3), Ajuda (F1),
      // tela cheia (F11) etc. durante a operação do caixa.
      const PDV_FKEYS = new Set(["F1", "F2", "F3", "F4", "F8", "F9", "F12"]);
      if (PDV_FKEYS.has(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (e.key === "F1") {
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (e.key === "F2") {
        // Toggle bidirecional: abre + foca, ou fecha + devolve foco ao F1.
        setShowDiscount((open) => {
          if (open) {
            requestAnimationFrame(() => searchRef.current?.focus());
            return false;
          }
          setTimeout(() => {
            discountRef.current?.focus();
            discountRef.current?.select();
          }, 50);
          return true;
        });
      } else if (e.key === "F4") {
        setShowPayment((v) => !v);
      } else if (e.key === "F12") {
        finalize();
      } else if (e.key === "F8") {
        if (cart.length > 0 || splits.length > 0 || discount > 0) setShowCancel(true);
      } else if (e.key === "F3") {
        const last = cart[cart.length - 1];
        if (!last) {
          toast.info("Carrinho vazio — adicione um item antes de ajustar a quantidade.");
          return;
        }
        requestAnimationFrame(() => {
          const el = qtyRefs.current[last.id];
          if (el) {
            el.focus();
            el.select();
          }
        });
      } else if (e.key === "F9") {
        if (cart.length === 0) return;
        const last = cart[cart.length - 1];
        setCart((c) => c.slice(0, -1));
        toast.warning(`Último item estornado: ${last.name}`, { duration: 1600 });
        requestAnimationFrame(() => searchRef.current?.focus());
      } else if (
        showPayment && !isTyping &&
        (PAYMENT_HOTKEYS as readonly string[]).includes(e.key)
      ) {
        // Sub-atalhos 1–4 (alfanumérico ou numpad — e.key normaliza ambos).
        e.preventDefault();
        e.stopPropagation();
        pickPaymentByHotkey(PAYMENT_HOTKEYS.indexOf(e.key as typeof PAYMENT_HOTKEYS[number]));
      } else if (e.key === "Enter" && !isTyping && cart.length > 0 && remaining <= 0.01) {
        e.preventDefault();
        finalize();
      } else if (e.key === "Escape") {
        if (showPayment) {
          setShowPayment(false);
          requestAnimationFrame(() => searchRef.current?.focus());
        }
        if (showDiscount) {
          setShowDiscount(false);
          requestAnimationFrame(() => searchRef.current?.focus());
        }
        setShowCancel(false);
      }
    };
    // Capture phase + window: garante que interceptamos o evento ANTES de
    // qualquer outro listener da página e antes do atalho nativo do browser.
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true } as EventListenerOptions);
  }, [finalize, cart, remaining, splits.length, discount, showPayment, showDiscount, showCancel, pickPaymentByHotkey]);

  const setSplitInstallments = (idx: number, n: number) => {
    setSplits((arr) => arr.map((s, i) => (i === idx ? { ...s, installments: n } : s)));
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
              onChange={(e) => {
                const v = e.target.value;
                setQ(v);
                // Leitor de mão: 13 dígitos (EAN-13) chegam de uma vez → bipa instantâneo
                if (/^\d{13}$/.test(v.trim())) tryScanBarcode(v);
              }}
              onKeyDown={(e) => {
                // Navegação por setas dentro do dropdown de sugestões
                if (results.length > 0 && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                  e.preventDefault();
                  setHighlight((h) => {
                    const len = results.length;
                    return e.key === "ArrowDown" ? (h + 1) % len : (h - 1 + len) % len;
                  });
                  return;
                }
                if (e.key === "Escape") {
                  if (q) {
                    e.preventDefault();
                    setQ("");
                  }
                  return;
                }
                if (e.key !== "Enter") return;
                e.preventDefault();
                // 1) EAN-13 válido → busca direta por código de barras
                if (/^\d{13}$/.test(q.trim())) {
                  tryScanBarcode(q);
                  return;
                }
                // 2) Item destacado no dropdown → insere imediatamente
                if (results.length > 0) {
                  add(results[highlight] ?? results[0]);
                  requestAnimationFrame(() => searchRef.current?.focus());
                  return;
                }
                // 3) Fallback: tenta tratar como código de barras de outro tamanho
                tryScanBarcode(q);
              }}
              placeholder="Bipe o código de barras ou digite o nome... (F1)"
              aria-label="Buscar produto ou bipar código de barras"
              autoFocus
              className="w-full h-11 pl-10 pr-3 rounded-md bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>
          <AnimatePresence>
            {results.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-2 rounded-lg border border-border bg-card divide-y divide-border max-h-72 overflow-auto"
              >
                {results.map((p, idx) => (
                  <li key={p.id}>
                    <button
                      ref={(el) => { resultRefs.current[idx] = el; }}
                      onClick={() => add(p)}
                      onMouseEnter={() => setHighlight(idx)}
                      data-active={idx === highlight}
                      className="w-full flex items-center justify-between p-3 text-left transition data-[active=true]:bg-primary/15 data-[active=true]:text-primary hover:bg-accent/60"
                    >
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
                      ref={(el) => { qtyRefs.current[item.id] = el; }}
                      value={item.qty}
                      step={isFractional(item.unit) ? "0.01" : "1"}
                      min={isFractional(item.unit) ? "0" : "1"}
                      inputMode="decimal"
                      onChange={(e) => setQty(item.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          (e.currentTarget as HTMLInputElement).blur();
                          requestAnimationFrame(() => searchRef.current?.focus());
                        }
                      }}
                      aria-label={`Quantidade em ${item.unit}`}
                      className="w-20 h-8 text-right tabular-nums px-2 rounded border border-border bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                    />
                    <span className="text-[11px] font-mono text-muted-foreground w-6">{item.unit}</span>
                  </div>
                  <p className="w-24 text-right font-semibold">{BRL(item.price * item.qty)}</p>
                  <button
                    onClick={() => {
                      setCart((c) => c.filter((x) => x.id !== item.id));
                      toast.info(`Item removido: ${item.name}`, { duration: 1400 });
                    }}
                    aria-label={`Remover ${item.name} do carrinho`}
                    title="Remover item (estorno parcial)"
                    className="w-8 h-8 grid place-items-center rounded text-muted-foreground hover:bg-primary/15 hover:text-primary transition-colors"
                  >
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
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Desconto em R$
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">R$</span>
                  <input
                    ref={discountRef}
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount || ""}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="Ex: 25.50"
                    className="w-full h-9 pl-9 pr-3 rounded bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  O valor é abatido direto do total. O sistema calcula o restante automaticamente para o pagamento (ex.: total R$ 60 — pague R$ 20 em Dinheiro e R$ 40 no Pix).
                </p>
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
                <li key={i} className="flex items-center justify-between gap-2 text-xs bg-secondary/60 border border-border rounded px-2.5 py-1.5">
                  <span className="font-semibold shrink-0">{s.method}</span>
                  {s.method === "Crédito" && (
                    <label className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="uppercase tracking-wider font-semibold">Parcelas</span>
                      <select
                        value={s.installments ?? 1}
                        onChange={(e) => setSplitInstallments(i, parseInt(e.target.value, 10))}
                        aria-label="Parcelas no crédito"
                        className="h-6 px-1.5 rounded border border-border bg-card text-foreground text-[11px] font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/60"
                      >
                        {INSTALLMENT_OPTIONS.map((n) => (
                          <option key={n} value={n}>{n}x{n > 1 ? ` · ${BRL(s.amount / n)}` : " à vista"}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <span className="flex items-center gap-2 tabular-nums ml-auto">
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

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Forma de pagamento</p>
              <kbd className="px-2 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono text-muted-foreground">F4</kbd>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {PAYMENT_METHODS.map(({ id, icon: Icon }, idx) => (
                <button
                  key={id}
                  onClick={() => addSplit(id, remaining > 0 ? remaining : total)}
                  disabled={cart.length === 0}
                  className={`relative flex flex-col items-center gap-1 py-2 rounded-md bg-secondary border text-[10px] font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${showPayment ? "border-primary/60 ring-1 ring-primary/40" : "border-border"} hover:border-primary hover:bg-accent`}
                >
                  {showPayment && (
                    <kbd
                      aria-hidden
                      className="absolute top-1 right-1 px-1 min-w-[16px] h-4 grid place-items-center rounded bg-primary text-primary-foreground text-[9px] font-mono font-bold shadow-sm"
                    >
                      {PAYMENT_HOTKEYS[idx]}
                    </kbd>
                  )}
                  <Icon className="w-4 h-4" /> {id}
                </button>
              ))}
            </div>
            {showPayment && (
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Modo seleção ativo — tecle <kbd className="px-1 rounded bg-secondary border border-border font-mono">1–4</kbd> para escolher · <kbd className="px-1 rounded bg-secondary border border-border font-mono">Esc</kbd> cancela
              </p>
            )}
          </div>

          <button
            onClick={finalize}
            disabled={cart.length === 0}
            className="mt-3 h-12 rounded-md bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-bold shadow-[0_0_24px_-6px_rgba(139,0,0,0.8)] inline-flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Finalizar venda
            <kbd className="ml-1 px-1.5 py-0.5 rounded bg-primary-foreground/15 text-[10px] font-mono">F12</kbd>
          </button>

          <button
            type="button"
            onClick={() => setShowCancel(true)}
            disabled={cart.length === 0 && splits.length === 0 && discount === 0}
            className="mt-2 h-10 rounded-md border border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <XCircle className="w-4 h-4" /> Cancelar venda
            <kbd className="ml-1 px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono text-muted-foreground">F8</kbd>
          </button>
        </aside>
      </section>

      {/* Shortcut legend bar */}
      <div className="mb-8 rounded-lg border border-border bg-card/60 px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground"><Receipt className="w-3.5 h-3.5" /> Atalhos:</span>
        <Shortcut keyLabel="F1" desc="Buscar" />
        <Shortcut keyLabel="F2" desc="Desconto" />
        <Shortcut keyLabel="F3" desc="Quantidade" />
        <Shortcut keyLabel="F4" desc="Pagamento" />
        <Shortcut keyLabel="F8" desc="Cancelar Venda" />
        <Shortcut keyLabel="F9" desc="Estornar Último Item" />
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

      <AlertDialog open={showCancel} onOpenChange={setShowCancel}>
        <AlertDialogContent
          className="border-border bg-card"
          onOpenAutoFocus={(e) => {
            // Foco inicial direto no botão de confirmação (vermelho).
            e.preventDefault();
            requestAnimationFrame(() => confirmCancelRef.current?.focus());
          }}
          onCloseAutoFocus={(e) => {
            // Devolve o cursor ao campo de busca (F1) ao fechar.
            e.preventDefault();
            requestAnimationFrame(() => searchRef.current?.focus());
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              cancelSale();
              return;
            }
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              const root = e.currentTarget as HTMLElement;
              const btns = Array.from(
                root.querySelectorAll<HTMLButtonElement>("button"),
              ).filter((b) => !b.disabled);
              if (btns.length < 2) return;
              const active = document.activeElement as HTMLElement | null;
              const idx = btns.findIndex((b) => b === active);
              const dir = e.key === "ArrowRight" ? 1 : -1;
              const next = btns[(Math.max(0, idx) + dir + btns.length) % btns.length];
              next?.focus();
            }
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-primary/15 text-primary">
                <XCircle className="w-4 h-4" />
              </span>
              Cancelar venda em andamento?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              ⚠️ Deseja mesmo cancelar esta venda? Todos os itens do carrinho e formas de pagamento adicionadas serão limpos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              ref={confirmCancelRef}
              onClick={cancelSale}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Cancelar venda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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