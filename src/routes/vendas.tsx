import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import {
  BRL, CUSTOMERS, PRODUCTS, SALES, commitPdvSale,
  formatQty, isFractional, DEMO_SEED_COMPANY_ID,
  type Product, type Sale,
} from "@/lib/mock-data";
import { useMockStore } from "@/hooks/use-mock-store";
import { useSaaS, PLAN_LABEL, getPlanCaixasLimit } from "@/lib/saas-context";
import { pushSaleToCloud } from "@/lib/sales-sync";
import {
  Banknote, CreditCard, CheckCircle2, QrCode, Receipt, Search, Trash2, X,
  UserCheck, Lock, Printer, DoorOpen, DoorClosed, LogOut, Wallet,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { XCircle } from "lucide-react";
import { PlanDaysLeftBadge } from "@/components/PlanDaysLeftBadge";
import { FullscreenToggle } from "@/components/FullscreenToggle";
import { PeripheralsHelp } from "@/components/PeripheralsHelp";

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

// ──────────────────────────────────────────────────────────────────────
// Abertura / Fechamento de Caixa (Shift)
// ──────────────────────────────────────────────────────────────────────
type ShiftPaymentKey = PaymentMethod | "Crediário";
type ShiftSaleEntry = { ts: number; method: ShiftPaymentKey; amount: number };
type Shift = {
  id: string;
  cid: string;
  userId: string;
  userName: string;
  openedAt: number;
  openingFloat: number;
  sales: ShiftSaleEntry[];
  closedAt?: number;
  closingCash?: number;
};

const SHIFT_KEY = (cid: string, uid: string) => `orvix_pdv_shift_${cid}_${uid}`;
const SHIFT_HISTORY_KEY = (cid: string) => `orvix_pdv_shifts_history_${cid}`;

function loadShift(cid: string, uid: string): Shift | null {
  try {
    const raw = localStorage.getItem(SHIFT_KEY(cid, uid));
    if (!raw) return null;
    const s = JSON.parse(raw) as Shift;
    if (s.closedAt) return null;
    return s;
  } catch { return null; }
}
function saveShift(s: Shift) {
  try { localStorage.setItem(SHIFT_KEY(s.cid, s.userId), JSON.stringify(s)); } catch {}
}
function archiveShift(s: Shift) {
  try {
    const raw = localStorage.getItem(SHIFT_HISTORY_KEY(s.cid));
    const list: Shift[] = raw ? JSON.parse(raw) : [];
    list.unshift(s);
    localStorage.setItem(SHIFT_HISTORY_KEY(s.cid), JSON.stringify(list.slice(0, 200)));
    localStorage.removeItem(SHIFT_KEY(s.cid, s.userId));
    // Notifica o Dashboard do Lojista (mesma aba) para atualizar a lista de
    // "Últimos Caixas Fechados" em tempo real, sem precisar de reload.
    try { window.dispatchEvent(new CustomEvent("orvix:shifts-updated", { detail: { cid: s.cid } })); } catch {}
  } catch {}
}

/** Impressão silenciosa via iframe oculto (evita popup blocker). */
function printHTML(html: string) {
  const iframe = document.createElement("iframe");
  Object.assign(iframe.style, {
    position: "fixed", right: "0", bottom: "0",
    width: "0", height: "0", border: "0",
  });
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc) { document.body.removeChild(iframe); return; }
  doc.open(); doc.write(html); doc.close();
  window.setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    window.setTimeout(() => { document.body.removeChild(iframe); }, 1500);
  }, 250);
}

const RECEIPT_CSS = `
  @page { size: 80mm auto; margin: 4mm 4mm 6mm 4mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Courier New', ui-monospace, monospace; font-size: 12px; line-height: 1.35; color: #000; background: #fff; margin: 0; padding: 0; width: 72mm; }
  h1 { font-size: 14px; margin: 0 0 2px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
  .muted { color: #000; opacity: 0.8; }
  .center { text-align: center; }
  .right { text-align: right; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .sep { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { padding: 2px 0; vertical-align: top; }
  th { text-align: left; border-bottom: 1px solid #000; }
  td.qty, td.unit, td.total, th.qty, th.unit, th.total { text-align: right; white-space: nowrap; }
  .name { word-break: break-word; }
  .totals { font-size: 13px; }
  .totals .row.big { font-size: 15px; font-weight: bold; }
  .footer { margin-top: 10px; text-align: center; font-size: 11px; }
  @media print {
    html, body { width: 80mm; }
  }
`;

