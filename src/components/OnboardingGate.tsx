import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Store, Loader2, ShieldCheck, MonitorSmartphone, ArrowRight, ArrowLeft,
  User as UserIcon, Mail, Lock, Eye, EyeOff, Check,
} from "lucide-react";
import { useSaaS } from "@/lib/saas-context";
import { Logo } from "@/components/Logo";
import { PasswordRules } from "@/components/PasswordRules";
import { isStrongPassword } from "@/lib/password-policy";

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
  const { user, company, completeOnboarding, createCashier, impersonating } = useSaaS();
  const navigate = useNavigate();

  // Etapa 1 — Dados da empresa
  const [step, setStep] = useState<1 | 2>(1);
  const [fantasia, setFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [segment, setSegment] = useState("");

  // Etapa 2 — Primeiro terminal de caixa
  const [opName, setOpName] = useState("");
  const [opEmail, setOpEmail] = useState("");
  const [opPwd, setOpPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);

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

  // ───── Etapa 1: salva dados da empresa e avança para a etapa 2.
  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !company) return;
    if (!fantasia.trim() || !cnpj.trim() || !phone.trim() || !segment) {
      toast.error("Preencha todos os campos da empresa para continuar.");
      return;
    }
    setBusy(true);
    const res = await completeOnboarding(company.id, { fantasia, cnpj, phone, segment });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.reason ?? "Não foi possível concluir o cadastro.");
      return;
    }
    toast.success("Dados da empresa salvos. Agora cadastre o primeiro terminal de caixa.");
    setStep(2);
  };

  // ───── Etapa 2: cria o primeiro operador de caixa e libera o sistema.
  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !company) return;
    if (!opName.trim() || !opEmail.trim()) {
      toast.error("Informe o nome e o e-mail do operador.");
      return;
    }
    if (!isStrongPassword(opPwd)) {
      toast.error("A senha do caixa não atende às regras de segurança.");
      return;
    }
    setBusy(true);
    const res = await createCashier(company.id, { name: opName, email: opEmail, password: opPwd });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.reason ?? "Não foi possível criar o terminal.");
      return;
    }
    toast.success(`Bem-vindo(a) à ORVIX SISTEMAS, ${fantasia}! Painel de gestão liberado.`);
    // Lojista (dono) vai para o Dashboard principal; o PDV fica para o operador criado.
    setTimeout(() => navigate({ to: "/" }), 250);
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
              {step === 1 ? <Store className="w-6 h-6" /> : <MonitorSmartphone className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#ff5b5c] font-semibold">
                Primeiro acesso — Etapa {step} de 2
              </p>
              <h2 id="onboarding-title" className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {step === 1 ? "Cadastre os dados da sua empresa" : "Cadastre o seu Primeiro Terminal de Caixa"}
              </h2>
            </div>
            <div className="hidden sm:block">
              <Logo height={26} priority />
            </div>
          </div>

          {/* Stepper */}
          <div className="px-7 pt-5 flex items-center gap-3">
            <StepDot n={1} active={step === 1} done={step > 1} label="Empresa" />
            <div className={`flex-1 h-px ${step > 1 ? "bg-[#850405]" : "bg-white/10"}`} />
            <StepDot n={2} active={step === 2} done={false} label="Terminal de Caixa" />
          </div>

          {step === 1 ? (
          <>
          {/* Aviso */}
          <div className="px-7 pt-5">
            <p className="text-sm text-neutral-300 leading-relaxed">
              Para liberar o <span className="text-white font-semibold">Painel de Gestão</span> e a Frente de Caixa,
              precisamos das informações fiscais e comerciais oficiais do seu negócio. Esses dados serão usados nos
              cupons, relatórios e na sua ficha no Painel Master da ORVIX SISTEMAS.
            </p>
          </div>

          {/* Form Etapa 1 */}
          <form onSubmit={handleStep1} className="px-7 py-6 grid sm:grid-cols-2 gap-4">
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
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Avançar
              </button>
            </div>
          </form>
          </>
          ) : (
          <>
          {/* Aviso Etapa 2 */}
          <div className="px-7 pt-5">
            <p className="text-sm text-neutral-300 leading-relaxed">
              Crie agora o usuário do <span className="text-white font-semibold">primeiro operador de caixa</span> da
              sua loja. Essas credenciais serão usadas no login do PDV. Ele já conta como o 1º terminal ativo do seu
              plano.
            </p>
          </div>

          {/* Form Etapa 2 */}
          <form onSubmit={handleStep2} className="px-7 py-6 grid sm:grid-cols-2 gap-4">
            <Field label="Nome do Operador / Funcionário" required full>
              <IconInput icon={UserIcon} value={opName} onChange={setOpName} placeholder="Ex.: João da Silva" maxLength={60} autoFocus />
            </Field>

            <Field label="Usuário / E-mail do Caixa" required full>
              <IconInput icon={Mail} value={opEmail} onChange={setOpEmail} placeholder="joao@minhaloja.com.br" inputMode="email" maxLength={120} />
            </Field>

            <Field label="Senha de Acesso do Caixa" required full>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={opPwd}
                  onChange={(e) => setOpPwd(e.target.value)}
                  placeholder="Crie uma senha forte"
                  autoComplete="new-password"
                  className="w-full h-11 pl-9 pr-10 rounded-md bg-black border border-white/15 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#850405] focus:ring-2 focus:ring-[#850405]/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  tabIndex={-1}
                  aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordRules value={opPwd} variant="dark" />
            </Field>

            <div className="sm:col-span-2 mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={busy}
                className="h-11 px-5 rounded-md border border-white/15 bg-transparent text-neutral-200 inline-flex items-center justify-center gap-2 hover:bg-white/5 transition-colors disabled:opacity-60"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
              <button
                type="submit"
                disabled={busy || !isStrongPassword(opPwd) || !opName.trim() || !opEmail.trim()}
                className="h-11 px-6 rounded-md bg-[#850405] hover:bg-[#a30506] text-white font-semibold inline-flex items-center justify-center gap-2 shadow-[0_8px_24px_-8px_rgba(133,4,5,0.7)] disabled:opacity-60 transition-colors"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Finalizar Cadastro
              </button>
            </div>
          </form>
          </>
          )}
        </div>
      </div>
    </div>
  );
}

function StepDot({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  const state = done ? "done" : active ? "active" : "idle";
  const dot =
    state === "done"
      ? "bg-[#850405] border-[#850405] text-white"
      : state === "active"
        ? "bg-[#850405]/20 border-[#850405] text-[#ff5b5c]"
        : "bg-white/5 border-white/10 text-neutral-500";
  const txt =
    state === "idle" ? "text-neutral-500" : "text-white";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className={`w-7 h-7 rounded-full border grid place-items-center text-xs font-bold ${dot}`}>
        {done ? <Check className="w-3.5 h-3.5" /> : n}
      </span>
      <span className={`text-[11px] uppercase tracking-wider font-semibold ${txt}`}>{label}</span>
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

function IconInput({
  icon: Icon, value, onChange, placeholder, autoFocus, maxLength, inputMode,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  maxLength?: number;
  inputMode?: "text" | "numeric" | "tel" | "email";
}) {
  return (
    <div className="relative">
      <Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={maxLength}
        inputMode={inputMode}
        className="w-full h-11 pl-9 pr-3 rounded-md bg-black border border-white/15 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#850405] focus:ring-2 focus:ring-[#850405]/40 transition-colors"
      />
    </div>
  );
}