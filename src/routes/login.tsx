import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ROLE_LABEL, useSaaS, type SaaSUser } from "@/lib/saas-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogIn, ShieldCheck, Store, ShoppingCart, Crown, KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

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
  const { user, loginAs, users, updatePassword } = useSaaS();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>(users[1]?.id ?? users[0].id);
  const [pendingUser, setPendingUser] = useState<SaaSUser | null>(null);

  const routeForRole = (role: SaaSUser["role"]) => {
    if (role === "cashier") navigate({ to: "/vendas" });
    else if (role === "super_admin") navigate({ to: "/super-admin" });
    else navigate({ to: "/" });
  };

  // Já logado → manda pra rota apropriada (a menos que precise trocar a senha).
  useEffect(() => {
    if (!user) return;
    if (user.isTemporaryPassword) {
      setPendingUser(user);
      return;
    }
    routeForRole(user.role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = users.find((x) => x.id === selected);
    if (!u) return;
    loginAs(u.id);
    if (u.isTemporaryPassword) {
      setPendingUser(u);
      return;
    }
    routeForRole(u.role);
  };

  const handlePasswordUpdated = (newPwd: string) => {
    if (!pendingUser) return;
    updatePassword(pendingUser.id, newPwd);
    toast.success("Senha atualizada com segurança na ORVIX SISTEMAS!");
    const role = pendingUser.role;
    setPendingUser(null);
    routeForRole(role);
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
              {users.map((u) => {
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
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{u.name}</p>
                        {u.isTemporaryPassword && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/15 text-primary">
                            <KeyRound className="w-3 h-3" /> 1º acesso
                          </span>
                        )}
                      </div>
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
      {pendingUser && (
        <ForcePasswordChangeModal user={pendingUser} onConfirm={handlePasswordUpdated} />
      )}
    </div>
  );
}

/* ───────── Modal obrigatório de troca de senha ───────── */

function ForcePasswordChangeModal({
  user,
  onConfirm,
}: {
  user: SaaSUser;
  onConfirm: (newPwd: string) => void;
}) {
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [show, setShow] = useState(false);

  // Bloqueia Esc, scroll do body e foco fora do modal.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey, true);
    };
  }, []);

  const tooShort = pwd.length > 0 && pwd.length < 6;
  const mismatch = pwd2.length > 0 && pwd !== pwd2;
  const valid = pwd.length >= 6 && pwd === pwd2;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onConfirm(pwd);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="force-pwd-title"
      className="fixed inset-0 z-[100] grid place-items-center bg-black/70 backdrop-blur-sm p-4"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
      >
        <header className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary grid place-items-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="force-pwd-title" className="font-bold text-base leading-tight">
                🔒 Atualize sua Senha de Primeiro Acesso — ORVIX SISTEMAS
              </h2>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {user.email} · troca obrigatória antes de acessar a plataforma
              </p>
            </div>
          </div>
        </header>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground/80">
            Por motivos de segurança, defina uma nova senha pessoal. A senha temporária deixará de funcionar imediatamente.
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nova senha</span>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoFocus
                autoComplete="new-password"
                minLength={6}
                placeholder="mínimo de 6 caracteres"
                className="w-full h-10 pl-3 pr-10 rounded-md bg-background border border-input text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {tooShort && <p className="text-[11px] text-destructive">A senha precisa de pelo menos 6 caracteres.</p>}
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confirme a nova senha</span>
            <input
              type={show ? "text" : "password"}
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              placeholder="digite novamente"
              className="w-full h-10 px-3 rounded-md bg-background border border-input text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {mismatch && <p className="text-[11px] text-destructive">As senhas não coincidem.</p>}
          </label>
        </div>

        <footer className="px-6 pb-6 pt-2">
          <button
            type="submit"
            disabled={!valid}
            className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="w-4 h-4" /> Salvar e Acessar Plataforma
          </button>
          <p className="mt-3 text-[10px] uppercase tracking-wider text-center text-muted-foreground">
            ORVIX SISTEMAS · Política de Primeiro Acesso
          </p>
        </footer>
      </form>
    </div>
  );
}
