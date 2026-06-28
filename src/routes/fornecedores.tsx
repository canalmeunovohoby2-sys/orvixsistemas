import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SUPPLIERS } from "@/lib/mock-data";
import { PeopleTable } from "./clientes";

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
  component: FornecedoresPage,
});

function FornecedoresPage() {
  return (
    <AppShell title="Fornecedores" breadcrumb={["Meu Saas", "Fornecedores"]}>
      <PeopleTable rows={SUPPLIERS} addLabel="Novo fornecedor" />
    </AppShell>
  );
}
