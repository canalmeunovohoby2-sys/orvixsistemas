import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import { BRL, PRODUCTS, UNITS, addProduct, deleteProduct, formatQty, isFractional, lookupEan, type Product, type Unit } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Camera, CheckCircle2, Loader2, Plus, ScanLine, X } from "lucide-react";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { useMockStore } from "@/hooks/use-mock-store";
import { toast } from "sonner";

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
  useMockStore();
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
    {
      key: "actions",
      label: "",
      align: "right",
      render: (r) => (
        <div className="flex justify-end">
          <ConfirmDelete
            triggerAriaLabel={`Remover ${r.name}`}
            triggerTitle="Remover produto"
            title="Remover produto?"
            description={<>Deseja mesmo excluir o produto <strong className="text-foreground">{r.name}</strong>? Esta ação não poderá ser desfeita e ele será removido do inventário.</>}
            confirmLabel="Sim, excluir produto"
            onConfirm={() => {
              const name = r.name;
              if (deleteProduct(r.id)) toast.success(`Produto "${name}" excluído.`);
            }}
          />
        </div>
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

type LookupState = "idle" | "searching" | "found" | "notfound";

function ProductDrawer({ onClose }: { onClose: () => void }) {
  const [ean, setEan] = useState("");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [supplier, setSupplier] = useState("");
  const [desc, setDesc] = useState("");
  const [unit, setUnit] = useState<Unit>("un");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");

  const [lookup, setLookup] = useState<LookupState>("idle");
  const [autoFilled, setAutoFilled] = useState<Set<"name" | "brand" | "category" | "unit">>(new Set());
  const [scanning, setScanning] = useState(false);

  const costRef = useRef<HTMLInputElement>(null);
  const lastSearched = useRef<string>("");

  const decimalStep = isFractional(unit) ? "0.01" : "1";

  async function runLookup(code: string) {
    if (code.length !== 13 || lastSearched.current === code) return;
    lastSearched.current = code;
    setLookup("searching");
    const hit = await lookupEan(code);
    if (hit) {
      setName(hit.name);
      setBrand(hit.brand);
      setCategory(hit.category);
      setUnit(hit.unit);
      setAutoFilled(new Set(["name", "brand", "category", "unit"]));
      setLookup("found");
      toast.success(`Produto encontrado: ${hit.name}`, { description: `Marca: ${hit.brand} · Categoria: ${hit.category}` });
      setTimeout(() => costRef.current?.focus(), 60);
    } else {
      setLookup("notfound");
      setAutoFilled(new Set());
      toast.warning("Produto não encontrado na base pública.", {
        description: "Você pode cadastrá-lo manualmente abaixo — todos os campos estão liberados.",
      });
    }
  }

  function handleEanChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 13);
    setEan(digits);
    if (digits.length < 13) {
      setLookup("idle");
      lastSearched.current = "";
    } else {
      runLookup(digits);
    }
  }

  function startCameraScan() {
    if (scanning) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      // pega o primeiro EAN do catálogo público como simulação de leitura bem-sucedida
      const demoEan = "7894900011517";
      setEan(demoEan);
      runLookup(demoEan);
    }, 1500);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ean || !name || !category) {
      toast.error("Preencha código, nome e categoria do produto.");
      return;
    }
    const p = addProduct({
      ean,
      name,
      brand: brand || undefined,
      category,
      unit,
      costPrice: parseFloat(costPrice) || 0,
      salePrice: parseFloat(salePrice) || 0,
      stock: parseFloat(stock) || 0,
      minStock: parseFloat(minStock) || 0,
      supplier: supplier || undefined,
    });
    toast.success(`Produto "${p.name}" cadastrado.`);
    onClose();
  }

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
        <form className="flex-1 overflow-y-auto p-5 space-y-4" onSubmit={submit}>
          {/* CÓDIGO EAN + CÂMERA */}
          <div>
            <label htmlFor="ean" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Código EAN <span className="text-primary">*</span>
            </label>
            <div className="flex gap-2">
              <input
                id="ean"
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder="Bipe ou digite os 13 dígitos"
                value={ean}
                onChange={(e) => handleEanChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); runLookup(ean); } }}
                className="flex-1 px-3 py-2 rounded-md bg-secondary border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60"
              />
              <button
                type="button"
                onClick={startCameraScan}
                disabled={scanning}
                title="Escanear pela câmera do celular"
                className="h-10 w-10 grid place-items-center rounded-md border border-border bg-secondary hover:bg-accent disabled:opacity-60"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Simulação de câmera */}
            <AnimatePresence>
              {scanning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden rounded-md border border-emerald-500/40 bg-black/85"
                >
                  <div className="relative h-32 overflow-hidden">
                    <div className="absolute inset-0 grid place-items-center text-emerald-400/80 text-xs font-mono uppercase tracking-widest">
                      <span className="flex items-center gap-2"><ScanLine className="w-3.5 h-3.5" /> escaneando código…</span>
                    </div>
                    <motion.div
                      initial={{ top: "8%" }}
                      animate={{ top: "92%" }}
                      transition={{ duration: 0.9, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                      className="absolute left-4 right-4 h-[2px] bg-emerald-400 shadow-[0_0_12px_2px_rgba(16,185,129,0.85)]"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Feedback do lookup */}
            {lookup === "searching" && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                🔍 Consultando produto na base comercial…
              </div>
            )}
            {lookup === "found" && (
              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-500 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Produto identificado — defina apenas os valores financeiros.
              </div>
            )}
            {lookup === "notfound" && (
              <div className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-[12px] text-foreground">
                ⚠️ Produto não encontrado na base pública. Deseja cadastrá-lo manualmente? Todos os campos estão liberados abaixo.
              </div>
            )}
          </div>

          <FieldText id="name" label="Nome do produto" value={name} onChange={setName} highlight={autoFilled.has("name")} required />
          <FieldText id="brand" label="Marca" value={brand} onChange={setBrand} highlight={autoFilled.has("brand")} placeholder="Ex: Coca-Cola, Tramontina, Nestlé…" />
          <FieldText id="cat" label="Categoria" value={category} onChange={setCategory} highlight={autoFilled.has("category")} placeholder="Ex: Bebidas, Ferramentas, Higiene…" required />
          <FieldTextarea id="desc" label="Descrição" value={desc} onChange={setDesc} />
          <FieldText id="sup" label="Fornecedor" value={supplier} onChange={setSupplier} placeholder="Opcional" />
          <div>
            <label htmlFor="unit" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Unidade de medida <span className="text-primary">*</span>
              {autoFilled.has("unit") && <span className="ml-2 text-[10px] font-medium text-emerald-500 normal-case tracking-normal">· preenchido automaticamente</span>}
            </label>
            <select
              id="unit"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
              className={`w-full px-3 py-2 rounded-md bg-secondary border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 ${autoFilled.has("unit") ? "border-emerald-500/40" : "border-border"}`}
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
            <FieldNumber id="cost" label="Preço de custo (R$)" value={costPrice} onChange={setCostPrice} step="0.01" min="0" inputRef={costRef} />
            <FieldNumber id="sale" label="Preço de venda (R$)" value={salePrice} onChange={setSalePrice} step="0.01" min="0" />
            <FieldNumber id="stock" label={`Estoque inicial (${unit})`} value={stock} onChange={setStock} step={decimalStep} min="0" />
            <FieldNumber id="min" label={`Estoque mínimo (${unit})`} value={minStock} onChange={setMinStock} step={decimalStep} min="0" />
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

const baseInputCls =
  "w-full px-3 py-2 rounded-md bg-secondary border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60";

function FieldText({ id, label, value, onChange, placeholder, highlight, required }: { id: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string; highlight?: boolean; required?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-primary"> *</span>}
        {highlight && <span className="ml-2 text-[10px] font-medium text-emerald-500 normal-case tracking-normal">· auto</span>}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${baseInputCls} ${highlight ? "border-emerald-500/40" : "border-border"}`}
      />
    </div>
  );
}

function FieldTextarea({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{label}</label>
      <textarea id={id} rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={`${baseInputCls} border-border`} />
    </div>
  );
}

function FieldNumber({ id, label, value, onChange, step, min, inputRef }: { id: string; label: string; value: string; onChange: (v: string) => void; step?: string; min?: string; inputRef?: React.Ref<HTMLInputElement> }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{label}</label>
      <input
        ref={inputRef}
        id={id}
        type="number"
        value={value}
        step={step}
        min={min}
        inputMode="decimal"
        onChange={(e) => onChange(e.target.value)}
        className={`${baseInputCls} border-border`}
      />
    </div>
  );
}
