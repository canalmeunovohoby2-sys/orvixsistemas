import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { SaaSProvider } from "@/lib/saas-context";
import { DevRoleSwitcher } from "@/components/DevRoleSwitcher";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Meu Saas — Controle de Estoque e Vendas B2B" },
      { name: "description", content: "Meu Saas: ERP B2B para controle de estoque, PDV e vendas. Gestão de inventário, produtos, fornecedores e relatórios em tempo real para empresas de médio porte." },
      { name: "author", content: "Meu Saas" },
      { property: "og:site_name", content: "Meu Saas" },
      { property: "og:title", content: "Meu Saas — Controle de Estoque e Vendas B2B" },
      { property: "og:description", content: "Meu Saas: ERP B2B para controle de estoque, PDV e vendas. Gestão de inventário, produtos, fornecedores e relatórios em tempo real para empresas de médio porte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Meu Saas — Controle de Estoque e Vendas B2B" },
      { name: "twitter:description", content: "Meu Saas: ERP B2B para controle de estoque, PDV e vendas. Gestão de inventário, produtos, fornecedores e relatórios em tempo real para empresas de médio porte." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/54798fd2-175c-45c0-a848-b32d157a8814/id-preview-e9f5f8a6--2cb886ac-9860-4308-87e7-e18b14f502cc.lovable.app-1782684997758.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/54798fd2-175c-45c0-a848-b32d157a8814/id-preview-e9f5f8a6--2cb886ac-9860-4308-87e7-e18b14f502cc.lovable.app-1782684997758.png" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" },
      { rel: "stylesheet", href: appCss },
    ],
    scripts: [
      {
        children: `
          (function() {
            try {
              var t = localStorage.getItem('meusaas_theme');
              if (!t) {
                t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
              }
              if (t === 'dark') document.documentElement.classList.add('dark');
              else document.documentElement.classList.remove('dark');
            } catch(e) { document.documentElement.classList.add('dark'); }
          })();
        `,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <SaaSProvider>
      <DevRoleSwitcher />
      <SubscriptionBanner />
      <Outlet />
      <Toaster position="top-right" />
    </SaaSProvider>
  );
}
