import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSaaS, type SaaSUser } from "@/lib/saas-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { LogIn, ShieldCheck, Store, ShoppingCart, KeyRound, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { PasswordRules } from "@/components/PasswordRules";
import { isStrongPassword } from "@/lib/password-policy";

/**
 * Card de download público exibido na página de login.
 * `variant="promo"`  → grande, para a coluna esquerda desktop.
 * `variant="inline"` → compacto, acima do formulário (mobile + fallback).
 * Detecta Windows: em outros SOs mostra aviso "apenas Windows" e mantém
 * o botão desabilitado para não confundir o usuário.
 */
function DownloadInstallerCard({ variant }: { variant: "promo" | "inline" }) {
  const [isWindows, setIsWindows] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = (navigator.userAgent || "").toLowerCase();
    // Cobre Win10/11 desktop e evita falsos positivos de Windows Phone.
    setIsWindows(/windows nt/.test(ua) && !/phone|arm/.test(ua) ? true : /windows nt/.test(ua));
  }, []);

  const handleDownload = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isWindows === false) {
      e.preventDefault();
      toast.error("O Instalador ORVIX Sistemas é exclusivo para Windows 10 ou superior.");
      return;
    }
    // Fallback programático — garante o download imediato mesmo com
    // extensões que interceptam navegação por âncora.
    try {
      const a = document.createElement("a");
      a.href = INSTALLER_URL;
      a.download = INSTALLER_FILENAME;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      e.preventDefault();
      toast.success("Download iniciado — abra o instalador ao terminar.");
    } catch {
      // Deixa o comportamento padrão do <a> assumir.
    }
  };

  const disabled = isWindows === false;

  if (variant === "promo") {
    return (
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary font-bold">
            <ShieldCheck className="w-3 h-3" /> App oficial · assinado
          </span>
        </div>
        <h3 className="text-xl font-extrabold leading-tight">
          Instalador ORVIX Sistemas
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
          App nativo para Windows. Impressão silenciosa, atualização
          automática e desempenho profissional — sem depender do navegador.
        </p>
        <a
          href={INSTALLER_URL}
          onClick={handleDownload}
          aria-disabled={disabled}
          className={`mt-5 inline-flex items-center gap-2.5 px-5 py-3 rounded-full font-bold text-sm shadow-lg transition-all ${
            disabled
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30 hover:scale-[1.02]"
          }`}
        >
          <Download className="w-4 h-4" />
          Baixar Instalador ORVIX Sistemas
          <span className="ml-1 text-[11px] opacity-80">(.exe)</span>
        </a>
        <p className="mt-2.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
          <Monitor className="w-3 h-3" />
          {isWindows === false
            ? "Disponível apenas para Windows 10 ou superior."
            : "Windows 10 ou superior · 200 MB · conexão com a internet."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 flex items-start gap-3 lg:hidden">
      <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">
        <Download className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">Instalador ORVIX Sistemas</p>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
          {isWindows === false
            ? "Disponível apenas para Windows 10 ou superior."
            : "App nativo para Windows · impressão silenciosa."}
        </p>
        <a
          href={INSTALLER_URL}
          onClick={handleDownload}
          aria-disabled={disabled}
          className={`mt-2 inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-bold transition-colors ${
            disabled
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          Baixar Instalador
        </a>
      </div>
    </div>
  );
}

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
    if (role === "cashier") navigate({ to: "/caixa" });
    else if (role === "super_admin") navigate({ to: "/super-admin" });
    else navigate({ to: "/dashboard" });
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await loginWithCredentials(email, password);
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

  const handlePasswordUpdated = async (newPwd: string) => {
    if (!pendingUser) return;
    const r = await updatePassword(newPwd);
    if (!r.ok) {
      toast.error(r.reason ?? "Falha ao atualizar a senha.");
      return;
    }
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
          <ul className="space-y-3 text-sm mb-10">
            <li className="flex gap-2"><ShieldCheck className="w-4 h-4 mt-0.5 text-primary" /> Controle de acesso por papel (Admin e Caixa)</li>
            <li className="flex gap-2"><Store className="w-4 h-4 mt-0.5 text-primary" /> Cada empresa enxerga apenas seus próprios dados</li>
            <li className="flex gap-2"><ShoppingCart className="w-4 h-4 mt-0.5 text-primary" /> PDV otimizado para operação 100% via teclado</li>
          </ul>
          <DownloadInstallerCard variant="promo" />
        </section>

        <section className="flex items-center justify-center p-6">
          <form onSubmit={submit} className="w-full max-w-md space-y-5">
            <DownloadInstallerCard variant="inline" />
            <div className="space-y-4">
              <div className="flex justify-center lg:justify-start">
                <div
                  className="animate-float"
                  style={{ animation: "float-logo 3s ease-in-out infinite", display: "inline-block", willChange: "transform" }}
                >
                  <Logo height={84} priority />
                </div>
              </div>
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

  const weak = pwd.length > 0 && !isStrongPassword(pwd);
  const mismatch = pwd2.length > 0 && pwd !== pwd2;
  const valid = isStrongPassword(pwd) && pwd === pwd2;

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
                placeholder="Crie uma senha forte"
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
            <PasswordRules value={pwd} />
            {weak && (
              <p className="text-[11px] text-destructive">
                A senha ainda não atende às regras de segurança acima.
              </p>
            )}
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confirme a nova senha</span>
            <input
              type={show ? "text" : "password"}
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              autoComplete="new-password"
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
