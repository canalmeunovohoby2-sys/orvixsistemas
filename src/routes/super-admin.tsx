import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import {
  PLAN_LABEL, PLAN_PRICE, STATUS_LABEL, useSaaS,
  type Plan, type SubscriptionStatus,
} from "@/lib/saas-context";
import {
  BRL, SYSTEM_LOGS, SUPPORT_TICKETS, SAAS_SETTINGS,
  updateTicketStatus, updateSaaSSettings,
  type SupportTicket, type SystemLog, type SystemLogKind,
} from "@/lib/mock-data";
import { useMockStore } from "@/hooks/use-mock-store";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Crown, Building2, TrendingUp, AlertTriangle, CheckCircle2, LayoutDashboard,
  ShieldCheck, Settings, LifeBuoy, LogIn, KeyRound, Mail, CreditCard,
  ArrowRightLeft, Database, FileWarning, UserCog, Sparkles, X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/super-admin")({
  head: () => ({
    meta: [
      { title: "Painel Master — Meu Saas" },
      { name: "description", content: "Visão global da plataforma: MRR/ARR, empresas, auditoria, suporte e configurações." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["super_admin"]}>
      <SuperAdminPage />
    </RoleGuard>
  ),
});

type TabId = "dashboard" | "empresas" | "auditoria" | "suporte" | "config";

