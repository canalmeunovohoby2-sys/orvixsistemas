import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { AppShell } from "@/components/AppShell";
import { DataTable, type Column } from "@/components/DataTable";
import { CUSTOMERS, BRL, deleteCustomer, type Person } from "@/lib/mock-data";
import { useSaaS } from "@/lib/saas-context";
import { Plus } from "lucide-react";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { useMockStore } from "@/hooks/use-mock-store";
import { toast } from "sonner";

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
  useMockStore();
  const { user } = useSaaS();
  const cid = user?.companyId ?? "EMP001";
  const rows = CUSTOMERS.filter((c) => c.company_id === cid);

  const cols: Column<Person>[] = [
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
            onConfirm={() => {
              const name = r.name;
              if (deleteCustomer(r.id)) toast.success(`Cliente "${name}" removido.`);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <AppShell title="Clientes" breadcrumb={["Meu Saas", "Clientes"]}>
      <DataTable<Person>
        rows={rows}
        columns={cols}
        searchKeys={["name", "doc", "email", "city"]}
        pageSize={10}
        toolbar={
          <button className="ml-auto h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold">
            <Plus className="w-4 h-4" /> Novo cliente
          </button>
        }
      />
    </AppShell>
  );
}