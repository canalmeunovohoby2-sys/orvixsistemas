import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { AppShell } from "@/components/AppShell";
import { DataTable, type Column } from "@/components/DataTable";
import { addSupplier, deleteSupplier, getCompanySuppliers, DEMO_SEED_COMPANY_ID, type Person } from "@/lib/mock-data";
import { useSaaS } from "@/lib/saas-context";
import { Plus } from "lucide-react";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { useMockStore } from "@/hooks/use-mock-store";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/fornecedores")({
  head: () => ({
    meta: [
      { title: "Fornecedores — Meu Saas" },
      { name: "description", content: "Gerencie a base de fornecedores, contatos comerciais e relacionamentos de compra." },
      { property: "og:title", content: "Fornecedores — Meu Saas" },
      { property: "og:description", content: "Base de fornecedores e contatos comerciais." },
      { property: "og:url", content: "/fornecedores" },
    ],
    links: [{ rel: "canonical", href: "/fornecedores" }],
  }),
  component: () => (<RoleGuard allow={["admin"]}><FornecedoresPage /></RoleGuard>),
});

function FornecedoresPage() {
  useMockStore();
  const { user, company } = useSaaS();
  const cid = company?.isDemo === true ? DEMO_SEED_COMPANY_ID : user?.companyId ?? null;
  const [open, setOpen] = useState(false);
  const rows = getCompanySuppliers(cid);
  const cols: Column<Person>[] = [
    { key: "id", label: "Código", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "name", label: "Razão social", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "doc", label: "CNPJ", render: (r) => <span className="font-mono text-xs">{r.doc}</span> },
    { key: "email", label: "E-mail", render: (r) => <a href={`mailto:${r.email}`} className="text-sky-500 hover:underline">{r.email}</a> },
    { key: "phone", label: "Telefone" },
    { key: "city", label: "Cidade" },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (r) => (
        <div className="flex justify-end">
          <ConfirmDelete
            triggerAriaLabel={`Remover ${r.name}`}
            triggerTitle="Remover fornecedor"
            title="Remover fornecedor?"
            description={<>Deseja remover o fornecedor <strong className="text-foreground">{r.name}</strong> ({r.doc})? Esta ação é permanente e não poderá ser desfeita.</>}
            confirmLabel="Sim, remover fornecedor"
            onConfirm={() => {
              const name = r.name;
              if (deleteSupplier(r.id)) toast.success(`Fornecedor "${name}" removido.`);
            }}
          />
        </div>
      ),
    },
  ];
  return (
    <AppShell title="Fornecedores" breadcrumb={["Meu Saas", "Fornecedores"]}>
      <DataTable<Person>
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
            <Plus className="w-4 h-4" /> Adicionar fornecedor
          </button>
        }
      />
      {open && (
        <SupplierFormModal
          onClose={() => setOpen(false)}
          onSave={(data) => {
            if (!cid) { toast.error("Empresa não identificada."); return; }
            const s = addSupplier(cid, data);
            toast.success(`Fornecedor "${s.name}" cadastrado.`);
            setOpen(false);
          }}
        />
      )}
    </AppShell>
  );
}

function SupplierFormModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: { name: string; doc: string; email: string; phone: string; city: string }) => void;
}) {
  const [name, setName] = useState("");
  const [doc, setDoc] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Informe a razão social.");
    onSave({ name, doc, email, phone, city });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="supplier-form-title"
      className="fixed inset-0 z-[90] grid place-items-center bg-black/40 p-4"
      onMouseDown={onClose}
    >
      <form
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
      >
        <header className="px-6 pt-5 pb-4 border-b border-border">
          <h2 id="supplier-form-title" className="text-lg font-bold">Adicionar fornecedor</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Os dados ficam isolados na sua empresa.</p>
        </header>
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Razão social" className="md:col-span-2">
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus required className={inputCls} placeholder="Distribuidora Norte LTDA" />
          </Field>
          <Field label="CNPJ">
            <input value={doc} onChange={(e) => setDoc(e.target.value)} className={inputCls} placeholder="00.000.000/0001-00" />
          </Field>
          <Field label="Telefone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="(11) 0000-0000" />
          </Field>
          <Field label="E-mail" className="md:col-span-2">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="comercial@fornecedor.com.br" />
          </Field>
          <Field label="Cidade" className="md:col-span-2">
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="São Paulo" />
          </Field>
        </div>
        <footer className="px-6 pb-5 pt-2 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-md border border-border text-sm font-medium hover:bg-accent">
            Cancelar
          </button>
          <button type="submit" className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Salvar fornecedor
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
