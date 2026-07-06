import { motion } from "framer-motion";

const ITEMS = [
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
];

function Row({ direction = 1, duration = 7 }: { direction?: 1 | -1; duration?: number }) {
  const loop = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <motion.div
      className="flex gap-14 sm:gap-20 whitespace-nowrap will-change-transform"
      animate={{ x: direction === 1 ? ["0%", "-50%"] : ["-50%", "0%"] }}
      transition={{ duration, ease: "linear", repeat: Infinity }}
    >
      {loop.map((t, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-5 text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900"
        >
          {t}
          <span aria-hidden className="inline-block w-2 h-2 rounded-full bg-[#850405]/70" />
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
          <Row direction={1} duration={8} />
        </div>
      </div>
      {/* Faixa 2: diagonal oposta, esquerda -> direita */}
      <div aria-hidden className="absolute inset-x-[-20%] top-1/2 -translate-y-1/2 rotate-[8deg] sm:rotate-[12deg]">
        <div className="border-y border-[#850405]/20 bg-[#850405] text-white py-3 sm:py-4">
          <motion.div
            className="flex gap-14 sm:gap-20 whitespace-nowrap will-change-transform"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 7, ease: "linear", repeat: Infinity }}
          >
            {[...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS].map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-5 text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white"
              >
                {t}
                <span aria-hidden className="inline-block w-2 h-2 rounded-full bg-white/70" />
              </span>
            ))}
          </motion.div>
        </div>
      </div>
      {/* Fade laterais */}
      <div aria-hidden className="absolute inset-y-0 left-0 w-32 sm:w-56 bg-gradient-to-r from-white via-white/90 to-transparent pointer-events-none z-10" />
      <div aria-hidden className="absolute inset-y-0 right-0 w-32 sm:w-56 bg-gradient-to-l from-white via-white/90 to-transparent pointer-events-none z-10" />

      {/* Título de âncora centralizado sobre o cruzamento do X */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto rounded-full border border-white/60 bg-white/60 backdrop-blur-xl px-5 sm:px-8 py-2.5 sm:py-3.5 shadow-[0_10px_40px_-10px_rgba(133,4,5,0.35)]">
          <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-[#850405]">
            Vantagens Exclusivas ORVIX
          </span>
        </div>
      </div>
    </div>
  );
}

export default CrossMarquee;