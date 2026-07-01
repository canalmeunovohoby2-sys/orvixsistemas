import { useState } from "react";
import {
  HelpCircle,
  Printer,
  ScanLine,
  DoorOpen,
  ShoppingCart,
  Wallet,
  Package,
  BarChart3,
  Users,
  CreditCard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSaaS } from "@/lib/saas-context";

type Topic = {
  icon: typeof HelpCircle;
  title: string;
  body: React.ReactNode;
};

const CASHIER_TOPICS: Topic[] = [
  {
    icon: DoorOpen,
    title: "Abertura e Fechamento de Caixa",
    body: (
      <>
        No início do turno, informe o <strong>troco inicial</strong> para abrir o caixa.
        Ao final, use <strong>&quot;Fechar Caixa&quot;</strong>, faça a conferência do
        dinheiro em espécie e confirme para gerar o relatório do turno.
      </>
    ),
  },
  {
    icon: ShoppingCart,
    title: "Realizar uma Venda",
    body: (
      <>
        Adicione produtos pelo <strong>código de barras</strong> ou pela busca, escolha a
        forma de pagamento (Dinheiro, PIX, Cartão ou Crediário) e finalize com{" "}
        <strong>F10</strong>. O cupom é enviado direto para a impressora térmica.
      </>
    ),
  },
  {
    icon: ScanLine,
    title: "Leitor de Código de Barras",
    body: (
      <>
        Conecte o leitor USB em modo <strong>Emulação de Teclado (HID)</strong>. Basta
        bipar o produto — ele será adicionado automaticamente ao carrinho.
      </>
    ),
  },
  {
    icon: Printer,
    title: "Impressora Térmica (80mm)",
    body: (
      <>
        Defina a impressora como <strong>padrão no Windows</strong>. Modelos testados:
        Elgin i9 e Bematech MP-4200. Ao imprimir, desmarque cabeçalhos e margens do
        navegador para melhor resultado.
      </>
    ),
  },
  {
    icon: Wallet,
    title: "Sangria e Suprimento",
    body: (
      <>
        Use <strong>Sangria</strong> para retirar dinheiro do caixa (ex.: pagamentos) e{" "}
        <strong>Suprimento</strong> para adicionar troco durante o turno. Todo
        movimento fica registrado no fechamento.
      </>
    ),
  },
];

const MANAGER_TOPICS: Topic[] = [
  {
    icon: Package,
    title: "Cadastro de Produtos",
    body: (
      <>
        Em <strong>Produtos</strong>, cadastre manualmente ou use o{" "}
        <strong>scanner EAN</strong> para preencher automaticamente via base pública.
        Defina preço de custo, preço de venda e estoque mínimo.
      </>
    ),
  },
  {
    icon: BarChart3,
    title: "Relatórios de Faturamento",
    body: (
      <>
        Em <strong>Relatórios</strong>, filtre por período (dia, semana, mês) para
        analisar vendas, ticket médio e lucratividade. Exporte em PDF para
        compartilhar com contador ou sócios.
      </>
    ),
  },
  {
    icon: Users,
    title: "Funcionários e Terminais",
    body: (
      <>
        Em <strong>Terminais</strong>, crie usuários do tipo <strong>Caixa</strong>{" "}
        com senha temporária. Cada terminal opera de forma independente e a
        movimentação é consolidada no Dashboard.
      </>
    ),
  },
  {
    icon: CreditCard,
    title: "Assinatura e Plano",
    body: (
      <>
        Em <strong>Assinatura</strong>, acompanhe o vencimento do plano e atualize o
        método de pagamento. O sistema avisa 3 dias antes do vencimento e bloqueia
        o acesso somente após a data limite.
      </>
    ),
  },
  {
    icon: Printer,
    title: "Configuração de Impressora",
    body: (
      <>
        A impressora térmica 80mm deve estar como <strong>padrão no Windows</strong>.
        Modelos testados: Elgin i9 e Bematech MP-4200.
      </>
    ),
  },
];

/**
 * Painel de Ajuda dinâmico e sensível ao perfil do usuário logado.
 * - Cashier: apenas tutoriais operacionais de PDV.
 * - Admin / Super Admin: tutoriais de gestão do negócio.
 * A filtragem é feita em runtime a partir do `user.role`, garantindo
 * que conteúdos fora do escopo de permissão jamais sejam renderizados.
 */
export function PeripheralsHelp() {
  const [open, setOpen] = useState(false);
  const { user } = useSaaS();

  const isCashier = user?.role === "cashier";
  const topics = isCashier ? CASHIER_TOPICS : MANAGER_TOPICS;
  const heading = isCashier ? "Central de Ajuda — Operação de Caixa" : "Central de Ajuda — Gestão";
  const subheading = isCashier
    ? "Guia rápido do dia a dia no PDV."
    : "Guia rápido para gerenciar o seu negócio no ORVIX.";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Central de Ajuda"
        title="Central de Ajuda"
        className="h-10 w-10 grid place-items-center rounded-md border border-border bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              {heading}
            </DialogTitle>
            <DialogDescription>
              {subheading}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {topics.map(({ icon: Icon, title, body }) => (
              <section
                key={title}
                className="rounded-md border border-border bg-secondary/40 p-4 space-y-2"
              >
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="w-4 h-4 text-primary" /> {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {body}
                </p>
              </section>
            ))}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Entendido
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}