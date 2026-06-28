export type Product = {
  id: string;
  ean: string;
  name: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
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
};

const CATS = ["Cimento", "Tintas", "Hidráulica", "Elétrica", "Ferragens", "Madeiras", "Pisos", "Ferramentas"];
const SUPS = ["Votorantim Cimentos", "Suvinil Distribuidora", "Tigre Tubos", "Tramontina SA", "Gerdau Aços", "Eucatex"];

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const r = rng(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
const num = (a: number, b: number) => Math.floor(r() * (b - a) + a);

const PROD_NAMES = [
  "Cimento CP-II 50kg", "Tinta Acrílica Branca 18L", "Tubo PVC 100mm 6m", "Disjuntor 25A Tripolar",
  "Argamassa AC-III 20kg", "Furadeira de Impacto 800W", "Chave de Fenda 6\"", "Parafuso 6x40 (cx 100)",
  "Areia Lavada m³", "Brita 1 m³", "Bloco Cerâmico 9x19x19", "Telha Cerâmica Portuguesa",
  "Verniz Marítimo 3,6L", "Fio Flexível 2,5mm (100m)", "Tomada 2P+T 10A", "Lâmpada LED 9W",
  "Porcelanato 60x60 Polido", "Rejunte Cinza 1kg", "Caixa d'água 1000L", "Registro de Esfera 1\"",
  "Massa Corrida 25kg", "Rolo de Pintura 23cm", "Pincel 2\" Cerda Macia", "Trena 5m Profissional",
  "Serra Circular 1400W", "Martelo Unha 27mm", "Trincha 4\"", "Espátula Aço 4\"",
  "Cano de Cobre 22mm", "Cabo Coaxial RG6 (m)", "Interruptor Simples", "Refletor LED 50W",
];

export const PRODUCTS: Product[] = PROD_NAMES.map((name, i) => {
  const cost = num(8, 450);
  return {
    id: `P${String(i + 1).padStart(4, "0")}`,
    ean: String(7890000000000 + num(1000, 999999)),
    name,
    category: pick(CATS),
    costPrice: cost,
    salePrice: +(cost * (1.25 + r() * 0.6)).toFixed(2),
    stock: num(0, 240),
    minStock: num(10, 40),
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
}));

export const SUPPLIERS: Person[] = SUPS.map((name, i) => ({
  id: `F${String(i + 1).padStart(3, "0")}`,
  name,
  doc: `${num(10, 99)}.${num(100, 999)}.${num(100, 999)}/0001-${num(10, 99)}`,
  email: `comercial@${name.toLowerCase().replace(/[^a-z]/g, "")}.com.br`,
  phone: `(11) 3${num(100, 999)}-${num(1000, 9999)}`,
  city: pick(["São Paulo", "Joinville", "Curitiba", "Belo Horizonte"]),
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
    product: pick(PROD_NAMES),
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
  { name: "Cimento CP-II 50kg", vendas: 312 },
  { name: "Tinta Acrílica 18L", vendas: 248 },
  { name: "Tubo PVC 100mm", vendas: 196 },
  { name: "Argamassa AC-III", vendas: 174 },
  { name: "Disjuntor 25A", vendas: 142 },
  { name: "Fio Flexível 2,5mm", vendas: 118 },
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
