import { useState } from "react";
import { Copy, Check, KeyRound, X } from "lucide-react";

export function CredentialsModal({
  title = "Credenciais criadas com sucesso!",
  subtitle,
  email,
  password,
  onClose,
}: {
  title?: string;
  subtitle?: string;
  email: string;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = `Login: ${email}\nSenha: ${password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cred-modal-title"
      className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 pt-6 pb-4 border-b border-border flex items-start gap-3">
          <div className="w-10 h-10 grid place-items-center rounded-full bg-primary/15 text-primary">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 id="cred-modal-title" className="font-bold leading-tight">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="px-6 py-5 space-y-3">
          <div className="rounded-md border border-primary/30 bg-primary/5 p-4 font-mono text-sm space-y-2 select-all">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Login</p>
              <p className="font-semibold break-all">{email}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Senha</p>
              <p className="font-semibold break-all">{password}</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Anote ou copie agora. Estas credenciais já estão gravadas no banco e funcionam imediatamente na tela de login.
          </p>
        </div>
        <footer className="px-6 pb-6 flex items-center justify-end gap-2">
          <button
            onClick={copy}
            className="h-10 px-4 inline-flex items-center gap-2 rounded-md border border-border bg-secondary text-sm font-semibold hover:bg-accent transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado!" : "Copiar Credenciais"}
          </button>
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