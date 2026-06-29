import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { COMPANIES, STATUS_LABEL, useSaaS } from "@/lib/saas-context";
import { BRL } from "@/lib/mock-data";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Crown, Building2, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/super-admin")({
  head: () => ({
    meta: [
      { title: "Super Admin — Meu Saas" },
      { name: "description", content: "Gestão global da plataforma: empresas, assinaturas e faturamento." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["super_admin"]}>
      <SuperAdminPage />
    </RoleGuard>
  ),
});

function SuperAdminPage() {
  const { user } = useSaaS();
  const total = COMPANIES.length;
  const ativas = COMPANIES.filter((c) => c.status === "active").length;
  const trial = COMPANIES.filter((c) => c.status === "trial").length;
  const inadimplentes = COMPANIES.filter((c) => c.status === "overdue").length;
  const mrr = COMPANIES.reduce((a, c) => a + (c.status === "active" ? c.mrr : 0), 0);

  const KPI = [
    { label: "Empresas ativas", value: `${ativas}/${total}`, icon: Building2 },
    { label: "MRR consolidado", value: BRL(mrr), icon: TrendingUp },
    { label: "Em trial", value: String(trial), icon: CheckCircle2 },
    { label: "Inadimplentes", value: String(inadimplentes), icon: AlertTriangle, alert: true },
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/85 backdrop-blur-xl flex items-center gap-3 px-4 lg:px-6">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 grid place-items-center text-white">
          <Crown className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="font-bold leading-tight truncate">Painel da Plataforma</p>
          <p className="text-xs text-muted-foreground truncate">Visão global · {user?.name}</p>
        </div>
        <div className="ml-auto"><ThemeToggle /></div>
      </header>

      <main className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Empresas cadastradas</h1>
          <p className="text-sm text-muted-foreground">Status de assinatura, plano e faturamento mensal recorrente.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {KPI.map((k) => (
            <div key={k.label} className={`rounded-xl border p-4 bg-card ${k.alert ? "border-destructive/40" : "border-border"}`}>
              <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wide">
                <span>{k.label}</span>
                <k.icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold mt-2">{k.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-muted-foreground text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Empresa</th>
                <th className="text-left px-4 py-3">CNPJ</th>
                <th className="text-left px-4 py-3">Plano</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">MRR</th>
                <th className="text-left px-4 py-3">Desde</th>
              </tr>
            </thead>
            <tbody>
              {COMPANIES.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{c.fantasia}</div>
                    <div className="text-xs text-muted-foreground">{c.razaoSocial}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.cnpj}</td>
                  <td className="px-4 py-3 capitalize">{c.plan}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                      c.status === "active" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : c.status === "trial" ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
                      : c.status === "overdue" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                      : "bg-muted text-muted-foreground"
                    }`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{BRL(c.mrr)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
