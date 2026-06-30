export type Unit = "un" | "m" | "m²" | "m³" | "kg" | "L";

export const UNITS: { value: Unit; label: string; fractional: boolean }[] = [
  { value: "un", label: "Unidade (un)", fractional: false },
  { value: "m", label: "Metro (m)", fractional: true },
  { value: "m²", label: "Metro Quadrado (m²)", fractional: true },
  { value: "m³", label: "Metro Cúbico (m³)", fractional: true },
  { value: "kg", label: "Quilograma (kg)", fractional: true },
  { value: "L", label: "Litro (L)", fractional: true },
];

export const isFractional = (u: Unit) => u !== "un";

/**
 * IDs de empresas "demo" — as únicas que carregam dados fictícios pré-povoados
 * (vendas, produtos, gráficos, KPIs). Empresas criadas a partir de cadastros
 * reais começam zeradas para que o lojista veja apenas os próprios dados.
 *
 * Esta lista é sincronizada em tempo de execução pelo `SaaSProvider`
 * (src/lib/saas-context.tsx) a partir da coluna `companies.is_demo` no
 * Supabase via `setDemoCompanyIds(...)`. O valor inicial garante que o
 * tenant histórico (EMP001) continue exibindo o conteúdo de demonstração
 * mesmo antes da primeira sincronização.
 */
export const DEMO_COMPANY_IDS: Set<string> = new Set<string>(["EMP001"]);
export const isDemoCompany = (id: string | null | undefined): boolean =>
  !!id && DEMO_COMPANY_IDS.has(id);

/**
 * Substitui o conjunto de empresas demo. Chamado pelo `SaaSProvider` após
 * ler `companies` no Supabase para refletir a flag `is_demo`. Empresas
 * reais (`is_demo=false`) deixam de ser elegíveis a qualquer carga futura
 * de dados de demonstração.
 */
export function setDemoCompanyIds(ids: Iterable<string>): void {
  DEMO_COMPANY_IDS.clear();
  for (const id of ids) DEMO_COMPANY_IDS.add(id);
  __emit();
}

export const formatQty = (qty: number, unit: Unit) =>
  isFractional(unit)
    ? qty.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })
    : Math.trunc(qty).toLocaleString("pt-BR");

export type Product = {
  id: string;
  company_id: string;
  ean: string;
  name: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: Unit;
  supplier: string;
  status: "ativo" | "inativo";
};

export type Sale = {
  id: string;
  company_id: string;
  date: string;
  customer: string;
  total: number;
  items: number;
  payment: "Dinheiro" | "Cartão" | "Pix";
  status: "concluida" | "pendente" | "cancelada";
  /** Parcelas no crédito (1 = à vista). Definido apenas quando payment === "Cartão". */
  installments?: number;
  /** Custo total dos itens vendidos (para cálculo de Lucro Real). */
  cost?: number;
  /** Quando true, a venda foi feita no crediário (gera Conta a Receber). */
  crediario?: boolean;
  /** ID do cliente do crediário (quando crediario === true). */
  customerId?: string;
};

export type Movement = {
  id: string;
  company_id: string;
  date: string;
  product: string;
  type: "Entrada" | "Saída" | "Ajuste";
  qty: number;
  user: string;
  /** ID do produto (auditoria). Opcional para registros legados. */
  productId?: string;
  /** Justificativa / origem da movimentação (ex.: "Venda PDV V20301"). */
  reason?: string;
};

export type Person = {
  id: string;
  company_id: string;
  name: string;
  doc: string;
  email: string;
  phone: string;
  city: string;
  creditLimit: number;
  currentDebt: number;
};

/* ============================================================
 * Plataforma SaaS — Logs globais, suporte e configurações
 * ============================================================ */

export type SystemLogKind =
  | "LOGIN_OK"
  | "LOGIN_FAIL"
  | "SALE_OK"
  | "SUBSCRIPTION_CHANGE"
  | "PLAN_CHANGE"
  | "DUE_CHANGE"
  | "IMPERSONATION_START"
  | "IMPERSONATION_END"
  | "SETTINGS_UPDATE"
  | "SUPPORT_TICKET_CLOSED";

export type SystemLog = {
  id: string;
  date: string;
  kind: SystemLogKind;
  company_id?: string | null;
  companyName?: string;
  user?: string;
  action: string;
  /** Snapshot opaco para reversão de estado. Tipado no consumidor (saas-context). */
  undo?: unknown;
  /** Marca o log como já revertido — desabilita o botão "Reverter". */
  reverted?: boolean;
};

export const SYSTEM_LOGS: SystemLog[] = [];
let __logSeq = 9000;
export function logEvent(input: Omit<SystemLog, "id" | "date"> & { date?: string }): SystemLog {
  const log: SystemLog = {
    id: `L${String(__logSeq++).padStart(5, "0")}`,
    date: input.date ?? new Date().toISOString(),
    kind: input.kind,
    company_id: input.company_id ?? null,
    companyName: input.companyName,
    user: input.user,
    action: input.action,
    undo: input.undo,
    reverted: input.reverted,
  };
  SYSTEM_LOGS.unshift(log);
  __emit();
  return log;
}

/** Marca um log como revertido (consumido pelo Painel Master após rollback bem-sucedido). */
export function markLogReverted(logId: string) {
  const l = SYSTEM_LOGS.find((x) => x.id === logId);
  if (!l) return;
  l.reverted = true;
  __emit();
}
// Seed alguns logs para demonstração
(function seedLogs() {
  const base = Date.now();
  const seed: Array<Omit<SystemLog, "id" | "date"> & { offset: number }> = [
    { offset: 1000 * 60 * 60 * 5,  kind: "LOGIN_OK",            company_id: "EMP001", companyName: "Mercadinho Orvix", user: "Ana Mendes",   action: "Login realizado com sucesso." },
    { offset: 1000 * 60 * 60 * 4,  kind: "SALE_OK",             company_id: "EMP001", companyName: "Mercadinho Orvix", user: "Bruno Caixa",  action: "Venda V20012 concluída (R$ 184,90)." },
    { offset: 1000 * 60 * 60 * 3,  kind: "LOGIN_FAIL",          company_id: "EMP002", companyName: "Trigo Dourado",    user: "carla@trigo.com.br", action: "Tentativa de login com senha incorreta." },
    { offset: 1000 * 60 * 60 * 2,  kind: "SUBSCRIPTION_CHANGE", company_id: "EMP003", companyName: "Boi Bom",          user: "Sistema",      action: "Assinatura alterada para BLOQUEADA por inadimplência." },
    { offset: 1000 * 60 * 30,      kind: "LOGIN_OK",            company_id: null,     companyName: "Plataforma",       user: "Tiago (Orvix Sistemas)",     action: "Super Admin acessou o painel master." },
  ];
  seed.forEach((s) => {
    SYSTEM_LOGS.unshift({
      id: `L${String(__logSeq++).padStart(5, "0")}`,
      date: new Date(base - s.offset).toISOString(),
      kind: s.kind, company_id: s.company_id ?? null, companyName: s.companyName,
      user: s.user, action: s.action,
    });
  });
})();

