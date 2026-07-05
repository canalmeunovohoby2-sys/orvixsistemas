import { createFileRoute } from "@tanstack/react-router";
import { Download, ShieldCheck, Printer, Zap, Cpu, RefreshCw, Monitor } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RoleGuard } from "@/components/RoleGuard";

/**
 * Página "Instalador ORVIX Sistemas" — vive dentro da Área do Cliente
 * (RoleGuard + AppShell), acesso exclusivo para usuários logados.
 * Foco 100% Windows. Não altera nenhuma regra de negócio.
 */
export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Instalador ORVIX Sistemas — Download" },
      {
        name: "description",
        content:
          "Baixe o Instalador ORVIX Sistemas para Windows. App nativo com impressão silenciosa, atualização automática e desempenho profissional.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "/download" }],
  }),
  component: () => (
    <RoleGuard allow={["admin", "cashier"]}>
      <DownloadPage />
    </RoleGuard>
  ),
});

function DownloadPage() {
  return (
    <AppShell title="Instalador ORVIX Sistemas" breadcrumb={["Área do Cliente", "Download"]}>
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-primary/10 via-card to-card">
        <div aria-hidden className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative px-6 sm:px-10 pt-12 pb-10 md:pt-16 md:pb-14 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/60 text-[11px] uppercase tracking-widest text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            App oficial · assinado
          </span>
          <h1 className="mt-5 text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
            Instalador <span className="text-primary">ORVIX Sistemas</span> para Windows
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground text-sm md:text-base leading-relaxed">
            App nativo para o seu computador. Impressão silenciosa, atualização
            automática e desempenho profissional — sem depender do navegador.
          </p>

          <div className="mt-8 flex justify-center">
            <a
              href="/downloads/OrvixSistemas-Setup.exe"
              className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm md:text-base shadow-lg shadow-primary/30 transition-all hover:scale-[1.03]"
            >
              <Download className="w-5 h-5" />
              Baixar Instalador ORVIX Sistemas
              <span className="ml-1 text-xs opacity-80">(.exe)</span>
            </a>
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground">
            Requisitos: Windows 10 ou superior · 200 MB de espaço · conexão com a internet.
          </p>
        </div>
      </section>

      <section aria-labelledby="tutorial" className="mt-10">
        <h2 id="tutorial" className="text-center text-sm uppercase tracking-widest text-muted-foreground mb-6">
          Instalação em 3 passos
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          <TutorialStep n={1} icon={<Download className="w-5 h-5" />} title="Baixe o instalador">
            Clique em <strong>Baixar Instalador ORVIX Sistemas</strong> e aguarde o download terminar.
          </TutorialStep>
          <TutorialStep n={2} icon={<Zap className="w-5 h-5" />} title="Execute o .exe">
            Abra o arquivo baixado. O instalador cria automaticamente um atalho na área
            de trabalho e no menu Iniciar.
          </TutorialStep>
          <TutorialStep n={3} icon={<Monitor className="w-5 h-5" />} title="Abra o ORVIX Sistemas">
            Faça login com o mesmo e-mail e senha da Área do Cliente. A impressão
            passa a ser silenciosa, sem diálogos.
          </TutorialStep>
        </ol>
      </section>

      <section aria-labelledby="beneficios" className="mt-10 pb-4">
        <h2 id="beneficios" className="text-center text-sm uppercase tracking-widest text-muted-foreground mb-6">
          Por que usar o app nativo?
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Benefit icon={<Printer className="w-5 h-5" />} title="Impressão silenciosa">
            Cupom e documentos saem direto na impressora. Sem diálogo, sem plugin, sem QZ Tray.
          </Benefit>
          <Benefit icon={<Cpu className="w-5 h-5" />} title="Estabilidade">
            Janela dedicada com prioridade alta no Windows. Sem abas, sem travamentos.
          </Benefit>
          <Benefit icon={<RefreshCw className="w-5 h-5" />} title="Atualização automática">
            Novas versões do ORVIX Sistemas chegam sozinhas em segundo plano.
          </Benefit>
          <Benefit icon={<ShieldCheck className="w-5 h-5" />} title="Login seguro">
            Mesmo usuário da Área do Cliente. Sessão criptografada e isolada por empresa.
          </Benefit>
        </div>
      </section>
    </AppShell>
  );
}

function TutorialStep({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-2xl border border-border bg-card p-6 hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-8 h-8 grid place-items-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
          {n}
        </span>
        <span className="text-primary">{icon}</span>
      </div>
      <h3 className="text-base font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
    </li>
  );
}

function Benefit({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary grid place-items-center mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
    </div>
  );
}