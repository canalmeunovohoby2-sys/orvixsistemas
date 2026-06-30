import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { AppShell } from "@/components/AppShell";
import { DataTable, type Column } from "@/components/DataTable";
import { BRL } from "@/lib/mock-data";
import { useSaaS } from "@/lib/saas-context";
import { Plus } from "lucide-react";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createCustomer } from "@/lib/customers.functions";

type CustomerRow = {
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

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Meu Saas" },
      { name: "description", content: "Cadastro de clientes da empresa com CPF/CNPJ, limite e saldo de crediário." },
      { property: "og:title", content: "Clientes — Meu Saas" },
      { property: "og:description", content: "Cadastro de clientes e controle de crediário." },
      { property: "og:url", content: "/clientes" },
    ],
    links: [{ rel: "canonical", href: "/clientes" }],
  }),
  component: () => (<RoleGuard allow={["admin"]}><ClientesPage /></RoleGuard>),
});

function ClientesPage() {
  const { user } = useSaaS();
  const cid = user?.companyId ?? "EMP001";
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("customers")
      .select("id, company_id, name, doc, email, phone, city, credit_limit, current_debt")
      .eq("company_id", cid)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Falha ao carregar clientes.", { description: error.message });
      setRows([]);
    } else {
      setRows(
        (data ?? []).map((d) => ({
          id: d.id,
          company_id: d.company_id,
          name: d.name,
          doc: d.doc,
          email: d.email,
          phone: d.phone,
          city: d.city,
          creditLimit: Number(d.credit_limit ?? 0),
          currentDebt: Number(d.current_debt ?? 0),
        })),
      );
    }
    setLoading(false);
  }, [cid]);

  useEffect(() => { void load(); }, [load]);

  const handleDelete = async (id: string, name: string) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) return toast.error("Não foi possível remover o cliente.", { description: error.message });
    toast.success(`Cliente "${name}" removido.`);
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const cols: Column<CustomerRow>[] = [
    { key: "id", label: "Código", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "name", label: "Cliente", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "doc", label: "CPF / CNPJ", render: (r) => <span className="font-mono text-xs">{r.doc}</span> },
    { key: "email", label: "E-mail", render: (r) => <a href={`mailto:${r.email}`} className="text-sky-500 hover:underline">{r.email}</a> },
    { key: "phone", label: "Telefone" },
    { key: "city", label: "Cidade" },
    { key: "creditLimit", label: "Limite", align: "right", render: (r) => <span className="tabular-nums text-muted-foreground">{BRL(r.creditLimit)}</span> },
    { key: "currentDebt", label: "Dívida", align: "right", render: (r) => (
        <span className={`tabular-nums font-semibold ${r.currentDebt > 0 ? "text-primary" : "text-emerald-600 dark:text-emerald-400"}`}>
          {BRL(r.currentDebt)}
        </span>
      ) },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (r) => (
        <div className="flex justify-end">
          <ConfirmDelete
            triggerAriaLabel={`Remover ${r.name}`}
            triggerTitle="Remover cliente"
            title="Remover cliente?"
            description={<>Deseja remover o cliente <strong className="text-foreground">{r.name}</strong> ({r.doc})? Esta ação é permanente.</>}
            confirmLabel="Sim, remover cliente"
            onConfirm={() => { void handleDelete(r.id, r.name); }}
          />
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Clientes" breadcrumb={["Meu Saas", "Clientes"]}>
      <DataTable<CustomerRow>
        rows={rows}
        columns={cols}
        searchKeys={["name", "doc", "email", "city"]}
        pageSize={10}
        toolbar={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="ml-auto h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Cadastrar novo cliente
          </button>
        }
      />
      {loading && rows.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">Carregando clientes…</p>
      )}
      {open && (
        <CustomerFormModal
          onClose={() => setOpen(false)}
          onSaved={(c) => {
            setRows((prev) => [c, ...prev]);
            setOpen(false);
            toast.success("Cliente cadastrado com sucesso!");
          }}
        />
      )}
    </AppShell>
  );
}

function CustomerFormModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (c: CustomerRow) => void;
}) {
  const [name, setName] = useState("");
  const [doc, setDoc] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [creditLimit, setCreditLimit] = useState("0");
  const [saving, setSaving] = useState(false);
  const createCustomerFn = useServerFn(createCustomer);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Informe o nome do cliente.");
    setSaving(true);
    try {
      const row = await createCustomerFn({
        data: {
          name: name.trim(),
          doc: doc.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city: city.trim(),
          creditLimit: Number(creditLimit) || 0,
        },
      });
      onSaved(row);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido.";
      toast.error("Não foi possível cadastrar o cliente.", { description: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-form-title"
      className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4"
      onMouseDown={onClose}
    >
      <form
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
      >
        <header className="px-6 pt-5 pb-4 border-b border-border">
          <h2 id="customer-form-title" className="text-lg font-bold">Cadastrar novo cliente</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Os dados ficam isolados na sua empresa.</p>
        </header>
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nome / Razão social" className="md:col-span-2">
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus required className={inputCls} placeholder="João da Silva" />
          </Field>
          <Field label="CPF / CNPJ">
            <input value={doc} onChange={(e) => setDoc(e.target.value)} className={inputCls} placeholder="000.000.000-00" />
          </Field>
          <Field label="Telefone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="(11) 90000-0000" />
          </Field>
          <Field label="E-mail" className="md:col-span-2">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="cliente@exemplo.com.br" />
          </Field>
          <Field label="Cidade">
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="São Paulo" />
          </Field>
          <Field label="Limite de crédito (R$)">
            <input type="number" min="0" step="0.01" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <footer className="px-6 pb-5 pt-2 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border border-border text-sm font-medium hover:bg-accent">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> {saving ? "Salvando…" : "Salvar cliente"}
          </button>
        </footer>
      </form>
    </div>
  );
}

const inputCls =
  "w-full h-10 px-3 rounded-md bg-background border border-input text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block space-y-1.5 ${className ?? ""}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}