export type SupportTicket = {
  id: string;
  company_id: string;
  companyName: string;
  subject: string;
  message: string;
  priority: "baixa" | "media" | "alta";
  status: "aberto" | "em_andamento" | "resolvido";
  openedAt: string;
  requester: string;
};

export const SUPPORT_TICKETS: SupportTicket[] = [
  { id: "T1001", company_id: "EMP001", companyName: "Mercadinho Orvix", subject: "Impressora térmica não emite cupom",
    message: "Após a última atualização, o PDV trava ao enviar para a impressora Bematech MP-4200.",
    priority: "alta",  status: "em_andamento", openedAt: new Date(Date.now() - 1000*60*60*8).toISOString(), requester: "Ana Mendes" },
  { id: "T1002", company_id: "EMP002", companyName: "Trigo Dourado", subject: "Importação de planilha de produtos",
    message: "Posso importar minha lista do Excel em lote? Tenho mais de 800 SKUs.",
    priority: "media", status: "aberto",        openedAt: new Date(Date.now() - 1000*60*60*30).toISOString(), requester: "Carla Lima" },
  { id: "T1003", company_id: "EMP004", companyName: "Norte Distribuição", subject: "Renegociação de plano",
    message: "Gostaríamos de avaliar um desconto no Enterprise com pagamento anual.",
    priority: "baixa", status: "resolvido",     openedAt: new Date(Date.now() - 1000*60*60*72).toISOString(), requester: "Diretor Comercial" },
];

export function updateTicketStatus(id: string, status: SupportTicket["status"]) {
  const t = SUPPORT_TICKETS.find((x) => x.id === id);
  if (!t) return;
  t.status = status;
  __emit();
}

/* ---------------------------------------------------------------- */
/*  Lixeira de chamados de suporte — F5-safe e restaurável.          */
/*  Chave: orvix_deleted_support_tickets → SupportTicket[] completo. */
/*  Compat: orvix_tickets_removed_v1 (somente IDs, formato legado).  */
/* ---------------------------------------------------------------- */
const TICKETS_TRASH_KEY = "orvix_deleted_support_tickets";
const TICKETS_REMOVED_LEGACY_KEY = "orvix_tickets_removed_v1";

function loadTrashedTickets(): SupportTicket[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TICKETS_TRASH_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as SupportTicket[]) : [];
  } catch { return []; }
}
function persistTrashedTickets(list: SupportTicket[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(TICKETS_TRASH_KEY, JSON.stringify(list)); } catch {}
}
function loadLegacyRemovedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TICKETS_REMOVED_LEGACY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch { return []; }
}

// Hidrata na carga do módulo — remove tickets já descartados em sessões anteriores.
(() => {
  const trashIds = new Set(loadTrashedTickets().map((t) => t.id));
  const legacy = loadLegacyRemovedIds();
  legacy.forEach((id) => trashIds.add(id));
  if (!trashIds.size) return;
  for (let i = SUPPORT_TICKETS.length - 1; i >= 0; i--) {
    if (trashIds.has(SUPPORT_TICKETS[i].id)) SUPPORT_TICKETS.splice(i, 1);
  }
})();

/** Remove um chamado de suporte e o move para a lixeira (restaurável). */
export function deleteTicket(id: string): SupportTicket | null {
  const idx = SUPPORT_TICKETS.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const [removed] = SUPPORT_TICKETS.splice(idx, 1);
  const trash = loadTrashedTickets();
  if (!trash.some((t) => t.id === removed.id)) {
    trash.push(removed);
    persistTrashedTickets(trash);
  }
  __emit();
  return removed;
}

/** Restaura um chamado previamente removido pelo Super Admin. */
export function restoreTicket(id: string): SupportTicket | null {
  const trash = loadTrashedTickets();
  const idx = trash.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const [ticket] = trash.splice(idx, 1);
  persistTrashedTickets(trash);
  // Limpa também a chave legada, se presente.
  const legacy = loadLegacyRemovedIds().filter((x) => x !== id);
  if (typeof window !== "undefined") {
    try { localStorage.setItem(TICKETS_REMOVED_LEGACY_KEY, JSON.stringify(legacy)); } catch {}
  }
  if (!SUPPORT_TICKETS.some((t) => t.id === ticket.id)) {
    SUPPORT_TICKETS.unshift(ticket);
  }
  __emit();
  return ticket;
}

export type SaaSSettings = {
  trialDays: number;
  usersLimit: { bronze: number; prata: number; ouro: number };
  smtpHost: string;
  smtpUser: string;
  smtpFrom: string;
  paymentGateway: "Stripe" | "Pagar.me" | "Mercado Pago";
  paymentPublicKey: string;
};

export const SAAS_SETTINGS: SaaSSettings = {
  trialDays: 14,
  // Limites padrão por plano (usuários/terminais). Super Admin pode ajustar em Configurações.
  usersLimit: { bronze: 1, prata: 3, ouro: 10 },
  smtpHost: "smtp.sendgrid.net",
  smtpUser: "apikey",
  smtpFrom: "no-reply@orvix.app",
  paymentGateway: "Mercado Pago",
  paymentPublicKey: "",
};

// Persistência local — garante que ajustes feitos no Painel Master sobrevivam ao refresh.
const SAAS_SETTINGS_KEY = "orvix_saas_settings_v2";
if (typeof window !== "undefined") {
  try {
    const raw = window.localStorage.getItem(SAAS_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SaaSSettings>;
      Object.assign(SAAS_SETTINGS, parsed);
      // Normaliza limites para inteiros válidos (>=1).
      const ul = SAAS_SETTINGS.usersLimit;
      ul.bronze = Math.max(1, Number(ul.bronze) || 1);
      ul.prata  = Math.max(1, Number(ul.prata)  || 3);
      ul.ouro   = Math.max(1, Number(ul.ouro)   || 10);
    }
  } catch {
    /* ignore corrupted settings */
  }
}

function persistSaaSSettings() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAAS_SETTINGS_KEY, JSON.stringify(SAAS_SETTINGS));
  } catch {
    /* storage cheio ou indisponível */
  }
}

