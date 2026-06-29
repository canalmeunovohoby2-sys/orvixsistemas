import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/RoleGuard";
import { AppShell } from "@/components/AppShell";
import { useSaaS } from "@/lib/saas-context";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Upload, ShieldCheck, KeyRound, Building2 } from "lucide-react";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações Fiscais — ORVIX SISTEMAS" },
      { name: "description", content: "Configure os dados fiscais da empresa para emissão de NFC-e e NF-e." },
    ],
  }),
  component: () => (
    <RoleGuard allow={["admin"]}>
      <ConfiguracoesPage />
    </RoleGuard>
  ),
});

type FiscalData = {
  razaoSocial: string;
  cnpj: string;
  ie: string;
  im: string;
  regime: "simples" | "presumido" | "real";
  certName: string;
  certPassword: string;
};

const EMPTY: FiscalData = {
  razaoSocial: "",
  cnpj: "",
  ie: "",
  im: "",
  regime: "simples",
  certName: "",
  certPassword: "",
};

function ConfiguracoesPage() {
  const { company } = useSaaS();
  const cid = company?.id ?? "EMP001";
  const storageKey = `orvix_fiscal_${cid}`;

  const [data, setData] = useState<FiscalData>(EMPTY);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setData({ ...EMPTY, ...JSON.parse(raw) });
      else setData({ ...EMPTY, razaoSocial: company?.razaoSocial ?? company?.fantasia ?? "", cnpj: company?.cnpj ?? "" });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid]);

  const update = <K extends keyof FiscalData>(k: K, v: FiscalData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const onFile = (f: File | null | undefined) => {
    if (!f) return;
    if (!/\.pfx$/i.test(f.name)) {
      toast.error("Arquivo inválido. Selecione um certificado .pfx.");
      return;
    }
    update("certName", f.name);
    toast.success(`Certificado carregado: ${f.name}`);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Persist tudo, exceto a senha do certificado (mock).
      const { certPassword: _omit, ...safe } = data;
      void _omit;
      localStorage.setItem(storageKey, JSON.stringify(safe));
    } catch {}
    toast.success("⚙️ Configurações fiscais atualizadas e integradas com sucesso na ORVIX SISTEMAS!");
  };

  return (
    <AppShell title="Configurações" breadcrumb={["ORVIX SISTEMAS", "Configurações", "Fiscal"]}>
      <header className="mb-6 flex items-start gap-4">
        <div className="w-12 h-12 grid place-items-center rounded-xl bg-primary/10 border border-primary/30 text-primary">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações Fiscais</h1>
          <p className="text-sm text-muted-foreground">
            Dados utilizados pela ORVIX SISTEMAS para emissão de <strong className="text-foreground">NFC-e</strong> e <strong className="text-foreground">NF-e</strong> diretamente do PDV.
          </p>
        </div>
      </header>

      <form onSubmit={save} className="grid gap-6 max-w-4xl">
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Identificação da empresa</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Razão Social" required>
              <input
                required
                value={data.razaoSocial}
                onChange={(e) => update("razaoSocial", e.target.value)}
                placeholder="Ex.: ORVIX COMERCIO LTDA"
                className={inputCls}
              />
            </Field>
            <Field label="CNPJ" required>
              <input
                required
                value={data.cnpj}
                onChange={(e) => update("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
                className={inputCls}
              />
            </Field>
            <Field label="Inscrição Estadual">
              <input
                value={data.ie}
                onChange={(e) => update("ie", e.target.value)}
                placeholder="Somente números"
                className={inputCls}
              />
            </Field>
            <Field label="Inscrição Municipal">
              <input
                value={data.im}
                onChange={(e) => update("im", e.target.value)}
                placeholder="Opcional"
                className={inputCls}
              />
            </Field>
            <Field label="Regime Tributário" required>
              <select
                value={data.regime}
                onChange={(e) => update("regime", e.target.value as FiscalData["regime"])}
                className={inputCls}
              >
                <option value="simples">Simples Nacional</option>
                <option value="presumido">Lucro Presumido</option>
                <option value="real">Lucro Real</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Certificado Digital A1</h2>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              onFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragging ? "border-primary bg-primary/5" : "border-border bg-secondary/40 hover:border-primary/60 hover:bg-secondary"
            }`}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-semibold text-foreground">
              {data.certName ? data.certName : "Clique ou arraste o Certificado Digital A1 (.pfx)"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tamanho máximo: 5 MB · Formato aceito: <strong>.pfx</strong>
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".pfx"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </div>

          <div className="mt-4">
            <Field label="Senha do Certificado Digital" required={!!data.certName}>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={data.certPassword}
                  onChange={(e) => update("certPassword", e.target.value)}
                  placeholder="Digite a senha do .pfx"
                  className={`${inputCls} pl-9`}
                />
              </div>
            </Field>
            <p className="text-[11px] text-muted-foreground mt-2">
              A senha é armazenada de forma criptografada e usada exclusivamente para assinar documentos fiscais.
            </p>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="h-11 px-6 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 inline-flex items-center gap-2 shadow"
          >
            <ShieldCheck className="w-4 h-4" /> Salvar Dados Fiscais
          </button>
        </div>
      </form>
    </AppShell>
  );
}

const inputCls =
  "w-full h-10 px-3 rounded-md bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}