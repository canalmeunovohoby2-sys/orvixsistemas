import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DataTable, type Column } from "@/components/DataTable";
import { CUSTOMERS, type Person } from "@/lib/mock-data";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — Meu Saas" },
      { name: "description", content: "Cadastro e gestão da base de clientes da empresa, com dados de contato, documentos e cidade." },
      { property: "og:title", content: "Clientes — Meu Saas" },
      { property: "og:description", content: "Base de clientes B2B e B2C centralizada." },
      { property: "og:url", content: "/clientes" },
    ],
    links: [{ rel: "canonical", href: "/clientes" }],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  return <AppShell title="Clientes" breadcrumb={["Meu Saas", "Clientes"]}><PeopleTable rows={CUSTOMERS} addLabel="Novo cliente" /></AppShell>;
}

export function PeopleTable({ rows, addLabel }: { rows: Person[]; addLabel: string }) {
  const cols: Column<Person>[] = [
    { key: "id", label: "Código", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "name", label: "Nome / Razão", render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "doc", label: "Documento", render: (r) => <span className="font-mono text-xs">{r.doc}</span> },
    { key: "email", label: "E-mail", render: (r) => <a href={`mailto:${r.email}`} className="text-sky-400 hover:underline">{r.email}</a> },
    { key: "phone", label: "Telefone" },
    { key: "city", label: "Cidade" },
  ];
  return (
    <DataTable<Person>
      rows={rows}
      columns={cols}
      searchKeys={["name", "doc", "email", "city"]}
      pageSize={10}
      toolbar={
        <button className="ml-auto h-9 px-3 inline-flex items-center gap-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold">
          <Plus className="w-4 h-4" /> {addLabel}
        </button>
      }
    />
  );
}