export function updateSaaSSettings(patch: Partial<SaaSSettings>) {
  Object.assign(SAAS_SETTINGS, patch);
  // Normaliza limites — sempre inteiros >=1.
  const ul = SAAS_SETTINGS.usersLimit;
  ul.bronze = Math.max(1, Math.floor(Number(ul.bronze) || 1));
  ul.prata  = Math.max(1, Math.floor(Number(ul.prata)  || 3));
  ul.ouro   = Math.max(1, Math.floor(Number(ul.ouro)   || 10));
  persistSaaSSettings();
  __emit();
}

/* ============================================================
 * Financeiro — Contas a Pagar e Contas a Receber (multiempresa)
 * ============================================================ */
export type FinancialType = "PAGAR" | "RECEBER";
export type FinancialStatus = "PENDENTE" | "PAGO" | "ATRASADO";

export type FinancialRecord = {
  id: string;
  company_id: string;
  type: FinancialType;
  description: string;
  amount: number;
  dueDate: string;   // ISO
  paidDate?: string; // ISO
  status: FinancialStatus;
  customerId?: string;
  supplierId?: string;
  saleRef?: string;
};

const CATS = ["Alimentos", "Bebidas", "Limpeza", "Higiene", "Hortifruti", "Papelaria", "Eletrônicos", "Utilidades", "Vestuário", "Variedades"];
const SUPS = ["Distribuidora Central LTDA", "Atacado União", "Comercial Brasil", "Importadora Norte", "Distribuidora Sul", "Atacadão Geral"];

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const r = rng(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
const num = (a: number, b: number) => Math.floor(r() * (b - a) + a);

const PROD_SEEDS: { name: string; unit: Unit; category: string }[] = [
  { name: "Arroz Branco 5kg", unit: "un", category: "Alimentos" },
  { name: "Feijão Carioca 1kg", unit: "un", category: "Alimentos" },
  { name: "Açúcar Refinado 1kg", unit: "un", category: "Alimentos" },
  { name: "Café Torrado 500g", unit: "un", category: "Alimentos" },
  { name: "Óleo de Soja 900ml", unit: "un", category: "Alimentos" },
  { name: "Macarrão Espaguete 500g", unit: "un", category: "Alimentos" },
  { name: "Refrigerante 2L", unit: "un", category: "Bebidas" },
  { name: "Água Mineral 500ml", unit: "un", category: "Bebidas" },
  { name: "Suco Natural a Granel", unit: "L", category: "Bebidas" },
  { name: "Sabão em Pó 1kg", unit: "un", category: "Limpeza" },
  { name: "Detergente Líquido 500ml", unit: "un", category: "Limpeza" },
  { name: "Água Sanitária 1L", unit: "un", category: "Limpeza" },
  { name: "Vassoura Doméstica", unit: "un", category: "Limpeza" },
  { name: "Pano de Chão", unit: "un", category: "Limpeza" },
  { name: "Sabonete Glicerina", unit: "un", category: "Higiene" },
  { name: "Shampoo 350ml", unit: "un", category: "Higiene" },
  { name: "Pasta de Dente", unit: "un", category: "Higiene" },
  { name: "Papel Higiênico 12 rolos", unit: "un", category: "Higiene" },
  { name: "Banana Prata", unit: "kg", category: "Hortifruti" },
  { name: "Tomate Italiano", unit: "kg", category: "Hortifruti" },
  { name: "Maçã Fuji", unit: "kg", category: "Hortifruti" },
  { name: "Batata Inglesa", unit: "kg", category: "Hortifruti" },
  { name: "Queijo Mussarela Fatiado", unit: "kg", category: "Alimentos" },
  { name: "Presunto Cozido", unit: "kg", category: "Alimentos" },
  { name: "Tecido Algodão Cru", unit: "m", category: "Variedades" },
  { name: "Fita LED Branca", unit: "m", category: "Eletrônicos" },
  { name: "Mangueira de Jardim", unit: "m", category: "Utilidades" },
  { name: "Corda Trançada", unit: "m", category: "Utilidades" },
  { name: "Caderno 200 folhas", unit: "un", category: "Papelaria" },
  { name: "Caneta Esferográfica Azul", unit: "un", category: "Papelaria" },
  { name: "Pilha AA (par)", unit: "un", category: "Eletrônicos" },
  { name: "Lâmpada LED 9W", unit: "un", category: "Eletrônicos" },
  { name: "Carregador USB-C", unit: "un", category: "Eletrônicos" },
];

export const PRODUCTS: Product[] = PROD_SEEDS.map(({ name, unit, category }, i) => {
  const cost = num(3, 180);
  const rawStock = num(0, 240) + (isFractional(unit) ? +r().toFixed(2) : 0);
  const rawMin = num(10, 40) + (isFractional(unit) ? +r().toFixed(2) : 0);
  return {
    id: `P${String(i + 1).padStart(4, "0")}`,
    company_id: "EMP001",
    ean: String(7890000000000 + num(1000, 999999)),
    name,
    category,
    costPrice: cost,
    salePrice: +(cost * (1.25 + r() * 0.6)).toFixed(2),
    stock: +rawStock.toFixed(3),
    minStock: +rawMin.toFixed(3),
    unit,
    supplier: pick(SUPS),
    status: r() > 0.08 ? "ativo" : "inativo",
  };
});

// Produtos de homologação com EAN-13 fixo para testar o leitor de código de barras
// sem hardware (basta digitar o código no campo de busca do PDV).
const SCAN_DEMO: { ean: string; name: string; unit: Unit; category: string; price: number }[] = [
  { ean: "7891000100101", name: "Coca-Cola Lata 350ml", unit: "un", category: "Bebidas", price: 6.49 },
  { ean: "7892000200202", name: "Martelo de Unha 27mm", unit: "un", category: "Utilidades", price: 38.9 },
  { ean: "7893000300303", name: "Cabo Elétrico Flexível", unit: "m", category: "Eletrônicos", price: 4.75 },
];
SCAN_DEMO.forEach((d, i) => {
  PRODUCTS.push({
    id: `PScan${i + 1}`,
    company_id: "EMP001",
    ean: d.ean,
    name: d.name,
    category: d.category,
    costPrice: +(d.price * 0.6).toFixed(2),
    salePrice: d.price,
    stock: 50,
    minStock: 10,
    unit: d.unit,
    supplier: SUPS[0],
    status: "ativo",
  });
});

const CUST_NAMES = [
  "Construtora Aliança LTDA", "Reforma Já ME", "João da Silva", "Maria Oliveira",
  "Pedro Construções", "Casa Nova Materiais", "Edificar Engenharia", "Ana Paula Lima",
  "Marcos Eletricista", "Lar Doce Lar Reformas",
];

export const CUSTOMERS: Person[] = CUST_NAMES.map((name, i) => ({
  id: `C${String(i + 1).padStart(3, "0")}`,
  company_id: "EMP001",
  name,
  doc: name.includes("LTDA") || name.includes("ME") || name.includes("Construções") || name.includes("Materiais") || name.includes("Engenharia") || name.includes("Reformas")
    ? `${num(10, 99)}.${num(100, 999)}.${num(100, 999)}/0001-${num(10, 99)}`
    : `${num(100, 999)}.${num(100, 999)}.${num(100, 999)}-${num(10, 99)}`,
  email: `contato${i + 1}@exemplo.com.br`,
  phone: `(11) 9${num(1000, 9999)}-${num(1000, 9999)}`,
  city: pick(["São Paulo", "Campinas", "Sorocaba", "Santos", "Ribeirão Preto"]),
  creditLimit: [500, 1000, 2000, 3500, 5000, 7500, 10000][num(0, 7)],
  currentDebt: r() > 0.55 ? +(r() * 2200 + 80).toFixed(2) : 0,
}));

export const SUPPLIERS: Person[] = SUPS.map((name, i) => ({
  id: `F${String(i + 1).padStart(3, "0")}`,
  company_id: "EMP001",
  name,
  doc: `${num(10, 99)}.${num(100, 999)}.${num(100, 999)}/0001-${num(10, 99)}`,
  email: `comercial@${name.toLowerCase().replace(/[^a-z]/g, "")}.com.br`,
  phone: `(11) 3${num(100, 999)}-${num(1000, 9999)}`,
  city: pick(["São Paulo", "Joinville", "Curitiba", "Belo Horizonte"]),
  creditLimit: 0,
  currentDebt: 0,
}));

export const SALES: Sale[] = Array.from({ length: 28 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  const payment = pick(["Dinheiro", "Cartão", "Pix"] as const);
  // Cerca de 60% das vendas no Cartão saem parceladas em 2x–12x; o resto, à vista.
  const installments =
    payment === "Cartão"
      ? (r() > 0.4 ? pick([2, 3, 4, 6, 10, 12] as const) : 1)
      : undefined;
  const total = +(num(80, 4500) + r()).toFixed(2);
  return {
    id: `V${String(20240 + i).padStart(5, "0")}`,
    company_id: "EMP001",
    date: d.toISOString(),
    customer: pick(CUST_NAMES),
    total,
    cost: +(total * (0.55 + r() * 0.15)).toFixed(2),
    items: num(1, 12),
    payment,
    installments,
    status: r() > 0.12 ? "concluida" : r() > 0.5 ? "pendente" : "cancelada",
  };
});

export const MOVEMENTS: Movement[] = Array.from({ length: 24 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  return {
    id: `M${String(5000 + i).padStart(5, "0")}`,
    company_id: "EMP001",
    date: d.toISOString(),
    product: pick(PROD_SEEDS).name,
    type: pick(["Entrada", "Saída", "Ajuste"] as const),
    qty: num(1, 80),
    user: pick(["admin", "joao.vendas", "maria.estoque", "ricardo.gerente"]),
  };
});

// Charts
export const SALES_BY_DAY = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  return {
    day: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    vendas: num(2800, 9200),
    lucro: num(900, 3400),
  };
});

