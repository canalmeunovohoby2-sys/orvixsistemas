import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Printer, RefreshCw, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  QZ_DOWNLOAD_URL, connectQz, listPrinters, getSelectedPrinter, setSelectedPrinter, getDefaultPrinter,
} from "@/lib/qz-tray";
import { useQzTray } from "@/hooks/useQzTray";

/**
 * Modal reutilizável de configuração de impressora térmica via QZ Tray.
 * Aparece no painel do dono (Configurações → Impressoras) e no aviso do caixa.
 */
export function PrinterSetupDialog({
  open, onOpenChange, cid,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  cid: string | null | undefined;
}) {
  const status = useQzTray(open);
  const [printers, setPrinters] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(getSelectedPrinter(cid) ?? "");
  }, [open, cid]);

  const refresh = async () => {
    setBusy(true);
    const ok = await connectQz();
    if (!ok) {
      setBusy(false);
      toast.error("QZ Tray não detectado. Instale o driver e mantenha-o aberto.");
      return;
    }
    const list = await listPrinters();
    setPrinters(list);
    if (!selected) {
      const def = await getDefaultPrinter();
      if (def) setSelected(def);
    }
    setBusy(false);
  };

  useEffect(() => { if (open && status === "connected") void refresh(); /* eslint-disable-line */ }, [open, status]);

  const save = () => {
    if (!selected) { toast.error("Selecione a impressora de cupom."); return; }
    setSelectedPrinter(cid, selected);
    toast.success(`Impressora salva: ${selected}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-primary" />
            Configurar Impressora do Caixa
          </DialogTitle>
          <DialogDescription>
            Habilite a impressão automática (sem pop-up do navegador) usando o driver QZ Tray.
          </DialogDescription>
        </DialogHeader>

        {/* Passo 1 — Download */}
        <section className="rounded-lg border border-border bg-secondary/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Passo 1 — Instalar o driver
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            Baixe o QZ Tray, instale em seu computador e reinicie o PDV. Após instalado, o programa fica rodando na
            bandeja do sistema (ícone ao lado do relógio) e comunica-se com este PDV pela rede local.
          </p>
          <a
            href={QZ_DOWNLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
          >
            <Download className="w-4 h-4" /> Baixar QZ Tray (Windows)
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </section>

        {/* Passo 2 — Detecção */}
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Passo 2 — Escolher impressora
            </p>
            <StatusPill status={status} />
          </div>

          {status !== "connected" ? (
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                O sistema não detectou o QZ Tray rodando. Instale o driver do Passo 1, abra-o e clique em
                <strong className="text-foreground"> Detectar agora</strong>.
              </p>
              <button
                type="button"
                onClick={refresh}
                disabled={busy}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border hover:bg-accent text-sm font-medium disabled:opacity-60"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Detectar agora
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
              >
                <option value="">Selecione uma impressora…</option>
                {printers.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
              <button
                type="button"
                onClick={refresh}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Atualizar lista
              </button>
            </div>
          )}
        </section>

        <DialogFooter className="gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 rounded-md border border-border text-sm font-medium hover:bg-accent"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={save}
            disabled={status !== "connected" || !selected}
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Salvar preferência
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    idle:        { cls: "bg-secondary text-muted-foreground border-border", label: "Aguardando", icon: <Loader2 className="w-3 h-3" /> },
    connecting:  { cls: "bg-amber-500/10 text-amber-600 border-amber-500/40", label: "Conectando…", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    connected:   { cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/40", label: "Driver ativo", icon: <CheckCircle2 className="w-3 h-3" /> },
    unavailable: { cls: "bg-destructive/10 text-destructive border-destructive/40", label: "Não detectado", icon: <XCircle className="w-3 h-3" /> },
  };
  const s = map[status] ?? map.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-full border text-[11px] font-semibold ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}