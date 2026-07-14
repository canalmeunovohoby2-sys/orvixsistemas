import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import {
  PLAN_LABEL, PLAN_PRICE, PLAN_LIMITS, STATUS_LABEL, useSaaS, getPlanUsersLimit,
  SUPER_ADMIN_EMAIL, SUPER_ADMIN_LUIZ_EMAIL, CURRENT_ADMIN_EMAIL_KEY, type Plan, type SubscriptionStatus,
} from "@/lib/saas-context";
import {
  BRL, SYSTEM_LOGS, SUPPORT_TICKETS, SAAS_SETTINGS, logEvent,
  updateTicketStatus, deleteTicket, restoreTicket, markLogReverted,
  updateSaaSSettings, resetCommercialData,
  type SupportTicket, type SystemLog, type SystemLogKind,
} from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { useMockStore } from "@/hooks/use-mock-store";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { CredentialsModal } from "@/components/CredentialsModal";
import {
  Crown, Building2, TrendingUp, AlertTriangle, CheckCircle2, LayoutDashboard,
  ShieldCheck, Settings, LifeBuoy, LogIn, KeyRound, Mail, CreditCard,
  ArrowRightLeft, Database, FileWarning, UserCog, Sparkles, X, Eraser,
  LogOut, Trash2, Undo2, Eye, EyeOff,
} from "lucide-react";
import { Send, Megaphone, Clock, Phone } from "lucide-react";
import { RefreshCw } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listRemarketingLeads, sendRemarketingEmail, deleteRemarketingLead, type RemarketingLead } from "@/lib/remarketing.functions";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { MessageCircle, CalendarX2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/super-admin")({
  head: () => ({
    meta: [
      { title: "Painel Master — Meu Saas" },
      { name: "description", content: "Visão global da plataforma: MRR/ARR, empresas, auditoria, suporte e configurações." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["super_admin"]}>
      <SuperAdminEmailGate>
        <SuperAdminPage />
      </SuperAdminEmailGate>
    </RoleGuard>
  ),
});

/** Reforço de segurança: apenas o e-mail oficial da ORVIX SISTEMAS abre o Painel Master. */
function SuperAdminEmailGate({ children }: { children: React.ReactNode }) {
  const { user, logout } = useSaaS();
  const navigate = useNavigate();
  if (!user) return null;
  const allowed = [SUPER_ADMIN_EMAIL, SUPER_ADMIN_LUIZ_EMAIL].map((e) => e.toLowerCase());
  if (!allowed.includes(user.email.toLowerCase())) {
    logout();
    navigate({ to: "/login" });
    return null;
  }
  return <>{children}</>;
}

type TabId = "dashboard" | "empresas" | "auditoria" | "suporte" | "remarketing" | "config";

function getMasterDisplayName(user: ReturnType<typeof useSaaS>["user"], sessionEmail?: string | null): string {
  const email = (sessionEmail || user?.email || "").trim().toLowerCase();
  const name = (user?.name ?? "").trim().toLowerCase();
  if (email === SUPER_ADMIN_LUIZ_EMAIL.toLowerCase() || email.includes("luiz") || name.includes("luiz")) {
    return "Luiz Sub Admin";
  }
  return "Tiago Lopes Admin";
}

function SuperAdminPage() {
  useMockStore();
  const { user, logout, processWebhookPayment } = useSaaS();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>("dashboard");
  const [pwdModal, setPwdModal] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(() => {
    try { return localStorage.getItem(CURRENT_ADMIN_EMAIL_KEY); } catch { return null; }
  });
  const masterDisplayName = getMasterDisplayName(user, sessionEmail);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setSessionEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  // Poller do webhook do Mercado Pago — drena eventos pendentes da fila server-side
  // e materializa empresas + auditoria. Só roda enquanto o Super Admin está logado.
  const pollingRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (pollingRef.current) return;
      pollingRef.current = true;
      try {
        const res = await fetch("/api/webhooks/mercadopago", { method: "GET" });
        if (!res.ok) return;
        const data = (await res.json()) as { events?: Array<{
          id: string; externalId: string;
          type: "payment" | "subscription" | "unknown";
          status: string; amount: number;
          payerEmail: string | null; payerName: string | null;
        }> };
        const events = data.events ?? [];
        if (!events.length || cancelled) return;
        const handled: string[] = [];
        for (const ev of events) {
          const result = await processWebhookPayment(ev);
          handled.push(ev.id);
          if (result.ok && result.company) {
            toast.success(`Webhook MP: empresa ${result.company.fantasia} criada automaticamente.`);
          }
        }
        if (handled.length) {
          await fetch(`/api/webhooks/mercadopago?ack=${handled.join(",")}`, { method: "POST" });
        }
      } catch {
        /* silencioso — backoff implícito pelo intervalo */
      } finally {
        pollingRef.current = false;
      }
    };
    tick();
    const id = window.setInterval(tick, 8000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, [processWebhookPayment]);

  const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Visão geral",  icon: LayoutDashboard },
    { id: "empresas",  label: "Empresas",     icon: Building2 },
    { id: "auditoria", label: "Auditoria",    icon: ShieldCheck },
    { id: "suporte",   label: "Suporte",      icon: LifeBuoy },
    { id: "remarketing", label: "Remarketing", icon: Megaphone },
    { id: "config",    label: "Configurações",icon: Settings },
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="h-16 flex items-center gap-3 px-4 lg:px-6">
          <Logo height={32} priority />
          <div className="h-8 w-px bg-border mx-1 hidden sm:block" />
          <div className="min-w-0 flex items-center gap-3">
            <Crown className="w-4 h-4 text-amber-500 shrink-0 hidden sm:block" />
            <div className="min-w-0 hidden md:block">
              <p className="font-semibold text-sm leading-tight truncate">Painel Master</p>
              <p className="text-[11px] text-muted-foreground truncate">Plataforma · {masterDisplayName}</p>
            </div>
            <div className="h-8 w-px bg-border mx-1 hidden md:block" />
            <div className="flex items-center gap-2.5">
              <span className="relative inline-flex h-3.5 w-3.5 shrink-0" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75 animate-ping" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.9)]" />
              </span>
              <span className="text-xl md:text-2xl font-bold tracking-tight">
                {masterDisplayName}
              </span>
              <span className="sr-only">Sistema ativo · monitoramento em tempo real</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setPwdModal(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              title="Alterar a senha do Super Admin (somente o hash é armazenado)"
              aria-label="Alterar senha do Super Admin"
            >
              <KeyRound className="w-4 h-4" /> Alterar senha
            </button>
            <button
              onClick={() => {
                logout();
                toast.success("Sessão encerrada. Até logo!");
                navigate({ to: "/login" });
              }}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
              title="Encerrar sessão do Super Admin"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
        <nav aria-label="Seções do painel master" className="px-4 lg:px-6 flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {active && <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-primary" />}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="p-4 lg:p-6 space-y-6">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "empresas"  && <CompaniesTab />}
        {tab === "auditoria" && <AuditTab />}
        {tab === "suporte"   && <SupportTab />}
        {tab === "remarketing" && <RemarketingTab />}
        {tab === "config"    && <SettingsTab />}
      </main>
      {pwdModal && (
        <ChangeSuperAdminPasswordModal onClose={() => setPwdModal(false)} />
      )}
    </div>
  );
}

