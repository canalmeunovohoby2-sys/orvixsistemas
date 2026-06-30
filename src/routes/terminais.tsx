import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  MonitorSmartphone, Plus, Trash2, Lock, Mail, User as UserIcon, ShieldCheck, Eye, EyeOff, Crown, Pencil, X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";
import { useSaaS, PLAN_LABEL } from "@/lib/saas-context";
import { PasswordRules } from "@/components/PasswordRules";
import { isStrongPassword } from "@/lib/password-policy";
import { CredentialsModal } from "@/components/CredentialsModal";

export const Route = createFileRoute("/terminais")({
  head: () => ({
    meta: [
      { title: "Terminais / Caixas — ORVIX SISTEMAS" },
      { name: "description", content: "Cadastre os operadores de caixa (PDV) da sua loja conforme o limite do seu plano." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["admin"]}>
      <TerminaisPage />
    </RoleGuard>
  ),
});

function TerminaisPage() {
  const { company, users, canAddCashier, createCashier, deleteCashier, renameCashier } = useSaaS();
  const cid = company?.id ?? null;

  const cashiers = useMemo(
    () => users.filter((u) => u.companyId === cid && u.role === "cashier"),
    [users, cid],
  );

  const guard = cid ? canAddCashier(cid) : { ok: false, reason: "Empresa não encontrada.", limit: 0, current: 0 };
  const limit = guard.limit;
  const current = cashiers.length;
  const blocked = !guard.ok;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [credModal, setCredModal] = useState<{ email: string; password: string; name: string } | null>(null);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; email: string } | null>(null);
  const [editName, setEditName] = useState("");
  const [editBusy, setEditBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cid || busy) return;
    setBusy(true);
    const res = await createCashier(cid, { name, email, password });
    setBusy(false);
    if (!res.ok) { toast.error(res.reason ?? "Não foi possível criar o operador."); return; }
    toast.success(`✅ Terminal criado — ${res.user!.name}`);
    setCredModal({ email: res.user!.email, password: res.password ?? password, name: res.user!.name });
    setName(""); setEmail(""); setPassword("");
  };

  const remove = async (userId: string, label: string) => {
    if (!confirm(`Remover o terminal "${label}"? Esta ação não poderá ser desfeita.`)) return;
    const res = await deleteCashier(userId);
    if (!res.ok) { toast.error(res.reason ?? "Não foi possível remover."); return; }
    toast.success("Terminal removido.");
  };

  const openEdit = (id: string, name: string, email: string) => {
    setEditTarget({ id, name, email });
    setEditName(name);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || editBusy) return;
    setEditBusy(true);
    const res = await renameCashier(editTarget.id, editName);
    setEditBusy(false);
    if (!res.ok) { toast.error(res.reason ?? "Não foi possível salvar."); return; }
    toast.success("Terminal atualizado.");
    setEditTarget(null);
  };

  return (
    <AppShell title="Terminais / Caixas" breadcrumb={["ORVIX SISTEMAS", "Terminais"]}>
      <header className="mb-6 flex items-start gap-4">
        <div className="w-12 h-12 grid place-items-center rounded-xl bg-primary/10 border border-primary/30 text-primary">
          <MonitorSmartphone className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar Caixas / Terminais</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre os operadores de PDV da sua loja. Cada operador recebe credenciais exclusivas para abrir o Caixa.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end text-right">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Plano atual</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Crown className="w-4 h-4 text-primary" />
            {company ? PLAN_LABEL[company.plan] : "—"}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">
            <strong className={blocked ? "text-primary" : "text-foreground"}>{current}</strong> / {limit} terminais
          </span>
        </div>
      </header>

      {blocked && (
        <div className="mb-6 rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm flex items-start gap-3">
          <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">Limite de terminais atingido</p>
            <p className="text-muted-foreground mt-1">{guard.reason}</p>
          </div>
        </div>
      )}

      <section className="grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Lista de terminais */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Terminais cadastrados</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Operadores autorizados a operar o PDV.</p>
            </div>
            <span className="text-xs font-semibold tabular-nums px-2.5 py-1 rounded-md bg-secondary border border-border">
              {current} / {limit}
            </span>
          </div>

          {cashiers.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              Nenhum operador de caixa cadastrado ainda. Use o formulário ao lado para criar o primeiro.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2.5 text-left font-semibold">Operador</th>
                  <th className="px-5 py-2.5 text-left font-semibold">E-mail / Usuário</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {cashiers.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-[#5A0000] grid place-items-center text-white text-xs font-bold">
                          {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{c.name}</p>
                          <p className="text-[11px] text-muted-foreground">PDV · Operador de Caixa</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.email}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c.id, c.name, c.email)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-secondary/40 text-xs text-foreground hover:bg-accent transition-colors"
                          aria-label={`Editar ${c.name}`}
                        >
                          <Pencil className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
                          onClick={() => remove(c.id, c.name)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-secondary/40 text-xs text-destructive hover:bg-destructive/10 hover:border-destructive/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Formulário de criação */}
        <form
          onSubmit={submit}
          className={`rounded-xl border bg-card p-5 self-start ${blocked ? "border-border opacity-70" : "border-border"}`}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Novo terminal
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            As credenciais serão usadas no login do PDV (modo Caixa).
          </p>

          <div className="space-y-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Nome do operador</span>
              <div className="relative mt-1">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  required disabled={blocked}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex.: João da Silva"
                  className={inputCls}
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">E-mail / Usuário</span>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  required disabled={blocked}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@minhaloja.com.br"
                  className={inputCls}
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Senha do caixa</span>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  required disabled={blocked}
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Crie uma senha forte"
                  className={`${inputCls} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordRules value={password} />
            </label>
          </div>

          <button
            type="submit"
            disabled={blocked || busy || !isStrongPassword(password) || !name.trim() || !email.trim()}
            className="mt-5 w-full h-11 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            <Plus className="w-4 h-4" /> Criar terminal
          </button>

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Permissão restrita ao PDV — operadores não acessam o painel administrativo.
          </p>
        </form>
      </section>
      {credModal && (
        <CredentialsModal
          title="Terminal criado com sucesso!"
          subtitle={`Use estas credenciais no login do PDV (${credModal.name})`}
          email={credModal.email}
          password={credModal.password}
          onClose={() => setCredModal(null)}
        />
      )}
      {editTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-term-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => !editBusy && setEditTarget(null)}
        >
          <form
            onSubmit={saveEdit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
          >
            <header className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 id="edit-term-title" className="text-lg font-bold tracking-tight">Editar terminal</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Atualize o nome do operador. O e-mail e a senha não mudam.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !editBusy && setEditTarget(null)}
                className="p-1 rounded-md text-muted-foreground hover:bg-accent"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Nome do operador</span>
              <div className="relative mt-1">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={inputCls}
                />
              </div>
            </label>

            <p className="mt-3 text-[11px] text-muted-foreground">
              E-mail vinculado: <span className="font-mono text-foreground">{editTarget.email}</span>
            </p>

            <footer className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                disabled={editBusy}
                className="h-10 px-4 rounded-md border border-border bg-secondary/40 text-sm font-medium hover:bg-accent disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editBusy || editName.trim().length < 2 || editName.trim() === editTarget.name}
                className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {editBusy ? "Salvando…" : "Salvar alterações"}
              </button>
            </footer>
          </form>
        </div>
      )}
    </AppShell>
  );
}

const inputCls =
  "w-full h-10 pl-9 pr-3 rounded-md bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";