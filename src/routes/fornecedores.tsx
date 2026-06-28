import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { AppShell } from "@/components/AppShell";
import { DataTable, type Column } from "@/components/DataTable";
import { SUPPLIERS, deleteSupplier, type Person } from "@/lib/mock-data";
import { Plus } from "lucide-react";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { useMockStore } from "@/hooks/use-mock-store";
import { toast } from "sonner";

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
        rows={SUPPLIERS}
        columns={cols}
        searchKeys={["name", "doc", "email", "city"]}
        pageSize={10}
        toolbar={
          <button className="ml-auto h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold">
            <Plus className="w-4 h-4" /> Novo fornecedor
          </button>
        }
      />
    </AppShell>
  );
}
