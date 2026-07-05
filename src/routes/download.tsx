import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, ShieldCheck, Printer, Zap, Cpu, RefreshCw, ArrowLeft, Apple, Monitor } from "lucide-react";
import logoDark from "@/assets/orvix-logo-dark.png.asset.json";

/**
 * Página pública "Download do PDV". Fica na Área do Cliente e no header da
 * landing. Não altera nenhuma regra de negócio — apenas oferece os
 * instaladores nativos do ORVIX PDV (Electron) publicados pela equipe.
 *
 * Os links `/downloads/*` são servidos estaticamente após o build do
 * instalador (electron-builder → GitHub Releases / R2). Enquanto o build
 * final não estiver publicado, os botões apontam para uma página de aviso.
 */
export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Download do PDV — ORVIX SISTEMAS" },
      {
        name: "description",
        content:
          "Baixe o ORVIX PDV para Windows. Aplicativo nativo com impressão silenciosa, atualização automática e desempenho profissional para o seu caixa.",
      },
      { property: "og:title", content: "Baixe o ORVIX PDV para Windows" },
      {
        property: "og:description",
        content: "App nativo com impressão silenciosa e auto-update. Instale, abra e venda.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/download" }],
  }),
  component: DownloadPage,
});

function DownloadPage() {
  return (
    <main className="min-h-dvh bg-black text-white">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <Link to="/" className="flex items-center">
            <img src={logoDark.url} alt="ORVIX SISTEMAS" className="h-8 w-auto" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-sm font-medium hover:border-[#850405] hover:bg-[#850405]/10 transition-colors"
          >
            Área do Cliente
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[#850405]/20 blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-10 md:pt-24 md:pb-16 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/5 text-[11px] uppercase tracking-widest text-white/70">
            <ShieldCheck className="w-3.5 h-3.5" />
            App oficial · assinado
          </span>
          <h1 className="mt-5 text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
            Baixe o <span className="text-[#e94f4f]">ORVIX PDV</span> para Windows
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-white/70 text-sm md:text-base leading-relaxed">
            Aplicativo nativo do seu caixa. Impressão silenciosa, atualização automática,
            atalhos globais e desempenho de software profissional — sem depender do navegador.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href="/downloads/OrvixPDV-Setup.exe"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#850405] hover:bg-[#a10406] text-white font-bold text-sm md:text-base shadow-lg shadow-[#850405]/30 transition-all hover:scale-[1.03]"
            >
              <Download className="w-5 h-5" />
              Baixar para Windows
              <span className="ml-1 text-xs opacity-80">(.exe)</span>
            </a>
            <a
              href="mailto:suporte@orvixsistemas.com.br?subject=Instalador%20macOS%20ORVIX%20PDV"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/15 hover:border-white/40 text-sm text-white/80 transition-colors"
            >
              <Apple className="w-4 h-4" />
              macOS (sob demanda)
            </a>
          </div>

          <p className="mt-4 text-[11px] text-white/50">
            Requisitos: Windows 10 ou superior · 200 MB de espaço · conexão com a internet.
          </p>
        </div>
      </section>

      <section aria-labelledby="tutorial" className="max-w-6xl mx-auto px-5 sm:px-8 pb-12">
        <h2 id="tutorial" className="text-center text-sm uppercase tracking-widest text-white/60 mb-6">
          Instalação em 3 passos
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          <TutorialStep n={1} icon={<Download className="w-5 h-5" />} title="Baixe o instalador">
            Clique em <strong>Baixar para Windows</strong> e aguarde o download terminar.
          </TutorialStep>
          <TutorialStep n={2} icon={<Zap className="w-5 h-5" />} title="Execute o .exe">
            Abra o arquivo baixado. O instalador cria automaticamente um atalho na área
            de trabalho e no menu Iniciar.
          </TutorialStep>
          <TutorialStep n={3} icon={<Monitor className="w-5 h-5" />} title="Abra o ORVIX PDV">
            Faça login com o mesmo e-mail e senha da Área do Cliente. Impressão de cupom
            passa a ser silenciosa, sem diálogos.
          </TutorialStep>
        </ol>
      </section>

      <section aria-labelledby="beneficios" className="max-w-6xl mx-auto px-5 sm:px-8 pb-16 md:pb-24">
        <h2 id="beneficios" className="text-center text-sm uppercase tracking-widest text-white/60 mb-6">
          Por que usar o app nativo?
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Benefit icon={<Printer className="w-5 h-5" />} title="Impressão silenciosa">
            Cupom sai direto na impressora térmica. Sem diálogo, sem plugin, sem QZ Tray.
          </Benefit>
          <Benefit icon={<Cpu className="w-5 h-5" />} title="Estabilidade">
            Janela dedicada com prioridade alta no Windows. Sem abas, sem travamentos.
          </Benefit>
          <Benefit icon={<RefreshCw className="w-5 h-5" />} title="Atualização automática">
            Novas versões chegam sozinhas em segundo plano. O caixa nunca fica desatualizado.
          </Benefit>
          <Benefit icon={<ShieldCheck className="w-5 h-5" />} title="Login seguro">
            Mesmo usuário da Área do Cliente. Sessão criptografada e isolada por empresa.
          </Benefit>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/50">
        © {new Date().getFullYear()} ORVIX SISTEMAS — Todos os direitos reservados.
      </footer>
    </main>
  );
}

function TutorialStep({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-[#850405]/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-8 h-8 grid place-items-center rounded-full bg-[#850405] text-white text-sm font-bold">
          {n}
        </span>
        <span className="text-[#e94f4f]">{icon}</span>
      </div>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-white/70 leading-relaxed">{children}</p>
    </li>
  );
}

function Benefit({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="w-10 h-10 rounded-lg bg-[#850405]/15 text-[#e94f4f] grid place-items-center mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-white/60 leading-relaxed">{children}</p>
    </div>
  );
}