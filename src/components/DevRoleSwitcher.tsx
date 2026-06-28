import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSaaS, SAAS_USERS, ROLE_LABEL } from "@/lib/saas-context";
import { ChevronDown, FlaskConical, LogOut } from "lucide-react";

/**
 * Barra superior discreta para alternar entre perfis durante testes.
 * Aparece apenas se houver sessão; some na tela de login.
 */
export function DevRoleSwitcher() {
  const { user, company, loginAs, logout } = useSaaS();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const handle = (id: string) => {
    const u = SAAS_USERS.find((x) => x.id === id);
    if (!u) return;
    loginAs(id);
    setOpen(false);
    if (u.role === "cashier") navigate({ to: "/vendas" });
    else if (u.role === "super_admin") navigate({ to: "/super-admin" });
    else navigate({ to: "/" });
  };

  return (
    <div className="sticky top-0 z-[60] w-full bg-amber-500/95 text-black border-b border-amber-700/40 backdrop-blur-sm">
      <div className="px-3 lg:px-6 h-9 flex items-center gap-3 text-xs">
        <FlaskConical className="w-3.5 h-3.5 shrink-0" />
        <span className="font-semibold tracking-wide">MODO DEMO</span>
        <span className="hidden sm:inline opacity-80">·</span>
        <span className="hidden sm:inline truncate">
          {user.name} <span className="opacity-70">({ROLE_LABEL[user.role]}{company ? ` · ${company.fantasia}` : ""})</span>
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-black/15 hover:bg-black/25 font-medium"
            >
              Alternar perfil <ChevronDown className="w-3 h-3" />
            </button>
            {open && (
              <div className="absolute right-0 mt-1 w-72 rounded-md border border-border bg-popover text-popover-foreground shadow-lg p-1 z-50">
                {SAAS_USERS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handle(u.id)}
                    className={`w-full text-left px-3 py-2 rounded-sm text-xs hover:bg-accent ${user.id === u.id ? "bg-accent" : ""}`}
                  >
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-[10px] opacity-70">{ROLE_LABEL[u.role]} · {u.email}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { logout(); navigate({ to: "/login" }); }}
            className="p-1 rounded hover:bg-black/20"
            title="Sair"
            aria-label="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