export const TOP_PRODUCTS = [
  { name: "Arroz Branco 5kg", vendas: 312 },
  { name: "Refrigerante 2L", vendas: 248 },
  { name: "Sabão em Pó 1kg", vendas: 196 },
  { name: "Banana Prata (kg)", vendas: 174 },
  { name: "Detergente Líquido 500ml", vendas: 142 },
  { name: "Papel Higiênico 12 rolos", vendas: 118 },
];

export const CATEGORY_SHARE = CATS.slice(0, 5).map((name, i) => ({
  name,
  value: [32, 24, 16, 14, 14][i],
}));

export const KPIS = {
  vendasMes: 184_320.55,
  lucroMes: 56_180.22,
  itensEstoque: PRODUCTS.reduce((a, p) => a + p.stock, 0),
  estoqueBaixo: PRODUCTS.filter((p) => p.stock <= p.minStock).length,
};

export const BRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// ============================================================
// Tenant-scoped helpers (multi-empresa)
// Toda nova consulta/escrita deve passar pelo company_id atual.
// Ex.: getCompanyProducts(user.companyId)
// ============================================================
export const getCompanyProducts = (cid: string | null) =>
  cid ? PRODUCTS.filter((p) => p.company_id === cid) : [];
export const getCompanySales = (cid: string | null) =>
  cid ? SALES.filter((s) => s.company_id === cid) : [];
export const getCompanyMovements = (cid: string | null) =>
  cid ? MOVEMENTS.filter((m) => m.company_id === cid) : [];
export const getCompanySuppliers = (cid: string | null) =>
  cid ? SUPPLIERS.filter((s) => s.company_id === cid) : [];
export const getCompanyCustomers = (cid: string | null) =>
  cid ? CUSTOMERS.filter((c) => c.company_id === cid) : [];

/* ============================================================
 * Financeiro — seed + helpers tenant-scoped
 * ============================================================ */
function isOverdue(rec: { status: FinancialStatus; dueDate: string }) {
  if (rec.status !== "PENDENTE") return false;
  return new Date(rec.dueDate).getTime() < Date.now() - 24 * 3600 * 1000;
}