function buildReceiptHTML(opts: {
  storeName: string; operator: string; saleId: string;
  items: { name: string; qty: number; unit: string; price: number }[];
  subtotal: number; discount: number; total: number;
  splits: { method: string; amount: number; installments?: number }[];
  crediario?: { customer?: string };
}): string {
  const now = new Date();
  const dt = now.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
  const itemsRows = opts.items.map((it) => `
    <tr>
      <td class="name">${escapeHTML(it.name)}</td>
      <td class="qty">${it.qty.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</td>
      <td class="unit">${escapeHTML(it.unit)}</td>
      <td class="total">${BRL(it.price * it.qty)}</td>
    </tr>`).join("");
  const paymentLines = opts.crediario
    ? `<div class="row"><span>Crediário</span><span>${BRL(opts.total)}</span></div>
       <div class="row muted"><span>Cliente</span><span>${escapeHTML(opts.crediario.customer ?? "—")}</span></div>`
    : opts.splits.map((s) => `
        <div class="row"><span>${escapeHTML(s.method)}${s.method === "Crédito" && s.installments && s.installments > 1 ? ` ${s.installments}x` : ""}</span><span>${BRL(s.amount)}</span></div>
      `).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Cupom</title><style>${RECEIPT_CSS}</style></head>
  <body>
    <h1>${escapeHTML(opts.storeName)}</h1>
    <div class="center muted">CUPOM NÃO FISCAL</div>
    <div class="row muted"><span>${dt}</span><span>#${escapeHTML(opts.saleId)}</span></div>
    <div class="muted">Operador: ${escapeHTML(opts.operator)}</div>
    <hr class="sep" />
    <table>
      <thead><tr><th>Item</th><th class="qty">Qtd</th><th class="unit">Un</th><th class="total">Total</th></tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <hr class="sep" />
    <div class="totals">
      <div class="row"><span>Subtotal</span><span>${BRL(opts.subtotal)}</span></div>
      ${opts.discount > 0 ? `<div class="row"><span>Desconto</span><span>- ${BRL(opts.discount)}</span></div>` : ""}
      <div class="row big"><span>TOTAL</span><span>${BRL(opts.total)}</span></div>
    </div>
    <hr class="sep" />
    <div>${paymentLines}</div>
    <div class="footer">
      Obrigado pela preferência<br/>Cupom Não Fiscal
    </div>
  </body></html>`;
}

function buildClosingHTML(opts: {
  storeName: string; operator: string; shift: Shift; totals: Record<ShiftPaymentKey, number>;
  expectedCash: number; informedCash: number;
}): string {
  const opened = new Date(opts.shift.openedAt).toLocaleString("pt-BR");
  const closed = new Date().toLocaleString("pt-BR");
  const diff = opts.informedCash - opts.expectedCash;
  const diffLabel = diff === 0 ? "Sem diferença" : diff > 0 ? `Sobra ${BRL(diff)}` : `Falta ${BRL(Math.abs(diff))}`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Fechamento</title><style>${RECEIPT_CSS}</style></head>
  <body>
    <h1>${escapeHTML(opts.storeName)}</h1>
    <div class="center muted">FECHAMENTO DE CAIXA</div>
    <div class="muted">Operador: ${escapeHTML(opts.operator)}</div>
    <div class="row muted"><span>Abertura</span><span>${opened}</span></div>
    <div class="row muted"><span>Fechamento</span><span>${closed}</span></div>
    <hr class="sep" />
    <div class="totals">
      <div class="row"><span>Troco inicial</span><span>${BRL(opts.shift.openingFloat)}</span></div>
      <div class="row"><span>Dinheiro</span><span>${BRL(opts.totals["Dinheiro"])}</span></div>
      <div class="row"><span>PIX</span><span>${BRL(opts.totals["Pix"])}</span></div>
      <div class="row"><span>Crédito</span><span>${BRL(opts.totals["Crédito"])}</span></div>
      <div class="row"><span>Débito</span><span>${BRL(opts.totals["Débito"])}</span></div>
      <div class="row muted"><span>Crediário</span><span>${BRL(opts.totals["Crediário"])}</span></div>
    </div>
    <hr class="sep" />
    <div class="totals">
      <div class="row"><span>Esperado em dinheiro</span><span>${BRL(opts.expectedCash)}</span></div>
      <div class="row"><span>Conferido</span><span>${BRL(opts.informedCash)}</span></div>
      <div class="row big"><span>${diff >= 0 ? "Diferença" : "Diferença"}</span><span>${diffLabel}</span></div>
    </div>
    <div class="footer">Relatório interno · ORVIX SISTEMAS</div>
  </body></html>`;
}

