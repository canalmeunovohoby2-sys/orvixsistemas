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

export const formatQty = (qty: number, unit: Unit) =>
  isFractional(unit)
    ? qty.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })
    : Math.trunc(qty).toLocaleString("pt-BR");

export type Product = {
  id: string;
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
  date: string;
  customer: string;
  total: number;
  items: number;
  payment: "Dinheiro" | "Cartão" | "Pix";
  status: "concluida" | "pendente" | "cancelada";
  /** Parcelas no crédito (1 = à vista). Definido apenas quando payment === "Cartão". */
  installments?: number;
};

export type Movement = {
  id: string;
  date: string;
  product: string;
  type: "Entrada" | "Saída" | "Ajuste";
  qty: number;
  user: string;
};

export type Person = {
  id: string;
  name: string;
  doc: string;
  email: string;
  phone: string;
  city: string;
  creditLimit: number;
  currentDebt: number;
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
  return {
    id: `V${String(20240 + i).padStart(5, "0")}`,
    date: d.toISOString(),
    customer: pick(CUST_NAMES),
    total: +(num(80, 4500) + r()).toFixed(2),
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
}): Sale {
  const sale: Sale = {
    id: `V${String(__saleSeq++).padStart(5, "0")}`,
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