export const FINANCIAL_RECORDS: FinancialRecord[] = (() => {
  const out: FinancialRecord[] = [];
  let seq = 7000;
  const now = new Date();
  // Contas a pagar (fornecedores) — recorrentes do mês corrente
  const pagar = [
    { desc: "Aluguel — loja matriz", amount: 4800, daysFromNow: 5 },
    { desc: "Energia elétrica — CPFL", amount: 1240.55, daysFromNow: -3 },
    { desc: "Internet fibra empresarial", amount: 299.9, daysFromNow: 10 },
    { desc: "Fornecedor Distribuidora Central LTDA", amount: 6890.0, daysFromNow: -8 },
    { desc: "Folha de pagamento — operadores", amount: 9500.0, daysFromNow: 15 },
  ];
  pagar.forEach((p, i) => {
    const d = new Date(now); d.setDate(d.getDate() + p.daysFromNow);
    const rec: FinancialRecord = {
      id: `FR${seq++}`,
      company_id: "EMP001",
      type: "PAGAR",
      description: p.desc,
      amount: p.amount,
      dueDate: d.toISOString(),
      status: i === 1 ? "PAGO" : "PENDENTE",
      paidDate: i === 1 ? new Date(d.getTime() - 86400000).toISOString() : undefined,
    };
    if (isOverdue(rec)) rec.status = "ATRASADO";
    out.push(rec);
  });
  // Contas a receber (clientes em crediário)
  CUSTOMERS.slice(0, 4).forEach((c, i) => {
    const d = new Date(now); d.setDate(d.getDate() + (i * 7 - 4));
    const rec: FinancialRecord = {
      id: `FR${seq++}`,
      company_id: "EMP001",
      type: "RECEBER",
      description: `Crediário — ${c.name}`,
      amount: +(380 + i * 220).toFixed(2),
      dueDate: d.toISOString(),
      status: i === 0 ? "PAGO" : "PENDENTE",
      paidDate: i === 0 ? new Date(d.getTime() - 86400000).toISOString() : undefined,
      customerId: c.id,
      saleRef: `V${20100 + i}`,
    };
    if (isOverdue(rec)) rec.status = "ATRASADO";
    out.push(rec);
  });
  return out;
})();

export const getCompanyFinancialRecords = (cid: string | null): FinancialRecord[] => {
  if (!cid) return [];
  // Reavalia status (PENDENTE → ATRASADO se vencido) a cada leitura.
  return FINANCIAL_RECORDS
    .filter((r) => r.company_id === cid)
    .map((r) => (isOverdue(r) ? { ...r, status: "ATRASADO" as FinancialStatus } : r));
};

let __finSeq = 8000;
export function addFinancialRecord(input: Omit<FinancialRecord, "id" | "status"> & { status?: FinancialStatus }): FinancialRecord {
  const rec: FinancialRecord = {
    id: `FR${__finSeq++}`,
    status: input.status ?? "PENDENTE",
    ...input,
  };
  if (isOverdue(rec)) rec.status = "ATRASADO";
  FINANCIAL_RECORDS.push(rec);
  __emit();
  return rec;
}

export function markFinancialPaid(id: string, paidDate = new Date().toISOString()): boolean {
  const rec = FINANCIAL_RECORDS.find((r) => r.id === id);
  if (!rec) return false;
  rec.status = "PAGO";
  rec.paidDate = paidDate;
  __emit();
  return true;
}

export function markFinancialPending(id: string): boolean {
  const rec = FINANCIAL_RECORDS.find((r) => r.id === id);
  if (!rec) return false;
  rec.status = "PENDENTE";
  rec.paidDate = undefined;
  if (isOverdue(rec)) rec.status = "ATRASADO";
  __emit();
  return true;
}

// ============================================================
// Credit / Crediário store (mock — in-memory, reactive)
// ============================================================

export type CreditDebt = {
  id: string;
  customerId: string;
  date: string;
  total: number; // original amount
  paid: number;  // already paid
  ref?: string;  // sale reference (e.g. V20245)
};

// Seed a few open debts for customers that start with currentDebt > 0
export const CREDIT_DEBTS: CreditDebt[] = (() => {
  const out: CreditDebt[] = [];
  let seq = 9000;
  CUSTOMERS.forEach((c) => {
    if (c.currentDebt <= 0) return;
    let remaining = c.currentDebt;
    const n = Math.max(1, Math.min(3, Math.ceil(remaining / 900)));
    for (let i = 0; i < n; i++) {
      const slice = i === n - 1 ? remaining : +(remaining / (n - i) * (0.4 + Math.random() * 0.5)).toFixed(2);
      const d = new Date();
      d.setDate(d.getDate() - (i * 7 + Math.floor(Math.random() * 4)));
      out.push({
        id: `D${seq++}`,
        customerId: c.id,
        date: d.toISOString(),
        total: slice,
        paid: 0,
        ref: `V${20100 + seq}`,
      });
      remaining = +(remaining - slice).toFixed(2);
      if (remaining <= 0) break;
    }
  });
  return out;
})();

// Simple reactive layer so multiple routes/components re-render on changes.
const __listeners = new Set<() => void>();
export const subscribeMockStore = (fn: () => void): (() => void) => {
  __listeners.add(fn);
  return () => {
    __listeners.delete(fn);
  };
};
const __emit = () => __listeners.forEach((l) => l());

let __debtSeq = 9500;

/* ---------------------------------------------------------------- */
/*  Sales registration (PDV → SALES history + reactive emit)         */
/* ---------------------------------------------------------------- */

let __saleSeq = 20300;
export function registerSale(input: {
  total: number;
  items: number;
  payment: Sale["payment"];
  customer?: string;
  installments?: number;
  company_id?: string;
}): Sale {
  const sale: Sale = {
    id: `V${String(__saleSeq++).padStart(5, "0")}`,
    company_id: input.company_id ?? "EMP001",
    date: new Date().toISOString(),
    customer: input.customer || "Consumidor",
    total: +input.total.toFixed(2),
    items: input.items,
    payment: input.payment,
    status: "concluida",
    installments: input.payment === "Cartão" ? Math.max(1, Math.min(12, input.installments ?? 1)) : undefined,
  };
  SALES.unshift(sale);
  __emit();
  return sale;
}

/* ---------------------------------------------------------------- */
/*  Movements (auditoria de estoque)                                 */
/* ---------------------------------------------------------------- */

let __movSeq = 6000;
export function registerMovement(input: {
  company_id: string;
  productId?: string;
  product: string;
  type: Movement["type"];
  qty: number;
  user: string;
  reason?: string;
}): Movement {
  const mov: Movement = {
    id: `M${String(__movSeq++).padStart(5, "0")}`,
    company_id: input.company_id,
    date: new Date().toISOString(),
    product: input.product,
    productId: input.productId,
    type: input.type,
    qty: +input.qty.toFixed(3),
    user: input.user,
    reason: input.reason,
  };
  MOVEMENTS.unshift(mov);
  __emit();
  return mov;
}

/**
 * Finaliza uma venda do PDV: registra a venda, debita o estoque de cada item
 * filtrando pelo company_id e cria uma movimentação de SAÍDA para auditoria.
 */
