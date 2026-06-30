import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSaaS, STATUS_LABEL } from "@/lib/saas-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Lock, CreditCard, LogOut, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/assinatura")({
  head: () => ({
    meta: [
      { title: "Renovar Assinatura — Meu Saas" },
      { name: "description", content: "Regularize sua assinatura para liberar o acesso ao ERP e ao PDV." },
    ],
  }),
  component: AssinaturaPage,
});

function AssinaturaPage() {
  const { user, company, setCompanyStatus, logout } = useSaaS();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Se a empresa já está ativa, devolve para o destino padrão do papel.
  useEffect(() => {
    if (!mounted) return;
    if (!user) { navigate({ to: "/login" }); return; }
    if (user.role === "super_admin") { navigate({ to: "/super-admin" }); return; }
    if (company && company.status !== "blocked" && company.status !== "pending") {
      navigate({ to: user.role === "cashier" ? "/caixa" : "/dashboard" });
    }
  }, [mounted, user, company, navigate]);

  if (!mounted || !user) return null;

  const handlePay = async () => {
    if (!company) return;
    await setCompanyStatus(company.id, "active");
    toast.success("Pagamento confirmado. Acesso liberado!");
    navigate({ to: user.role === "cashier" ? "/caixa" : "/dashboard" });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <header className="h-14 px-4 lg:px-6 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B0000] to-[#5A0000] grid place-items-center">
            <span className="text-white font-extrabold leading-none">M</span>
          </div>
          <p className="font-bold">Meu Saas</p>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 grid place-items-center p-6">
        <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-xl">
          <div className="w-14 h-14 grid place-items-center rounded-2xl bg-primary/15 text-primary mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-center mt-4">
            Sua conta está suspensa
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Efetue o pagamento para liberar seus acessos ao ERP e ao PDV.
          </p>

          {company && (
            <div className="mt-6 rounded-lg border border-border bg-secondary/40 p-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Empresa</span><span className="font-semibold">{company.fantasia}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">CNPJ</span><span className="font-mono text-xs">{company.cnpj}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plano</span><span className="capitalize font-semibold">{company.plan}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mensalidade</span><span className="font-semibold tabular-nums">{company.mrr.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-semibold text-primary">{STATUS_LABEL[company.status]}</span></div>
            </div>
          )}

          <button
            onClick={handlePay}
            className="mt-6 w-full h-12 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-bold shadow hover:bg-primary/90 transition-colors"
          >
            <CreditCard className="w-4 h-4" /> Pagar e liberar acesso (demo)
          </button>
          <p className="mt-2 text-[11px] text-muted-foreground text-center inline-flex items-center justify-center gap-1 w-full">
            <CheckCircle2 className="w-3 h-3" /> Ambiente de demonstração — sem cobrança real.
          </p>

          <button
            onClick={() => { logout(); navigate({ to: "/login" }); }}
            className="mt-4 w-full h-9 inline-flex items-center justify-center gap-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-accent"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair da conta
          </button>
        </section>
      </main>
    </div>
  );
}