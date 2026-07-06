import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ScanBarcode,
  Boxes,
  Wallet,
  FileText,
  Check,
  ArrowRight,
  ShieldCheck,
  Lock,
  PlayCircle,
  Plus,
  Sparkles,
  Download,
} from "lucide-react";
import logoAsset from "@/assets/orvix-logo-dark.png.asset.json";
import { TrialLandingModal } from "@/components/TrialLandingModal";
const logoLight = logoAsset.url;

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "ORVIX SISTEMAS — Gestão e PDV para escalar seu lucro real" },
      {
        name: "description",
        content:
          "Frente de Caixa ultra-rápido, controle de estoque, crediário inteligente e gestão financeira. Software de gestão estruturado para proteger sua margem.",
      },
      { property: "og:title", content: "ORVIX SISTEMAS — Gestão e PDV de alta performance" },
      {
        property: "og:description",
        content:
          "PDV blindado, estoque automatizado, fluxo de caixa e emissor fiscal. Controle o seu comércio com a velocidade que o mercado exige.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

/* ───────────── Scroll Reveal Hook ───────────── */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("orvix-revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`orvix-reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function LandingPage() {
  const [trialOpen, setTrialOpen] = useState(false);
  return (
    <div className="min-h-screen text-white font-sans antialiased overflow-x-hidden orvix-root">
      <style>{`
        .orvix-root {
          background-color: #0a0a0a;
          background-image:
            radial-gradient(1200px 700px at 15% -10%, rgba(133,4,5,0.10), transparent 60%),
            radial-gradient(900px 600px at 100% 20%, rgba(255,255,255,0.03), transparent 60%),
            radial-gradient(1000px 800px at 50% 120%, rgba(133,4,5,0.08), transparent 65%),
            linear-gradient(180deg, #070707 0%, #0a0a0a 40%, #050505 100%);
          background-attachment: fixed;
        }
        .orvix-mesh-a {
          background: radial-gradient(45% 45% at 30% 40%, rgba(133,4,5,0.16) 0%, rgba(133,4,5,0.04) 45%, rgba(0,0,0,0) 75%);
          filter: blur(20px);
        }
        .orvix-mesh-b {
          background: radial-gradient(45% 45% at 70% 60%, rgba(255,90,91,0.10) 0%, rgba(255,255,255,0.02) 45%, rgba(0,0,0,0) 75%);
          filter: blur(24px);
        }
        .orvix-title-gradient {
          background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 40%, #c9c9c9 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .orvix-card {
          border: 1px solid #1f1f1f;
          background: linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.012) 100%);
          backdrop-filter: blur(10px);
          transition: border-color 400ms ease, box-shadow 400ms ease, transform 400ms ease, background-color 400ms ease;
        }
        .orvix-card:hover {
          border-color: rgba(133,4,5,0.55);
          box-shadow: 0 0 60px -15px rgba(133,4,5,0.55), inset 0 1px 0 0 rgba(255,255,255,0.04);
        }
        .orvix-icon-halo {
          position: relative;
          isolation: isolate;
        }
        .orvix-icon-halo::before {
          content: "";
          position: absolute;
          inset: -40%;
          background: radial-gradient(50% 50% at 50% 50%, rgba(255,90,91,0.35) 0%, rgba(133,4,5,0.15) 40%, transparent 70%);
          filter: blur(10px);
          z-index: -1;
          opacity: 0.75;
          transition: opacity 300ms ease;
        }
        .group:hover .orvix-icon-halo::before { opacity: 1; }
        .orvix-btn-primary {
          background: #850405;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.05), 0 18px 45px -18px rgba(133,4,5,0.7);
          transition: box-shadow 350ms ease, transform 350ms ease, background-color 350ms ease;
        }
        .orvix-btn-primary:hover {
          background: #9a0507;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.08),
            0 0 40px -6px rgba(133,4,5,0.85),
            0 25px 70px -12px rgba(133,4,5,0.95);
          transform: translateY(-1px) scale(1.02);
        }
        .orvix-btn-ghost {
          color: #e5e5e5;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent;
          transition: color 300ms ease, border-color 300ms ease, background-color 300ms ease;
        }
        .orvix-btn-ghost:hover {
          color: #ffffff;
          border-color: rgba(255,255,255,0.20);
          background: rgba(255,255,255,0.03);
        }
        .orvix-body { color: #e5e5e5; line-height: 1.75; }
        .orvix-muted { color: #a3a3a3; line-height: 1.7; }
        .orvix-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 800ms cubic-bezier(0.16,1,0.3,1), transform 800ms cubic-bezier(0.16,1,0.3,1);
          will-change: opacity, transform;
        }
        .orvix-revealed { opacity: 1; transform: translateY(0); }
        .orvix-glow-radial {
          background: radial-gradient(60% 60% at 50% 0%, rgba(133,4,5,0.28) 0%, rgba(133,4,5,0.06) 35%, rgba(0,0,0,0) 70%);
        }
        .orvix-glow-soft {
          background: radial-gradient(50% 50% at 50% 50%, rgba(133,4,5,0.14) 0%, rgba(0,0,0,0) 70%);
        }
        .orvix-grid-bg {
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse at 50% 0%, #000 30%, transparent 75%);
        }
        @keyframes orvix-float {
          0%,100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(0,-18px,0); }
        }
        .orvix-float { animation: orvix-float 9s ease-in-out infinite; }
        @keyframes orvix-pulse-glow {
          0%,100% { opacity: 0.55; }
          50% { opacity: 0.9; }
        }
        .orvix-pulse-glow { animation: orvix-pulse-glow 4.5s ease-in-out infinite; }
      `}</style>

      <Header onOpenTrial={() => setTrialOpen(true)} />
      <Hero onOpenTrial={() => setTrialOpen(true)} />
      <Bento />
      <Pricing />
      <Guarantee />
      <FAQ />
      <Footer />
      <TrialLandingModal open={trialOpen} onClose={() => setTrialOpen(false)} />
    </div>
  );
}

function Header({ onOpenTrial }: { onOpenTrial: () => void }) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#050505]/70 backdrop-blur-xl border-b border-[#1f1f1f]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center group">
          <img
            src={logoLight}
            alt="ORVIX SISTEMAS"
            className="h-8 sm:h-12 w-auto transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/download"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/15 bg-white/5 text-xs sm:text-sm font-semibold text-white hover:border-white/30 hover:bg-white/10 transition-all duration-300"
          >
            <Download className="w-3.5 h-3.5" />
            Área do Cliente
          </Link>
          <button
            type="button"
            onClick={onOpenTrial}
            className="group inline-flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-full bg-[#850405] text-xs sm:text-sm font-semibold text-white hover:bg-[#9a0507] shadow-[0_10px_30px_-10px_rgba(133,4,5,0.8)] transition-all duration-300 hover:scale-[1.03]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Teste Grátis</span>
            <span className="hidden sm:inline opacity-80">(7 dias)</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onOpenTrial }: { onOpenTrial: () => void }) {
  return (
    <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 px-5 sm:px-8 overflow-hidden">
      <div aria-hidden className="absolute inset-0 orvix-grid-bg pointer-events-none" />
      <div
        aria-hidden
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] orvix-glow-radial pointer-events-none orvix-pulse-glow"
      />
      <div
        aria-hidden
        className="absolute top-[40%] -left-32 w-[420px] h-[420px] orvix-glow-soft pointer-events-none orvix-float"
      />
      <div
        aria-hidden
        className="absolute top-[20%] -right-24 w-[380px] h-[380px] orvix-glow-soft pointer-events-none orvix-float"
        style={{ animationDelay: "-3s" }}
      />

      <div className="relative max-w-5xl mx-auto text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs font-medium text-slate-300 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#850405] shadow-[0_0_12px_#850405]" />
            Plataforma de gestão para o varejo brasileiro
          </div>
        </Reveal>

        <Reveal delay={80}>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] orvix-title-gradient">
            Controle o seu comércio com a{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-[#850405]">
              velocidade e precisão
            </span>{" "}
            que o mercado exige.
          </h1>
        </Reveal>

        <Reveal delay={160}>
          <p className="mt-7 sm:mt-9 text-base sm:text-lg lg:text-xl orvix-body max-w-3xl mx-auto">
            Frente de Caixa (PDV) ultra-rápido, controle rigoroso de estoque, crediário
            inteligente e gestão financeira simplificada. O software de gestão estruturado
            para proteger sua margem e escalar seu lucro real.
          </p>
        </Reveal>

        <Reveal delay={240}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
            <a
              href="#planos"
              className="group orvix-btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-white font-semibold text-sm"
            >
              Ver planos e preços
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
            <button
              type="button"
              onClick={onOpenTrial}
              className="group orvix-btn-ghost inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm"
            >
              <Sparkles className="w-4 h-4 text-[#ff5a5b]" />
              Teste Grátis (7 dias)
            </button>
            <Link
              to="/download"
              className="group orvix-btn-ghost inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-sm"
            >
              <Download className="w-4 h-4 text-[#ff5a5b]" />
              Área do Cliente
            </Link>
          </div>
        </Reveal>

        <Reveal delay={340}>
          <div className="mt-16 sm:mt-20 relative mx-auto max-w-5xl">
            <div
              aria-hidden
              className="absolute -inset-6 sm:-inset-10 rounded-[2rem] bg-gradient-to-br from-[#850405]/40 via-[#850405]/10 to-transparent blur-3xl opacity-70"
            />
            <div className="relative aspect-video rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] overflow-hidden shadow-[0_40px_120px_-20px_rgba(133,4,5,0.4),0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-[10px]">
              <div
                aria-hidden
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 30%)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="mx-auto w-20 h-20 rounded-full bg-[#850405]/20 border border-[#850405]/40 flex items-center justify-center mb-4 backdrop-blur-sm group cursor-pointer transition-all duration-300 hover:scale-110 hover:bg-[#850405]/30">
                    <PlayCircle className="w-10 h-10 text-white" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-slate-400 font-medium">
                    Vídeo de demonstração da plataforma
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Em breve</p>
                </div>
              </div>
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.15]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 30%, rgba(133,4,5,0.6), transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.15), transparent 40%)",
                }}
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: ScanBarcode,
    title: "Frente de Caixa (PDV) Blindado",
    desc: "Operação ágil, atalhos eficientes por teclado, leitura instantânea de código de barras e funcionamento contínuo.",
    span: "md:col-span-2 md:row-span-2",
    big: true,
  },
  {
    icon: Boxes,
    title: "Estoque com Baixa Automatizada",
    desc: "Rastreamento em tempo real de produtos, gerenciamento de grades e alertas visuais automáticos para reposição urgente.",
    span: "md:col-span-2",
  },
  {
    icon: Wallet,
    title: "Fluxo de Caixa e Crediário",
    desc: "Controle completo de entradas, saídas, fechamento de turnos por operador e gestão integrada de contas no fiado.",
    span: "",
  },
  {
    icon: FileText,
    title: "Simulador e Emissor Fiscal",
    desc: "Estrutura pronta para simular e emitir NFC-e de forma simplificada, gerando chaves de acesso com total conformidade.",
    span: "",
  },
];