export function commitPdvSale(input: {
  company_id: string;
  user: string;
  items: { id: string; name: string; qty: number }[];
  total: number;
  payment: Sale["payment"];
  installments?: number;
  customer?: string;
  /** Quando informado, registra a venda como crediário e gera Conta a Receber. */
  customerId?: string;
  crediario?: boolean;
  /** Dias para vencimento da Conta a Receber (default 30). */
  crediarioDueDays?: number;
}): Sale {
  // Custo real da venda (soma cost × qty por item).
  let cost = 0;
  input.items.forEach((it) => {
    const p = PRODUCTS.find((pp) => pp.id === it.id && pp.company_id === input.company_id);
    if (p) cost += p.costPrice * it.qty;
  });
  const sale = registerSale({
    total: input.total,
    items: input.items.length,
    payment: input.payment,
    customer: input.customer,
    installments: input.installments,
    company_id: input.company_id,
  });
  sale.cost = +cost.toFixed(2);
  sale.crediario = !!input.crediario;
  sale.customerId = input.customerId;
  input.items.forEach((it) => {
    const p = PRODUCTS.find((pp) => pp.id === it.id && pp.company_id === input.company_id);
    if (!p) return;
    p.stock = +Math.max(0, p.stock - it.qty).toFixed(3);
    registerMovement({
      company_id: input.company_id,
      productId: p.id,
      product: p.name,
      type: "Saída",
      qty: it.qty,
      user: input.user,
      reason: `Venda PDV ${sale.id}`,
    });
  });
  // Crediário → cria Conta a Receber + atualiza saldo do cliente.
  if (input.crediario && input.customerId) {
    const days = input.crediarioDueDays ?? 30;
    const due = new Date(); due.setDate(due.getDate() + days);
    const cust = CUSTOMERS.find((c) => c.id === input.customerId);
    addFinancialRecord({
      company_id: input.company_id,
      type: "RECEBER",
      description: `Crediário — ${cust?.name ?? "Cliente"} · ${sale.id}`,
      amount: input.total,
      dueDate: due.toISOString(),
      customerId: input.customerId,
      saleRef: sale.id,
    });
    addCreditDebt(input.customerId, input.total, sale.id);
  }
  // Auditoria global da plataforma
  logEvent({
    kind: "SALE_OK",
    company_id: input.company_id,
    user: input.user,
    action: `Venda ${sale.id} concluída (R$ ${input.total.toFixed(2).replace(".", ",")})${input.crediario ? " — crediário" : ""}.`,
  });
  __emit();
  return sale;
}

export function addCreditDebt(customerId: string, amount: number, ref?: string): CreditDebt | null {
  const c = CUSTOMERS.find((p) => p.id === customerId);
  if (!c || amount <= 0) return null;
  const debt: CreditDebt = {
    id: `D${__debtSeq++}`,
    customerId,
    date: new Date().toISOString(),
    total: +amount.toFixed(2),
    paid: 0,
    ref,
  };
  CREDIT_DEBTS.push(debt);
  c.currentDebt = +(c.currentDebt + amount).toFixed(2);
  __emit();
  return debt;
}

/**
 * Apply a payment against a customer's open debts (oldest first).
 * Returns the actual amount applied (capped at total open balance).
 */
export function applyCreditPayment(customerId: string, amount: number): number {
  const c = CUSTOMERS.find((p) => p.id === customerId);
  if (!c || amount <= 0) return 0;
  let remaining = amount;
  const open = CREDIT_DEBTS
    .filter((d) => d.customerId === customerId && d.total - d.paid > 0.0001)
    .sort((a, b) => a.date.localeCompare(b.date));
  for (const d of open) {
    if (remaining <= 0.0001) break;
    const owed = d.total - d.paid;
    const apply = Math.min(owed, remaining);
    d.paid = +(d.paid + apply).toFixed(2);
    remaining = +(remaining - apply).toFixed(2);
  }
  const applied = +(amount - remaining).toFixed(2);
  c.currentDebt = +Math.max(0, c.currentDebt - applied).toFixed(2);
  __emit();
  return applied;
}

export function updateCustomer(id: string, patch: Partial<Pick<Person, "creditLimit" | "currentDebt" | "name" | "email" | "phone" | "city" | "doc">>) {
  const c = CUSTOMERS.find((p) => p.id === id);
  if (!c) return;
  Object.assign(c, patch);
  __emit();
}

/* ---------------------------------------------------------------- */
/*  Generic delete helpers (in-memory mock store)                   */
/* ---------------------------------------------------------------- */

function removeById<T extends { id: string }>(arr: T[], id: string): boolean {
  const idx = arr.findIndex((x) => x.id === id);
  if (idx === -1) return false;
  arr.splice(idx, 1);
  return true;
}

export function deleteCustomer(id: string): boolean {
  const ok = removeById(CUSTOMERS, id);
  if (ok) {
    // also clean credit history for that customer
    for (let i = CREDIT_DEBTS.length - 1; i >= 0; i--) {
      if (CREDIT_DEBTS[i].customerId === id) CREDIT_DEBTS.splice(i, 1);
    }
    __emit();
  }
  return ok;
}

export function deleteProduct(id: string): boolean {
  const ok = removeById(PRODUCTS, id);
  if (ok) __emit();
  return ok;
}

export function deleteSupplier(id: string): boolean {
  const ok = removeById(SUPPLIERS, id);
  if (ok) __emit();
  return ok;
}

export function deleteMovement(id: string): boolean {
  const ok = removeById(MOVEMENTS, id);
  if (ok) __emit();
  return ok;
}

/* ---------------------------------------------------------------- */
/*  Reset de dados comerciais (homologação)                          */
/*  Zera vendas, produtos, clientes, fornecedores, movimentações,    */
/*  financeiro, crediário, logs e KPIs do dashboard — mantendo       */
/*  intactos os usuários (logins) e as empresas cadastradas.         */
/* ---------------------------------------------------------------- */
export function resetCommercialData(): void {
  // Esvazia todos os arrays mutáveis (preservando as referências exportadas).
  [
    PRODUCTS, SALES, MOVEMENTS, CUSTOMERS, SUPPLIERS,
    CREDIT_DEBTS, FINANCIAL_RECORDS, SYSTEM_LOGS, SUPPORT_TICKETS,
    SALES_BY_DAY as unknown as unknown[],
    TOP_PRODUCTS as unknown as unknown[],
    CATEGORY_SHARE as unknown as unknown[],
  ].forEach((arr) => { (arr as unknown[]).splice(0, (arr as unknown[]).length); });

  // Zera contadores do dashboard.
  KPIS.vendasMes = 0;
  KPIS.lucroMes = 0;
  KPIS.itensEstoque = 0;
  KPIS.estoqueBaixo = 0;

  // Limpa estado de PDV aberto e configurações fiscais por empresa no navegador.
  if (typeof window !== "undefined") {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (k.startsWith("orvix_pdv_open_") || k.startsWith("orvix_fiscal_")) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }

  __emit();
}

/* ---------------------------------------------------------------- */
/*  Public EAN catalog (mock — simulates a commercial GTIN lookup)  */
/* ---------------------------------------------------------------- */

