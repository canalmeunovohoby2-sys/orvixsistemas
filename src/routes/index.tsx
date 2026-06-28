import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Scale, Shield, Gavel, FileText, Briefcase, Lock, Mic2, Building2,
  Star, MapPin, Phone, Mail, Clock, ChevronDown, MessageCircle, Award, Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const WHATSAPP_URL =
  "https://api.whatsapp.com/send?phone=5511955555786&text=Ol%C3%A1%2C%20gostaria%20de%20uma%20consulta%20jur%C3%ADdica%20especializada%20com%20a%20Cavalcanti%20Advogados.";

const NAV_LINKS = [
  { label: "Início", href: "#inicio" },
  { label: "Diferenciais", href: "#diferenciais" },
  { label: "Áreas", href: "#servicos" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "FAQ", href: "#faq" },
  { label: "Contato", href: "#contato" },
];

const MARQUEE_ITEMS = [
  "Tribunal do Júri", "STF", "STJ", "Direito Penal Empresarial",
  "Habeas Corpus", "Colarinho Branco", "Compliance Criminal",
  "Inquérito Policial", "TJSP", "Sustentação Oral", "Defesa Estratégica",
];

const DIFFERENTIALS = [
  {
    icon: Award,
    title: "+834 Avaliações 5 Estrelas",
    desc: "Reputação consolidada no Google, fruto de resultados concretos e atendimento humanizado.",
  },
  {
    icon: Shield,
    title: "Casos Criminais Complexos",
    desc: "Especialização em causas de alta complexidade no cenário criminal de São Paulo.",
  },
  {
    icon: Clock,
    title: "Atendimento 24h Emergências",
    desc: "Plantão jurídico permanente para prisões em flagrante e medidas urgentes.",
  },
];

const SERVICES = [
  { icon: FileText, title: "Defesa em Inquérito Policial", desc: "Acompanhamento estratégico desde a fase pré-processual para garantir direitos." },
  { icon: Briefcase, title: "Crimes de Colarinho Branco", desc: "Defesa técnica em crimes financeiros, tributários e contra a ordem econômica." },
  { icon: Gavel, title: "Tribunal do Júri", desc: "Atuação plenária em crimes dolosos contra a vida, com técnica e oratória apuradas." },
  { icon: Scale, title: "Recursos em STJ e STF", desc: "Teses exclusivas e atuação direcionada nas instâncias superiores." },
  { icon: Lock, title: "Compliance Criminal", desc: "Prevenção de riscos para executivos e estruturação de programas de integridade." },
  { icon: Shield, title: "Habeas Corpus", desc: "Medidas urgentes e impetrações estratégicas em defesa da liberdade." },
  { icon: Mic2, title: "Sustentação Oral", desc: "Presença marcante em tribunais com argumentação consistente e persuasiva." },
  { icon: Building2, title: "Direito Penal Empresarial", desc: "Consultoria preventiva e contenciosa para pessoas jurídicas e seus gestores." },
];

const TESTIMONIALS = [
  {
    name: "R. Almeida",
    role: "Empresário, São Paulo/SP",
    quote: "Atuação excepcional em um momento crítico. Técnica, sobriedade e total comprometimento com o resultado.",
  },
  {
    name: "M. Ferreira",
    role: "Diretora Executiva",
    quote: "Profissionalismo de primeiro nível. A defesa foi construída com estratégia e conhecimento profundo da matéria penal.",
  },
  {
    name: "J. Carvalho",
    role: "Cliente atendido em SP",
    quote: "Disponibilidade 24h fez diferença em uma emergência. Conduta ética irretocável e resultados que falam por si.",
  },
];