function SuperAdminPage() {
  useMockStore();
  const { user } = useSaaS();
  const [tab, setTab] = useState<TabId>("dashboard");

  const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "Visão geral",  icon: LayoutDashboard },
    { id: "empresas",  label: "Empresas",     icon: Building2 },
    { id: "auditoria", label: "Auditoria",    icon: ShieldCheck },
    { id: "suporte",   label: "Suporte",      icon: LifeBuoy },
    { id: "config",    label: "Configurações",icon: Settings },
  ];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="h-16 flex items-center gap-3 px-4 lg:px-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 grid place-items-center text-white shadow-[0_0_20px_-4px_rgba(245,158,11,0.6)]">
            <Crown className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-bold leading-tight truncate">Painel Master da Plataforma</p>
            <p className="text-xs text-muted-foreground truncate">Acesso de plataforma · {user?.name}</p>
          </div>
          <div className="ml-auto"><ThemeToggle /></div>
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
        {tab === "config"    && <SettingsTab />}
      </main>
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

  const KPI = [
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
        <p className="text-sm text-muted-foreground">Métricas financeiras consolidadas em tempo real (mock store).</p>
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
              {(["starter", "pro", "enterprise"] as Plan[]).map((p) => {
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
  const { companies, setCompanyStatus, setCompanyPlan, setCompanyDueDate, startImpersonation, createDemoAccess } = useSaaS();
  const navigate = useNavigate();
  const [emailPreview, setEmailPreview] = useState<{ email: string; password: string; company: string } | null>(null);
  const STATUS_OPTS: SubscriptionStatus[] = ["active", "trial", "pending", "blocked", "canceled"];
  const PLAN_OPTS: Plan[] = ["starter", "pro", "enterprise"];

  return (
    <>
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gestão de empresas</h1>
          <p className="text-sm text-muted-foreground">Plano, vencimento, status e acesso de suporte (impersonação).</p>
        </div>
        <button
          onClick={() => {
            const { user, company } = createDemoAccess();
            setEmailPreview({ email: user.email, password: user.password, company: company.fantasia });
            toast.success(`Empresa ${company.fantasia} criada — e-mail de acesso disparado.`);
          }}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-sm shadow hover:bg-primary/90 transition-colors"
          title="Cria uma nova empresa cliente e simula o disparo de e-mail de boas-vindas com senha temporária"
        >
          <Sparkles className="w-4 h-4" /> Simular Nova Venda (Gerar Acesso)
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead className="bg-secondary/60 text-muted-foreground text-[11px] uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Empresa</th>
                <th className="text-left px-4 py-3">CNPJ</th>
                <th className="text-left px-4 py-3">Plano</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Vencimento</th>
                <th className="text-right px-4 py-3">MRR</th>
                <th className="text-left px-4 py-3">Suporte</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-t border-border align-middle">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{c.fantasia}</div>
                    <div className="text-xs text-muted-foreground">{c.razaoSocial}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.cnpj}</td>
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
                    <button
                      onClick={() => {
                        startImpersonation(c.id);
                        toast.success(`Modo suporte iniciado em ${c.fantasia}.`);
                        navigate({ to: "/" });
                      }}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors"
                      title="Acessar a empresa como administrador (suporte técnico)"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" /> Acessar empresa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {emailPreview && (
        <EmailPreviewModal
          email={emailPreview.email}
          password={emailPreview.password}
          company={emailPreview.company}
          onClose={() => setEmailPreview(null)}
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
          <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary grid place-items-center">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="email-preview-title" className="font-bold leading-tight">
              📧 E-mail enviado com sucesso!
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Pré-visualização da mensagem enviada para o novo cliente</p>
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
    default: return "bg-muted text-muted-foreground";
  }
}

function AuditTab() {
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
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum evento registrado para este filtro.</td></tr>
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
  return (
    <>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Central de suporte</h1>
        <p className="text-sm text-muted-foreground">Chamados abertos pelos lojistas — atualize o status conforme a tratativa.</p>
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {SUPPORT_TICKETS.map((t) => (
          <article key={t.id} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
            <header className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{t.id} · {t.companyName}</p>
                <h3 className="font-semibold leading-tight truncate">{t.subject}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${PRIO_BADGE[t.priority]}`}>
                {t.priority.toUpperCase()}
              </span>
            </header>
            <p className="text-sm text-muted-foreground line-clamp-3">{t.message}</p>
            <footer className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-border text-xs">
              <div className="text-muted-foreground">
                <p>{t.requester}</p>
                <p className="tabular-nums">{new Date(t.openedAt).toLocaleString("pt-BR")}</p>
              </div>
              <select
                defaultValue={t.status}
                onChange={(e) => {
                  updateTicketStatus(t.id, e.target.value as SupportTicket["status"]);
                  toast.success(`${t.id}: ${STATUS_TICKET_LABEL[e.target.value as SupportTicket["status"]]}.`);
                }}
                aria-label={`Status do chamado ${t.id}`}
                className="h-8 px-2 rounded-md bg-secondary border border-border text-xs"
              >
                {(["aberto", "em_andamento", "resolvido"] as SupportTicket["status"][]).map((s) => (
                  <option key={s} value={s}>{STATUS_TICKET_LABEL[s]}</option>
                ))}
              </select>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}

/* ─────────────────────── Configurações tab ─────────────────────── */

function SettingsTab() {
  const [form, setForm] = useState({ ...SAAS_SETTINGS });

  const save = () => {
    updateSaaSSettings(form);
    toast.success("Configurações globais atualizadas.");
  };

  return (
    <>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Configurações globais</h1>
        <p className="text-sm text-muted-foreground">Trial, limites por plano, SMTP e gateway de pagamento.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-semibold inline-flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> Plataforma</h2>
          <Field label="Tempo de trial (dias)">
            <input
              type="number" min={1} max={90}
              value={form.trialDays}
              onChange={(e) => setForm((f) => ({ ...f, trialDays: Number(e.target.value) || 0 }))}
              className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-sm"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            {(["starter", "pro", "enterprise"] as Plan[]).map((p) => (
              <Field key={p} label={`Limite ${PLAN_LABEL[p]} (usuários)`}>
                <input
                  type="number" min={1}
                  value={form.usersLimit[p]}
                  onChange={(e) => setForm((f) => ({ ...f, usersLimit: { ...f.usersLimit, [p]: Number(e.target.value) || 1 } }))}
                  className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-sm tabular-nums"
                />
              </Field>
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
                <option>Stripe</option><option>Pagar.me</option><option>Mercado Pago</option>
              </select>
            </Field>
            <Field label="Chave pública">
              <input value={form.paymentPublicKey} onChange={(e) => setForm((f) => ({ ...f, paymentPublicKey: e.target.value }))}
                className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-sm font-mono" />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">As credenciais privadas (secret keys) ficam apenas no servidor — nunca exibidas no painel.</p>
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