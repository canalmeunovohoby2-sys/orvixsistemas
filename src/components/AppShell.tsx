import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Warehouse, Truck, BarChart3,
  Search, ChevronLeft, ChevronRight, Menu, X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HelpCenter } from "@/components/HelpCenter";

type NavItem = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  children?: { label: string; to: string }[];
};

const NAV: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Produtos", to: "/produtos", icon: Package },
  { label: "Vendas", to: "/vendas", icon: ShoppingCart },
  { label: "Estoque", to: "/estoque", icon: Warehouse },
  { label: "Fornecedores", to: "/fornecedores", icon: Truck },
  { label: "Relatórios", to: "/relatorios", icon: BarChart3 },
];

function useStored<T extends string>(key: string, fallback: T): [T, (v: T) => void] {
  const [v, setV] = useState<T>(fallback);
  useEffect(() => {
    try { const s = localStorage.getItem(key); if (s) setV(s as T); } catch {}
  }, [key]);
  const set = (next: T) => {
    setV(next);
    try { localStorage.setItem(key, next); } catch {}
  };
  return [v, set];
}

export function AppShell({ children, title, breadcrumb }: { children: React.ReactNode; title: string; breadcrumb?: string[] }) {
  const [collapsed, setCollapsed] = useStored<"0" | "1">("meusaas_sidebar", "0");
  const [mobileOpen, setMobileOpen] = useState(false);
  const isCollapsed = collapsed === "1";

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 76 : 252 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed lg:sticky top-0 left-0 z-50 h-dvh lg:h-screen bg-sidebar border-r border-sidebar-border flex flex-col ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border shrink-0">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8B0000] to-[#5A0000] grid place-items-center shrink-0 shadow-[0_0_20px_-4px_rgba(139,0,0,0.6)]">
              <span className="text-white font-extrabold text-lg leading-none">M</span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="font-bold text-sidebar-foreground leading-tight truncate">Meu Saas</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">ERP B2B</p>
              </div>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Navegação principal">
          {NAV.map((item) => (
            <NavLink key={item.to + item.label} item={item} active={pathname === item.to} collapsed={isCollapsed} pathname={pathname} />
          ))}
        </nav>

        {/* Footer of sidebar */}
        <div className="border-t border-sidebar-border p-2 space-y-1 shrink-0">
          <button
            onClick={() => setCollapsed(isCollapsed ? "0" : "1")}
            aria-label={isCollapsed ? "Expandir menu" : "Colapsar menu"}
            className="hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4 shrink-0" /> : <ChevronLeft className="w-4 h-4 shrink-0" />}
            {!isCollapsed && <span>Colapsar</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/85 backdrop-blur-xl flex items-center gap-3 px-4 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-accent"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Buscar produtos, vendas..."
                aria-label="Busca global"
                className="w-full h-10 pl-10 pr-3 rounded-md bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 transition"
              />
            </div>
          </div>
          <div className="flex-1 md:hidden" />

          <HelpCenter />
          <ThemeToggle />

          <div className="flex items-center gap-3 pl-3 ml-1 border-l border-border">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-[#5A0000] grid place-items-center text-white font-bold text-sm">
              RC
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-semibold leading-tight truncate">Ricardo Cunha</p>
              <p className="text-xs text-muted-foreground truncate">Administrador</p>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-4 lg:p-6 animate-page-enter">
          <div className="mb-6">
            {breadcrumb && breadcrumb.length > 0 && (
              <nav aria-label="breadcrumb" className="text-xs text-muted-foreground mb-2">
                {breadcrumb.map((b, i) => (
                  <span key={i}>
                    {i > 0 && <span className="mx-1.5">/</span>}
                    {b}
                  </span>
                ))}
              </nav>
            )}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
          </div>
          {children}
        </main>

        <footer className="border-t border-border px-4 lg:px-6 py-6 text-sm text-muted-foreground">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <p>© 2026 Meu Saas. Todos os direitos reservados.</p>
            <nav aria-label="Rodapé" className="flex flex-wrap gap-x-5 gap-y-2">
              <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Contato</a>
              <a href="#" className="hover:text-foreground transition-colors">Sobre Nós</a>
            </nav>
          </div>
        </footer>
      </div>

      {/* Mobile close */}
      {mobileOpen && (
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
          className="fixed top-3 left-3 z-[60] lg:hidden w-10 h-10 rounded-md bg-card border border-border grid place-items-center"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

function NavLink({ item, active, collapsed, pathname }: { item: NavItem; active: boolean; collapsed: boolean; pathname: string }) {
  const hasChildren = !!item.children?.length;
  const [open, setOpen] = useState(active);
  useEffect(() => { if (active) setOpen(true); }, [active]);
  const Icon = item.icon;

  if (collapsed || !hasChildren) {
    return (
      <Link
        to={item.to}
        className={`group relative flex items-center gap-3 px-3 py-2.5 mx-1 my-0.5 rounded-md text-sm font-medium transition-colors ${
          active
            ? "bg-primary/15 text-primary"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        }`}
        aria-current={active ? "page" : undefined}
        title={collapsed ? item.label : undefined}
      >
        {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-primary" />}
        <Icon className="w-[18px] h-[18px] shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 mx-1 my-0.5 rounded-md text-sm font-medium transition-colors ${
          active ? "bg-primary/15 text-primary" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        }`}
        aria-expanded={open}
      >
        {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-primary" />}
        <Icon className="w-[18px] h-[18px] shrink-0" />
        <span className="flex-1 text-left truncate">{item.label}</span>
        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="ml-9 mr-2 my-1 border-l border-sidebar-border pl-3 space-y-0.5">
              {item.children!.map((c, i) => (
                <Link
                  key={i}
                  to={c.to}
                  className={`block px-2 py-1.5 rounded text-[13px] transition-colors ${
                    pathname === c.to ? "text-primary" : "text-muted-foreground hover:text-sidebar-foreground"
                  }`}
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