const FAQS = [
  {
    q: "Como funciona a primeira consulta jurídica?",
    a: "A primeira consulta é estratégica e confidencial. Avaliamos o caso, esclarecemos dúvidas processuais e apresentamos um plano de defesa personalizado, sempre preservando o sigilo profissional.",
  },
  {
    q: "Vocês atuam em casos de prisão em flagrante?",
    a: "Sim. Mantemos plantão 24 horas para atender emergências, incluindo prisões em flagrante, audiências de custódia e pedidos urgentes de liberdade provisória.",
  },
  {
    q: "Atendem em qual região de São Paulo?",
    a: "Nosso escritório fica no Paraíso, São Paulo/SP, e atendemos clientes em todo o Estado, com atuação também perante tribunais superiores em Brasília.",
  },
  {
    q: "É possível agendar reuniões fora do horário comercial?",
    a: "Sim. Para casos urgentes ou clientes com agendas executivas, oferecemos reuniões agendadas em horários estendidos e por videoconferência segura.",
  },
  {
    q: "Como é definido o honorário advocatício?",
    a: "Os honorários são estabelecidos com base na complexidade do caso, instância e tempo estimado, sempre seguindo as diretrizes da OAB e formalizados em contrato transparente.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const yHeroBg = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const yHeroContent = useTransform(scrollYProgress, [0, 0.5], ["0%", "-15%"]);
  const scaleHero = useTransform(scrollYProgress, [0, 0.3], [1, 1.08]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heroTitle = "Defesa Criminal Estratégica e Especializada em São Paulo";

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-[#0F172A] font-[Manrope,sans-serif] overflow-x-hidden">
      {/* ───── FLUID BACKGROUND ───── */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-[#F5F1E8]">
        <motion.div
          className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full filter blur-[130px] opacity-[0.12] mix-blend-multiply"
          style={{ background: "radial-gradient(circle, #C9A961 0%, transparent 70%)" }}
          animate={{ x: [0, 120, -80, 0], y: [0, -90, 60, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: 27, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div
          className="absolute top-[20%] right-[-10%] w-[700px] h-[700px] rounded-full filter blur-[130px] opacity-[0.10] mix-blend-multiply"
          style={{ background: "radial-gradient(circle, #1F2937 0%, transparent 70%)" }}
          animate={{ x: [0, -100, 70, 0], y: [0, 80, -50, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 22, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[10%] left-[15%] w-[600px] h-[600px] rounded-full filter blur-[130px] opacity-[0.11] mix-blend-multiply"
          style={{ background: "radial-gradient(circle, #C9A961 0%, transparent 70%)" }}
          animate={{ x: [0, 90, -60, 0], y: [0, -70, 40, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 31, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[-5%] right-[10%] w-[750px] h-[750px] rounded-full filter blur-[130px] opacity-[0.09] mix-blend-multiply"
          style={{ background: "radial-gradient(circle, #1F2937 0%, transparent 70%)" }}
          animate={{ x: [0, -110, 80, 0], y: [0, 70, -40, 0], scale: [1, 1.05, 0.92, 1] }}
          transition={{ duration: 35, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div
          className="absolute top-[40%] left-[35%] w-[500px] h-[500px] rounded-full filter blur-[130px] opacity-[0.10] mix-blend-multiply"
          style={{ background: "radial-gradient(circle, #C9A961 0%, transparent 70%)" }}
          animate={{ x: [0, 70, -90, 0], y: [0, -60, 80, 0], scale: [1, 1.12, 0.97, 1] }}
          transition={{ duration: 28, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div
          className="absolute top-[5%] right-[30%] w-[550px] h-[550px] rounded-full filter blur-[130px] opacity-[0.08] mix-blend-multiply"
          style={{ background: "radial-gradient(circle, #1F2937 0%, transparent 70%)" }}
          animate={{ x: [0, 100, -70, 0], y: [0, 90, -50, 0], scale: [1, 0.95, 1.1, 1] }}
          transition={{ duration: 33, ease: "easeInOut", repeat: Infinity }}
        />
      </div>

      {/* ───── NAVBAR ───── */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#F5F1E8]/75 backdrop-blur-xl border-b border-[#C9A961]/20 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a href="#inicio" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#C9A961] to-[#A88845] flex items-center justify-center shadow-md">
              <Scale className="w-5 h-5 text-[#F5F1E8]" strokeWidth={2.2} />
            </div>
            <div className="font-[Playfair_Display,serif] text-[#0F172A] leading-tight">
              <div className="text-base font-bold tracking-tight">Cavalcanti</div>
              <div className="text-[10px] tracking-[0.25em] text-[#1F2937]/70 uppercase">Advogados</div>
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-9">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-[#1F2937] hover:text-[#C9A961] transition-colors duration-300 relative group"
              >
                {l.label}
                <span className="absolute left-0 -bottom-1 w-0 h-px bg-[#C9A961] group-hover:w-full transition-all duration-500" />
              </a>
            ))}
          </div>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-2 bg-[#0F172A] text-[#F5F1E8] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#C9A961] hover:text-[#0F172A] transition-all duration-300 shadow-lg shadow-[#0F172A]/10"
          >
            <Phone className="w-4 h-4" /> Consulta
          </a>

          <button
            className="lg:hidden text-[#0F172A] p-2"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            <div className="space-y-1.5">
              <span className={`block w-6 h-px bg-current transition-transform ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`} />
              <span className={`block w-6 h-px bg-current transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-6 h-px bg-current transition-transform ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
            </div>
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden bg-[#F5F1E8]/95 backdrop-blur-xl border-t border-[#C9A961]/20"
            >
              <div className="px-6 py-4 flex flex-col gap-3">
                {NAV_LINKS.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="py-2 text-[#1F2937] border-b border-[#C9A961]/15"
                  >
                    {l.label}
                  </a>
                ))}
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center justify-center gap-2 bg-[#0F172A] text-[#F5F1E8] px-5 py-3 rounded-full text-sm font-medium"
                >
                  <Phone className="w-4 h-4" /> Falar Agora
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ───── HERO ───── */}
      <section id="inicio" ref={heroRef} className="relative pt-40 pb-28 lg:pt-48 lg:pb-36">
        <motion.div style={{ y: yHeroBg, scale: scaleHero }} className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] max-w-[120vw] rounded-full opacity-[0.06]"
               style={{ background: "radial-gradient(circle, #C9A961 0%, transparent 60%)" }} />
        </motion.div>

        <motion.div style={{ y: yHeroContent }} className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md border border-[#C9A961]/30 px-4 py-1.5 rounded-full text-xs tracking-widest uppercase text-[#1F2937] mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A961] animate-pulse" />
            Advocacia Criminal Premium · São Paulo/SP
          </motion.div>

          <h1 className="font-[Playfair_Display,serif] text-[#0F172A] text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.25rem] leading-[1.05] tracking-tight max-w-5xl">
            {heroTitle.split(" ").map((word, i) => (
              <span key={i} className="inline-block overflow-hidden pb-2 mr-3 align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.08, duration: 0.9, ease: [0.215, 0.61, 0.355, 1] }}
                >
                  {word === "Estratégica" || word === "Especializada" ? (
                    <span className="italic text-[#C9A961] font-medium">{word}</span>
                  ) : (
                    word
                  )}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-10 max-w-2xl text-lg md:text-xl text-[#1F2937]/85 leading-relaxed"
          >
            Cavalcanti Advogados atua com técnica apurada e absoluta discrição na defesa
            de pessoas físicas e empresas em casos criminais complexos — do inquérito
            policial às instâncias superiores.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.8 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 items-start"
          >
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="group relative inline-flex items-center gap-3 bg-[#0F172A] text-[#F5F1E8] px-8 py-4 rounded-full text-sm font-medium tracking-wide overflow-hidden shadow-[0_20px_40px_-12px_rgba(15,23,42,0.4)]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#C9A961] to-[#A88845] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <span className="relative flex items-center gap-3 group-hover:text-[#0F172A] transition-colors duration-500">
                Agendar Consulta Reservada
                <MessageCircle className="w-4 h-4" />
              </span>
            </a>

            <a
              href="#servicos"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-sm font-medium text-[#0F172A] border border-[#0F172A]/15 hover:border-[#C9A961] hover:text-[#C9A961] transition-all duration-300"
            >
              Conhecer Áreas de Atuação
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.8 }}
            className="mt-16 flex flex-wrap items-center gap-8 text-sm text-[#1F2937]/70"
          >
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C9A961] text-[#C9A961]" />
                ))}
              </div>
              <span><strong className="text-[#0F172A]">+834</strong> avaliações no Google</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C9A961]" />
              Atendimento 24h para emergências
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C9A961]" />
              Paraíso · São Paulo/SP
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ───── MARQUEE ───── */}
      <section className="relative py-10 border-y border-[#C9A961]/15 bg-[#0F172A] overflow-hidden">
        <div className="flex gap-12 whitespace-nowrap animate-[marquee_38s_linear_infinite]">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} className="flex items-center gap-12 text-[#F5F1E8]/80 font-[Playfair_Display,serif] text-2xl md:text-3xl italic">
              <span>{item}</span>
              <span className="text-[#C9A961]">✦</span>
            </div>
          ))}
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-33.33%); } }`}</style>
      </section>

      {/* ───── DIFFERENTIALS ───── */}
      <section id="diferenciais" className="py-28 lg:py-36 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <div className="text-xs tracking-[0.3em] uppercase text-[#C9A961] mb-4">Por que Cavalcanti</div>
            <h2 className="font-[Playfair_Display,serif] text-4xl md:text-5xl lg:text-6xl text-[#0F172A] leading-[1.1]">
              Autoridade construída em <span className="italic text-[#C9A961]">resultados</span>.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {DIFFERENTIALS.map((d, i) => {
              const Icon = d.icon;
              return (
                <motion.div
                  key={d.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: i * 0.1, duration: 0.7 }}
                  style={{ transformPerspective: 1000 }}
                  whileHover={{ y: -14, scale: 1.03, rotateX: 3, rotateY: -3 }}
                  className="bg-white/80 backdrop-blur-md border border-[#C9A961]/20 p-8 rounded-2xl transition-[box-shadow,border-color] duration-500 hover:shadow-[0_25px_60px_-15px_rgba(201,169,97,0.3)] hover:border-[#C9A961]/60"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#C9A961]/20 to-[#C9A961]/5 border border-[#C9A961]/30 flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-[#C9A961]" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-[Playfair_Display,serif] text-2xl text-[#0F172A] mb-3 leading-tight">{d.title}</h3>
                  <p className="text-[#1F2937]/75 leading-relaxed">{d.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───── SERVICES ───── */}
      <section id="servicos" className="py-28 lg:py-36 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
            <div className="max-w-3xl">
              <div className="text-xs tracking-[0.3em] uppercase text-[#C9A961] mb-4">Áreas de Atuação</div>
              <h2 className="font-[Playfair_Display,serif] text-4xl md:text-5xl lg:text-6xl text-[#0F172A] leading-[1.1]">
                Defesa criminal <span className="italic text-[#C9A961]">integral</span>, em todas as instâncias.
              </h2>
            </div>
            <p className="text-[#1F2937]/75 max-w-md leading-relaxed">
              Estratégias jurídicas sob medida, do primeiro contato investigatório à
              sustentação oral nos Tribunais Superiores.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: (i % 4) * 0.08, duration: 0.6 }}
                  style={{ transformPerspective: 1000 }}
                  whileHover={{ y: -14, scale: 1.03, rotateX: 3, rotateY: -3 }}
                  className="group bg-white/80 backdrop-blur-md border border-[#C9A961]/20 p-7 rounded-2xl transition-[box-shadow,border-color] duration-500 hover:shadow-[0_25px_60px_-15px_rgba(201,169,97,0.3)] hover:border-[#C9A961]/60"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#0F172A] flex items-center justify-center mb-5 group-hover:bg-[#C9A961] transition-colors duration-500">
                    <Icon className="w-5 h-5 text-[#C9A961] group-hover:text-[#0F172A] transition-colors duration-500" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-[Playfair_Display,serif] text-xl text-[#0F172A] mb-2 leading-tight">{s.title}</h3>
                  <p className="text-sm text-[#1F2937]/70 leading-relaxed">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───── SOCIAL PROOF ───── */}
      <section id="depoimentos" className="py-28 lg:py-36 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-16">
            <div>
              <div className="text-xs tracking-[0.3em] uppercase text-[#C9A961] mb-4">Reconhecimento</div>
              <h2 className="font-[Playfair_Display,serif] text-4xl md:text-5xl lg:text-6xl text-[#0F172A] leading-[1.1]">
                Confiança de quem <span className="italic text-[#C9A961]">esteve aqui</span>.
              </h2>
            </div>

            <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-md border border-[#C9A961]/30 px-6 py-4 rounded-2xl shadow-lg">
              <div className="flex flex-col">
                <div className="text-3xl font-[Playfair_Display,serif] text-[#0F172A]">5.0</div>
                <div className="text-[10px] tracking-widest uppercase text-[#1F2937]/60">Google Reviews</div>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#C9A961] text-[#C9A961]" />
                  ))}
                </div>
                <div className="text-xs text-[#1F2937]/70">+834 avaliações</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.1, duration: 0.7 }}
                className="bg-white/80 backdrop-blur-md border border-[#C9A961]/20 p-8 rounded-2xl flex flex-col"
              >
                <div className="flex mb-5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[#C9A961] text-[#C9A961]" />
                  ))}
                </div>
                <p className="font-[Playfair_Display,serif] italic text-lg text-[#0F172A] leading-relaxed flex-1">
                  "{t.quote}"
                </p>
                <div className="mt-6 pt-6 border-t border-[#C9A961]/15">
                  <div className="font-medium text-[#0F172A]">{t.name}</div>
                  <div className="text-sm text-[#1F2937]/60">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section id="faq" className="py-28 lg:py-36 relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs tracking-[0.3em] uppercase text-[#C9A961] mb-4">Dúvidas Frequentes</div>
            <h2 className="font-[Playfair_Display,serif] text-4xl md:text-5xl lg:text-6xl text-[#0F172A] leading-[1.1]">
              Respostas <span className="italic text-[#C9A961]">claras</span>.
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-white/80 backdrop-blur-md border rounded-2xl overflow-hidden transition-colors duration-300 ${
                    open ? "border-[#C9A961]/60" : "border-[#C9A961]/20"
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-6 px-6 md:px-8 py-6 text-left"
                  >
                    <span className="font-[Playfair_Display,serif] text-lg md:text-xl text-[#0F172A] leading-snug">{f.q}</span>
                    <motion.span
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="flex-shrink-0 w-9 h-9 rounded-full border border-[#C9A961]/40 flex items-center justify-center text-[#C9A961]"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 md:px-8 pb-6 text-[#1F2937]/80 leading-relaxed">{f.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───── CONTACT ───── */}
      <section id="contato" className="py-28 lg:py-36 relative">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-start">
          <div>
            <div className="text-xs tracking-[0.3em] uppercase text-[#C9A961] mb-4">Fale com o Escritório</div>
            <h2 className="font-[Playfair_Display,serif] text-4xl md:text-5xl lg:text-6xl text-[#0F172A] leading-[1.05] mb-6">
              Sua defesa começa por uma <span className="italic text-[#C9A961]">conversa</span>.
            </h2>
            <p className="text-[#1F2937]/75 leading-relaxed mb-10 max-w-md">
              Atendimento confidencial e estratégico. Envie sua mensagem ou agende uma
              consulta reservada presencial ou por videoconferência.
            </p>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#0F172A] text-[#C9A961] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#1F2937]/60 mb-1">Endereço</div>
                  <div className="text-[#0F172A]">Rua Coronel Oscar Porto, 813 — conj. 13</div>
                  <div className="text-[#1F2937]/70 text-sm">Paraíso · São Paulo/SP · 04003-004</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#0F172A] text-[#C9A961] flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#1F2937]/60 mb-1">Plantão 24h</div>
                  <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-[#0F172A] hover:text-[#C9A961] transition">
                    (11) 95555-5786
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#0F172A] text-[#C9A961] flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#1F2937]/60 mb-1">Atendimento</div>
                  <div className="text-[#0F172A]">Seg–Sex · 09h às 19h</div>
                  <div className="text-[#1F2937]/70 text-sm">Emergências 24 horas</div>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.open(WHATSAPP_URL, "_blank");
            }}
            className="bg-white/85 backdrop-blur-xl border border-[#C9A961]/25 rounded-3xl p-8 md:p-10 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.15)]"
          >
            <div className="space-y-6">
              <FloatingInput id="name" label="Nome completo" type="text" />
              <FloatingInput id="email" label="E-mail" type="email" />
              <FloatingInput id="phone" label="Telefone / WhatsApp" type="tel" />
              <FloatingTextarea id="message" label="Descreva brevemente o caso" />
            </div>

            <button
              type="submit"
              className="mt-8 w-full group relative inline-flex items-center justify-center gap-3 bg-[#0F172A] text-[#F5F1E8] px-8 py-4 rounded-full text-sm font-medium tracking-wide overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#C9A961] to-[#A88845] translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative flex items-center gap-3 group-hover:text-[#0F172A] transition-colors duration-500">
                Enviar mensagem reservada
                <MessageCircle className="w-4 h-4" />
              </span>
            </button>
            <p className="text-xs text-[#1F2937]/55 mt-4 text-center">
              Sigilo profissional preservado conforme art. 7º do EOAB.
            </p>
          </form>
        </div>
      </section>

      {/* ───── MAP ───── */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-[2.5rem] overflow-hidden border border-[#C9A961]/25 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)]">
            <iframe
              title="Cavalcanti Advogados - Paraíso/SP"
              src="https://www.google.com/maps?q=Rua+Coronel+Oscar+Porto,+813+-+Para%C3%ADso,+S%C3%A3o+Paulo+-+SP&output=embed"
              width="100%"
              height="460"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block w-full grayscale-[40%] saturate-[1.2] contrast-[0.95] hover:grayscale-0 transition-all duration-700"
            />
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="bg-[#0F172A] text-[#F5F1E8] pt-20 pb-10 mt-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ background: "radial-gradient(circle at 20% 20%, #C9A961 0%, transparent 50%)" }} />
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid md:grid-cols-4 gap-12 pb-14 border-b border-[#F5F1E8]/10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C9A961] to-[#A88845] flex items-center justify-center">
                  <Scale className="w-5 h-5 text-[#0F172A]" strokeWidth={2.2} />
                </div>
                <div className="font-[Playfair_Display,serif] leading-tight">
                  <div className="text-lg font-bold">Cavalcanti Advogados</div>
                  <div className="text-[10px] tracking-[0.25em] text-[#C9A961] uppercase">Advocacia Criminal</div>
                </div>
              </div>
              <p className="text-[#F5F1E8]/65 leading-relaxed max-w-md">
                Defesa criminal estratégica em São Paulo, com atuação em todas as
                instâncias e plantão 24h para emergências.
              </p>
            </div>

            <div>
              <div className="text-xs tracking-[0.25em] uppercase text-[#C9A961] mb-5">Navegar</div>
              <ul className="space-y-3 text-sm text-[#F5F1E8]/75">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="hover:text-[#C9A961] transition">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs tracking-[0.25em] uppercase text-[#C9A961] mb-5">Contato</div>
              <ul className="space-y-3 text-sm text-[#F5F1E8]/75">
                <li className="flex gap-2"><MapPin className="w-4 h-4 mt-0.5 text-[#C9A961]" /> R. Cel. Oscar Porto, 813 — Paraíso/SP</li>
                <li className="flex gap-2"><Phone className="w-4 h-4 mt-0.5 text-[#C9A961]" /> (11) 95555-5786</li>
                <li className="flex gap-2"><Mail className="w-4 h-4 mt-0.5 text-[#C9A961]" /> contato@cavalcantiadv.com.br</li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#F5F1E8]/50">
            <div>© {new Date().getFullYear()} Cavalcanti Advogados. Todos os direitos reservados.</div>
            <div>OAB/SP · Advocacia Criminal Especializada</div>
          </div>
        </div>
      </footer>

      {/* ───── WHATSAPP FAB ───── */}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-6 right-6 z-50 group"
      >
        <span className="absolute inset-0 rounded-full bg-[#C9A961] animate-ping opacity-40" />
        <span className="absolute -inset-3 rounded-full" style={{ background: "radial-gradient(circle, rgba(201,169,97,0.45) 0%, transparent 70%)" }} />
        <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#0F172A] text-[#C9A961] border border-[#C9A961]/40 shadow-[0_15px_40px_-10px_rgba(201,169,97,0.6)] group-hover:bg-[#C9A961] group-hover:text-[#0F172A] transition-all duration-300">
          <MessageCircle className="w-6 h-6" strokeWidth={2} />
        </span>
      </a>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOATING INPUTS
// ─────────────────────────────────────────────────────────────────────────────

function FloatingInput({ id, label, type }: { id: string; label: string; type: string }) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        required
        placeholder=" "
        className="peer w-full bg-transparent border-b border-[#1F2937]/25 px-1 pt-5 pb-2 text-[#0F172A] outline-none focus:border-[#C9A961] transition-colors"
      />
      <label
        htmlFor={id}
        className="absolute left-1 top-5 text-[#1F2937]/60 text-sm pointer-events-none transition-all duration-300 peer-focus:-translate-y-4 peer-focus:text-xs peer-focus:text-[#C9A961] peer-[:not(:placeholder-shown)]:-translate-y-4 peer-[:not(:placeholder-shown)]:text-xs"
      >
        {label}
      </label>
    </div>
  );
}

function FloatingTextarea({ id, label }: { id: string; label: string }) {
  return (
    <div className="relative">
      <textarea
        id={id}
        rows={4}
        required
        placeholder=" "
        className="peer w-full bg-transparent border-b border-[#1F2937]/25 px-1 pt-5 pb-2 text-[#0F172A] outline-none focus:border-[#C9A961] transition-colors resize-none"
      />
      <label
        htmlFor={id}
        className="absolute left-1 top-5 text-[#1F2937]/60 text-sm pointer-events-none transition-all duration-300 peer-focus:-translate-y-4 peer-focus:text-xs peer-focus:text-[#C9A961] peer-[:not(:placeholder-shown)]:-translate-y-4 peer-[:not(:placeholder-shown)]:text-xs"
      >
        {label}
      </label>
    </div>
  );
}
