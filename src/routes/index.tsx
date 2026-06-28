import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold">Pronto para começar</h1>
        <p className="text-muted-foreground">Envie o próximo prompt.</p>
      </div>
    </main>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import {
  Heart,
  Brain,
  Award,
  MessageCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Users,
  Briefcase,
  Sun,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Psicóloga Natalia Mendes — Psicoterapia em Sorocaba/SP" },
      {
        name: "description",
        content:
          "Atendimento psicológico humanizado em Sorocaba/SP. Ansiedade, depressão, luto, autoconhecimento, TCC e orientação de carreira.",
      },
      { property: "og:title", content: "Psicóloga Natalia Mendes — Sorocaba/SP" },
      {
        property: "og:description",
        content:
          "Saúde mental e equilíbrio emocional para sua vida. Agende sua sessão no Boulevard Alavanca.",
      },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

/* ───────────── DADOS ───────────── */

const WHATSAPP_URL =
  "https://api.whatsapp.com/send?phone=5515992733604&text=Ol%C3%A1%2C%20Nat%C3%A1lia.%20Gostaria%20de%20agendar%20uma%20sess%C3%A3o%20de%20psicoterapia.";

const ADDRESS =
  "Boulevard Alavanca - R. Bernardo Guimarães, 105 - sala 708 - Jardim Vergueiro, Sorocaba - SP, 18030-030";

const SERVICES = [
  {
    icon: Heart,
    title: "Psicoterapia Individual",
    desc: "Atendimento personalizado para adultos e adolescentes em um espaço de escuta cuidadosa.",
  },
  {
    icon: Brain,
    title: "Ansiedade & Depressão",
    desc: "Tratamento baseado em evidências para reconquistar leveza, foco e bem-estar emocional.",
  },
  {
    icon: Sun,
    title: "Luto & Perdas",
    desc: "Acompanhamento sensível para atravessar processos de luto com acolhimento e respeito ao seu tempo.",
  },
  {
    icon: Briefcase,
    title: "Orientação de Carreira",
    desc: "Apoio para escolhas profissionais conscientes, transições e desenvolvimento de propósito.",
  },
  {
    icon: Sparkles,
    title: "Terapia Cognitivo-Comportamental",
    desc: "Abordagem TCC estruturada para identificar padrões e construir novas formas de pensar e agir.",
  },
  {
    icon: Users,
    title: "Autoconhecimento & Autoestima",
    desc: "Espaço para desenvolver consciência de si, fortalecer sua identidade e elevar sua autoestima.",
  },
];

const DIFFERENTIALS = [
  {
    icon: Heart,
    title: "Atendimento Humanizado",
    desc: "Cada sessão é desenhada para você, com escuta sem julgamentos e total sigilo profissional.",
  },
  {
    icon: Brain,
    title: "Abordagem TCC",
    desc: "Método clínico estruturado, com objetivos claros e progresso mensurável ao longo do processo.",
  },
  {
    icon: Award,
    title: "5 Estrelas no Google",
    desc: "Avaliação máxima com 12 reviews reais de pacientes que reencontraram seu equilíbrio.",
  },
];

const TESTIMONIALS = [
  {
    name: "Mariana A.",
    text:
      "Encontrei na Natalia uma escuta que mudou minha relação comigo mesma. Recomendo de coração.",
  },
  {
    name: "Rafael P.",
    text:
      "Profissional dedicada e acolhedora. Os encontros me ajudaram a lidar com a ansiedade no trabalho.",
  },
  {
    name: "Beatriz L.",
    text:
      "Ambiente tranquilo e atendimento humano. Senti segurança desde a primeira consulta.",
  },
];

const FAQS = [
  {
    q: "Quanto tempo dura cada sessão?",
    a: "Cada sessão tem duração média de 50 minutos, realizada semanal ou quinzenalmente conforme combinado.",
  },
  {
    q: "Você atende por planos de saúde?",
    a: "O atendimento é particular. Mediante solicitação, emito recibo para reembolso junto ao seu plano.",
  },
  {
    q: "Como é a primeira consulta?",
    a: "É um encontro de acolhimento, onde conversamos sobre sua demanda, sua história e definimos juntos o melhor caminho terapêutico.",
  },
  {
    q: "Há atendimento online?",
    a: "Sim. Ofereço sessões presenciais em Sorocaba/SP e atendimento online via plataforma segura.",
  },
];

const MARQUEE_ITEMS = [
  "Psicoterapia Individual",
  "Autoconhecimento",
  "Saúde Mental",
  "Sorocaba",
  "TCC",
  "Equilíbrio",
  "Empatia",
];

/* ───────────── ANIMAÇÕES ───────────── */

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const wordReveal: Variants = {
  hidden: { y: "100%" },
  visible: (i: number) => ({
    y: 0,
    transition: { delay: i * 0.1, duration: 0.9, ease: EASE_OUT },
  }),
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
};

/* ───────────── COMPONENTES ───────────── */

function FluidBackground() {
  const orbs = [
    { color: "#A8D8B9", x: "10%", y: "15%", size: 520, dur: 22 },
    { color: "#D4A373", x: "75%", y: "20%", size: 460, dur: 28 },
    { color: "#A8D8B9", x: "20%", y: "70%", size: 600, dur: 32 },
    { color: "#D4A373", x: "80%", y: "75%", size: 480, dur: 26 },
    { color: "#A8D8B9", x: "50%", y: "45%", size: 540, dur: 35 },
  ];
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: o.x,
            top: o.y,
            width: o.size,
            height: o.size,
            background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
            filter: "blur(130px)",
            opacity: 0.07,
          }}
          animate={{
            x: [0, 60, -40, 0],
            y: [0, -50, 40, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{
            duration: o.dur,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: EASE_OUT }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-md bg-[#FDFBF7]/70 border-b border-[#A8D8B9]/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#A8D8B9] to-[#D4A373] grid place-items-center text-[#1E2A32] font-[var(--font-display)] text-lg">
            N
          </div>
          <span className="font-[var(--font-display)] text-lg text-[#1E2A32] tracking-tight">
            Natalia Mendes
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-[#1E2A32]/80">
          <a href="#sobre" className="hover:text-[#1E2A32] transition">Sobre</a>
          <a href="#servicos" className="hover:text-[#1E2A32] transition">Serviços</a>
          <a href="#depoimentos" className="hover:text-[#1E2A32] transition">Depoimentos</a>
          <a href="#contato" className="hover:text-[#1E2A32] transition">Contato</a>
        </nav>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1E2A32] text-[#FDFBF7] text-sm font-medium hover:bg-[#2a3a44] transition shadow-sm"
        >
          Agendar <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </motion.header>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -100]);
  const title = "Saúde mental e equilíbrio emocional para sua vida".split(" ");

  return (
    <section
      id="top"
      ref={ref}
      className="relative pt-40 pb-24 md:pt-48 md:pb-32 px-6 md:px-10"
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#A8D8B9]/25 border border-[#A8D8B9]/40 text-[#1E2A32] text-xs tracking-wide uppercase mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#A8D8B9]" />
            Psicóloga clínica em Sorocaba/SP
          </motion.div>

          <h1 className="font-[var(--font-display)] text-[2.6rem] sm:text-5xl lg:text-[4.2rem] leading-[1.05] text-[#1E2A32] tracking-tight">
            {title.map((word, i) => (
              <span
                key={i}
                className="inline-block overflow-hidden align-bottom mr-[0.25em]"
              >
                <motion.span
                  custom={i}
                  variants={wordReveal}
                  initial="hidden"
                  animate="visible"
                  className="inline-block"
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7, ease: EASE_OUT }}
            className="mt-8 text-lg text-[#1E2A32]/75 max-w-xl leading-relaxed"
          >
            Um espaço seguro para você reencontrar clareza, leveza e propósito.
            Atendimento humano, ético e personalizado em psicoterapia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7, ease: EASE_OUT }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="group relative inline-flex items-center gap-2 px-7 py-4 rounded-full bg-[#1E2A32] text-[#FDFBF7] font-medium shadow-[0_10px_40px_-10px_rgba(30,42,50,0.5)] hover:shadow-[0_20px_60px_-12px_rgba(30,42,50,0.65)] transition-all"
            >
              <span
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(168,216,185,0.35), transparent 60%)",
                }}
              />
              <MessageCircle className="w-5 h-5 relative" />
              <span className="relative">Agendar Consulta</span>
            </a>
            <a
              href="#servicos"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full border border-[#1E2A32]/15 text-[#1E2A32] hover:bg-[#1E2A32]/5 transition"
            >
              Conhecer serviços
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="mt-12 flex items-center gap-4 text-sm text-[#1E2A32]/70"
          >
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-[#D4A373] text-[#D4A373]"
                />
              ))}
            </div>
            <span>5.0 • 12 avaliações no Google</span>
          </motion.div>
        </div>

        <motion.div style={{ y }} className="relative">
          <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-[0_30px_80px_-20px_rgba(30,42,50,0.35)]">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, #A8D8B9 0%, #FDFBF7 45%, #D4A373 100%)",
              }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.6),transparent_60%)]" />
            <div className="relative h-full flex flex-col justify-end p-10">
              <div className="backdrop-blur-md bg-[#FDFBF7]/50 border border-white/40 rounded-2xl p-6">
                <p className="font-[var(--font-display)] italic text-2xl text-[#1E2A32] leading-snug">
                  “Cuidar da mente é o gesto mais corajoso e generoso que você
                  pode oferecer a si mesma.”
                </p>
                <p className="mt-4 text-sm text-[#1E2A32]/70">
                  — Natalia Mendes, CRP
                </p>
              </div>
            </div>
          </div>
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="hidden lg:flex absolute -left-8 top-12 w-32 h-32 rounded-3xl bg-[#FDFBF7] border border-[#A8D8B9]/30 shadow-xl flex-col items-center justify-center"
          >
            <Heart className="w-7 h-7 text-[#D4A373]" />
            <p className="mt-2 text-xs text-[#1E2A32]/70 text-center px-3">
              Escuta acolhedora
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Marquee() {
  return (
    <div className="relative py-10 overflow-hidden border-y border-[#1E2A32]/10 bg-[#FDFBF7]/60 backdrop-blur-sm">
      <motion.div
        className="flex gap-12 whitespace-nowrap font-[var(--font-display)] text-2xl md:text-3xl text-[#1E2A32]/40 italic"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
      >
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((t, i) => (
          <span key={i} className="flex items-center gap-12">
            {t}
            <span className="w-2 h-2 rounded-full bg-[#D4A373]" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function Differentials() {
  return (
    <section id="sobre" className="px-6 md:px-10 py-28">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="max-w-2xl mb-16"
        >
          <span className="text-xs tracking-[0.2em] uppercase text-[#D4A373]">
            Por que Natalia
          </span>
          <h2 className="mt-3 font-[var(--font-display)] text-4xl md:text-5xl text-[#1E2A32] leading-tight">
            Cuidado clínico com calor humano.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {DIFFERENTIALS.map((d, i) => {
            const Icon = d.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -15, scale: 1.05, rotateX: 1, rotateY: -1 }}
                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                className="relative p-8 rounded-3xl bg-[#FDFBF7] border border-[#1E2A32]/8 shadow-[0_10px_40px_-20px_rgba(30,42,50,0.2)]"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#A8D8B9]/30 grid place-items-center mb-6">
                  <Icon className="w-6 h-6 text-[#1E2A32]" />
                </div>
                <h3 className="font-[var(--font-display)] text-2xl text-[#1E2A32] mb-3">
                  {d.title}
                </h3>
                <p className="text-[#1E2A32]/70 leading-relaxed">{d.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section id="servicos" className="px-6 md:px-10 py-28 bg-[#1E2A32]/[0.025]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16"
        >
          <div className="max-w-2xl">
            <span className="text-xs tracking-[0.2em] uppercase text-[#D4A373]">
              Serviços
            </span>
            <h2 className="mt-3 font-[var(--font-display)] text-4xl md:text-5xl text-[#1E2A32] leading-tight">
              Caminhos terapêuticos para a sua jornada.
            </h2>
          </div>
          <p className="text-[#1E2A32]/70 max-w-md">
            Cada modalidade é conduzida com escuta atenta e técnica fundamentada,
            respeitando o seu ritmo e a sua história.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.article
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                whileHover={{ y: -15, scale: 1.03, rotateX: 1, rotateY: -1 }}
                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                className="group p-8 rounded-3xl bg-[#FDFBF7] border border-[#1E2A32]/8 flex flex-col"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#A8D8B9]/40 to-[#D4A373]/30 grid place-items-center">
                    <Icon className="w-5 h-5 text-[#1E2A32]" />
                  </div>
                  <span className="text-xs text-[#1E2A32]/40">0{i + 1}</span>
                </div>
                <h3 className="font-[var(--font-display)] text-2xl text-[#1E2A32] mb-3">
                  {s.title}
                </h3>
                <p className="text-[#1E2A32]/70 leading-relaxed mb-8 flex-1">
                  {s.desc}
                </p>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#1E2A32] group-hover:gap-3 transition-all"
                >
                  Saber mais
                  <ArrowRight className="w-4 h-4" />
                </a>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="depoimentos" className="px-6 md:px-10 py-28">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="max-w-2xl mb-16"
        >
          <span className="text-xs tracking-[0.2em] uppercase text-[#D4A373]">
            Depoimentos
          </span>
          <h2 className="mt-3 font-[var(--font-display)] text-4xl md:text-5xl text-[#1E2A32] leading-tight">
            5.0 no Google, com base em histórias reais.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              whileHover={{ y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="p-8 rounded-3xl bg-[#FDFBF7] border border-[#1E2A32]/8 shadow-[0_10px_40px_-20px_rgba(30,42,50,0.2)]"
            >
              <div className="flex mb-5">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star
                    key={k}
                    className="w-4 h-4 fill-[#D4A373] text-[#D4A373]"
                  />
                ))}
              </div>
              <p className="font-[var(--font-display)] text-xl italic text-[#1E2A32] leading-snug">
                “{t.text}”
              </p>
              <p className="mt-6 text-sm text-[#1E2A32]/60">— {t.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="px-6 md:px-10 py-28 bg-[#1E2A32]/[0.025]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="text-center mb-14"
        >
          <span className="text-xs tracking-[0.2em] uppercase text-[#D4A373]">
            Perguntas frequentes
          </span>
          <h2 className="mt-3 font-[var(--font-display)] text-4xl md:text-5xl text-[#1E2A32]">
            Tire suas dúvidas
          </h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="rounded-2xl bg-[#FDFBF7] border border-[#1E2A32]/8 overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="font-[var(--font-display)] text-lg text-[#1E2A32]">
                    {f.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-9 h-9 rounded-full bg-[#A8D8B9]/25 grid place-items-center shrink-0"
                  >
                    <ChevronDown className="w-4 h-4 text-[#1E2A32]" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE_OUT }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-[#1E2A32]/75 leading-relaxed">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FloatingField({
  label,
  type = "text",
  as = "input",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  as?: "input" | "textarea";
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;
  return (
    <div className="relative">
      {as === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={4}
          className="peer w-full px-5 pt-6 pb-3 rounded-2xl bg-[#FDFBF7] border border-[#1E2A32]/15 text-[#1E2A32] outline-none focus:border-[#A8D8B9] focus:ring-4 focus:ring-[#A8D8B9]/25 transition resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="peer w-full px-5 pt-6 pb-3 rounded-2xl bg-[#FDFBF7] border border-[#1E2A32]/15 text-[#1E2A32] outline-none focus:border-[#A8D8B9] focus:ring-4 focus:ring-[#A8D8B9]/25 transition"
        />
      )}
      <label
        className={`absolute left-5 pointer-events-none transition-all text-[#1E2A32]/55 ${
          active ? "top-2 text-[10px] uppercase tracking-wider" : "top-4 text-base"
        }`}
      >
        {label}
      </label>
    </div>
  );
}

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Olá, Natália. Meu nome é ${name}. ${msg} (contato: ${email})`;
    window.open(
      `https://api.whatsapp.com/send?phone=5515992733604&text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  return (
    <section id="contato" className="px-6 md:px-10 py-28">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <span className="text-xs tracking-[0.2em] uppercase text-[#D4A373]">
            Contato
          </span>
          <h2 className="mt-3 font-[var(--font-display)] text-4xl md:text-5xl text-[#1E2A32] leading-tight">
            Vamos conversar.
          </h2>
          <p className="mt-5 text-[#1E2A32]/75 max-w-md leading-relaxed">
            Preencha o formulário e iniciaremos sua jornada com uma conversa
            inicial, sem compromisso.
          </p>

          <div className="mt-10 space-y-5 text-[#1E2A32]/80">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-1 text-[#D4A373] shrink-0" />
              <p className="leading-relaxed">{ADDRESS}</p>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-[#D4A373] shrink-0" />
              <a href="tel:+5515992733604">+55 (15) 99273-3604</a>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#D4A373] shrink-0" />
              <span>Seg–Sex • 09h às 19h</span>
            </div>
          </div>

          <div className="mt-10 rounded-[2.5rem] overflow-hidden border border-[#1E2A32]/10 shadow-[0_20px_60px_-30px_rgba(30,42,50,0.4)]">
            <iframe
              title="Mapa do consultório"
              src="https://www.google.com/maps?q=R.+Bernardo+Guimar%C3%A3es,+105,+Jardim+Vergueiro,+Sorocaba+-+SP&output=embed"
              className="w-full h-72 grayscale-[40%]"
              loading="lazy"
            />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 md:p-10 rounded-[2rem] bg-[#FDFBF7] border border-[#1E2A32]/8 shadow-[0_20px_60px_-30px_rgba(30,42,50,0.35)] space-y-5"
        >
          <FloatingField label="Seu nome" value={name} onChange={setName} />
          <FloatingField
            label="Seu melhor e-mail"
            type="email"
            value={email}
            onChange={setEmail}
          />
          <FloatingField
            label="Como posso te ajudar?"
            as="textarea"
            value={msg}
            onChange={setMsg}
          />
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-[#1E2A32] text-[#FDFBF7] font-medium hover:bg-[#2a3a44] transition shadow-[0_10px_40px_-10px_rgba(30,42,50,0.5)]"
          >
            <MessageCircle className="w-5 h-5" />
            Enviar via WhatsApp
          </button>
          <p className="text-xs text-[#1E2A32]/55 text-center">
            Suas informações são tratadas com total sigilo profissional.
          </p>
        </form>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 md:px-10 pt-16 pb-10 border-t border-[#1E2A32]/10 bg-[#FDFBF7]/60">
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#A8D8B9] to-[#D4A373] grid place-items-center text-[#1E2A32] font-[var(--font-display)]">
              N
            </div>
            <span className="font-[var(--font-display)] text-lg text-[#1E2A32]">
              Natalia Mendes
            </span>
          </div>
          <p className="mt-4 text-sm text-[#1E2A32]/65 leading-relaxed max-w-xs">
            Psicoterapia clínica em Sorocaba/SP, com escuta humana e abordagem
            cognitivo-comportamental.
          </p>
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[#D4A373] mb-4">
            Navegação
          </p>
          <ul className="space-y-2 text-sm text-[#1E2A32]/75">
            <li><a href="#sobre" className="hover:text-[#1E2A32]">Sobre</a></li>
            <li><a href="#servicos" className="hover:text-[#1E2A32]">Serviços</a></li>
            <li><a href="#depoimentos" className="hover:text-[#1E2A32]">Depoimentos</a></li>
            <li><a href="#contato" className="hover:text-[#1E2A32]">Contato</a></li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[#D4A373] mb-4">
            Consultório
          </p>
          <p className="text-sm text-[#1E2A32]/75 leading-relaxed">{ADDRESS}</p>
          <a
            href="mailto:contato@natalia.psi"
            className="mt-3 inline-flex items-center gap-2 text-sm text-[#1E2A32] hover:text-[#D4A373] transition"
          >
            <Mail className="w-4 h-4" />
            contato@natalia.psi
          </a>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[#1E2A32]/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#1E2A32]/55">
        <p>© {new Date().getFullYear()} Natalia Mendes — Psicologia Clínica. Todos os direitos reservados.</p>
        <p>CRP • Sorocaba/SP</p>
      </div>
    </footer>
  );
}

function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Abrir WhatsApp"
      className="fixed bottom-6 right-6 z-40"
    >
      <span className="relative grid place-items-center w-16 h-16 rounded-full bg-[#25D366] text-white shadow-[0_15px_40px_-10px_rgba(37,211,102,0.7)]">
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping" />
        <MessageCircle className="w-7 h-7 relative" />
      </span>
    </a>
  );
}

/* ───────────── PAGE ───────────── */

function LandingPage() {
  return (
    <div
      className="relative min-h-screen text-[#1E2A32]"
      style={{ backgroundColor: "#FDFBF7" }}
    >
      <FluidBackground />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Differentials />
        <Services />
        <Testimonials />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
