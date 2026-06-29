import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { VendasPage } from "./vendas";

export const Route = createFileRoute("/caixa")({
  head: () => ({
    meta: [
      { title: "Caixa (PDV) — ORVIX SISTEMAS" },
      { name: "description", content: "Terminal de caixa e PDV ORVIX SISTEMAS." },
    ],
    links: [{ rel: "canonical", href: "/caixa" }],
  }),
  component: () => (
    <RoleGuard allow={["admin", "cashier"]}>
      <VendasPage />
    </RoleGuard>
  ),
});
