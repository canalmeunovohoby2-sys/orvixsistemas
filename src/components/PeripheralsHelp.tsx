import { useState } from "react";
import { HelpCircle, Printer, ScanLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Botão discreto que abre um modal informativo com orientações
 * sobre uso de periféricos (impressora térmica e leitor de código
 * de barras). Apenas informativo — não altera nenhuma lógica do PDV.
 */
export function PeripheralsHelp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ajuda sobre periféricos"
        title="Assistente de Periféricos"
        className="h-10 w-10 grid place-items-center rounded-md border border-border bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Assistente de Periféricos
            </DialogTitle>
            <DialogDescription>
              Guia rápido para configurar o hardware do PDV.
            </DialogDescription>
          </DialogHeader>

          <section className="rounded-md border border-border bg-secondary/40 p-4 space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Printer className="w-4 h-4 text-primary" /> Impressora
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Impressora Térmica (80mm):</strong>{" "}
              Certifique-se de que esteja como impressora padrão no Windows.
              Modelos recomendados: <strong>Elgin i9</strong>, <strong>Bematech MP-4200</strong>.
            </p>
          </section>

          <section className="rounded-md border border-border bg-secondary/40 p-4 space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ScanLine className="w-4 h-4 text-primary" /> Leitor de Código de Barras
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Leitor USB:</strong> Conecte via USB.
              O leitor deve estar configurado em modo{" "}
              <strong>&quot;Emulação de Teclado&quot; (HID)</strong>. Basta plugar e,
              ao ler qualquer código, ele aparecerá automaticamente no campo de busca.
            </p>
          </section>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Entendido
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}