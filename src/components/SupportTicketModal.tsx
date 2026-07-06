import { useState } from "react";
import { createPortal } from "react-dom";
import { LifeBuoy, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSaaS } from "@/lib/saas-context";

type Priority = "baixa" | "media" | "alta";

export function SupportTicketModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, company } = useSaaS();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [saving, setSaving] = useState(false);

  if (!open || typeof document === "undefined") return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !company) {
      toast.error("Sessão inválida. Faça login novamente.");
      return;
    }
    const s = subject.trim();
    const m = message.trim();
    if (s.length < 3) return toast.error("Descreva um assunto para o chamado.");
    if (m.length < 5) return toast.error("Descreva melhor o problema ou dúvida.");
    setSaving(true);
    const { error } = await supabase.from("support_tickets").insert({
      company_id: company.id,
      company_name: company.fantasia,
      user_id: user.id,
      requester_name: user.name,
      subject: s.slice(0, 140),
      message: m.slice(0, 4000),
      priority,
    });
    setSaving(false);
    if (error) {
      console.error("[support_tickets:insert]", error);
      toast.error(`Não foi possível enviar o chamado: ${error.message}`);
      return;
    }
    toast.success("Requisição enviada! Nossa equipe responderá em breve.");
    setSubject(""); setMessage(""); setPriority("media");
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-title"
      className="fixed inset-0 z-[100] grid place-items-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-xl p-5 md:p-6"
      >
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary grid place-items-center">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h2 id="support-title" className="text-lg font-bold leading-tight">Abrir requisição de suporte</h2>
              <p className="text-xs text-muted-foreground">Descreva seu problema. Retornaremos o mais rápido possível.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar"
            className="w-8 h-8 grid place-items-center rounded-md border border-border hover:bg-secondary">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Assunto</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={140}
              placeholder="Ex.: Erro ao emitir cupom fiscal"
              className="mt-1 w-full h-11 px-3 rounded-md bg-secondary border border-border text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Descrição</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={4000}
              rows={5}
              placeholder="Conte o que aconteceu, quando começou e o que já tentou."
              className="mt-1 w-full px-3 py-2 rounded-md bg-secondary border border-border text-sm resize-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">Prioridade</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="mt-1 w-full h-11 px-3 rounded-md bg-secondary border border-border text-sm"
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </label>
        </div>

        <footer className="mt-5 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose}
            className="h-11 px-4 rounded-md border border-border text-sm font-semibold hover:bg-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            className="h-11 px-5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Enviar requisição
          </button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}