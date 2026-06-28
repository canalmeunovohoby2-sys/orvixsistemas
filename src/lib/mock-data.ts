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
  return {
    id: `V${String(20240 + i).padStart(5, "0")}`,
    date: d.toISOString(),
    customer: pick(CUST_NAMES),
    total: +(num(80, 4500) + r()).toFixed(2),
    items: num(1, 12),
    payment: pick(["Dinheiro", "Cartão", "Pix"] as const),
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
