import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Scale, Shield, Gavel, Briefcase, Lock, Mic2, FileText, Banknote,
  Star, MapPin, Phone, Mail, Clock, ChevronDown, MessageCircle, Award, User,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: LandingPage });

const WHATSAPP_URL =
  "https://api.whatsapp.com/send?phone=5511955555786&text=Ol%C3%A1%2C%20preciso%20de%20uma%20consulta%20jur%C3%ADdica%20especializada%20com%20a%20Cavalcanti%20Advogados.";

const NAV = [
  { label: "Início", href: "#inicio" },
  { label: "Diferenciais", href: "#diferenciais" },
  { label: "Áreas", href: "#servicos" },
  { label: "Avaliações", href: "#provasocial" },
  { label: "FAQ", href: "#faq" },
  { label: "Contato", href: "#contato" },
];

const MARQUEE = [
  "CRIMINAL", "TRIBUNAL DO JÚRI", "HABEAS CORPUS", "SÃO PAULO", "DEFESA 24H",
  "WHITE COLLAR", "LAVAGEM DE DINHEIRO", "STJ · STF", "INQUÉRITO POLICIAL", "SIGILO ABSOLUTO",
];

const DIFFERENTIALS = [
  { icon: Clock, title: "Plantão 24h Criminal", desc: "Atendimento permanente para prisões em flagrante, audiências de custódia e medidas urgentes." },
  { icon: Shield, title: "Sigilo Absoluto", desc: "Discrição total no manejo das informações, com protocolo confidencial em cada etapa." },
  { icon: Scale, title: "Estratégia de Elite", desc: "Teses jurídicas construídas sob medida, com excelência técnica reconhecida em SP." },
];

const SERVICES = [
  { icon: Gavel, title: "Habeas Corpus Urgente", desc: "Impetração imediata em qualquer instância para garantir o direito de liberdade." },
  { icon: FileText, title: "Defesa em Inquéritos Policiais", desc: "Acompanhamento estratégico desde a fase pré-processual em delegacias e MP." },
  { icon: Scale, title: "Tribunal do Júri", desc: "Sustentação plenária em crimes dolosos contra a vida, com técnica e oratória apurada." },
  { icon: Briefcase, title: "Crimes Financeiros & White Collar", desc: "Defesa em crimes tributários, contra o sistema financeiro e o mercado de capitais." },
  { icon: Banknote, title: "Lavagem de Dinheiro", desc: "Atuação especializada em casos de lavagem, ocultação patrimonial e compliance criminal." },
  { icon: Mic2, title: "Sustentação Oral em Tribunais Superiores", desc: "Presença incisiva em STJ e STF com argumentação consistente e persuasiva." },
];

const FAQS = [
  { q: "O que fazer em caso de prisão em flagrante?", a: "Ligue imediatamente para nosso plantão 24h. Atuamos desde a delegacia, na audiência de custódia e nos pedidos urgentes de liberdade provisória, preservando todos os direitos do investigado." },
  { q: "Vocês atendem casos em outros estados?", a: "Sim. Embora nossa sede esteja em São Paulo, atendemos clientes em todo o território nacional, com atuação direta perante o STJ e o STF em Brasília." },
  { q: "Como funciona a primeira consulta?", a: "É uma reunião estratégica e confidencial — presencial ou por videoconferência segura. Avaliamos o caso, esclarecemos dúvidas e apresentamos um plano de defesa personalizado." },
  { q: "É possível receber atendimento fora do horário comercial?", a: "Sim. Para emergências criminais oferecemos plantão 24h. Para clientes executivos, agendamos reuniões em horários estendidos e fins de semana." },
  { q: "Como são definidos os honorários?", a: "Os honorários são calculados conforme complexidade do caso, instâncias envolvidas e tempo estimado de atuação, sempre formalizados em contrato transparente e dentro das diretrizes da OAB." },
];

const TESTIMONIALS = [
  { name: "R. Almeida", role: "Empresário · SP", quote: "Atuação irretocável em momento crítico. Técnica, discrição e resultado." },
  { name: "M. Ferreira", role: "Diretora Executiva", quote: "Defesa construída com profundidade e estratégia. Profissionalismo de primeiríssima linha." },
  { name: "J. Carvalho", role: "Cliente em SP", quote: "Plantão 24h fez toda a diferença em uma emergência. Conduta ética impecável." },
];

