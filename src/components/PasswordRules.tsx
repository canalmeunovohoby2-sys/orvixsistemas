import { Check, X } from "lucide-react";
import { evaluatePassword, PASSWORD_POLICY_TEXT } from "@/lib/password-policy";

/**
 * Checklist visual da política de senha. Reaproveitado em todas as telas
 * de criação/alteração de senha (Onboarding, Primeiro Acesso, Terminais…).
 *
 * `variant="dark"` casa com o Dark Premium do Onboarding (#000 / #850405).
 * `variant="default"` segue os tokens semânticos do shadcn.
 */
export function PasswordRules({
  value,
  variant = "default",
}: {
  value: string;
  variant?: "default" | "dark";
}) {
  const checks = evaluatePassword(value);

  const isDark = variant === "dark";
  const wrap = isDark
    ? "rounded-md border border-[#850405]/40 bg-[#850405]/5 p-3 mt-2"
    : "rounded-md border border-border bg-secondary/40 p-3 mt-2";
  const headTxt = isDark ? "text-[#ff5b5c]" : "text-primary";
  const labelTxt = isDark ? "text-neutral-200" : "text-foreground";

  return (
    <div className={wrap} aria-live="polite">
      <p className={`text-[11px] font-semibold uppercase tracking-wider ${headTxt} mb-2`}>
        Regras de senha
      </p>
      <p className={`text-[11px] ${isDark ? "text-neutral-400" : "text-muted-foreground"} mb-2 leading-relaxed`}>
        {PASSWORD_POLICY_TEXT}
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {checks.map((r) => (
          <li
            key={r.id}
            className={`flex items-center gap-1.5 text-[11px] ${
              r.ok
                ? "text-emerald-500"
                : isDark
                  ? "text-neutral-400"
                  : "text-muted-foreground"
            }`}
          >
            <span
              className={`w-3.5 h-3.5 grid place-items-center rounded-full shrink-0 ${
                r.ok
                  ? "bg-emerald-500/15 text-emerald-500"
                  : isDark
                    ? "bg-white/5 text-neutral-500"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {r.ok ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
            </span>
            <span className={r.ok ? "" : labelTxt}>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}