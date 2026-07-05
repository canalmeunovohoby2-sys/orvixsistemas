import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useSaaS } from "@/lib/saas-context";
import { useMockStore } from "@/hooks/use-mock-store";
import {
  BRL, getCompanyFinancialRecords, markFinancialPaid, markFinancialPending, addFinancialRecord,
  type FinancialRecord, type FinancialType, type FinancialStatus,
} from "@/lib/mock-data";
import {
  ArrowDownCircle, ArrowUpCircle, CheckCircle2, RotateCcw, Wallet, AlertTriangle, CalendarClock, Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Meu Saas" },
      { name: "description", content: "Contas a pagar e a receber, fluxo de caixa do mês e baixa de pagamentos." },
      { property: "og:title", content: "Financeiro — Meu Saas" },
      { property: "og:description", content: "Controle de contas a pagar/receber e fluxo de caixa." },
      { property: "og:url", content: "/financeiro" },
    ],
    links: [{ rel: "canonical", href: "/financeiro" }],
  }),
  component: () => (<RoleGuard allow={["admin"]}><FinanceiroPage /></RoleGuard>),
});

const STATUS_BADGE: Record<FinancialStatus, string> = {
  PAGO: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  PENDENTE: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  ATRASADO: "bg-primary/15 text-primary border-primary/40",
};

