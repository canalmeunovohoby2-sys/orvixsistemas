import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { DashboardPage } from "@/components/DashboardPageContent";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ORVIX SISTEMAS" },
      { name: "description", content: "Painel do lojista ORVIX SISTEMAS." },
    ],
    links: [{ rel: "canonical", href: "/dashboard" }],
  }),
  component: () => (
    <RoleGuard allow={["admin"]}>
      <DashboardPage />
    </RoleGuard>
  ),
});
