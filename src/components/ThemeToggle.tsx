import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "meusaas_theme";
type Theme = "light" | "dark";

function getInitial(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitial());
    setMounted(true);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.add("theme-transitioning");
    root.classList.toggle("dark", next === "dark");
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    setTheme(next);
    window.setTimeout(() => root.classList.remove("theme-transitioning"), 550);
  };

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={isDark ? "Modo claro" : "Modo escuro"}
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-md border border-border bg-secondary text-foreground hover:border-primary/60 hover:text-primary hover:shadow-[0_0_20px_-6px_var(--color-primary)] transition-all overflow-hidden ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {mounted && (
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {isDark ? <Moon className="w-[18px] h-[18px]" strokeWidth={2} /> : <Sun className="w-[18px] h-[18px]" strokeWidth={2} />}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}