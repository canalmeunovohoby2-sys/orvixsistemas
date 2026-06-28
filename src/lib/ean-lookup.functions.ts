import { createServerFn } from "@tanstack/react-start";

export type EanScrapeResult = {
  name: string;
  brand: string;
  category: string;
} | null;

/**
 * Scrapes Cosmos Bluesoft via Firecrawl (bypasses Cloudflare).
 * Returns null on timeout / 404 / parse failure so the UI can fall back to
 * the yellow "manual entry" contingency card.
 */
export const scrapeEanCosmos = createServerFn({ method: "POST" })
  .inputValidator((input: { ean: string }) => {
    if (!input || typeof input.ean !== "string") throw new Error("invalid ean");
    const ean = input.ean.replace(/\D/g, "");
    if (ean.length < 8 || ean.length > 14) throw new Error("invalid ean length");
    return { ean };
  })
  .handler(async ({ data }): Promise<EanScrapeResult> => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      console.error("[scrapeEanCosmos] FIRECRAWL_API_KEY missing");
      return null;
    }

    const url = `https://cosmos.bluesoft.com.br/produtos/${data.ean}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    try {
      const { default: Firecrawl } = await import("@mendable/firecrawl-js");
      const fc = new Firecrawl({ apiKey });

      const scrapePromise = fc.scrape(url, {
        formats: [
          {
            type: "json",
            prompt:
              "Extract product info from this Cosmos Bluesoft product page. Return JSON with: name (product title from h1 or og:title), brand (manufacturer/marca from the specifications table), category (commercial category / breadcrumb / GPC description). If the page is a 404 or has no product, return all empty strings.",
          },
        ],
        onlyMainContent: true,
      });

      const abortPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener("abort", () =>
          reject(new Error("firecrawl_timeout")),
        );
      });

      const result: any = await Promise.race([scrapePromise, abortPromise]);

      const jsonPayload =
        result?.json ?? result?.data?.json ?? result?.extract ?? null;

      if (!jsonPayload || typeof jsonPayload !== "object") {
        console.warn("[scrapeEanCosmos] no JSON payload in Firecrawl result");
        return null;
      }

      const name = String(jsonPayload.name ?? "").trim();
      const brand = String(jsonPayload.brand ?? "").trim();
      const category = String(jsonPayload.category ?? "").trim();

      if (!name && !brand) return null;
      return { name, brand, category };
    } catch (err) {
      console.error("[scrapeEanCosmos] error:", (err as Error)?.message ?? err);
      return null;
    } finally {
      clearTimeout(timer);
    }
  });