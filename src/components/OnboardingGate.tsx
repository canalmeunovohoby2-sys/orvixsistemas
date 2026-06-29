import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Store, Loader2, ShieldCheck } from "lucide-react";
import { useSaaS } from "@/lib/saas-context";
import { Logo } from "@/components/Logo";

const SEGMENTS = [
  "Mercado / Mercearia",
  "Padaria / Confeitaria",
  "Açougue / Frios",
  "Restaurante / Lanchonete",
  "Farmácia / Drogaria",
  "Moda / Vestuário",
  "Petshop / Agropecuária",
  "Conveniência / Tabacaria",
  "Distribuidora / Atacado",
  "Outro",
];

/**
 * Bloqueia o uso do sistema enquanto a empresa do lojista logado
 * estiver com `onboardingPending: true`. Não aparece para super_admin
 * nem durante impersonação (super_admin no modo suporte).
 */
export function OnboardingGate() {
  const { user, company, completeOnboarding, impersonating } = useSaaS();
  const navigate = useNavigate();

  const [fantasia, setFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [segment, setSegment] = useState("");
  const [busy, setBusy] = useState(false);

  // Trava o scroll do body enquanto a tela de bloqueio estiver visível.
  const mustBlock =
    !!user && user.role !== "super_admin" && !!company && company.onboardingPending === true && !impersonating;

  useEffect(() => {
    if (!mustBlock) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mustBlock]);

  if (!mustBlock) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !company) return;
    setBusy(true);
    const res = completeOnboarding(company.id, { fantasia, cnpj, phone, segment });
    if (!res.ok) {
      toast.error(res.reason ?? "Não foi possível concluir o cadastro.");
      setBusy(false);
      return;
    }
    toast.success(`Bem-vindo(a) à ORVIX SISTEMAS, ${fantasia}! Sua Frente de Caixa está liberada.`);
    setBusy(false);
    // Direciona para o PDV (Frente de Caixa) já com os dados aplicados.
    setTimeout(() => navigate({ to: "/vendas" }), 250);
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
        <div
          className="w-full max-w-2xl rounded-2xl border border-[#850405]/60 bg-[#0a0a0a] shadow-[0_30px_120px_-20px_rgba(133,4,5,0.5)] overflow-hidden"
          style={{ background: "linear-gradient(180deg, #0a0a0a 0%, #000 100%)" }}
        >
          {/* Header */}
          <div className="px-7 py-6 border-b border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#850405]/15 border border-[#850405]/50 grid place-items-center text-[#ff5b5c]">
              <Store className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#ff5b5c] font-semibold">
                Primeiro acesso — Obrigatório
              </p>
              <h2 id="onboarding-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Cadastre os dados da sua empresa
              </h2>
            </div>
            <div className="hidden sm:block">
              <Logo height={26} priority />
            </div>
          </div>

          {/* Aviso */}
          <div className="px-7 pt-5">
            <p className="text-sm text-neutral-300 leading-relaxed">
              Para liberar a <span className="text-white font-semibold">Frente de Caixa (PDV)</span>, precisamos das
              informações fiscais e comerciais oficiais do seu negócio. Esses dados serão usados nos cupons,
              relatórios e na sua ficha no Painel Master da ORVIX SISTEMAS.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-7 py-6 grid sm:grid-cols-2 gap-4">
            <Field label="Nome da Loja / Razão Social" required full>
              <Input
                value={fantasia}
                onChange={setFantasia}
                placeholder="Ex.: Mercadinho Bom Preço"
                autoFocus
                maxLength={80}
              />
            </Field>

            <Field label="CNPJ ou CPF do Negócio" required>
              <Input
                value={cnpj}
                onChange={setCnpj}
                placeholder="00.000.000/0001-00"
                inputMode="numeric"
                maxLength={20}
              />
            </Field>

            <Field label="Telefone Comercial" required>
              <Input
                value={phone}
                onChange={setPhone}
                placeholder="(11) 99999-9999"
                inputMode="tel"
                maxLength={20}
              />
            </Field>

            <Field label="Segmento do Negócio" required full>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full h-11 px-3 rounded-md bg-black border border-white/15 text-sm text-white focus:outline-none focus:border-[#850405] focus:ring-2 focus:ring-[#850405]/40 transition-colors"
              >
                <option value="">Selecione um segmento…</option>
                {SEGMENTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>

            <div className="sm:col-span-2 mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#ff5b5c]" />
                Dados protegidos pela ORVIX SISTEMAS — usados apenas para operação fiscal e suporte.
              </p>
              <button
                type="submit"
                disabled={busy}
                className="h-11 px-6 rounded-md bg-[#850405] hover:bg-[#a30506] text-white font-semibold inline-flex items-center justify-center gap-2 shadow-[0_8px_24px_-8px_rgba(133,4,5,0.7)] disabled:opacity-60 transition-colors"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Confirmar cadastro
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, required, full, children,
}: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-400 font-semibold">
        {label}{required && <span className="text-[#ff5b5c] ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function Input({
  value, onChange, placeholder, autoFocus, maxLength, inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "tel" | "email";
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      maxLength={maxLength}
      inputMode={inputMode}
      className="w-full h-11 px-3 rounded-md bg-black border border-white/15 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#850405] focus:ring-2 focus:ring-[#850405]/40 transition-colors"
    />
  );
}