function escapeHTML(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

export function VendasPage() {
  useMockStore();
  const { user, company, activateRevenue, logout } = useSaaS();
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [splits, setSplits] = useState<Split[]>([]);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [crediario, setCrediario] = useState(false);
  const [customerId, setCustomerId] = useState<string>("");
  /** Imprimir cupom não-fiscal (bobina térmica 80mm). Ligado por padrão. */
  const [printReceipt, setPrintReceipt] = useState(true);

  const navigate = useNavigate();

  // ── Abertura / Fechamento de Caixa (Shift) ──
  const [shift, setShift] = useState<Shift | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [openingFloat, setOpeningFloat] = useState<string>("");
  const [closingCash, setClosingCash] = useState<string>("");

  const cid = company?.isDemo === true ? DEMO_SEED_COMPANY_ID : company?.id ?? user?.companyId ?? null;

  // ── Trava de Caixas Simultâneos por plano ──
  // Cada aba registra um id único em `localStorage` com heartbeat. Se o número
  // de PDVs ativos para a empresa excede o limite do plano, bloqueia o caixa.
  const sessionIdRef = useRef<string>(`pdv_${Math.random().toString(36).slice(2)}_${Date.now()}`);
  const [pdvBlocked, setPdvBlocked] = useState<{ active: number; limit: number } | null>(null);

  useEffect(() => {
    if (!company || !cid) return;
    const STORAGE_KEY = `orvix_pdv_open_${cid}`;
    const MY_ID = sessionIdRef.current;
    const limit = getPlanCaixasLimit(company.plan);

    const read = (): Record<string, number> => {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); } catch { return {}; }
    };
    const write = (m: Record<string, number>) => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); } catch {}
    };
    const prune = (m: Record<string, number>) => {
      const now = Date.now();
      Object.keys(m).forEach((k) => { if (now - m[k] > 30_000) delete m[k]; });
      return m;
    };

    const sessions = prune(read());
    const others = Object.keys(sessions).filter((k) => k !== MY_ID).length;
    if (others >= limit) {
      setPdvBlocked({ active: others, limit });
      write(sessions);
      return;
    }
    sessions[MY_ID] = Date.now();
    write(sessions);
    setPdvBlocked(null);

    const heartbeat = window.setInterval(() => {
      const cur = prune(read());
      cur[MY_ID] = Date.now();
      write(cur);
    }, 10_000);

    const release = () => {
      const cur = read();
      delete cur[MY_ID];
      write(cur);
    };
    window.addEventListener("beforeunload", release);
    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("beforeunload", release);
      release();
    };
  }, [cid, company]);

  // Carrega turno aberto (se existir) para o operador+empresa atual.
  // Se não houver turno aberto, abre automaticamente o modal de Abertura
  // — vendas ficam bloqueadas até o operador informar o troco inicial.
  useEffect(() => {
    if (!user || !cid) return;
    const s = loadShift(cid, user.id);
    setShift(s);
    if (!s) setOpenModal(true);
  }, [user, cid]);

  // Totais agregados do turno por método (para o modal de fechamento).
  const shiftTotals = useMemo<Record<ShiftPaymentKey, number>>(() => {
    const base: Record<ShiftPaymentKey, number> = {
      Dinheiro: 0, Pix: 0, "Crédito": 0, "Débito": 0, "Crediário": 0,
    };
    shift?.sales.forEach((s) => { base[s.method] = +(base[s.method] + s.amount).toFixed(2); });
    return base;
  }, [shift]);

  const expectedCash = useMemo(
    () => +((shift?.openingFloat ?? 0) + shiftTotals["Dinheiro"]).toFixed(2),
    [shift, shiftTotals],
  );

  const openShift = useCallback(() => {
    if (!user || !cid) return;
    const float = parseFloat(openingFloat.replace(",", ".")) || 0;
    if (float < 0) return toast.error("Valor de troco inválido.");
    const s: Shift = {
      id: `SH_${Date.now()}`,
      cid, userId: user.id, userName: user.name,
      openedAt: Date.now(), openingFloat: float, sales: [],
    };
    saveShift(s);
    setShift(s);
    setOpenModal(false);
    setOpeningFloat("");
    toast.success(`Caixa aberto — troco inicial ${BRL(float)}`);
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [user, cid, openingFloat]);

  const closeShift = useCallback(() => {
    if (!shift || !user || !company) return;
    const informed = parseFloat(closingCash.replace(",", ".")) || 0;
    if (informed < 0) return toast.error("Valor em dinheiro inválido.");
    const closed: Shift = { ...shift, closedAt: Date.now(), closingCash: informed };
    archiveShift(closed);
    // Imprime relatório de fechamento (bobina térmica).
    const html = buildClosingHTML({
      storeName: company.fantasia,
      operator: user.name,
      shift: closed,
      totals: shiftTotals,
      expectedCash,
      informedCash: informed,
    });
    printHTML(html);
    toast.success("Caixa fechado — relatório enviado para impressão.");
    setShift(null);
    setCloseModal(false);
    setClosingCash("");
    // Desloga o operador para que outro turno comece com login novo.
    window.setTimeout(() => {
      logout();
      navigate({ to: "/login" });
    }, 600);
  }, [shift, user, company, closingCash, shiftTotals, expectedCash, logout, navigate]);

  const companyCustomers = useMemo(
    () => CUSTOMERS.filter((c) => c.company_id === cid),
    [cid],
  );

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
    return PRODUCTS.filter(
      (p) => p.company_id === cid && (p.name.toLowerCase().includes(n) || p.ean.includes(q)),
    );
  }, [q, cid]);

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
    const product = PRODUCTS.find((p) => p.company_id === cid && p.ean === ean);
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
  }, [add, cid]);

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
    if (!cid) return toast.error("Empresa não identificada.");
    if (cart.length === 0) return toast.error("Carrinho vazio.");
    if (!shift) {
      setOpenModal(true);
      return toast.error("Abra o caixa antes de registrar vendas.");
    }
    if (crediario) {
      if (!customerId) return toast.error("Selecione o cliente para a venda no crediário.");
    } else if (paid + 0.01 < total) {
      return toast.error(`Pagamento incompleto. Falta ${BRL(remaining)}.`);
    }

    // Baixa de estoque + registro de auditoria por item (filtrado pelo company_id)
    const credSplit = splits.find((s) => s.method === "Crédito");
    const primary = splits[0]?.method ?? "Dinheiro";
    const mappedPayment: Sale["payment"] =
      crediario ? "Pix" : (primary === "Crédito" || primary === "Débito" ? "Cartão" : primary);
    const savedSale = commitPdvSale({
      company_id: cid,
      user: user?.name ?? "operador",
      items: cart.map((c) => ({ id: c.id, name: c.name, qty: c.qty })),
      total,
      payment: mappedPayment,
      installments: credSplit?.installments ?? 1,
      crediario,
      customerId: crediario ? customerId : undefined,
      customer: crediario ? companyCustomers.find((c) => c.id === customerId)?.name : undefined,
    });
    // Persistência cross-tenant (Supabase). Fire-and-forget; em caso de falha
    // (offline / RLS / rede), a venda fica em fila local e é drenada depois.
    void pushSaleToCloud({
      company_id: cid,
      local_id: savedSale.id,
      total_amount: +total.toFixed(2),
      cost_amount: +(savedSale.cost ?? 0).toFixed(2),
      items_count: cart.length,
      payment_method: mappedPayment,
      installments: credSplit?.installments ?? 1,
      customer_name: crediario ? companyCustomers.find((c) => c.id === customerId)?.name : undefined,
      customer_id: crediario ? customerId : undefined,
      crediario,
      items: cart.map((c) => ({ id: c.id, name: c.name, qty: c.qty, price: c.price, unit: c.unit })),
      occurred_at: new Date().toISOString(),
    });
    // Recontagem de MRR — ativa o faturamento real da empresa a partir da 1ª venda.
    activateRevenue(cid);

    // Registra movimento no turno (caixa) — para conferência no fechamento.
    const shiftEntries: ShiftSaleEntry[] = crediario
      ? [{ ts: Date.now(), method: "Crediário", amount: total }]
      : splits.map((s) => ({ ts: Date.now(), method: s.method, amount: s.amount }));
    const updated: Shift = { ...shift, sales: [...shift.sales, ...shiftEntries] };
    saveShift(updated);
    setShift(updated);

    if (crediario) {
      const c = companyCustomers.find((x) => x.id === customerId);
      toast.success(`Crediário registrado — ${BRL(total)}`, {
        description: `${cart.length} item(ns) · Conta a Receber criada para ${c?.name ?? "cliente"} (venc. 30 dias).`,
      });
    } else {
      toast.success(`Venda concluída — ${BRL(total)}`, {
        description: `${cart.length} item(ns) · ${splits.map((s) => s.method === "Crédito" && s.installments && s.installments > 1 ? `Crédito ${s.installments}x` : s.method).join(" + ") || "—"}`,
      });
    }

    // Impressão de cupom não-fiscal (bobina térmica) — silenciosa via iframe.
    if (printReceipt) {
      const html = buildReceiptHTML({
        storeName: company?.fantasia ?? "Loja",
        operator: user?.name ?? "operador",
        saleId: `V${Date.now().toString().slice(-6)}`,
        items: cart.map((c) => ({ name: c.name, qty: c.qty, unit: c.unit, price: c.price })),
        subtotal,
        discount: discountValue,
        total,
        splits: crediario ? [] : splits,
        crediario: crediario
          ? { customer: companyCustomers.find((c) => c.id === customerId)?.name }
          : undefined,
      });
      printHTML(html);
    }

    setCart([]);
    setSplits([]);
    setDiscount(0);
    setShowDiscount(false);
    setShowPayment(false);
    setCrediario(false);
    setCustomerId("");
  }, [cart, paid, total, remaining, splits, cid, user, crediario, customerId, companyCustomers, printReceipt, shift, subtotal, discountValue, company, activateRevenue]);

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
    <AppShell title="Caixa" breadcrumb={["Meu Saas", "Caixa"]}>
      {pdvBlocked && company && (
        <section
          role="alert"
          aria-live="assertive"
          className="mb-6 rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 p-6 md:p-8 flex flex-col md:flex-row items-start gap-5"
        >
          <div className="w-14 h-14 shrink-0 grid place-items-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-500">
            <Lock className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-amber-500">🚫 Limite de Caixas Atingido</h2>
            <p className="mt-1 text-sm text-foreground/90">
              Seu plano <strong>{PLAN_LABEL[company.plan]}</strong> permite apenas{" "}
              <strong>{pdvBlocked.limit} caixa{pdvBlocked.limit > 1 ? "s" : ""} operando por vez</strong>
              {" "}— no momento já existe{pdvBlocked.active > 1 ? "m" : ""} <strong>{pdvBlocked.active}</strong> caixa(s) aberto(s) para esta empresa.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {company.plan === "bronze"
                ? `Faça o upgrade para o Plano Prata e abra até ${getPlanCaixasLimit("prata")} caixas simultaneamente — ou Ouro para até ${getPlanCaixasLimit("ouro")} terminais.`
                : `Faça o upgrade para o Plano Ouro Premium e libere até ${getPlanCaixasLimit("ouro")} terminais simultâneos.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="/assinatura"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors"
              >
                Fazer upgrade agora
              </a>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-border text-sm font-semibold hover:bg-accent transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </section>
      )}
      {!pdvBlocked && (
      <>
      {/* Cabeçalho do turno (status do caixa + ações de abrir/fechar). */}
      <section
        aria-label="Status do caixa"
        className="mb-4 rounded-xl border border-border bg-card/70 p-3 md:p-4 flex flex-wrap items-center gap-3 md:gap-4"
      >
        <div className={`shrink-0 w-10 h-10 grid place-items-center rounded-lg ${shift ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-primary/15 text-primary border border-primary/30"}`}>
          {shift ? <DoorOpen className="w-5 h-5" /> : <DoorClosed className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">
            {shift ? `Caixa aberto · Operador: ${user?.name ?? "—"}` : "Caixa fechado"}
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {shift
              ? `Abertura ${new Date(shift.openedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · Troco inicial ${BRL(shift.openingFloat)} · ${shift.sales.length} venda(s) registrada(s)`
              : "Abra o caixa para começar a registrar vendas no PDV."}
          </p>
        </div>
        {shift && (
          <div className="hidden md:flex items-center gap-2 text-[11px] text-muted-foreground border-l border-border pl-3">
            <Wallet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono tabular-nums">Esperado em dinheiro: <strong className="text-foreground">{BRL(expectedCash)}</strong></span>
          </div>
        )}
        <PlanDaysLeftBadge compact />
        <PeripheralsHelp />
        <FullscreenToggle />
        {shift ? (
          <button
            type="button"
            onClick={() => setCloseModal(true)}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            <DoorClosed className="w-4 h-4" /> Fechar Caixa
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-md bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-colors"
          >
            <DoorOpen className="w-4 h-4" /> Abrir Caixa
          </button>
        )}
      </section>

      {!shift && (
        <div className="mb-6 rounded-2xl border-2 border-primary/40 bg-primary/5 p-6 flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 grid place-items-center rounded-xl bg-primary/15 text-primary border border-primary/30">
            <Lock className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-primary">Caixa fechado — vendas bloqueadas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              O operador precisa <strong className="text-foreground">abrir o caixa</strong> e informar o valor de troco inicial antes de registrar qualquer venda.
            </p>
            <button
              type="button"
              onClick={() => setOpenModal(true)}
              className="mt-3 h-10 px-4 inline-flex items-center gap-2 rounded-md bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-colors"
            >
              <DoorOpen className="w-4 h-4" /> Abrir Caixa agora
            </button>
          </div>
        </div>
      )}

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

          {/* Crediário (Venda a prazo) */}
          <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={crediario}
                onChange={(e) => setCrediario(e.target.checked)}
                className="accent-primary"
              />
              <UserCheck className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Venda no Crediário (a prazo)</span>
            </label>
            {crediario && (
              <div className="mt-2 space-y-1.5">
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  aria-label="Cliente do crediário"
                  className="w-full h-9 px-2 rounded bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
                >
                  <option value="">Selecione o cliente…</option>
                  {companyCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.doc}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Gera uma <strong className="text-foreground">Conta a Receber</strong> com vencimento em 30 dias e atualiza o saldo do cliente.
                </p>
              </div>
            )}
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

          <label
            className={`mt-3 flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
              printReceipt
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary/40 hover:border-primary/60"
            }`}
          >
            <input
              type="checkbox"
              checked={printReceipt}
              onChange={(e) => setPrintReceipt(e.target.checked)}
              className="accent-primary w-4 h-4"
            />
            <Printer className={`w-4 h-4 ${printReceipt ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">🧾 Imprimir Recibo / Cupom Não Fiscal</p>
              <p className="text-[11px] text-muted-foreground">
                Ao finalizar, abre a janela de impressão com o cupom formatado para bobina térmica (80mm).
              </p>
            </div>
          </label>

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
        rows={SALES.filter((s) => s.company_id === cid)}
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

      {/* MODAL — Abertura de Caixa (bloqueia vendas até confirmar). */}
      <Dialog
        open={openModal}
        onOpenChange={setOpenModal}
      >
        <DialogContent className="border-border bg-card text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <DoorOpen className="w-4 h-4" />
              </span>
              Abertura de Caixa
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Informe o <strong className="text-foreground">valor de troco inicial</strong> que está fisicamente na gaveta do caixa.
              As vendas só serão liberadas após a abertura.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Valor de Troco Inicial (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                autoFocus
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); openShift(); } }}
                placeholder="Ex: 150,00"
                className="w-full h-11 pl-10 pr-3 rounded-md bg-secondary border border-border text-base font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Operador: <strong className="text-foreground">{user?.name ?? "—"}</strong> · Empresa: <strong className="text-foreground">{company?.fantasia ?? "—"}</strong>
            </p>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpenModal(false)}
              className="h-10 px-4 inline-flex items-center justify-center rounded-md border border-border bg-secondary text-sm font-semibold text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={openShift}
              className="h-10 px-4 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-colors"
            >
              <DoorOpen className="w-4 h-4" /> Abrir Caixa
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL — Fechamento de Caixa (resumo do turno + dinheiro conferido). */}
      <Dialog open={closeModal} onOpenChange={setCloseModal}>
        <DialogContent className="border-border bg-card text-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-primary/15 text-primary border border-primary/30">
                <DoorClosed className="w-4 h-4" />
              </span>
              Fechamento de Caixa
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Confira o resumo do turno e informe o valor em dinheiro contado na gaveta.
              Ao confirmar, o relatório será impresso e o operador será deslogado.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Operador</span><span className="font-semibold">{user?.name ?? "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Abertura</span><span className="font-mono tabular-nums">{shift ? new Date(shift.openedAt).toLocaleString("pt-BR") : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Troco inicial</span><span className="font-mono tabular-nums">{BRL(shift?.openingFloat ?? 0)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Vendas registradas</span><span className="font-mono tabular-nums">{shift?.sales.length ?? 0}</span></div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Totais por forma de pagamento</p>
            <ul className="text-sm divide-y divide-border">
              <li className="py-1.5 flex justify-between"><span>💵 Dinheiro</span><span className="font-mono tabular-nums">{BRL(shiftTotals["Dinheiro"])}</span></li>
              <li className="py-1.5 flex justify-between"><span>📱 PIX</span><span className="font-mono tabular-nums">{BRL(shiftTotals["Pix"])}</span></li>
              <li className="py-1.5 flex justify-between"><span>💳 Crédito</span><span className="font-mono tabular-nums">{BRL(shiftTotals["Crédito"])}</span></li>
              <li className="py-1.5 flex justify-between"><span>💳 Débito</span><span className="font-mono tabular-nums">{BRL(shiftTotals["Débito"])}</span></li>
              <li className="py-1.5 flex justify-between text-muted-foreground"><span>📝 Crediário</span><span className="font-mono tabular-nums">{BRL(shiftTotals["Crediário"])}</span></li>
            </ul>
          </div>

          <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Esperado em dinheiro</span>
              <span className="text-lg font-bold tabular-nums text-foreground">{BRL(expectedCash)}</span>
            </div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Valor em Dinheiro no Caixa (contado)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                autoFocus
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); closeShift(); } }}
                placeholder="Ex: 850,00"
                className="w-full h-11 pl-10 pr-3 rounded-md bg-card border border-border text-base font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/60"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setCloseModal(false)}
              className="h-10 px-4 inline-flex items-center justify-center rounded-md border border-border text-sm font-semibold hover:bg-accent transition-colors"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={closeShift}
              className="h-10 px-4 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Confirmar Fechamento
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </>
      )}
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