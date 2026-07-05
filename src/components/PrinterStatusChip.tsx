import { useState } from "react";
import { Printer, AlertTriangle } from "lucide-react";
import { useQzTray } from "@/hooks/useQzTray";
import { PrinterSetupDialog } from "@/components/PrinterSetupDialog";
import { getSelectedPrinter } from "@/lib/qz-tray";

/**
 * "Semáforo" de impressão exibido no cabeçalho do PDV.
 * - Verde: QZ Tray conectado e impressora escolhida.
 * - Âmbar: driver conectado, mas nenhuma impressora selecionada.
 * - Cinza: driver não detectado (clique abre o modal de download/config).
 */
export function PrinterStatusChip({ cid }: { cid: string | null | undefined }) {
  const status = useQzTray(true);
  const [open, setOpen] = useState(false);
  const printer = getSelectedPrinter(cid);

  const state: "on" | "warn" | "off" =
    status === "connected" && printer ? "on"
    : status === "connected" ? "warn"
    : "off";

  const meta = {
    on:   { dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]", label: "Impressora pronta", sub: printer ?? "" },
    warn: { dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",   label: "Selecione a impressora", sub: "QZ Tray ativo" },
    off:  { dot: "bg-muted-foreground/60",                                label: "Impressão manual", sub: "QZ Tray não detectado" },
  }[state];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`${meta.label}${meta.sub ? " — " + meta.sub : ""}`}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-card hover:bg-accent transition-colors text-xs"
      >
        <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
        <Printer className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-semibold text-foreground">{meta.label}</span>
      </button>
      <PrinterSetupDialog open={open} onOpenChange={setOpen} cid={cid} />
    </>
  );
}

/**
 * Banner de pendência exibido na tela do caixa quando o QZ Tray
 * não está detectado — recomenda o download do driver oficial.
 */
export function PrinterAutoPrintBanner({ cid }: { cid: string | null | undefined }) {
  const status = useQzTray(true);
  const [open, setOpen] = useState(false);
  const printer = getSelectedPrinter(cid);
  if (status === "connected" && printer) return null;

  const missingDriver = status !== "connected";
  return (
    <>
      <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex items-start gap-3 text-sm">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">
            {missingDriver
              ? "⚠️ O sistema de impressão automática não está ativo."
              : "Impressão automática pendente — nenhuma impressora selecionada."}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {missingDriver
              ? "Baixe e instale o driver QZ Tray para habilitar a impressão sem cliques."
              : "Selecione qual impressora receberá os cupons desta bobina."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-9 px-3 rounded-md bg-amber-600 text-white text-xs font-semibold hover:bg-amber-500 inline-flex items-center gap-1.5 shrink-0"
        >
          <Printer className="w-3.5 h-3.5" /> {missingDriver ? "Baixar driver" : "Configurar"}
        </button>
      </div>
      <PrinterSetupDialog open={open} onOpenChange={setOpen} cid={cid} />
    </>
  );
}