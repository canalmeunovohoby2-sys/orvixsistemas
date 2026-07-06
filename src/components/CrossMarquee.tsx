import { motion } from "framer-motion";

const ADVANTAGES: readonly string[] = [
  "PDV de Alta Performance",
  "Impressão Silenciosa e Automática",
  "Modo Offline-First (Venda sem Internet)",
  "Sincronização em Tempo Real",
  "Painel do Empresário (Controle Total)",
  "Suporte Técnico Humanizado",
  "Gestão de Estoque Precisa",
  "Interface Intuitiva e Moderna",
  "Segurança de Dados de Nível Bancário",
  "Atualizações Automáticas",
  "Relatórios de Lucro e Vendas",
  "Suporte a Leitores de Código de Barras",
] as const;

// Triplicamos o array para garantir loop infinito sem espaços vazios.
// A translação usa -33.3333% (1/3), então o final da 1ª cópia encosta
// exatamente no início da 2ª — seamless loop com TODOS os 12 itens visíveis.
const LOOP_ITEMS: string[] = [...ADVANTAGES, ...ADVANTAGES, ...ADVANTAGES];
const LOOP_SHIFT = "-33.3333%";

function Row({
  direction = 1,
  duration = 22,
  variant = "light",
}: {
  direction?: 1 | -1;
  duration?: number;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";
  return (
    <motion.div
      className="flex min-w-max gap-14 sm:gap-20 whitespace-nowrap will-change-transform"
      animate={{
        x: direction === 1 ? ["0%", LOOP_SHIFT] : [LOOP_SHIFT, "0%"],
      }}
      transition={{ duration, ease: "linear", repeat: Infinity }}
    >
      {LOOP_ITEMS.map((t, i) => (
        <span
          key={`${variant}-${i}-${t}`}
          className={`inline-flex shrink-0 items-center gap-5 text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight ${
            isDark ? "text-white" : "text-neutral-900"
          }`}
        >
          {t}
          <span
            aria-hidden
            className={`inline-block w-2 h-2 rounded-full ${
              isDark ? "bg-white/70" : "bg-[#850405]/70"
            }`}
          />
        </span>
      ))}
    </motion.div>
  );
}

export function CrossMarquee() {
  return (
    <div
      className="relative my-16 sm:my-20 h-[220px] sm:h-[320px] overflow-hidden select-none"
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, rgba(133,4,5,0.06), transparent 70%)",
        }}
      />
      {/* Faixa 1: diagonal, direita -> esquerda */}
      <div aria-hidden className="absolute inset-x-[-20%] top-1/2 -translate-y-1/2 rotate-[-8deg] sm:rotate-[-12deg]">
        <div className="border-y border-neutral-200 bg-white/70 backdrop-blur-[2px] py-3 sm:py-4">
          <Row direction={1} duration={48} variant="light" />
        </div>
      </div>
      {/* Faixa 2: diagonal oposta, esquerda -> direita */}
      <div aria-hidden className="absolute inset-x-[-20%] top-1/2 -translate-y-1/2 rotate-[8deg] sm:rotate-[12deg]">
        <div className="border-y border-[#850405]/20 bg-[#850405] text-white py-3 sm:py-4">
          <Row direction={-1} duration={44} variant="dark" />
        </div>
      </div>
      {/* Fade laterais */}
      <div aria-hidden className="absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
      <div aria-hidden className="absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />

      {/* Título de âncora centralizado sobre o cruzamento do X */}
      <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto rounded-full border border-neutral-200 bg-white px-6 sm:px-10 py-3 sm:py-4 shadow-[0_20px_60px_-15px_rgba(133,4,5,0.35),0_0_0_6px_rgba(255,255,255,0.9)]">
          <span className="text-xs sm:text-sm font-bold tracking-[0.25em] uppercase text-[#850405]">
            Vantagens Exclusivas ORVIX
          </span>
        </div>
      </div>
    </div>
  );
}

export default CrossMarquee;