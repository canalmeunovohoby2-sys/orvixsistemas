import { motion } from "framer-motion";

const ITEMS = [
  "Impressão Silenciosa",
  "Offline-First",
  "Sincronização em Tempo Real",
  "Segurança Bancária",
  "Suporte Especializado",
  "Gestão Multi-terminal",
];

function Row({ direction = 1, duration = 28 }: { direction?: 1 | -1; duration?: number }) {
  const loop = [...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <motion.div
      className="flex gap-10 whitespace-nowrap will-change-transform"
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
          <Row direction={1} duration={32} />
        </div>
      </div>
      {/* Faixa 2: diagonal oposta, esquerda -> direita */}
      <div className="absolute inset-x-[-20%] top-1/2 -translate-y-1/2 rotate-[8deg] sm:rotate-[12deg]">
        <div className="border-y border-[#850405]/20 bg-[#850405] text-white py-3 sm:py-4">
          <motion.div
            className="flex gap-10 whitespace-nowrap will-change-transform"
            animate={{ x: ["-50%", "0%"] }}
            transition={{ duration: 28, ease: "linear", repeat: Infinity }}
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
      <div className="absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  );
}

export default CrossMarquee;