// ─────────────────────────────────────────────────────────────────────────────

function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  const yHeroBg = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const yHeroContent = useTransform(scrollYProgress, [0, 0.5], ["0%", "-12%"]);
  const scaleHero = useTransform(scrollYProgress, [0, 0.3], [1, 1.08]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heroTitle = "Defesa Criminal de Elite em São Paulo";

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#F5F1E8] font-[Manrope,sans-serif] overflow-x-hidden">
      {/* 1 ─ FLUID BACKGROUND */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0F0F0F]">
        <motion.div
          className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full filter blur-[130px] opacity-[0.18] mix-blend-soft-light"
          style={{ background: "radial-gradient(circle, #C9A961 0%, transparent 70%)" }}
          animate={{ x: [0, 120, -60, 0], y: [0, -80, 50, 0], scale: [1, 1.12, 0.92, 1] }}
          transition={{ duration: 28, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div
          className="absolute top-[15%] right-[-10%] w-[720px] h-[720px] rounded-full filter blur-[130px] opacity-[0.16] mix-blend-soft-light"
          style={{ background: "radial-gradient(circle, #1F2937 0%, transparent 70%)" }}
          animate={{ x: [0, -110, 70, 0], y: [0, 90, -50, 0], scale: [1, 0.9, 1.1, 1] }}
          transition={{ duration: 22, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[12%] left-[12%] w-[640px] h-[640px] rounded-full filter blur-[130px] opacity-[0.14] mix-blend-soft-light"
          style={{ background: "radial-gradient(circle, #C9A961 0%, transparent 70%)" }}
          animate={{ x: [0, 90, -70, 0], y: [0, -60, 40, 0], scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 32, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-[-8%] right-[8%] w-[780px] h-[780px] rounded-full filter blur-[130px] opacity-[0.13] mix-blend-soft-light"
          style={{ background: "radial-gradient(circle, #1F2937 0%, transparent 70%)" }}
          animate={{ x: [0, -120, 80, 0], y: [0, 70, -40, 0], scale: [1, 1.06, 0.9, 1] }}
          transition={{ duration: 35, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div
          className="absolute top-[40%] left-[35%] w-[520px] h-[520px] rounded-full filter blur-[130px] opacity-[0.12] mix-blend-soft-light"
          style={{ background: "radial-gradient(circle, #C9A961 0%, transparent 70%)" }}
          animate={{ x: [0, 70, -90, 0], y: [0, -60, 80, 0], scale: [1, 1.14, 0.96, 1] }}
          transition={{ duration: 25, ease: "easeInOut", repeat: Infinity }}
        />
        <motion.div
          className="absolute top-[5%] right-[30%] w-[560px] h-[560px] rounded-full filter blur-[130px] opacity-[0.10] mix-blend-soft-light"
          style={{ background: "radial-gradient(circle, #1F2937 0%, transparent 70%)" }}
          animate={{ x: [0, 100, -70, 0], y: [0, 90, -50, 0], scale: [1, 0.94, 1.12, 1] }}
          transition={{ duration: 20, ease: "easeInOut", repeat: Infinity }}
        />
        {/* subtle grain overlay */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #C9A961 1px, transparent 0)", backgroundSize: "32px 32px" }} />
      </div>
      <FluidBackground />

      {/* NAVBAR */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-[#0F0F0F]/70 backdrop-blur-xl border-b border-[#C9A961]/15 py-3" : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <a href="#inicio" className="flex items-center gap-2.5 group">
            <motion.div
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C9A961] to-[#8a6f3f] flex items-center justify-center shadow-lg shadow-[#C9A961]/20"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
            >
              <Scale className="w-5 h-5 text-[#0F0F0F]" strokeWidth={2.4} />
            </motion.div>
            <div className="font-[Playfair_Display,serif] leading-tight">
              <div className="text-base font-bold tracking-tight text-[#F5F1E8]">Cavalcanti</div>
              <div className="text-[10px] tracking-[0.28em] uppercase text-[#C9A961]">Advogados</div>
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-9">
            {NAV.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-[#F5F1E8]/75 hover:text-[#C9A961] transition-colors relative group">
                {l.label}
                <span className="absolute left-0 -bottom-1 w-0 h-px bg-[#C9A961] group-hover:w-full transition-all duration-500" />
              </a>
            ))}
          </div>

          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"
            className="hidden md:inline-flex items-center gap-2 bg-[#C9A961] text-[#0F0F0F] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#F5F1E8] transition-all shadow-lg shadow-[#C9A961]/20">
            <Phone className="w-4 h-4" /> Consulta 24h
          </a>

          <button className="lg:hidden text-[#F5F1E8] p-2" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            <div className="space-y-1.5">
              <span className={`block w-6 h-px bg-current transition-transform ${menuOpen ? "translate-y-1.5 rotate-45" : ""}`} />
              <span className={`block w-6 h-px bg-current transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-6 h-px bg-current transition-transform ${menuOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
            </div>
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }} className="lg:hidden overflow-hidden bg-[#0F0F0F]/95 backdrop-blur-xl border-t border-[#C9A961]/15">
              <div className="px-6 py-4 flex flex-col gap-3">
                {NAV.map((l) => (
                  <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="py-2 text-[#F5F1E8]/80 border-b border-[#C9A961]/10">{l.label}</a>
                ))}
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"
                  className="mt-2 inline-flex items-center justify-center gap-2 bg-[#C9A961] text-[#0F0F0F] px-5 py-3 rounded-full text-sm font-medium">
                  <Phone className="w-4 h-4" /> Falar Agora
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* HERO */}
      <section id="inicio" ref={heroRef} className="relative pt-40 pb-28 lg:pt-52 lg:pb-36">
        <motion.div style={{ y: yHeroBg, scale: scaleHero }} className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] max-w-[130vw] rounded-full opacity-[0.10]"
            style={{ background: "radial-gradient(circle, #C9A961 0%, transparent 60%)" }} />
        </motion.div>

        <motion.div style={{ y: yHeroContent }} className="max-w-7xl mx-auto px-6">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
            className="inline-flex items-center gap-2 bg-[#F5F1E8]/5 backdrop-blur-md border border-[#C9A961]/30 px-4 py-1.5 rounded-full text-xs tracking-[0.25em] uppercase text-[#C9A961] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A961] animate-pulse" />
            Advocacia Criminal Premium · São Paulo/SP
          </motion.div>

          <h1 className="font-[Playfair_Display,serif] text-[#F5F1E8] text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.25rem] leading-[1.05] tracking-tight max-w-5xl">
            {heroTitle.split(" ").map((word, i) => (
              <span key={i} className="inline-block overflow-hidden pb-2 mr-3 align-bottom">
                <motion.span className="inline-block" initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}>
                  {word === "Elite" || word === "Criminal" ? (
                    <span className="italic text-[#C9A961] font-medium">{word}</span>
                  ) : word}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-10 max-w-2xl text-lg md:text-xl text-[#F5F1E8]/70 leading-relaxed">
            Em situações que exigem urgência, sigilo e técnica apurada, a Cavalcanti Advogados constrói a sua
            defesa com a discrição e a estratégia que casos de alta complexidade demandam.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.8 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 items-start">
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"
              className="group relative inline-flex items-center gap-3 bg-[#C9A961] text-[#0F0F0F] px-8 py-4 rounded-full text-sm font-medium tracking-wide overflow-hidden shadow-[0_20px_50px_-12px_rgba(201,169,97,0.5)]">
              <span className="absolute inset-0 bg-[#F5F1E8] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              <span className="relative flex items-center gap-3">
                Falar com a Defesa Agora
                <MessageCircle className="w-4 h-4" />
              </span>
            </a>
            <a href="#servicos"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-full text-sm font-medium text-[#F5F1E8]/80 border border-[#F5F1E8]/15 hover:border-[#C9A961] hover:text-[#C9A961] transition-all">
              Áreas de Atuação
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.8 }}
            className="mt-16 flex flex-wrap items-center gap-8 text-sm text-[#F5F1E8]/60">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
              className="flex items-center gap-2.5">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C9A961] text-[#C9A961]" />
                ))}
              </div>
              <span><strong className="text-[#F5F1E8]">+834</strong> avaliações no Google</span>
            </motion.div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#C9A961]" /> Plantão 24h em emergências</div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#C9A961]" /> Paraíso · São Paulo/SP</div>
          </motion.div>
        </motion.div>
      </section>

      {/* MARQUEE */}
      <section className="relative py-10 border-y border-[#C9A961]/15 bg-[#0F0F0F]/40 backdrop-blur-sm overflow-hidden group">
        <motion.div
          className="flex gap-12 whitespace-nowrap font-[Playfair_Display,serif] text-3xl md:text-4xl text-[#F5F1E8]/40 italic"
          animate={{ x: [0, "-50%"] }}
          transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          style={{ animationPlayState: "running" }}
        >
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="flex items-center gap-12">
              {m}
              <span className="text-[#C9A961]">✦</span>
            </span>
          ))}
        </motion.div>
      </section>

      {/* DIFERENCIAIS */}
      <section id="diferenciais" className="relative py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C9A961] mb-4">Diferenciais</p>
            <h2 className="font-[Playfair_Display,serif] text-4xl md:text-5xl text-[#F5F1E8] leading-tight">
              Defesa <span className="italic text-[#C9A961]">técnica</span>, discreta e disponível.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {DIFFERENTIALS.map((d, i) => (
              <motion.div key={i}
                style={{ transformPerspective: 1000 }}
                whileHover={{ y: -12, scale: 1.02, rotateX: 2, rotateY: -2 }}
                transition={{ type: "spring", stiffness: 250, damping: 15 }}
                className="group relative p-8 rounded-2xl bg-[#1F2937]/30 backdrop-blur-md border border-[#C9A961]/20 hover:border-[#C9A961]/60 hover:shadow-[0_20px_50px_-10px_rgba(201,169,97,0.3)] transition-all"
              >
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4 + i, ease: "easeInOut", repeat: Infinity }}
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#C9A961] to-[#8a6f3f] flex items-center justify-center mb-6 shadow-lg shadow-[#C9A961]/20">
                  <d.icon className="w-6 h-6 text-[#0F0F0F]" strokeWidth={2.2} />
                </motion.div>
                <h3 className="font-[Playfair_Display,serif] text-xl text-[#F5F1E8] mb-3">{d.title}</h3>
                <p className="text-sm text-[#F5F1E8]/65 leading-relaxed">{d.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="relative py-24 lg:py-32 border-t border-[#C9A961]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <p className="text-xs tracking-[0.3em] uppercase text-[#C9A961] mb-4">Áreas de Atuação</p>
              <h2 className="font-[Playfair_Display,serif] text-4xl md:text-5xl text-[#F5F1E8] leading-tight">
                Especialização em <span className="italic text-[#C9A961]">defesa criminal</span> de alta complexidade.
              </h2>
            </div>
            <p className="text-[#F5F1E8]/60 max-w-md text-sm leading-relaxed">
              Atuação técnica em todas as instâncias, da fase pré-processual até os tribunais superiores em Brasília.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s, i) => (
              <motion.div key={i}
                style={{ transformPerspective: 1000 }}
                whileHover={{ y: -12, scale: 1.02, rotateX: 2, rotateY: -2 }}
                transition={{ type: "spring", stiffness: 250, damping: 15 }}
                className="group relative p-8 rounded-2xl bg-gradient-to-b from-[#1F2937]/40 to-[#0F0F0F]/40 backdrop-blur-md border border-[#C9A961]/15 hover:border-[#C9A961]/60 hover:shadow-[0_20px_50px_-10px_rgba(201,169,97,0.3)] transition-all overflow-hidden"
              >
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#C9A961]/0 group-hover:bg-[#C9A961]/10 blur-3xl transition-all duration-500" />
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5 + (i % 3), ease: "easeInOut", repeat: Infinity }}
                  className="relative w-12 h-12 rounded-lg border border-[#C9A961]/40 bg-[#C9A961]/5 flex items-center justify-center mb-6">
                  <s.icon className="w-5 h-5 text-[#C9A961]" strokeWidth={1.8} />
                </motion.div>
                <h3 className="font-[Playfair_Display,serif] text-xl text-[#F5F1E8] mb-3 relative">{s.title}</h3>
                <p className="text-sm text-[#F5F1E8]/60 leading-relaxed relative">{s.desc}</p>
                <div className="mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#C9A961]/80 group-hover:text-[#C9A961] transition-colors">
                  Saiba mais <span className="w-6 h-px bg-current transition-all group-hover:w-10" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROVA SOCIAL */}
      <section id="provasocial" className="relative py-24 lg:py-32 border-t border-[#C9A961]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-12 items-center">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}
              className="relative p-10 rounded-3xl bg-gradient-to-br from-[#C9A961]/15 to-[#1F2937]/20 border border-[#C9A961]/30 backdrop-blur-md text-center shadow-[0_30px_60px_-20px_rgba(201,169,97,0.4)]">
              <div className="text-7xl font-[Playfair_Display,serif] text-[#C9A961] mb-2">5.0</div>
              <div className="flex justify-center mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#C9A961] text-[#C9A961]" />
                ))}
              </div>
              <div className="text-sm uppercase tracking-[0.25em] text-[#F5F1E8]/80">Google Reviews</div>
              <div className="mt-3 text-[#F5F1E8] font-medium">+834 avaliações</div>
              <div className="mt-6 inline-flex items-center gap-2 text-xs text-[#F5F1E8]/60">
                <Award className="w-4 h-4 text-[#C9A961]" /> Reputação consolidada em SP
              </div>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t, i) => (
                <motion.div key={i}
                  whileHover={{ y: -8 }} transition={{ type: "spring", stiffness: 250, damping: 18 }}
                  className="p-6 rounded-2xl bg-[#1F2937]/40 backdrop-blur-md border border-[#C9A961]/15 hover:border-[#C9A961]/40 transition-all">
                  <div className="flex mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-[#C9A961] text-[#C9A961]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#F5F1E8]/80 leading-relaxed italic mb-5">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#C9A961]/15 border border-[#C9A961]/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-[#C9A961]" />
                    </div>
                    <div>
                      <div className="text-sm text-[#F5F1E8] font-medium">{t.name}</div>
                      <div className="text-[11px] text-[#F5F1E8]/55 uppercase tracking-widest">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative py-24 lg:py-32 border-t border-[#C9A961]/10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C9A961] mb-4">FAQ</p>
            <h2 className="font-[Playfair_Display,serif] text-4xl md:text-5xl text-[#F5F1E8] leading-tight">
              Dúvidas <span className="italic text-[#C9A961]">frequentes</span>
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={i} className="rounded-2xl bg-[#1F2937]/30 backdrop-blur-md border border-[#C9A961]/15 overflow-hidden">
                  <button onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between gap-4 text-left p-6 hover:bg-[#C9A961]/5 transition-colors">
                    <span className="font-[Playfair_Display,serif] text-lg text-[#F5F1E8]">{f.q}</span>
                    <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      <ChevronDown className="w-5 h-5 text-[#C9A961]" />
                    </motion.div>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                        style={{ overflow: "hidden" }}
                      >
                        <div className="px-6 pb-6 text-[#F5F1E8]/70 text-sm leading-relaxed border-t border-[#C9A961]/10 pt-4">
                          {f.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CONTATO + MAPA */}
      <section id="contato" className="relative py-24 lg:py-32 border-t border-[#C9A961]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C9A961] mb-4">Contato</p>
            <h2 className="font-[Playfair_Display,serif] text-4xl md:text-5xl text-[#F5F1E8] leading-tight">
              Atendimento <span className="italic text-[#C9A961]">reservado</span> em São Paulo.
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-10">
            <div className="p-8 lg:p-10 rounded-3xl bg-[#1F2937]/40 backdrop-blur-md border border-[#C9A961]/20">
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                {[
                  { id: "nome", label: "Nome completo", type: "text" },
                  { id: "email", label: "E-mail", type: "email" },
                  { id: "tel", label: "Telefone / WhatsApp", type: "tel" },
                ].map((f) => (
                  <FloatingField key={f.id} {...f} />
                ))}
                <div className="relative">
                  <textarea id="msg" rows={4} placeholder=" "
                    className="peer w-full bg-transparent border-b border-[#C9A961]/25 focus:border-[#C9A961] outline-none py-3 text-[#F5F1E8] placeholder-transparent resize-none transition-colors" />
                  <label htmlFor="msg" className="absolute left-0 -top-2 text-xs tracking-widest uppercase text-[#C9A961]/80 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-[#F5F1E8]/40 peer-focus:-top-2 peer-focus:text-xs peer-focus:tracking-widest peer-focus:uppercase peer-focus:text-[#C9A961] transition-all">
                    Descreva brevemente o caso
                  </label>
                </div>
                <button type="submit"
                  className="group relative w-full inline-flex items-center justify-center gap-3 bg-[#C9A961] text-[#0F0F0F] px-8 py-4 rounded-full text-sm font-medium tracking-wide overflow-hidden shadow-[0_20px_50px_-12px_rgba(201,169,97,0.5)]">
                  <span className="absolute inset-0 bg-[#F5F1E8] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                  <span className="relative flex items-center gap-3">
                    Solicitar Consulta Reservada
                    <Mail className="w-4 h-4" />
                  </span>
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2.5rem] overflow-hidden border border-[#C9A961]/20 h-[360px] shadow-2xl shadow-black/40">
                <iframe
                  title="Cavalcanti Advogados — Rua Coronel Oscar Porto, 813"
                  src="https://www.google.com/maps?q=Rua+Coronel+Oscar+Porto%2C+813%2C+Para%C3%ADso%2C+S%C3%A3o+Paulo%2C+SP&output=embed"
                  className="w-full h-full grayscale-[30%] saturate-[1.1] contrast-[1.05]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#1F2937]/40 border border-[#C9A961]/15 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C9A961] mb-2"><MapPin className="w-4 h-4" /> Endereço</div>
                  <div className="text-sm text-[#F5F1E8]/85 leading-relaxed">Rua Coronel Oscar Porto, 813<br />Conj. 13 · Paraíso<br />São Paulo/SP · 04003-004</div>
                </div>
                <div className="p-5 rounded-2xl bg-[#1F2937]/40 border border-[#C9A961]/15 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C9A961] mb-2"><Clock className="w-4 h-4" /> Atendimento</div>
                  <div className="text-sm text-[#F5F1E8]/85 leading-relaxed">Seg–Sex · 09h–19h<br /><span className="text-[#C9A961]">Plantão 24h emergências</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-[#C9A961]/15 py-12 bg-[#0F0F0F]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#C9A961] to-[#8a6f3f] flex items-center justify-center">
              <Scale className="w-4 h-4 text-[#0F0F0F]" strokeWidth={2.4} />
            </div>
            <div className="font-[Playfair_Display,serif] leading-tight">
              <div className="text-sm font-bold text-[#F5F1E8]">Cavalcanti Advogados</div>
              <div className="text-[10px] tracking-[0.28em] uppercase text-[#C9A961]">Defesa Criminal · SP</div>
            </div>
          </div>
          <div className="text-xs text-[#F5F1E8]/45">© {new Date().getFullYear()} Cavalcanti Advogados. OAB/SP. Todos os direitos reservados.</div>
        </div>
      </footer>

      {/* FAB WHATSAPP */}
      <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 group" aria-label="Falar no WhatsApp">
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
          className="relative w-16 h-16">
          <motion.div className="absolute inset-0 rounded-full bg-[#25D366]"
            animate={{ scale: [1, 1.5, 1], opacity: [0.55, 0, 0.55] }}
            transition={{ duration: 2, ease: "easeOut", repeat: Infinity }} />
          <motion.div className="absolute inset-0 rounded-full bg-[#25D366]"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, ease: "easeOut", repeat: Infinity, delay: 0.6 }} />
          <div className="relative w-16 h-16 rounded-full bg-[#25D366] flex items-center justify-center shadow-2xl shadow-[#25D366]/40 group-hover:scale-110 transition-transform">
            <MessageCircle className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
        </motion.div>
      </a>
    </div>
  );
}

function FloatingField({ id, label, type }: { id: string; label: string; type: string }) {
  return (
    <div className="relative">
      <input id={id} type={type} placeholder=" "
        className="peer w-full bg-transparent border-b border-[#C9A961]/25 focus:border-[#C9A961] outline-none py-3 text-[#F5F1E8] placeholder-transparent transition-colors" />
      <label htmlFor={id}
        className="absolute left-0 -top-2 text-xs tracking-widest uppercase text-[#C9A961]/80 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-[#F5F1E8]/40 peer-focus:-top-2 peer-focus:text-xs peer-focus:tracking-widest peer-focus:uppercase peer-focus:text-[#C9A961] transition-all">
        {label}
      </label>
    </div>
  );
}
