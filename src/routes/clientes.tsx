import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataTable, StatusBadge, type Column } from "@/components/DataTable";
import {
  BRL,
  CUSTOMERS,
  CREDIT_DEBTS,
  applyCreditPayment,
  deleteCustomer,
  updateCustomer,
  type Person,
  type CreditDebt,
} from "@/lib/mock-data";
import { useMockStore } from "@/hooks/use-mock-store";
import { AlertTriangle, HandCoins, Pencil, Plus, ShieldCheck, Wallet, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { ConfirmDelete } from "@/components/ConfirmDelete";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Crediário e Limite de Crédito | Meu Saas" },
      { name: "description", content: "Gestão de clientes com controle de crediário: limite de crédito, saldo devedor, histórico de débitos e baixa de pagamentos." },
      { property: "og:title", content: "Clientes — Crediário | Meu Saas" },
      { property: "og:description", content: "Contas a receber, fiado e quitação de dívidas com clientes do comércio." },
      { property: "og:url", content: "/clientes" },
    ],
    links: [{ rel: "canonical", href: "/clientes" }],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  useMockStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Person | null>(null);

  const selected = selectedId ? CUSTOMERS.find((c) => c.id === selectedId) ?? null : null;

  const totals = useMemo(() => {
    const inDebt = CUSTOMERS.filter((c) => c.currentDebt > 0);
    const overLimit = CUSTOMERS.filter((c) => c.creditLimit > 0 && c.currentDebt >= c.creditLimit);
    const totalReceivable = CUSTOMERS.reduce((a, c) => a + c.currentDebt, 0);
    return { inDebt: inDebt.length, overLimit: overLimit.length, totalReceivable };
  }, [CUSTOMERS.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const cols: Column<Person>[] = [
    { key: "id", label: "Código", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "name", label: "Nome / Razão", render: (r) => (
        <button onClick={() => setSelectedId(r.id)} className="text-left font-medium hover:text-primary transition-colors">
          {r.name}
        </button>
      ) },
    { key: "doc", label: "Documento", render: (r) => <span className="font-mono text-xs">{r.doc}</span> },
    { key: "city", label: "Cidade" },
    { key: "creditLimit", label: "Limite", align: "right", render: (r) => <span className="tabular-nums">{BRL(r.creditLimit)}</span> },
    { key: "currentDebt", label: "Saldo devedor", align: "right", render: (r) => (
        <span className={`tabular-nums font-semibold ${r.currentDebt > 0 ? "text-primary" : "text-muted-foreground"}`}>
          {BRL(r.currentDebt)}
        </span>
      ) },
    { key: "status", label: "Status", render: (r) => {
        if (r.creditLimit > 0 && r.currentDebt >= r.creditLimit) {
          return <StatusBadge kind="danger">Limite excedido</StatusBadge>;
        }
        if (r.currentDebt > 0) return <StatusBadge kind="warn">Em débito</StatusBadge>;
        return <StatusBadge kind="success">Em dia</StatusBadge>;
      } },
    { key: "actions", label: "", render: (r) => (
        <div className="flex justify-end gap-1">
          <button onClick={() => setSelectedId(r.id)} className="h-8 px-2.5 inline-flex items-center gap-1 rounded-md border border-border bg-secondary hover:bg-accent text-xs font-semibold">
            <Wallet className="w-3.5 h-3.5" /> Crediário
          </button>
          <button onClick={() => setEditing(r)} aria-label="Editar" className="w-8 h-8 grid place-items-center rounded-md border border-border bg-secondary hover:bg-accent">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <ConfirmDelete
            triggerAriaLabel={`Remover ${r.name}`}
            triggerTitle="Remover cliente"
            title="Remover cliente?"
            description={<>Você está prestes a remover <strong className="text-foreground">{r.name}</strong> ({r.id}). Esta ação é permanente e não poderá ser desfeita.</>}
            criticalWarning={r.currentDebt > 0 ? (
              <>⚠️ <strong>ATENÇÃO:</strong> Este cliente possui débitos ativos no Crediário ({BRL(r.currentDebt)})! Se você removê-lo, a dívida será perdida permanentemente.</>
            ) : undefined}
            confirmLabel="Sim, remover cliente"
            onConfirm={() => {
              const name = r.name;
              if (deleteCustomer(r.id)) toast.success(`Cliente "${name}" removido.`);
            }}
          />
        </div>
      ), align: "right" },
  ];

  return (
    <AppShell title="Clientes" breadcrumb={["Meu Saas", "Clientes"]}>
      {/* KPI strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <KpiCard label="Contas a receber" value={BRL(totals.totalReceivable)} tone="primary" icon={<HandCoins className="w-4 h-4" />} />
        <KpiCard label="Clientes em débito" value={String(totals.inDebt)} tone="warn" icon={<Wallet className="w-4 h-4" />} />
        <KpiCard label="Limite excedido" value={String(totals.overLimit)} tone="danger" icon={<AlertTriangle className="w-4 h-4" />} />
      </section>

      <DataTable<Person>
        rows={CUSTOMERS}
        columns={cols}
        searchKeys={["name", "doc", "email", "city"]}
        pageSize={10}
        rowClassName={(r) =>
          r.creditLimit > 0 && r.currentDebt >= r.creditLimit
            ? "bg-primary/[0.06] hover:bg-primary/[0.1]"
            : r.currentDebt > 0
            ? "bg-amber-500/[0.04]"
            : ""
        }
        toolbar={
          <button
            onClick={() => setEditing({ id: "", name: "", doc: "", email: "", phone: "", city: "", creditLimit: 1000, currentDebt: 0 })}
            className="ml-auto h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Novo cliente
          </button>
        }
      />

      <CreditDrawer customer={selected} onClose={() => setSelectedId(null)} />
      <EditCustomerModal customer={editing} onClose={() => setEditing(null)} />
    </AppShell>
  );
}

function KpiCard({ label, value, tone, icon }: { label: string; value: string; tone: "primary" | "warn" | "danger"; icon: React.ReactNode }) {
  const toneCls = {
    primary: "border-primary/30 bg-primary/5 text-primary",
    warn: "border-amber-500/30 bg-amber-500/5 text-amber-500",
    danger: "border-primary/40 bg-primary/10 text-primary",
  }[tone];
  return (
    <div className={`rounded-xl border ${toneCls} p-4 flex items-center gap-3`}>
      <div className="w-9 h-9 grid place-items-center rounded-lg bg-background/60 border border-border">{icon}</div>
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold opacity-80">{label}</p>
        <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Crediário side drawer                                                     */
/* -------------------------------------------------------------------------- */

function CreditDrawer({ customer, onClose }: { customer: Person | null; onClose: () => void }) {
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const debts = useMemo<CreditDebt[]>(() => {
    if (!customer) return [];
    return CREDIT_DEBTS
      .filter((d) => d.customerId === customer.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [customer, customer?.currentDebt]);

  const open = debts.filter((d) => d.total - d.paid > 0.0001);
  const closed = debts.filter((d) => d.total - d.paid <= 0.0001);

  const handlePay = () => {
    if (!customer) return;
    const v = parseFloat(amount.replace(",", "."));
    if (!v || v <= 0) return toast.error("Informe um valor válido.");
    const applied = applyCreditPayment(customer.id, v);
    if (applied <= 0) return toast.error("Não há débitos em aberto.");
    toast.success(`Pagamento de ${BRL(applied)} registrado`, {
      description: `${customer.name} · novo saldo ${BRL(Math.max(0, customer.currentDebt))}`,
    });
    setAmount("");
    setPayOpen(false);
  };

  return (
    <AnimatePresence>
      {customer && (
        <>
          <motion.div
            key="ovl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <motion.aside
            key="drw"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col"
            role="dialog"
            aria-label={`Crediário de ${customer.name}`}
          >
            <header className="p-5 border-b border-border flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{customer.id}</p>
                <h3 className="text-lg font-bold leading-tight">{customer.name}</h3>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{customer.doc}</p>
              </div>
              <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 grid place-items-center rounded-md hover:bg-accent">
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="p-5 border-b border-border space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Limite de crédito" value={BRL(customer.creditLimit)} />
                <Metric
                  label="Saldo devedor"
                  value={BRL(customer.currentDebt)}
                  tone={customer.currentDebt > 0 ? "danger" : "ok"}
                />
              </div>
              {customer.creditLimit > 0 && (
                <div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                    <span>Utilização do limite</span>
                    <span className="tabular-nums">
                      {Math.min(100, Math.round((customer.currentDebt / customer.creditLimit) * 100))}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full transition-all ${customer.currentDebt >= customer.creditLimit ? "bg-primary" : customer.currentDebt / customer.creditLimit > 0.8 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(100, (customer.currentDebt / customer.creditLimit) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
              {customer.creditLimit > 0 && customer.currentDebt >= customer.creditLimit && (
                <div className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p><strong>Limite excedido.</strong> Novas vendas no Crediário estão bloqueadas até a quitação parcial.</p>
                </div>
              )}
            </div>

            <div className="p-5">
              <button
                onClick={() => setPayOpen((v) => !v)}
                disabled={customer.currentDebt <= 0}
                className="w-full h-11 rounded-md bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-bold inline-flex items-center justify-center gap-2"
              >
                💸 Receber Pagamento / Dar Baixa
              </button>

              <AnimatePresence>
                {payOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mt-3 rounded-lg border border-border bg-secondary/50 p-3 overflow-hidden"
                  >
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor recebido (R$)</label>
                    <div className="flex gap-2 mt-1.5">
                      <input
                        type="number" min="0" step="0.01"
                        autoFocus
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handlePay()}
                        placeholder={`Máx ${BRL(customer.currentDebt)}`}
                        className="flex-1 h-10 px-3 rounded bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/60"
                      />
                      <button
                        onClick={() => setAmount(customer.currentDebt.toFixed(2))}
                        className="h-10 px-3 rounded-md border border-border bg-card hover:bg-accent text-xs font-semibold"
                      >
                        Quitar tudo
                      </button>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setPayOpen(false); setAmount(""); }} className="flex-1 h-9 rounded-md border border-border bg-card hover:bg-accent text-sm">
                        Cancelar
                      </button>
                      <button onClick={handlePay} className="flex-1 h-9 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold">
                        Confirmar baixa
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-6">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Débitos em aberto ({open.length})
              </h4>
              {open.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground inline-flex items-center justify-center gap-2 w-full">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Sem débitos em aberto.
                </div>
              ) : (
                <ul className="space-y-2">
                  {open.map((d) => (
                    <DebtRow key={d.id} debt={d} />
                  ))}
                </ul>
              )}

              {closed.length > 0 && (
                <>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-6 mb-2">
                    Histórico quitado ({closed.length})
                  </h4>
                  <ul className="space-y-2">
                    {closed.map((d) => (
                      <DebtRow key={d.id} debt={d} />
                    ))}
                  </ul>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "ok" | "danger" }) {
  const cls = tone === "danger" ? "text-primary" : tone === "ok" ? "text-emerald-500" : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${cls}`}>{value}</p>
    </div>
  );
}

function DebtRow({ debt }: { debt: CreditDebt }) {
  const remaining = +(debt.total - debt.paid).toFixed(2);
  const isOpen = remaining > 0.0001;
  return (
    <li className={`rounded-lg border p-3 ${isOpen ? "border-border bg-card" : "border-border/60 bg-secondary/30 opacity-80"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{debt.ref ?? debt.id}</p>
          <p className="text-[11px] text-muted-foreground">
            {new Date(debt.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-bold tabular-nums ${isOpen ? "text-primary" : "text-emerald-500"}`}>
            {isOpen ? BRL(remaining) : "Quitado"}
          </p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            de {BRL(debt.total)}
          </p>
        </div>
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*  Edit customer modal                                                       */
/* -------------------------------------------------------------------------- */

function EditCustomerModal({ customer, onClose }: { customer: Person | null; onClose: () => void }) {
  const [form, setForm] = useState<Person | null>(null);

  // sync incoming customer
  if (customer && (!form || form.id !== customer.id)) {
    queueMicrotask(() => setForm({ ...customer }));
  }
  if (!customer && form) {
    queueMicrotask(() => setForm(null));
  }

  const save = () => {
    if (!form || !customer) return;
    if (!customer.id) {
      // new customer (mock) — push into the array
      const id = `C${String(CUSTOMERS.length + 1).padStart(3, "0")}`;
      CUSTOMERS.push({ ...form, id, currentDebt: 0 });
      toast.success("Cliente cadastrado.");
    } else {
      updateCustomer(customer.id, {
        name: form.name,
        doc: form.doc,
        email: form.email,
        phone: form.phone,
        city: form.city,
        creditLimit: form.creditLimit,
        currentDebt: form.currentDebt,
      });
      toast.success("Cadastro atualizado.");
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {customer && form && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.97 }}
            className="fixed inset-0 z-50 grid place-items-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl">
              <header className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-bold">{customer.id ? "Editar cliente" : "Novo cliente"}</h3>
                <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 grid place-items-center rounded-md hover:bg-accent">
                  <X className="w-4 h-4" />
                </button>
              </header>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nome / Razão social" className="sm:col-span-2">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Documento (CPF/CNPJ)"><input value={form.doc} onChange={(e) => setForm({ ...form, doc: e.target.value })} className={inputCls} /></Field>
                <Field label="Cidade"><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} /></Field>
                <Field label="E-mail"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></Field>
                <Field label="Telefone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} /></Field>

                <Field label="Limite de crédito (R$)">
                  <input
                    type="number" min="0" step="0.01"
                    value={form.creditLimit}
                    onChange={(e) => setForm({ ...form, creditLimit: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Saldo devedor atual (R$)">
                  <input
                    type="number" min="0" step="0.01"
                    value={form.currentDebt}
                    onChange={(e) => setForm({ ...form, currentDebt: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className={inputCls}
                  />
                </Field>

                {form.currentDebt > 0 && (
                  <div className="sm:col-span-2 flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>Este cliente possui débito em aberto de <strong>{BRL(form.currentDebt)}</strong>.</p>
                  </div>
                )}
              </div>
              <footer className="p-5 border-t border-border flex justify-end gap-2">
                <button onClick={onClose} className="h-9 px-4 rounded-md border border-border bg-secondary hover:bg-accent text-sm">Cancelar</button>
                <button onClick={save} className="h-9 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold">Salvar</button>
              </footer>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const inputCls = "w-full h-10 px-3 rounded-md bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/60";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