function Bento() {
  return (
    <section className="relative px-5 sm:px-8 py-28 sm:py-36 bg-white text-neutral-900">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(1000px 500px at 100% 0%, rgba(133,4,5,0.05), transparent 60%), radial-gradient(800px 500px at 0% 100%, rgba(133,4,5,0.04), transparent 60%)",
        }}
      />
      <div className="relative max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#850405] uppercase mb-4">
              A vitrine do produto
            </p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] text-neutral-900">
              Tudo que o seu comércio precisa, em uma plataforma só.
            </h2>
            <p className="mt-6 text-base sm:text-lg text-neutral-600 leading-relaxed">
              Recursos pensados por quem opera no varejo. Sem firulas, sem complexidade desnecessária.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-4 md:auto-rows-[minmax(220px,auto)] gap-4 sm:gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 90} className={f.span}>
                <div className="group relative h-full rounded-2xl p-9 sm:p-10 overflow-hidden hover:-translate-y-1 border border-neutral-200 bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_-15px_rgba(133,4,5,0.25)] hover:border-[#850405]/40 transition-all duration-500">
                  <div
                    aria-hidden
                    className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#850405]/0 group-hover:bg-[#850405]/10 blur-3xl transition-all duration-700"
                  />
                  <div className="relative flex flex-col h-full">
                    <div className="w-12 h-12 rounded-xl bg-[#850405]/10 border border-[#850405]/30 flex items-center justify-center mb-6 group-hover:bg-[#850405]/15 group-hover:border-[#850405] transition-all duration-300">
                      <Icon className="w-5 h-5 text-[#850405]" strokeWidth={2} />
                    </div>
                    <h3
                      className={`font-semibold text-neutral-900 tracking-tight ${
                        f.big ? "text-2xl sm:text-3xl" : "text-lg sm:text-xl"
                      }`}
                    >
                      {f.title}
                    </h3>
                    <p
                      className={`mt-4 text-neutral-600 leading-relaxed ${
                        f.big ? "text-base max-w-md" : "text-sm"
                      }`}
                    >
                      {f.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const PLANS = [
  {
    name: "Bronze",
    tagline: "Essencial",
    price: "99,90",
    href: "https://mpago.la/2czRmdq",
    cta: "Assinar Plano Bronze",
    featured: false,
    benefits: [
      "1 usuário gestor",
      "1 terminal de caixa ativo",
      "Controle completo de estoque",
      "Vendas e relatórios básicos",
    ],
  },
  {
    name: "Prata",
    tagline: "Pro",
    price: "149,90",
    href: "https://mpago.la/2QFXuft",
    cta: "Assinar Plano Prata",
    featured: true,
    badge: "Recomendado para Empresas em Crescimento",
    benefits: [
      "Multi-caixas (até 3 usuários/terminais simultâneos)",
      "Suporte completo",
      "Relatórios consolidados",
      "Controle financeiro avançado",
    ],
  },
  {
    name: "Ouro",
    tagline: "Premium",
    price: "249,90",
    href: "https://mpago.la/19MKjsD",
    cta: "Assinar Plano Ouro",
    featured: false,
    benefits: [
      "Até 10 computadores/terminais simultâneos",
      "Suporte prioritário",
      "Relatórios gerenciais avançados",
      "Lucratividade nítida e expansão estruturada",
    ],
  },
] as const;

function Pricing() {
  return (
    <section id="planos" className="relative px-5 sm:px-8 py-28 sm:py-36 bg-neutral-50 text-neutral-900 border-t border-neutral-200">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(900px 400px at 50% 0%, rgba(133,4,5,0.06), transparent 60%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#850405] uppercase mb-4">
              Planos e preços
            </p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] text-neutral-900">
              Escolha o plano certo para o tamanho do seu negócio.
            </h2>
            <p className="mt-6 text-base sm:text-lg text-neutral-600 leading-relaxed">
              Sem fidelidade. Sem taxas escondidas. Cancele quando quiser.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/download"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-neutral-300 bg-white text-neutral-900 font-semibold text-sm hover:border-[#850405] hover:text-[#850405] transition-all duration-300 shadow-sm"
              >
                <Download className="w-4 h-4" />
                Área do Cliente
              </Link>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 max-w-6xl mx-auto">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} delay={i * 100}>
              <div
                className={`group relative h-full rounded-3xl p-9 sm:p-10 flex flex-col transition-all duration-500 hover:-translate-y-2 ${
                  p.featured
                    ? "border-2 border-[#850405] bg-white shadow-[0_20px_60px_-15px_rgba(133,4,5,0.35)]"
                    : "border border-neutral-200 bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)]"
                }`}
              >
                {p.featured && "badge" in p && p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-[#850405] text-white text-[10px] sm:text-xs font-semibold tracking-wide whitespace-nowrap shadow-[0_8px_30px_-5px_rgba(133,4,5,0.8)]">
                    {p.badge}
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-semibold text-neutral-900">Plano {p.name}</h3>
                    <span className="text-xs text-neutral-500">({p.tagline})</span>
                  </div>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-sm text-neutral-500">R$</span>
                    <span className="text-5xl font-bold tracking-tight text-neutral-900">{p.price}</span>
                    <span className="text-sm text-neutral-500">/mês</span>
                  </div>
                </div>

                <ul className="space-y-3.5 mb-8 flex-1">
                  {p.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-3 text-sm text-neutral-700">
                      <span
                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                          p.featured ? "bg-[#850405]" : "bg-neutral-900"
                        }`}
                      >
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full text-center px-6 py-3.5 rounded-full font-semibold text-sm ${
                    p.featured
                      ? "orvix-btn-primary text-white"
                      : "border border-neutral-300 bg-white text-neutral-900 hover:border-[#850405] hover:text-[#850405] transition-colors"
                  }`}
                >
                  {p.cta}
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Guarantee() {
  return (
    <section className="relative px-5 sm:px-8 py-28 sm:py-32">
      <div aria-hidden className="orvix-mesh-a absolute top-0 left-1/4 w-[420px] h-[420px] pointer-events-none rounded-full" />
      <div className="relative max-w-4xl mx-auto">
        <Reveal>
          <div className="orvix-card relative rounded-3xl p-10 sm:p-14 overflow-hidden">
            <div
              aria-hidden
              className="absolute -top-32 -right-32 w-96 h-96 orvix-glow-soft pointer-events-none"
            />
            <div className="relative flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
              <div className="orvix-icon-halo flex-shrink-0 w-14 h-14 rounded-2xl bg-[#850405]/15 border border-[#850405]/40 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-[#ff5a5b]" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold orvix-title-gradient tracking-tight leading-tight">
                  Acesso imediato e automatizado.
                </h3>
                <p className="mt-5 orvix-body text-base sm:text-lg">
                  Assim que o Mercado Pago processar a sua assinatura, nosso sistema cria
                  a sua empresa instantaneamente e envia suas credenciais de acesso
                  temporárias direto para o seu e-mail cadastrado.{" "}
                  <span className="text-white font-medium">
                    Sem burocracia, sem espera.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    q: "Como recebo o meu acesso após o pagamento?",
    a: "O processo é 100% automatizado. Assim que o Mercado Pago aprova a sua assinatura (via Pix ou Cartão), nosso sistema cria a sua empresa instantaneamente e envia suas credenciais de acesso temporárias direto para o seu e-mail cadastrado. Você entra e já começa a usar na hora.",
  },
  {
    q: "Preciso instalar algum aplicativo pesados nos meus computadores?",
    a: "Não. A ORVIX SISTEMAS opera com tecnologia em nuvem de última geração. Isso significa que você pode acessar o seu caixa e toda a gestão da sua loja de qualquer computador, tablet ou celular conectado à internet, sem precisar instalar nada ou passar por configurações demoradas.",
  },
  {
    q: "O sistema funciona com leitor de código de barras e impressora térmica?",
    a: "Sim, perfeitamente. Nossa Frente de Caixa (PDV) foi projetada para alta performance e é compatível com os principais leitores de código de barras (EAN) do mercado e impressoras térmicas padrão para emissão de cupom e relatórios rápidos.",
  },
  {
    q: "Os meus dados de vendas e estoque estão seguros?",
    a: "Totalmente seguros. Utilizamos criptografia de nível bancário e servidores robustos com rotinas de backup automático diário. Mesmo que o computador da sua loja quebre ou seja roubado, o seu histórico de vendas, estoque e o caixa do dia continuam intactos e protegidos na nuvem.",
  },
  {
    q: "Como funciona o suporte caso eu tenha alguma dúvida?",
    a: "Nosso compromisso é com a operação da sua loja. Oferecemos suporte completo e prioritário (dependendo do seu plano escolhido) diretamente pelos nossos canais oficiais de atendimento. Você nunca ficará com o caixa travado ou sem resposta.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative px-5 sm:px-8 py-28 sm:py-32">
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] orvix-glow-soft pointer-events-none opacity-60"
      />
      <div aria-hidden className="orvix-mesh-b absolute top-10 -right-24 w-[420px] h-[420px] pointer-events-none rounded-full" />
      <div className="relative max-w-3xl mx-auto">
        <Reveal>
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block text-xs font-medium tracking-[0.2em] uppercase text-[#ff5a5b]/80">
              FAQ
            </span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-bold orvix-title-gradient tracking-tight">
              Perguntas frequentes
            </h2>
            <p className="mt-5 orvix-body text-base sm:text-lg">
              Respostas diretas para você decidir com segurança.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="rounded-2xl border border-[#1f1f1f] bg-white/[0.015] overflow-hidden backdrop-blur-[10px]">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={i}
                  className={
                    "border-b border-[#1f1f1f] last:border-b-0 transition-colors " +
                    (isOpen ? "bg-white/[0.02]" : "")
                  }
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-6 text-left px-6 sm:px-8 py-6 sm:py-7 group"
                  >
                    <span
                      className={
                        "text-base sm:text-lg font-medium tracking-tight transition-colors " +
                        (isOpen ? "text-white" : "text-white/90 group-hover:text-white")
                      }
                    >
                      {item.q}
                    </span>
                    <span
                      className={
                        "flex-shrink-0 w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-300 " +
                        (isOpen
                          ? "border-[#850405] bg-[#850405]/15 text-[#ff5a5b] rotate-45 shadow-[0_0_20px_-4px_#850405]"
                          : "border-white/15 text-white/70 group-hover:border-white/30")
                      }
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.2} />
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-500 ease-out"
                    style={{
                      gridTemplateRows: isOpen ? "1fr" : "0fr",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 sm:px-8 pb-7 pr-12 sm:pr-20 orvix-body text-sm sm:text-base">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-[#1f1f1f] px-5 sm:px-8 py-12">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img src={logoLight} alt="ORVIX SISTEMAS" className="h-6 w-auto opacity-90" />
        </div>

        <p className="text-xs text-slate-500 text-center order-3 sm:order-2">
          © 2026 ORVIX SISTEMAS. Todos os direitos reservados.
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-500 order-2 sm:order-3">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Criptografia SSL
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Pagamento seguro
          </span>
        </div>
      </div>
    </footer>
  );
}