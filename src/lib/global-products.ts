import { supabase } from "@/integrations/supabase/client";
import { lookupEan as lookupEanExternal, PRODUCTS, type Unit } from "@/lib/mock-data";

/**
 * Base Global de Produtos Orvix — camada colaborativa.
 *
 * A base global armazena APENAS informações públicas do produto:
 *  - EAN/GTIN, nome, marca, categoria, unidade, imagem.
 * Nunca contém: estoque, preços, dados de empresa/cliente/financeiros.
 *
 * Fluxo de resolução de código de barras:
 *   1. Produtos da própria empresa (localStorage / mock)
 *   2. Base Global do Orvix (Supabase — tabela global_products)
 *   3. APIs externas (Open Food Facts, Firecrawl/Cosmos etc.)
 *
 * Sempre que uma fonte externa (ou o cadastro manual) fornecer um produto
 * ainda inexistente na base global, contribuímos automaticamente com os
 * campos públicos, aumentando a taxa de identificação para toda a rede.
 */

export type ResolvedProduct = {
  ean: string;
  name: string;
  brand: string;
  category: string;
  unit: Unit;
  imageUrl?: string;
  source: "company" | "global" | "external";
};

const VALID_LENGTHS = new Set([8, 12, 13, 14]);
const SESSION_CACHE = new Map<string, ResolvedProduct | null>();

function isValidEan(ean: string): boolean {
  return /^\d+$/.test(ean) && VALID_LENGTHS.has(ean.length);
}

function normalizeUnit(value: unknown): Unit {
  const allowed: Unit[] = ["un", "m", "m²", "m³", "kg", "L"];
  if (typeof value === "string" && (allowed as string[]).includes(value)) return value as Unit;
  return "un";
}

/** 1️⃣ Busca no catálogo de produtos da empresa (dados privados do tenant). */
function lookupCompany(ean: string): ResolvedProduct | null {
  const hit = PRODUCTS.find((p) => p.ean === ean);
  if (!hit) return null;
  return {
    ean: hit.ean,
    name: hit.name,
    brand: "",
    category: hit.category,
    unit: hit.unit,
    source: "company",
  };
}

/** 2️⃣ Busca na Base Global do Orvix (Supabase). */
async function lookupGlobal(ean: string): Promise<ResolvedProduct | null> {
  try {
    const { data, error } = await supabase
      .from("global_products" as never)
      .select("ean,name,brand,category,unit,image_url")
      .eq("ean", ean)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as {
      ean: string; name: string; brand: string;
      category: string; unit: string; image_url: string | null;
    };
    return {
      ean: row.ean,
      name: row.name,
      brand: row.brand || "",
      category: row.category || "Geral",
      unit: normalizeUnit(row.unit),
      imageUrl: row.image_url ?? undefined,
      source: "global",
    };
  } catch {
    return null;
  }
}

/** Contribui com um produto para a Base Global (silencioso). */
export async function contributeToGlobalCatalog(input: {
  ean: string;
  name: string;
  brand?: string;
  category?: string;
  unit?: Unit;
  imageUrl?: string;
}): Promise<void> {
  const ean = String(input.ean || "").replace(/\D/g, "");
  if (!isValidEan(ean)) return;
  const name = (input.name || "").trim();
  if (!name) return;

  try {
    // Só grava se ainda não existir — a base global cresce, nunca é sobrescrita.
    const { data: existing } = await supabase
      .from("global_products" as never)
      .select("ean")
      .eq("ean", ean)
      .maybeSingle();
    if (existing) return;

    await supabase.from("global_products" as never).insert({
      ean,
      name,
      brand: (input.brand || "").trim(),
      category: (input.category || "Geral").trim() || "Geral",
      unit: input.unit ?? "un",
      image_url: input.imageUrl ?? null,
    } as never);

    // Atualiza cache de sessão para evitar re-consulta.
    SESSION_CACHE.set(ean, {
      ean, name,
      brand: (input.brand || "").trim(),
      category: (input.category || "Geral").trim() || "Geral",
      unit: input.unit ?? "un",
      imageUrl: input.imageUrl,
      source: "global",
    });
  } catch {
    // Falhas de contribuição nunca podem quebrar o cadastro.
  }
}

/**
 * Resolve um código de barras seguindo a cascata: empresa → global → externo.
 * Resultados negativos e positivos são cacheados na sessão para evitar
 * consultas repetidas ao mesmo código.
 */
export async function resolveProductByEan(ean: string): Promise<ResolvedProduct | null> {
  const code = String(ean || "").replace(/\D/g, "");
  if (!isValidEan(code)) return null;

  if (SESSION_CACHE.has(code)) return SESSION_CACHE.get(code) ?? null;

  // 1) Empresa
  const company = lookupCompany(code);
  if (company) {
    SESSION_CACHE.set(code, company);
    return company;
  }

  // 2) Base Global Orvix
  const global = await lookupGlobal(code);
  if (global) {
    SESSION_CACHE.set(code, global);
    return global;
  }

  // 3) Fontes externas (Open Food Facts, demo intercept, etc.)
  const external = await lookupEanExternal(code);
  if (external) {
    const resolved: ResolvedProduct = {
      ean: external.ean,
      name: external.name,
      brand: external.brand === "—" ? "" : external.brand,
      category: external.category,
      unit: external.unit,
      source: "external",
    };
    SESSION_CACHE.set(code, resolved);
    // Aprendizado colaborativo: alimenta a base global (silencioso, não bloqueia UI).
    void contributeToGlobalCatalog({
      ean: resolved.ean,
      name: resolved.name,
      brand: resolved.brand,
      category: resolved.category,
      unit: resolved.unit,
    });
    return resolved;
  }

  SESSION_CACHE.set(code, null);
  return null;
}