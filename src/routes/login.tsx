import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SAAS_USERS, ROLE_LABEL, useSaaS } from "@/lib/saas-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogIn, ShieldCheck, Store, ShoppingCart, Crown } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Meu Saas" },
      { name: "description", content: "Acesse o painel do seu ERP ou o PDV." },
    ],
  }),
  component: LoginPage,
});

const ROLE_ICON = {
  super_admin: Crown,
  admin: Store,
  cashier: ShoppingCart,
} as const;

function LoginPage() {
  const { user, loginAs } = useSaaS();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>(SAAS_USERS[1].id);

  // Já logado → manda pra rota apropriada
  useEffect(() => {
    if (!user) return;
    if (user.role === "cashier") navigate({ to: "/vendas" });
    else if (user.role === "super_admin") navigate({ to: "/super-admin" });
    else navigate({ to: "/" });
  }, [user, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = SAAS_USERS.find((x) => x.id === selected);
    if (!u) return;
    loginAs(u.id);
    if (u.role === "cashier") navigate({ to: "/vendas" });
    else if (u.role === "super_admin") navigate({ to: "/super-admin" });
    else navigate({ to: "/" });
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <header className="h-14 px-4 lg:px-6 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B0000] to-[#5A0000] grid place-items-center shadow-[0_0_20px_-4px_rgba(139,0,0,0.6)]">
            <span className="text-white font-extrabold leading-none">M</span>
          </div>
          <div>
            <p className="font-bold leading-tight">Meu Saas</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">ERP B2B Multiempresa</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 grid lg:grid-cols-2">
        <section className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-[#8B0000]/10 via-background to-background border-r border-border">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3">ERP + PDV em uma única plataforma.</h1>
          <p className="text-muted-foreground max-w-md mb-8">
            Gestão de produtos, estoque, vendas e relatórios — com isolamento total de dados por empresa.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><ShieldCheck className="w-4 h-4 mt-0.5 text-primary" /> Controle de acesso por papel (Admin, Caixa, Super Admin)</li>
            <li className="flex gap-2"><Store className="w-4 h-4 mt-0.5 text-primary" /> Cada empresa enxerga apenas seus próprios dados</li>
            <li className="flex gap-2"><ShoppingCart className="w-4 h-4 mt-0.5 text-primary" /> PDV otimizado para operação 100% via teclado</li>
          </ul>
        </section>

        <section className="flex items-center justify-center p-6">
          <form onSubmit={submit} className="w-full max-w-md space-y-5">
            <div>
              <h2 className="text-2xl font-bold">Entrar</h2>
              <p className="text-sm text-muted-foreground">Selecione um perfil de demonstração para acessar a plataforma.</p>
            </div>

            <div className="space-y-2">
              {SAAS_USERS.map((u) => {
                const Icon = ROLE_ICON[u.role];
                const checked = selected === u.id;
                return (
                  <label
                    key={u.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checked ? "border-primary bg-primary/5" : "border-border hover:bg-accent"}`}
                  >
                    <input
                      type="radio"
                      name="profile"
                      value={u.id}
                      checked={checked}
                      onChange={() => setSelected(u.id)}
                      className="mt-1 accent-primary"
                    />
                    <Icon className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <p className="text-[11px] uppercase tracking-wide text-primary/80 mt-0.5">{ROLE_LABEL[u.role]}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <button
              type="submit"
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 transition-colors"
            >
              <LogIn className="w-4 h-4" /> Entrar na plataforma
            </button>

            <p className="text-[11px] text-muted-foreground text-center">
              Ambiente de demonstração. Em produção, este fluxo usa e-mail + senha e/ou SSO.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