export type CatalogHit = {
  ean: string;
  name: string;
  brand: string;
  category: string;
  unit: Unit;
};

export const EAN_CATALOG: CatalogHit[] = [
  { ean: "7894900011517", name: "Coca-Cola Original 2L", brand: "Coca-Cola", category: "Bebidas", unit: "un" },
  { ean: "7891000100101", name: "Refrigerante Coca-Cola Lata 350ml", brand: "Coca-Cola", category: "Bebidas", unit: "un" },
  { ean: "7892000200202", name: "Martelo de Unha Polido 27mm", brand: "Tramontina", category: "Ferramentas", unit: "un" },
  { ean: "7891910000197", name: "Leite Integral Italac 1L", brand: "Italac", category: "Laticínios", unit: "un" },
  { ean: "7891000053508", name: "Café Solúvel Nescafé 100g", brand: "Nescafé", category: "Mercearia", unit: "un" },
  { ean: "7896005800010", name: "Biscoito Recheado Bono Chocolate 90g", brand: "Bono", category: "Biscoitos", unit: "un" },
  { ean: "7891150056756", name: "Sabão em Pó Omo Lavagem Perfeita 1.6kg", brand: "Omo", category: "Limpeza", unit: "un" },
  { ean: "7891035001119", name: "Creme Dental Colgate Total 12 90g", brand: "Colgate", category: "Higiene", unit: "un" },
];

/** Cleans a category tag from Open Food Facts (e.g. "en:beverages" → "Beverages"). */
function cleanCategory(raw: string): string {
  const stripped = raw.includes(":") ? raw.split(":").pop()! : raw;
  return stripped
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Picks the most specific (last) human category from Open Food Facts arrays. */
function pickCategory(p: any): string {
  if (Array.isArray(p?.categories_tags) && p.categories_tags.length) {
    return cleanCategory(p.categories_tags[p.categories_tags.length - 1]);
  }
  if (typeof p?.categories === "string" && p.categories.trim()) {
    const parts = p.categories.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (parts.length) return cleanCategory(parts[parts.length - 1]);
  }
  return "Geral";
}

/** Infers a friendly retail category from a product name when the API doesn't expose one. */
function inferCategoryFromName(name: string): string | null {
  const n = name.toLowerCase();
  const rules: Array<[RegExp, string]> = [
    [/desodorante|antitranspirante|perfume|colônia|colonia|shampoo|condicionador|sabonete|creme dental|escova de dente|fio dental|absorvente|fralda|hidratante|protetor solar|barbear/i, "Higiene"],
    [/sabão|sabao|detergente|amaciante|alvejante|água sanitária|agua sanitaria|desinfetante|limpa|multiuso|esponja|lustra|inseticida/i, "Limpeza"],
    [/refrigerante|cerveja|suco|água|agua|vinho|whisky|vodka|energético|energetico|isotônico|isotonico|chá|cha gelado/i, "Bebidas"],
    [/leite|iogurte|queijo|manteiga|requeijão|requeijao|nata|creme de leite/i, "Laticínios"],
    [/biscoito|bolacha|chocolate|bombom|wafer|bolo|torta|sorvete/i, "Doces e Biscoitos"],
    [/arroz|feijão|feijao|macarrão|macarrao|farinha|açúcar|acucar|óleo|oleo|café|cafe|sal|molho|tempero/i, "Mercearia"],
    [/pão|pao|bisnaguinha|broa|baguete/i, "Padaria"],
    [/carne|frango|peixe|linguiça|linguica|presunto|salsicha|mortadela/i, "Açougue"],
    [/martelo|chave|alicate|parafuso|prego|broca|furadeira|serrote|trena/i, "Ferramentas"],
    [/caderno|caneta|lápis|lapis|borracha|cola|tesoura|papel/i, "Papelaria"],
    [/ração|racao|petisco|areia higiênica|areia higienica/i, "Pet"],
  ];
  for (const [re, cat] of rules) if (re.test(n)) return cat;
  return null;
}

function normalizeHit(ean: string, raw: { name?: string; brand?: string; category?: string }): CatalogHit | null {
  const name = (raw.name || "").trim();
  const brand = (raw.brand || "").trim();
  if (!name && !brand) return null;
  const finalName = name || (brand ? `${brand} (${ean})` : `Produto ${ean}`);
  let category = (raw.category || "").trim();
  if (!category || category.toLowerCase() === "geral") {
    category = inferCategoryFromName(finalName) || category || "Geral";
  }
  return { ean, name: finalName, brand: brand || "—", category, unit: "un" };
}

async function fetchJson(url: string, signal: AbortSignal): Promise<any | null> {
  console.groupCollapsed(`%c[lookupEan] → fetch`, "color:#3b82f6;font-weight:bold", url);
  try {
    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    console.log("status:", res.status, res.statusText, "| ok:", res.ok);
    if (!res.ok) { console.warn("❌ resposta não-OK — abortando este endpoint"); console.groupEnd(); return null; }
    const json = await res.json();
    console.log("✅ JSON bruto recebido:", json);
    console.groupEnd();
    return json;
  } catch (err) {
    console.error("💥 erro de rede / CORS / timeout:", err);
    console.groupEnd();
    return null;
  }
}

/**
 * Brazil Market — espelho público de catálogo nacional (JSON puro, via proxy CORS).
 * Mapeamento genérico para capturar qualquer setor (higiene, limpeza, parafuso, caderno…).
 */
async function fetchBrazilMarket(ean: string, signal: AbortSignal): Promise<CatalogHit | null> {
  const url = `https://corsproxy.io/?https://arquivos.brazilmarket.com.br/api/products/${ean}`;
  const data = await fetchJson(url, signal);
  if (!data) return null;
  // resposta pode vir como objeto único ou array; trate ambos
  const p = Array.isArray(data) ? data[0] : (data.product || data.data || data);
  if (!p || typeof p !== "object") return null;
  const name = p.description || p.name || p.title || p.product_name || "";
  if (!name) return null;
  const brand = p.brand || p.manufacturer || p.marca || name.split(" ")[0] || "";
  return normalizeHit(ean, { name, brand, category: "" }); // categoria via inferência
}

/** Open Food Facts — CORS totalmente liberado. URL pura, sem encode. */
async function fetchOpenFoodFacts(ean: string, signal: AbortSignal): Promise<CatalogHit | null> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${ean}.json`;
  const data = await fetchJson(url, signal);
  return parseOFFLike(ean, data);
}

/** Open Beauty Facts — cosméticos, perfumaria e higiene (mesmo schema do OFF). */
async function fetchOpenBeautyFacts(ean: string, signal: AbortSignal): Promise<CatalogHit | null> {
  const url = `https://world.openbeautyfacts.org/api/v2/product/${ean}.json`;
  const data = await fetchJson(url, signal);
  return parseOFFLike(ean, data);
}

