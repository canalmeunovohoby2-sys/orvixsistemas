import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSaaS, type SaaSUser } from "@/lib/saas-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { LogIn, ShieldCheck, Store, ShoppingCart, KeyRound, Eye, EyeOff, Mail, Lock } from "lucide-react";
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

function LoginPage() {
  const { user, loginWithCredentials, updatePassword } = useSaaS();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = loginWithCredentials(email, password);
      if (!res.ok || !res.user) {
        toast.error(res.reason ?? "Credenciais inválidas.");
        return;
      }
      if (res.user.isTemporaryPassword) {
        setPendingUser(res.user);
        return;
      }
      routeForRole(res.user.role);
    } finally {
      setSubmitting(false);
    }
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
        <Logo height={28} priority />
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
            <div className="space-y-3">
              <Logo height={36} priority />
              <h2 className="sr-only">Entrar na ORVIX SISTEMAS</h2>
              <p className="text-sm text-muted-foreground">
                Acesse o painel da sua empresa com o e-mail e senha enviados pela equipe da ORVIX SISTEMAS.
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">E-mail</span>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  placeholder="voce@suaempresa.com.br"
                  className="w-full h-11 pl-9 pr-3 rounded-md bg-background border border-input text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Senha</span>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="Sua senha"
                  className="w-full h-11 pl-9 pr-10 rounded-md bg-background border border-input text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" /> Entrar na plataforma
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Acesso fornecido exclusivamente pela equipe <strong>ORVIX SISTEMAS</strong> após a contratação do plano.
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