function FinanceiroPage() {
  useMockStore();
  const { user } = useSaaS();
  const cid = user?.companyId ?? null;
  const all = getCompanyFinancialRecords(cid);

  const [tab, setTab] = useState<"all" | FinancialType>("all");
  const [status, setStatus] = useState<"all" | FinancialStatus>("all");

  // Mês corrente como recorte default
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const inMonth = (iso: string) => iso.startsWith(monthKey);

  const rows = useMemo(() => {
    return all
      .filter((r) => (tab === "all" ? true : r.type === tab))
      .filter((r) => (status === "all" ? true : r.status === status))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [all, tab, status]);

  // KPIs do mês corrente
  const monthRecs = all.filter((r) => inMonth(r.dueDate));
  const totalReceber = monthRecs.filter((r) => r.type === "RECEBER").reduce((a, r) => a + r.amount, 0);
  const totalPagar = monthRecs.filter((r) => r.type === "PAGAR").reduce((a, r) => a + r.amount, 0);
  const saldo = totalReceber - totalPagar;
  const overdueCount = all.filter((r) => r.status === "ATRASADO").length;

  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState<{ type: FinancialType; description: string; amount: string; dueDate: string }>({
    type: "PAGAR",
    description: "",
    amount: "",
    dueDate: new Date().toISOString().slice(0, 10),
  });

  function resetForm() {
    setForm({ type: "PAGAR", description: "", amount: "", dueDate: new Date().toISOString().slice(0, 10) });
  }

  function handleSave() {
    const desc = form.description.trim();
    const amt = parseFloat(form.amount.replace(",", "."));
    if (!desc) { toast.error("Informe a descrição."); return; }
    if (!isFinite(amt) || amt <= 0) { toast.error("Informe um valor válido."); return; }
    if (!form.dueDate) { toast.error("Informe o vencimento."); return; }
    addFinancialRecord({
      company_id: cid,
      type: form.type,
      description: desc,
      amount: +amt.toFixed(2),
      dueDate: new Date(form.dueDate + "T12:00:00").toISOString(),
    });
    toast.success("Lançamento adicionado.");
    setOpenAdd(false);
    resetForm();
  }

  return (
    <AppShell title="Financeiro" breadcrumb={["Meu Saas", "Financeiro"]}>
      <div className="flex items-center justify-end mb-4">
        <Button onClick={() => setOpenAdd(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Adicionar Lançamento
        </Button>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KPI label="A Receber (mês)" value={BRL(totalReceber)} icon={ArrowDownCircle} tone="success" />
        <KPI label="A Pagar (mês)" value={BRL(totalPagar)} icon={ArrowUpCircle} tone="warn" />
        <KPI label="Saldo previsto" value={BRL(saldo)} icon={Wallet} tone={saldo >= 0 ? "success" : "danger"} />
        <KPI label="Vencidos" value={String(overdueCount)} icon={AlertTriangle} tone={overdueCount > 0 ? "danger" : "muted"} />
      </section>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex rounded-md border border-border bg-card overflow-hidden text-xs">
          {([
            ["all", "Todos"],
            ["RECEBER", "A Receber"],
            ["PAGAR", "A Pagar"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3 h-8 font-semibold ${tab === k ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | FinancialStatus)}
          className="h-8 px-2 rounded-md bg-secondary border border-border text-xs"
          aria-label="Filtrar por status"
        >
          <option value="all">Todos os status</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="ATRASADO">Atrasados</option>
          <option value="PAGO">Pagos</option>
        </select>
        <span className="text-xs text-muted-foreground ml-auto">
          {rows.length} lançamento(s) · referência {now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
        </span>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Tipo</th>
              <th className="text-left px-4 py-3">Descrição</th>
              <th className="text-left px-4 py-3">Vencimento</th>
              <th className="text-left px-4 py-3">Pago em</th>
              <th className="text-right px-4 py-3">Valor</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum lançamento encontrado para este filtro.</td></tr>
            )}
            {rows.map((r) => (
              <FinRow key={r.id} r={r} />
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={openAdd} onOpenChange={(o) => { setOpenAdd(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Lançamento</DialogTitle>
            <DialogDescription>Inclua uma nova conta a pagar ou a receber.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <div className="inline-flex rounded-md border border-border bg-card overflow-hidden text-xs w-fit">
                {([["PAGAR", "A Pagar"], ["RECEBER", "A Receber"]] as const).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: k }))}
                    className={`px-3 h-8 font-semibold ${form.type === k ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fin-desc">Descrição</Label>
              <Input id="fin-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Ex.: Aluguel, fornecedor X..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="fin-amount">Valor (R$)</Label>
                <Input id="fin-amount" type="number" inputMode="decimal" step="0.01" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0,00" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fin-due">Vencimento</Label>
                <Input id="fin-due" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpenAdd(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function FinRow({ r }: { r: FinancialRecord }) {
  const isReceber = r.type === "RECEBER";
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isReceber ? "text-emerald-600 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
          {isReceber ? <ArrowDownCircle className="w-3.5 h-3.5" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
          {isReceber ? "Receber" : "Pagar"}
        </span>
      </td>
      <td className="px-4 py-3 min-w-[260px]">
        <p className="font-medium truncate">{r.description}</p>
        {r.saleRef && <p className="text-[11px] font-mono text-muted-foreground">Ref. {r.saleRef}</p>}
      </td>
      <td className="px-4 py-3 text-muted-foreground tabular-nums">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" />
          {new Date(r.dueDate).toLocaleDateString("pt-BR")}
        </span>
      </td>
      <td className="px-4 py-3 text-muted-foreground tabular-nums">
        {r.paidDate ? new Date(r.paidDate).toLocaleDateString("pt-BR") : "—"}
      </td>
      <td className={`px-4 py-3 text-right tabular-nums font-bold ${isReceber ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
        {BRL(r.amount)}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${STATUS_BADGE[r.status]}`}>
          {r.status}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {r.status === "PAGO" ? (
          <button
            onClick={() => { if (markFinancialPending(r.id)) toast.info("Lançamento reaberto."); }}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md border border-border bg-secondary hover:bg-accent text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reabrir
          </button>
        ) : (
          <button
            onClick={() => { if (markFinancialPaid(r.id)) toast.success("Baixa registrada — lançamento pago."); }}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Dar baixa
          </button>
        )}
      </td>
    </tr>
  );
}

function KPI({
  label, value, icon: Icon, tone,
}: {
  label: string; value: string; icon: typeof Wallet;
  tone: "success" | "warn" | "danger" | "muted";
}) {
  const toneCls =
    tone === "success" ? "text-emerald-600 dark:text-emerald-400"
    : tone === "warn"  ? "text-amber-700 dark:text-amber-400"
    : tone === "danger"? "text-primary"
    : "text-muted-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground text-xs uppercase tracking-wide">
        <span>{label}</span>
        <Icon className={`w-4 h-4 ${toneCls}`} />
      </div>
      <p className={`text-2xl font-bold mt-2 tabular-nums ${toneCls}`}>{value}</p>
    </div>
  );
}