/** Open Products Facts — limpeza, eletrodomésticos, brinquedos, papelaria. */
async function fetchOpenProductsFacts(ean: string, signal: AbortSignal): Promise<CatalogHit | null> {
  const url = `https://world.openproductsfacts.org/api/v2/product/${ean}.json`;
  const data = await fetchJson(url, signal);
  return parseOFFLike(ean, data);
}

/** Parser flexível compartilhado entre Open*Facts. */
function parseOFFLike(ean: string, data: any): CatalogHit | null {
  if (!data || (data.status !== 1 && !data.product)) return null;
  const p = data.product || {};
  const name = p.product_name_pt || p.product_name || p.generic_name || "";
  const brandRaw = p.brands || p.brand_owner || "";
  const brand = typeof brandRaw === "string" ? brandRaw.split(",")[0] : "";
  let category = "";
  if (Array.isArray(p.categories_hierarchy) && p.categories_hierarchy.length) {
    category = cleanCategory(p.categories_hierarchy[0]);
  } else {
    category = pickCategory(p);
  }
  if (!name && !brand) return null;
  return normalizeHit(ean, { name, brand, category });
}

/**
 * Parser genérico para o JSON do espelho VTEX público.
 * Cobre formatos comuns: array com itens, objeto direto, ou wrapper { product }.
 */
function parseVtexLike(ean: string, data: any): CatalogHit | null {
  if (!data) return null;
  const p = Array.isArray(data) ? data[0] : (data.product || data.data || data);
  if (!p || typeof p !== "object") return null;
  const name =
    p.productName || p.ProductName || p.description || p.Description ||
    p.name || p.title || p.product_name || "";
  if (!name) return null;
  const brand =
    p.brand || p.Brand || p.brandName || p.BrandName ||
    p.manufacturer || p.Manufacturer || p.marca ||
    name.split(" ")[0] || "";
  return normalizeHit(ean, { name, brand, category: "" }); // categoria via inferência
}

/**
 * VTEX público (catálogo comercial BR) via proxy CORS — URL pura, sem encode.
 */
async function fetchVtexPublic(ean: string, signal: AbortSignal): Promise<CatalogHit | null> {
  const url = `https://corsproxy.io/?https://api.vtex.com/public/products/ean/${ean}`;
  const data = await fetchJson(url, signal);
  return parseVtexLike(ean, data);
}

/**
 * Mapa de interceptação de demonstração comercial — códigos reais de mercado
 * com dados estruturados injetados instantaneamente (pitch de vendas).
 */
const DEMO_EAN_MAP: Record<string, { name: string; brand: string; category: string }> = {
  "7896098909751": { name: "Sabão em Pó Tixan Ypê Primavera 1kg", brand: "Ypê", category: "Limpeza" },
  "7891350037809": { name: "Desodorante Aerosol Avanço Reg regular 150ml", brand: "Avanço", category: "Higiene" },
  "7894900011517": { name: "Coca-Cola Original 2L", brand: "Coca-Cola", category: "Bebidas" },
  "7891000100101": { name: "Refrigerante Coca-Cola Lata 350ml", brand: "Coca-Cola", category: "Bebidas" },
};

/**
 * Lookup EAN — Interceptador Híbrido:
 *  1. Catálogo local (instantâneo).
 *  2. Mapa de demonstração → delay de 1s simulando cloud → sucesso garantido.
 *  3. APIs públicas (OpenFoodFacts) com timeout de 2s → null para contingência.
 */
export async function lookupEan(ean: string): Promise<CatalogHit | null> {
  console.log(
    `%c[lookupEan] EAN="${ean}" (${ean.length} dígitos)`,
    "color:#10b981;font-weight:bold",
  );

  const local = EAN_CATALOG.find((c) => c.ean === ean);
  if (local) {
    console.log("🎯 catálogo LOCAL:", local);
    return local;
  }

  // Interceptador de demonstração — simula latência de cloud (1s) e retorna sucesso.
  const demo = DEMO_EAN_MAP[ean];
  if (demo) {
    console.log("🎬 demo intercept (1s simulado):", demo);
    await new Promise((r) => setTimeout(r, 1000));
    return normalizeHit(ean, demo);
  }

  // Fora do mapa: tenta APIs JSON públicas com timeout de 2s.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const hit = await fetchOpenFoodFacts(ean, controller.signal);
    if (hit) {
      console.log("🏆 Open Food Facts:", hit);
      return hit;
    }
    console.warn("🚫 não encontrado em base pública — contingência manual");
    return null;
  } catch (err) {
    console.error("[lookupEan] exceção:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------------------------------------------- */
/*  Product registration (Cadastro rápido → PRODUCTS + reactive)    */
/* ---------------------------------------------------------------- */

let __prodSeq = PRODUCTS.length + 1;
export function addProduct(input: {
  ean: string;
  name: string;
  brand?: string;
  category: string;
  unit: Unit;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  supplier?: string;
}): Product {
  const p: Product = {
    id: `P${String(__prodSeq++).padStart(4, "0")}`,
    company_id: "EMP001",
    ean: input.ean,
    name: input.brand ? `${input.name}${input.name.toLowerCase().includes(input.brand.toLowerCase()) ? "" : ` — ${input.brand}`}` : input.name,
    category: input.category,
    costPrice: +input.costPrice.toFixed(2),
    salePrice: +input.salePrice.toFixed(2),
    stock: +input.stock.toFixed(3),
    minStock: +input.minStock.toFixed(3),
    unit: input.unit,
    supplier: input.supplier || SUPS[0],
    status: "ativo",
  };
  PRODUCTS.unshift(p);
  __emit();
  return p;
}

/* ---------------------------------------------------------------- */
/*  Supplier registration (tenant-scoped)                           */
/* ---------------------------------------------------------------- */

let __supSeq = SUPPLIERS.length + 1;
export function addSupplier(companyId: string, input: {
  name: string;
  doc: string;
  email: string;
  phone: string;
  city: string;
}): Person {
  const s: Person = {
    id: `F${String(__supSeq++).padStart(3, "0")}`,
    company_id: companyId,
    name: input.name.trim(),
    doc: input.doc.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    city: input.city.trim(),
    creditLimit: 0,
    currentDebt: 0,
  };
  SUPPLIERS.unshift(s);
  __emit();
  return s;
}