/* ─────────────────────── Dashboard tab ─────────────────────── */

function DashboardTab() {
  const { companies } = useSaaS();
  const total = companies.length;
  const ativas = companies.filter((c) => c.status === "active").length;
  const trial = companies.filter((c) => c.status === "trial").length;
  const pendentes = companies.filter((c) => c.status === "pending").length;
  const bloqueadas = companies.filter((c) => c.status === "blocked").length;
  const canceladas = companies.filter((c) => c.status === "canceled").length;
  const mrr = companies.reduce((a, c) => a + (c.status === "active" ? c.mrr : 0), 0);
  const arr = mrr * 12;
  const cobrancaBase = companies.filter((c) => c.status === "active" || c.status === "pending" || c.status === "blocked").length;
  const inadimplencia = cobrancaBase > 0 ? ((pendentes + bloqueadas) / cobrancaBase) * 100 : 0;

  // ─────────────────────────────────────────────────────────────────
  // RECEITA DO SAAS — apenas assinaturas (planos contratados).
  // NÃO somamos a tabela `sales` (PDV dos clientes): o dinheiro deles
  // não é receita do SaaS. Aqui consolidamos exclusivamente o valor
  // dos planos ativos de cada company, lido do banco via useSaaS().
  // ─────────────────────────────────────────────────────────────────
  const receitaAssinaturas = companies.reduce(
    (a, c) => a + (c.status === "active" ? PLAN_PRICE[c.plan] : 0),
    0,
  );

  const KPI = [
    { label: "Receita Consolidada (Assinaturas)", value: BRL(receitaAssinaturas), hint: `${ativas} plano(s) ativo(s) · soma dos planos contratados`, icon: TrendingUp, tone: "primary" as const },
    { label: "MRR (Receita Recorrente Mensal)", value: BRL(mrr), hint: `${ativas} empresa(s) ativa(s)`, icon: TrendingUp, tone: "primary" as const },
    { label: "ARR (Receita Anual Projetada)",  value: BRL(arr), hint: "MRR × 12 meses",                icon: TrendingUp, tone: "primary" as const },
    { label: "Empresas na plataforma",         value: `${ativas}/${total}`, hint: `Ativas de ${total} cadastradas`, icon: Building2, tone: "neutral" as const },
    { label: "Taxa de inadimplência",          value: `${inadimplencia.toFixed(1)}%`, hint: `${pendentes + bloqueadas} em atraso`, icon: AlertTriangle, tone: inadimplencia > 25 ? "danger" : "warn" as const },
  ];

  const breakdown = [
    { k: "Ativas",     v: ativas,    cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
    { k: "Trial",      v: trial,     cls: "bg-sky-500/15 text-sky-600 dark:text-sky-400",             icon: LogIn },
    { k: "Vencendo",   v: pendentes, cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400",       icon: FileWarning },
    { k: "Bloqueadas", v: bloqueadas,cls: "bg-primary/15 text-primary",                                icon: AlertTriangle },
    { k: "Canceladas", v: canceladas,cls: "bg-muted text-muted-foreground",                           icon: UserCog },
  ];

  return (
    <>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Visão geral da plataforma</h1>
        <p className="text-sm text-muted-foreground">Métricas financeiras consolidadas em tempo real.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPI.map((k) => (
          <div
            key={k.label}
            className={`rounded-xl border p-4 bg-card ${
              k.tone === "danger" ? "border-destructive/40" :
              k.tone === "warn"   ? "border-amber-500/40"   :
              k.tone === "primary"? "border-primary/30"     :
                                    "border-border"
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground text-[11px] uppercase tracking-wide font-semibold">
              <span>{k.label}</span>
              <k.icon className="w-4 h-4" />
            </div>
            <p className={`text-2xl font-bold mt-2 tabular-nums ${k.tone === "primary" ? "text-primary" : ""}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold inline-flex items-center gap-2 mb-4"><Building2 className="w-4 h-4 text-primary" /> Distribuição por status</h2>
          <div className="space-y-2">
            {breakdown.map((b) => {
              const pct = total > 0 ? (b.v / total) * 100 : 0;
              const Icon = b.icon;
              return (
                <div key={b.k} className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${b.cls}`}>
                    <Icon className="w-3 h-3" /> {b.k}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs tabular-nums w-12 text-right text-muted-foreground">{b.v} ({pct.toFixed(0)}%)</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold inline-flex items-center gap-2 mb-4"><CreditCard className="w-4 h-4 text-primary" /> Receita por plano</h2>
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr><th className="text-left py-2">Plano</th><th className="text-right">Empresas</th><th className="text-right">Preço</th><th className="text-right">MRR</th></tr>
            </thead>
            <tbody>
              {(["bronze", "prata", "ouro"] as Plan[]).map((p) => {
                const list = companies.filter((c) => c.plan === p && c.status === "active");
                return (
                  <tr key={p} className="border-t border-border">
                    <td className="py-2 font-medium">{PLAN_LABEL[p]}</td>
                    <td className="py-2 text-right tabular-nums">{list.length}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">{BRL(PLAN_PRICE[p])}</td>
                    <td className="py-2 text-right tabular-nums font-semibold">{BRL(list.length * PLAN_PRICE[p])}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}

/* ─────────────────────── Empresas tab ─────────────────────── */

function CompaniesTab() {
  const { companies, setCompanyStatus, setCompanyPlan, setCompanyDueDate, startImpersonation, createDemoAccess, countUsers, deleteCompany, refresh } = useSaaS();
  const navigate = useNavigate();
  const [tempCredentials, setTempCredentials] = useState<{ email: string; password: string; subtitle: string } | null>(null);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const STATUS_OPTS: SubscriptionStatus[] = ["active", "trial", "pending", "blocked", "canceled"];
  const PLAN_OPTS: Plan[] = ["bronze", "prata", "ouro"];

  // "Now" que reavalia o status online/offline a cada 30s sem refetch da lista.
  const [now, setNow] = useState(() => Date.now());
  // Filtro de conexão para a listagem de empresas.
  const [connFilter, setConnFilter] = useState<"all" | "online" | "offline">("all");
  // Mapa companyId -> último heartbeat (max de app_users.last_seen_at por empresa).
  // Alimenta o indicador online/offline com sinal REAL de sessão ativa.
  const [presence, setPresence] = useState<Record<string, number>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const aliveRef = useRef(true);
  const fetchPresence = useCallback(async () => {
    const { data, error } = await supabase
      .from("app_users")
      .select("company_id, last_seen_at")
      .not("last_seen_at", "is", null);
    if (!aliveRef.current || error || !data) return;
    const map: Record<string, number> = {};
    for (const row of data as Array<{ company_id: string | null; last_seen_at: string | null }>) {
      if (!row.company_id || !row.last_seen_at) continue;
      const t = new Date(row.last_seen_at).getTime();
      if (!Number.isFinite(t)) continue;
      if (!map[row.company_id] || t > map[row.company_id]) map[row.company_id] = t;
    }
    setPresence(map);
    setNow(Date.now());
  }, []);
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refresh(), fetchPresence()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh, fetchPresence]);
  useEffect(() => {
    aliveRef.current = true;
    void fetchPresence();
    // Auto-refresh a cada 10s: lista de empresas + presença (silencioso, sem flicker).
    const id = window.setInterval(() => {
      void refresh();
      void fetchPresence();
    }, 10_000);
    return () => { aliveRef.current = false; window.clearInterval(id); };
  }, [fetchPresence, refresh]);
  // Online = heartbeat nos últimos 5 minutos (heartbeat roda a cada 45s).
  const ONLINE_WINDOW_MS = 5 * 60_000;
  const isOnline = (companyId: string) => {
    const t = presence[companyId];
    return typeof t === "number" && now - t < ONLINE_WINDOW_MS;
  };

  // "Tick" leve para recalcular Online/Offline sem refazer o fetch de presença.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const visibleCompanies = useMemo(() => {
    if (connFilter === "all") return companies;
    return companies.filter((c) =>
      connFilter === "online" ? isOnline(c.id) : !isOnline(c.id),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies, connFilter, presence, now]);

  const onlineCount = useMemo(
    () => companies.filter((c) => isOnline(c.id)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companies, presence, now],
  );
  const offlineCount = companies.length - onlineCount;

  return (
    <>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestão de empresas</h1>
          <p className="text-sm text-muted-foreground">Plano, vencimento, status e acesso de suporte (impersonação).</p>
        </div>
        <button
          onClick={async () => {
            const res = await createDemoAccess();
            // eslint-disable-next-line no-console
            console.log("[super-admin] createDemoAccess result:", res);
            if (!res.ok) {
              toast.error(res.reason ?? "Não foi possível gerar o acesso.");
              return;
            }
            const { email = "", password = "" } = res;
            if (!email || !password) {
              toast.error("Empresa criada, mas credenciais não retornaram. Verifique o console.");
              return;
            }
            setTempCredentials({
              email,
              password,
              subtitle: `Cliente fictício para ${res.company?.fantasia ?? "nova empresa"}`,
            });
            setIsCredentialsModalOpen(true);
            // eslint-disable-next-line no-console
            console.log("[super-admin] Credenciais capturadas — modal forçado:", { email, password });
          }}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-sm shadow hover:bg-primary/90 transition-colors"
          title="Cria a empresa de testes e exibe as credenciais imediatamente na tela"
        >
          <Sparkles className="w-4 h-4" /> Gerar Cliente Fictício
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border">
          <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mr-1">
            Conexão
          </span>
          {([
            { id: "all",     label: `Todos (${companies.length})` },
            { id: "online",  label: `Online (${onlineCount})` },
            { id: "offline", label: `Offline (${offlineCount})` },
          ] as const).map((opt) => {
            const active = connFilter === opt.id;
            const dot =
              opt.id === "online"  ? "bg-emerald-500" :
              opt.id === "offline" ? "bg-red-500"     :
                                     "bg-muted-foreground/50";
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setConnFilter(opt.id)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-xs font-semibold transition-colors ${
                  active
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
                {opt.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            aria-label="Atualizar lista de empresas"
            title="Atualizar agora"
            className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Empresa</th>
                <th className="text-left px-4 py-3">CNPJ</th>
                <th className="text-left px-4 py-3">Conexão</th>
                <th className="text-left px-4 py-3">Plano</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Vencimento</th>
                <th className="text-right px-4 py-3">MRR</th>
                <th className="text-left px-4 py-3">Usuários</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {visibleCompanies.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhuma empresa {connFilter === "online" ? "online" : connFilter === "offline" ? "offline" : ""} no momento.
                  </td>
                </tr>
              )}
              {visibleCompanies.map((c) => (
                <tr key={c.id} className="border-t border-border align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                          isOnline(c.id)
                            ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
                            : "bg-muted-foreground/40"
                        }`}
                        title={
                          isOnline(c.id)
                            ? "Online — sessão ativa no momento"
                            : "Offline — nenhuma sessão ativa"
                        }
                        aria-label={isOnline(c.id) ? "Online" : "Offline"}
                      />
                      <span className="font-semibold">{c.fantasia}</span>
                      {/* Categorias mutuamente exclusivas, com prioridade
                          Fictício > Trial > Pago. Um cliente pagante NUNCA
                          pode aparecer como "Teste 7 dias". */}
                      {c.isMock ? (
                        <span
                          className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md bg-muted text-muted-foreground border border-border text-[10px] font-semibold uppercase tracking-wide"
                          title="Dado fictício gerado manualmente pelo painel — não é venda real"
                        >
                          <Database className="w-3 h-3" />
                          Dado Fictício
                        </span>
                      ) : c.isTrial ? (
                        <span
                          className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[10px] font-semibold uppercase tracking-wide"
                          title="Cliente em período de teste de 7 dias (plano Bronze)"
                        >
                          <Sparkles className="w-3 h-3" />
                          Teste 7 dias
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wide"
                          title={`Cliente pagante — plano ${PLAN_LABEL[c.plan]}`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          Pago
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{c.razaoSocial}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.cnpj}</td>
                  <td className="px-4 py-3">
                    {isOnline(c.id) ? (
                      <span
                        className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold"
                        title={`Online — último sinal ${new Date(presence[c.id]).toLocaleString("pt-BR")}`}
                      >
                        <span className="relative inline-flex w-2 h-2">
                          <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-60 animate-ping" />
                          <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
                        </span>
                        Online
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 h-6 px-2 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 text-[11px] font-semibold"
                        title={
                          presence[c.id]
                            ? `Offline — último sinal ${new Date(presence[c.id]).toLocaleString("pt-BR")}`
                            : "Offline — nenhum sinal registrado"
                        }
                      >
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                        Offline
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={c.plan}
                      onChange={(e) => {
                        const next = e.target.value as Plan;
                        setCompanyPlan(c.id, next);
                        toast.success(`${c.fantasia}: plano alterado para ${PLAN_LABEL[next]}.`);
                      }}
                      aria-label={`Plano de ${c.fantasia}`}
                      className="h-8 px-2 rounded-md bg-secondary border border-border text-xs"
                    >
                      {PLAN_OPTS.map((p) => <option key={p} value={p}>{PLAN_LABEL[p]} · {BRL(PLAN_PRICE[p])}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={c.status}
                      onChange={(e) => {
                        const next = e.target.value as SubscriptionStatus;
                        setCompanyStatus(c.id, next);
                        toast.success(`${c.fantasia}: ${STATUS_LABEL[next]}.`);
                      }}
                      aria-label={`Status de ${c.fantasia}`}
                      className="h-8 px-2 rounded-md bg-secondary border border-border text-xs"
                    >
                      {STATUS_OPTS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={c.dueDate.slice(0, 10)}
                      onChange={(e) => {
                        const iso = new Date(e.target.value + "T00:00:00").toISOString();
                        setCompanyDueDate(c.id, iso);
                      }}
                      aria-label={`Vencimento de ${c.fantasia}`}
                      className="h-8 px-2 rounded-md bg-secondary border border-border text-xs"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{BRL(c.mrr)}</td>
                  <td className="px-4 py-3">
                    {(() => {
                      const used = countUsers(c.id);
                      const limit = getPlanUsersLimit(c.plan);
                      const limitLbl = String(limit);
                      const full = used >= limit;
                      return (
                        <span
                          className={`text-xs tabular-nums ${full ? "text-amber-500 font-semibold" : "text-muted-foreground"}`}
                          title="Uso de usuários no plano contratado"
                        >
                          {used}/{limitLbl}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        startImpersonation(c.id);
                        toast.success(`Modo suporte iniciado em ${c.fantasia}.`);
                        navigate({ to: "/dashboard" });
                      }}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
                      title="Acessar a empresa como administrador (suporte técnico)"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Acessar empresa
                    </button>
                    <span className="inline-block w-2" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-destructive/50 text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors"
                          title="Remover empresa permanentemente"
                          aria-label={`Excluir ${c.fantasia}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-border bg-card">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-destructive/15 text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </span>
                            Remover {c.fantasia}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover esta empresa? Todos os dados vinculados a ela (usuários,
                            produtos, vendas, financeiro e tickets) serão apagados definitivamente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              const r = await deleteCompany(c.id);
                              if (r.ok) {
                                await refresh();
                              } else {
                                toast.error(r.reason ?? "Não foi possível remover a empresa.");
                              }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover definitivamente
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isCredentialsModalOpen && tempCredentials && (
        <CredentialsModal
          email={tempCredentials.email}
          password={tempCredentials.password}
          subtitle={tempCredentials.subtitle}
          onClose={() => {
            setIsCredentialsModalOpen(false);
            setTempCredentials(null);
          }}
        />
      )}
    </>
  );
}

function EmailPreviewModal({
  email, password, company, onClose,
}: { email: string; password: string; company: string; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-preview-title"
      className="fixed inset-0 z-[100] grid place-items-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 pt-6 pb-4 border-b border-border flex items-start gap-3">
          <div className="min-w-0 flex-1 flex flex-col gap-2">
            <Logo height={28} />
            <h2 id="email-preview-title" className="font-bold leading-tight inline-flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> E-mail enviado com sucesso!
            </h2>
            <p className="text-xs text-muted-foreground">Pré-visualização da mensagem enviada para o novo cliente</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="px-6 py-5 space-y-3 text-sm">
          <div className="rounded-md border border-border bg-secondary/50 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Assunto</p>
            <p className="font-semibold">Seu acesso à ORVIX SISTEMAS está pronto!</p>
          </div>
          <div className="rounded-md border border-border bg-background px-3 py-3 space-y-2">
            <p>Olá, seja bem-vindo(a) à <strong>ORVIX SISTEMAS</strong>.</p>
            <p>A conta da empresa <strong>{company}</strong> já está ativa em nossa plataforma.</p>
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 font-mono text-xs space-y-1">
              <p><span className="text-muted-foreground">Usuário:</span> <strong>{email}</strong></p>
              <p><span className="text-muted-foreground">Senha Temporária:</span> <strong>{password}</strong></p>
            </div>
            <p className="text-xs text-muted-foreground">
              Por motivos de segurança, você deverá alterar esta senha temporária em seu primeiro acesso à plataforma
              ORVIX SISTEMAS.
            </p>
          </div>
        </div>
        <footer className="px-6 pb-6 flex justify-end">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Entendi
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ─────────────────────── Auditoria tab ─────────────────────── */

const LOG_KIND_LABEL: Record<SystemLogKind, string> = {
  LOGIN_OK:             "Login",
  LOGIN_FAIL:           "Tentativa de login",
  SALE_OK:              "Venda concluída",
  SUBSCRIPTION_CHANGE:  "Assinatura",
  PLAN_CHANGE:          "Plano",
  DUE_CHANGE:           "Vencimento",
  IMPERSONATION_START:  "Suporte iniciado",
  IMPERSONATION_END:    "Suporte encerrado",
  SETTINGS_UPDATE:      "Configuração",
  SUPPORT_TICKET_CLOSED: "Chamado concluído",
};

function kindBadge(kind: SystemLogKind) {
  switch (kind) {
    case "LOGIN_OK":   return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
    case "LOGIN_FAIL": return "bg-destructive/15 text-destructive";
    case "SALE_OK":    return "bg-sky-500/15 text-sky-600 dark:text-sky-400";
    case "SUBSCRIPTION_CHANGE":
    case "PLAN_CHANGE":
    case "DUE_CHANGE": return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "IMPERSONATION_START":
    case "IMPERSONATION_END": return "bg-primary/15 text-primary";
    case "SUPPORT_TICKET_CLOSED": return "bg-destructive/15 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
}

function AuditTab() {
  useMockStore();
  const { revertLog } = useSaaS();
  const [filter, setFilter] = useState<"all" | SystemLogKind>("all");
  const logs = useMemo<SystemLog[]>(
    () => filter === "all" ? SYSTEM_LOGS : SYSTEM_LOGS.filter((l) => l.kind === filter),
    [filter],
  );
  const kinds: Array<"all" | SystemLogKind> = ["all", "LOGIN_OK", "LOGIN_FAIL", "SALE_OK", "SUBSCRIPTION_CHANGE", "IMPERSONATION_START"];

  return (
    <>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Auditoria de segurança</h1>
          <p className="text-sm text-muted-foreground">Eventos críticos da plataforma — logins, vendas, alterações de assinatura e suporte.</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {kinds.map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`h-8 px-3 rounded-md text-xs font-semibold border transition-colors ${
                filter === k ? "bg-primary/15 text-primary border-primary/40" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {k === "all" ? "Todos" : LOG_KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 w-[160px]">Data/Hora</th>
                <th className="text-left px-4 py-3 w-[160px]">Evento</th>
                <th className="text-left px-4 py-3">Empresa</th>
                <th className="text-left px-4 py-3">Usuário</th>
                <th className="text-left px-4 py-3">Ação</th>
                <th className="text-right px-4 py-3 w-[160px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum evento registrado para este filtro.</td></tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">{new Date(l.date).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${kindBadge(l.kind)}`}>
                      {LOG_KIND_LABEL[l.kind]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{l.companyName ?? "—"}</td>
                  <td className="px-4 py-3">{l.user ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.action}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {l.kind === "SUPPORT_TICKET_CLOSED" && !l.reverted ? (
                      (() => {
                        const ticketId = (l.undo as { ticketId?: string } | undefined)?.ticketId;
                        return (
                          <button
                            onClick={() => {
                              if (!ticketId) {
                                toast.error("Identificador do chamado ausente neste log.");
                                return;
                              }
                              const restored = restoreTicket(ticketId);
                              if (!restored) {
                                toast.error("Chamado não encontrado na lixeira — talvez já tenha sido restaurado.");
                                return;
                              }
                              markLogReverted(l.id);
                              toast.success("Chamado de suporte restaurado com sucesso!");
                            }}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
                            title="Restaurar este chamado de suporte"
                          >
                            <Undo2 className="w-3.5 h-3.5" /> Restaurar Chamado
                          </button>
                        );
                      })()
                    ) : l.undo && !l.reverted ? (
                      <button
                        onClick={() => {
                          const r = revertLog(l.id);
                          if (r.ok) toast.success("Ação revertida com sucesso! O estado anterior foi restaurado.");
                          else toast.error(r.reason ?? "Não foi possível reverter este evento.");
                        }}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
                        title="Restaurar o estado anterior deste evento"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Reverter Ação
                      </button>
                    ) : l.reverted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground italic">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Revertido
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/60">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────── Suporte tab ─────────────────────── */

const PRIO_BADGE: Record<SupportTicket["priority"], string> = {
  alta: "bg-destructive/15 text-destructive",
  media: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  baixa: "bg-muted text-muted-foreground",
};
const STATUS_TICKET_LABEL: Record<SupportTicket["status"], string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
};

function SupportTab() {
  useMockStore();
  type DbTicket = {
    id: string;
    company_id: string;
    company_name: string;
    requester_name: string;
    subject: string;
    message: string;
    priority: "baixa" | "media" | "alta";
    status: "aberto" | "em_andamento" | "resolvido";
    created_at: string;
  };
  const [tickets, setTickets] = useState<DbTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, company_id, company_name, requester_name, subject, message, priority, status, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar chamados de suporte.");
      setTickets([]);
    } else {
      setTickets((data ?? []) as DbTicket[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("support_tickets_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const setStatus = async (id: string, status: DbTicket["status"]) => {
    const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id);
    if (error) return toast.error("Falha ao atualizar o status.");
    toast.success(`Chamado atualizado: ${STATUS_TICKET_LABEL[status]}.`);
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  };

  const remove = async (t: DbTicket) => {
    const { error } = await supabase.from("support_tickets").delete().eq("id", t.id);
    if (error) return toast.error("Falha ao remover o chamado.");
    logEvent({
      kind: "SUPPORT_TICKET_CLOSED",
      company_id: t.company_id,
      companyName: t.company_name,
      user: "Super Admin",
      action: `Chamado ("${t.subject}") da empresa ${t.company_name} concluído/removido pelo Administrador.`,
    });
    toast.success("Chamado concluído e removido da fila.");
    setTickets((prev) => prev.filter((x) => x.id !== t.id));
  };

  return (
    <>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Central de suporte</h1>
        <p className="text-sm text-muted-foreground">Chamados abertos pelos lojistas — atualize o status conforme a tratativa.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando chamados…</p>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhuma requisição de suporte no momento.
        </div>
      ) : (
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {tickets.map((t) => (
          <article key={t.id} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 relative">
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{t.company_name}</p>
                <h3 className="font-semibold leading-tight truncate">{t.subject}</h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${PRIO_BADGE[t.priority]}`}>
                  {t.priority.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => remove(t)}
                  aria-label={`Concluir e remover chamado`}
                  title="Concluir e remover chamado"
                  className="w-7 h-7 grid place-items-center rounded-md border border-border text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </header>
            <p className="text-sm text-muted-foreground line-clamp-3">{t.message}</p>
            <footer className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-border text-xs">
              <div className="text-muted-foreground">
                <p>{t.requester_name}</p>
                <p className="tabular-nums">{new Date(t.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <select
                value={t.status}
                onChange={(e) => setStatus(t.id, e.target.value as DbTicket["status"])}
                aria-label={`Status do chamado`}
                className="h-8 px-2 rounded-md bg-secondary border border-border text-xs"
              >
                {(["aberto", "em_andamento", "resolvido"] as DbTicket["status"][]).map((s) => (
                  <option key={s} value={s}>{STATUS_TICKET_LABEL[s]}</option>
                ))}
              </select>
            </footer>
          </article>
        ))}
      </div>
      )}
    </>
  );
}

/* ─────────────────────── Configurações tab ─────────────────────── */

function SettingsTab() {
  const { user } = useSaaS();
  const [form, setForm] = useState({ ...SAAS_SETTINGS });

  const save = () => {
    // Snapshot do estado anterior — habilita reversão pelo log de auditoria.
    const previousSettings = JSON.parse(JSON.stringify(SAAS_SETTINGS));
    updateSaaSSettings(form);
    logEvent({
      kind: "SETTINGS_UPDATE",
      company_id: null,
      companyName: "Plataforma",
      user: user?.name ?? "Super Admin",
      action: `Configurações globais atualizadas (gateway: ${form.paymentGateway}, limites Bronze/Prata/Ouro: ${form.usersLimit.bronze}/${form.usersLimit.prata}/${form.usersLimit.ouro}).`,
      undo: { type: "SETTINGS_UPDATE", previousSettings },
    });
    toast.success("Configurações globais atualizadas.");
  };

  return (
    <>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Configurações globais</h1>
        <p className="text-sm text-muted-foreground">Limites por plano, SMTP e gateway de pagamento — cobrança 100% mensal.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold inline-flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> Plataforma</h2>
          <div className="rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            ORVIX SISTEMAS opera com cobrança <strong>100% mensal</strong> — sem períodos de trial ou planos gratuitos. Acessos são gerados manualmente pelo Painel Master após a venda.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            {(["bronze", "prata", "ouro"] as Plan[]).map((p) => (
              <label key={p} className="flex flex-col gap-1.5 min-w-0">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold leading-tight min-h-[2.25rem] flex items-end">
                  Limite {PLAN_LABEL[p]} <span className="ml-1 normal-case tracking-normal text-muted-foreground/70">(usuários/terminais)</span>
                </span>
                <input
                  type="number" min={1}
                  value={form.usersLimit[p]}
                  onChange={(e) => setForm((f) => ({ ...f, usersLimit: { ...f.usersLimit, [p]: Math.max(1, Math.floor(Number(e.target.value) || 1)) } }))}
                  className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-sm tabular-nums"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold inline-flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> SMTP transacional</h2>
          <Field label="Host">
            <input value={form.smtpHost} onChange={(e) => setForm((f) => ({ ...f, smtpHost: e.target.value }))}
              className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Usuário">
              <input value={form.smtpUser} onChange={(e) => setForm((f) => ({ ...f, smtpUser: e.target.value }))}
                className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-sm" />
            </Field>
            <Field label="Remetente (from)">
              <input value={form.smtpFrom} onChange={(e) => setForm((f) => ({ ...f, smtpFrom: e.target.value }))}
                className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-sm" />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 space-y-4 lg:col-span-2">
          <h2 className="font-semibold inline-flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary" /> Gateway de pagamento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Provedor">
              <select
                value={form.paymentGateway}
                onChange={(e) => setForm((f) => ({ ...f, paymentGateway: e.target.value as typeof form.paymentGateway }))}
                className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-sm"
              >
                <option>Mercado Pago</option><option>Stripe</option><option>Pagar.me</option>
              </select>
            </Field>
            <Field label="Chave pública">
              <input
                value={form.paymentPublicKey}
                onChange={(e) => setForm((f) => ({ ...f, paymentPublicKey: e.target.value }))}
                placeholder={form.paymentGateway === "Mercado Pago" ? "APP_USR-..." : form.paymentGateway === "Stripe" ? "pk_live_..." : "ak_live_..."}
                className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-sm font-mono"
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">As credenciais privadas (secret keys) ficam apenas no servidor — nunca exibidas no painel.</p>
        </section>

        <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-5 space-y-4 lg:col-span-2">
          <h2 className="font-semibold inline-flex items-center gap-2 text-destructive">
            <Eraser className="w-4 h-4" /> Zona de homologação
          </h2>
          <p className="text-sm text-muted-foreground">
            Limpa todos os <strong>dados de movimentação</strong> da plataforma — produtos, vendas, clientes, fornecedores, estoque, financeiro e logs — para iniciar um novo ciclo de testes comerciais. <strong className="text-foreground">Os logins de usuários e as empresas cadastradas permanecem ativos.</strong>
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                className="h-11 px-5 inline-flex items-center gap-2 rounded-md border border-destructive bg-destructive/10 text-destructive font-semibold hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Limpar Dados de Teste (Zerar Movimentações)
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-border bg-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <span className="inline-grid place-items-center w-8 h-8 rounded-full bg-destructive/15 text-destructive">
                    <Eraser className="w-4 h-4" />
                  </span>
                  Zerar dados comerciais?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Deseja zerar todos os produtos, vendas, clientes e fornecedores do sistema? Os usuários de login continuarão ativos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    resetCommercialData();
                    toast.success("✨ Sistema limpo com sucesso! Pronto para novos testes comerciais.");
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sim, zerar movimentações
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </div>

      <div className="flex justify-end">
        <button
          onClick={save}
          className="h-11 px-5 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
        >
          Salvar configurações
        </button>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

/* ───────── Modal: alterar senha do Super Admin (apenas o hash é armazenado) ───────── */

function ChangeSuperAdminPasswordModal({ onClose }: { onClose: () => void }) {
  const { user, updatePassword } = useSaaS();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const tooShort = pwd.length > 0 && pwd.length < 8;
  const mismatch = pwd2.length > 0 && pwd !== pwd2;
  const valid = pwd.length >= 8 && pwd === pwd2;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const res = await updatePassword(pwd);
      if (!res.ok) {
        toast.error(res.reason ?? "Não foi possível atualizar a senha.");
        return;
      }
      logEvent({
        kind: "SETTINGS_UPDATE",
        company_id: null,
        companyName: "Plataforma",
        user: user?.name ?? "Super Admin",
        action: "Senha do Super Admin alterada (hash atualizado).",
      });
      toast.success("Senha do Super Admin atualizada com segurança.");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sa-pwd-title"
      className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
      >
        <header className="px-6 pt-6 pb-4 border-b border-border flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary grid place-items-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="sa-pwd-title" className="font-bold text-base leading-tight">
              Alterar senha do Super Admin
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Apenas o hash SHA-256 é armazenado localmente — a senha em texto puro nunca é salva.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1 rounded text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="px-6 py-5 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nova senha</span>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoFocus
                autoComplete="new-password"
                minLength={8}
                placeholder="mínimo de 8 caracteres"
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
            {tooShort && <p className="text-[11px] text-destructive">A senha precisa de pelo menos 8 caracteres.</p>}
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confirme a nova senha</span>
            <input
              type={show ? "text" : "password"}
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              placeholder="digite novamente"
              className="w-full h-10 px-3 rounded-md bg-background border border-input text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {mismatch && <p className="text-[11px] text-destructive">As senhas não coincidem.</p>}
          </label>

          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-muted-foreground">
            Senhas amplamente conhecidas (como <code>admin123</code>) são bloqueadas automaticamente.
          </div>
        </div>

        <footer className="px-6 pb-6 pt-2 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-4 rounded-md border border-border text-sm font-semibold hover:bg-muted/50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!valid || submitting}
            className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck className="w-4 h-4" /> Salvar nova senha
          </button>
        </footer>
      </form>
    </div>
  );
}

/* ─────────────────────── Remarketing tab ─────────────────────── */

function RemarketingTab() {
  const listFn = useServerFn(listRemarketingLeads);
  const sendFn = useServerFn(sendRemarketingEmail);
  const deleteFn = useServerFn(deleteRemarketingLead);
  const [active, setActive] = useState<RemarketingLead[]>([]);
  const [expired, setExpired] = useState<RemarketingLead[]>([]);
  const [contacted, setContacted] = useState<RemarketingLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listFn();
      setActive(res.active);
      setExpired(res.expired);
      setContacted(res.contacted);
    } catch {
      toast.error("Falha ao carregar leads de remarketing.");
      setActive([]); setExpired([]); setContacted([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleSend = async (lead: RemarketingLead) => {
    setSendingEmail(lead.email);
    try {
      const res = await sendFn({ data: { email: lead.email } });
      if (res.ok) {
        toast.success(res.simulated
          ? `Estratégia registrada para ${lead.email} (provedor de e-mail não configurado — modo simulado).`
          : `Estratégia de venda enviada para ${lead.email}.`);
        await load();
      } else {
        toast.error(res.reason);
      }
    } catch {
      toast.error("Falha ao disparar o e-mail. Tente novamente.");
    } finally {
      setSendingEmail(null);
    }
  };

  const handleDelete = async (lead: RemarketingLead) => {
    try {
      const res = await deleteFn({ data: { email: lead.email } });
      if (res.ok) {
        toast.success(`Lead ${lead.email} removido.`);
        await load();
      } else {
        toast.error(res.reason);
      }
    } catch {
      toast.error("Falha ao remover o lead.");
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const fmtWhatsapp = (raw: string | null) => {
    if (!raw) return "—";
    const d = raw.replace(/\D/g, "");
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return raw;
  };

  const trialEndDate = (iso: string) => {
    const d = new Date(iso);
    d.setDate(d.getDate() + 7);
    return d;
  };

  const buildWhatsappUrl = (lead: RemarketingLead) => {
    const digits = (lead.whatsapp ?? "").replace(/\D/g, "");
    if (!digits) return null;
    const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
    const firstName = lead.fullName?.trim().split(" ")[0] ?? "Empreendedor";
    const msg = lead.expired
      ? `Olá ${firstName}, aqui é da ORVIX SISTEMAS 👋. Notamos que seu teste grátis encerrou. Podemos liberar uma condição especial para você continuar usando o PDV completo (offline, relatórios, estoque e vendas). Posso te enviar o link do plano mensal?`
      : `Olá ${firstName}, aqui é da ORVIX SISTEMAS 👋. Vi que você está no período de teste do nosso PDV. Posso te ajudar com alguma dúvida sobre instalação, uso ou planos?`;
    return `https://wa.me/${withCountry}?text=${encodeURIComponent(msg)}`;
  };

  const LeadCard = ({
    lead,
    variant,
  }: {
    lead: RemarketingLead;
    variant: "active" | "expired" | "contacted";
  }) => {
    const waUrl = buildWhatsappUrl(lead);
    const endDate = trialEndDate(lead.trialStartDate);
    const label =
      variant === "active" ? "Teste ativo" :
      variant === "expired" ? "Teste expirado" : "Já contatado";
    const labelColor =
      variant === "active" ? "text-sky-600 dark:text-sky-400" :
      variant === "expired" ? "text-primary" : "text-emerald-600 dark:text-emerald-400";
    return (
      <article className="relative rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
        <div className="absolute top-2 right-2">
          <ConfirmDelete
            title="Remover lead"
            description={<>Deseja remover permanentemente o lead <b>{lead.email}</b>? Esta ação não pode ser desfeita.</>}
            confirmLabel="Remover lead"
            onConfirm={() => handleDelete(lead)}
            triggerAriaLabel="Remover lead"
            triggerTitle="Remover lead"
          />
        </div>
        <header className="pr-10">
          <p className={`text-[11px] uppercase tracking-wide font-semibold ${labelColor}`}>{label}</p>
          <h3 className="font-semibold leading-tight truncate" title={lead.fullName ?? lead.email}>
            {lead.fullName ?? lead.email}
          </h3>
        </header>
        <dl className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span className="truncate">{lead.email}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            <span className="tabular-nums">{fmtWhatsapp(lead.whatsapp)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Início: <b className="text-foreground tabular-nums">{fmtDate(lead.trialStartDate)}</b></span>
          </div>
          <div className="flex items-center gap-1.5">
            <CalendarX2 className="w-3.5 h-3.5" />
            <span>Fim do teste: <b className="text-foreground tabular-nums">{fmtDate(endDate.toISOString())}</b></span>
          </div>
          {variant === "active" && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span><b className="text-foreground tabular-nums">{lead.daysLeft}</b> dia(s) restante(s)</span>
            </div>
          )}
          {variant === "expired" && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Expirado há <b className="text-foreground tabular-nums">{lead.daysSinceExpiry}</b> dia(s)</span>
            </div>
          )}
          {variant === "contacted" && lead.contactedAt && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Contatado em <b className="text-foreground tabular-nums">{new Date(lead.contactedAt).toLocaleDateString("pt-BR")}</b></span>
            </div>
          )}
        </dl>
        <div className="mt-auto grid grid-cols-2 gap-2">
          <a
            href={waUrl ?? undefined}
            target={waUrl ? "_blank" : undefined}
            rel={waUrl ? "noopener noreferrer" : undefined}
            aria-disabled={!waUrl}
            onClick={(e) => { if (!waUrl) e.preventDefault(); }}
            className={`h-10 inline-flex items-center justify-center gap-2 rounded-md text-sm font-semibold border transition-colors ${
              waUrl
                ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                : "bg-secondary text-muted-foreground border-border cursor-not-allowed opacity-60"
            }`}
            title={waUrl ? "Abrir conversa no WhatsApp" : "WhatsApp não informado"}
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
          <button
            type="button"
            onClick={() => handleSend(lead)}
            disabled={sendingEmail === lead.email || variant === "contacted"}
            className="h-10 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
            title={variant === "contacted" ? "Lead já contatado por e-mail" : "Disparar e-mail de venda"}
          >
            <Send className="w-4 h-4" />
            {sendingEmail === lead.email ? "Enviando…" : "E-mail"}
          </button>
        </div>
      </article>
    );
  };

  return (
    <>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Remarketing</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe usuários em teste ativo e reative os que expiraram sem contratar um plano.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando leads…</p>
      ) : (
        <>
          {/* SEÇÃO A — Ainda em teste */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-500" />
              <h2 className="font-semibold">Ainda em Teste <span className="text-muted-foreground font-normal">({active.length})</span></h2>
            </div>
            {active.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nenhum usuário em período de teste no momento.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {active.map((lead) => (
                  <LeadCard key={lead.email} lead={lead} variant="active" />
                ))}
              </div>
            )}
          </section>

          {/* SEÇÃO B — Oportunidades de Venda (Expirados) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pt-2">
              <Megaphone className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Oportunidades de Venda — Expirados <span className="text-muted-foreground font-normal">({expired.length})</span></h2>
            </div>
            {expired.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nenhuma oportunidade pendente no momento.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {expired.map((lead) => (
                  <LeadCard key={lead.email} lead={lead} variant="expired" />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 pt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h2 className="font-semibold">Contatados <span className="text-muted-foreground font-normal">({contacted.length})</span></h2>
            </div>
            {contacted.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                Nenhum lead contatado ainda.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {contacted.map((lead) => (
                  <LeadCard key={lead.email} lead={lead} variant="contacted" />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}