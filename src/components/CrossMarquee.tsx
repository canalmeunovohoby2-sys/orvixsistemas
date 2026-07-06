import { motion } from "framer-motion";

const ITEMS = [
  "PDV de Alta Performance",
  "Impressão Silenciosa e Automática",
  "Modo Offline-First (Não pare de vender)",
  "Sincronização em Tempo Real",
  "Painel de Gestão Administrativa",
  "Suporte Técnico Especializado",
  "Gestão de Estoque Inteligente",
  "Interface Intuitiva e Moderna",
  "Segurança de Dados com Criptografia",
  "Atualizações Automáticas",
];

function Row({ direction = 1, duration = 12 }: { direction?: 1 | -1; duration?: number }) {
  const loop = [...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <motion.div
      className="flex gap-16 sm:gap-20 whitespace-nowrap will-change-transform"
      animate={{ x: direction === 1 ? ["0%", "-50%"] : ["-50%", "0%"] }}
      transition={{ duration, ease: "linear", repeat: Infinity }}
    >
      {loop.map((t, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-4 text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900"
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
      aria-hidden
      className="relative my-16 sm:my-20 h-[220px] sm:h-[320px] overflow-hidden select-none"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, rgba(133,4,5,0.06), transparent 70%)",
        }}
      />
      {/* Faixa 1: diagonal, direita -> esquerda */}
      <div className="absolute inset-x-[-20%] top-1/2 -translate-y-1/2 rotate-[-8deg] sm:rotate-[-12deg]">
        <div className="border-y border-neutral-200 bg-white/70 backdrop-blur-[2px] py-3 sm:py-4">
          <Row direction={1} duration={14} />
        </div>
      </div>
      {/* Faixa 2: diagonal oposta, esquerda -> direita */}
      <div className="absolute inset-x-[-20%] top-1/2 -translate-y-1/2 rotate-[8deg] sm:rotate-[12deg]">
        <div className="border-y border-[#850405]/20 bg-[#850405] text-white py-3 sm:py-4">
          <motion.div
            className="flex gap-16 sm:gap-20 whitespace-nowrap will-change-transform"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 12, ease: "linear", repeat: Infinity }}
          >
            {[...ITEMS, ...ITEMS, ...ITEMS].map((t, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-4 text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white"
              >
                {t}
                <span aria-hidden className="inline-block w-2 h-2 rounded-full bg-white/70" />
              </span>
            ))}
          </motion.div>
        </div>
      </div>
      {/* Fade laterais */}
      <div className="absolute inset-y-0 left-0 w-24 sm:w-40 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-24 sm:w-40 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10" />
    </div>
  );
}

export default CrossMarquee;