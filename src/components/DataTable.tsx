import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Search } from "lucide-react";

export type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sort?: (a: T, b: T) => number;
  className?: string;
  align?: "left" | "right" | "center";
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  searchKeys,
  pageSize = 8,
  toolbar,
  rowClassName,
}: {
  rows: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  pageSize?: number;
  toolbar?: React.ReactNode;
  rowClassName?: (row: T) => string;
}) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let r = rows;
    if (q && searchKeys?.length) {
      const needle = q.toLowerCase();
      r = r.filter((row) =>
        searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(needle)),
      );
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col) {
        r = [...r].sort((a, b) => {
          const res = col.sort
            ? col.sort(a, b)
            : String((a as Record<string, unknown>)[sortKey] ?? "").localeCompare(
                String((b as Record<string, unknown>)[sortKey] ?? ""),
                "pt-BR",
                { numeric: true },
              );
          return sortDir === "asc" ? res : -res;
        });
      }
    }
    return r;
  }, [rows, q, sortKey, sortDir, columns, searchKeys]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curr = Math.min(page, pageCount);
  const slice = filtered.slice((curr - 1) * pageSize, curr * pageSize);

  const exportCsv = () => {
    const head = columns.map((c) => c.label).join(",");
    const body = filtered
      .map((r) =>
        columns
          .map((c) => {
            const v = (r as Record<string, unknown>)[c.key as string];
            return JSON.stringify(v ?? "");
          })
          .join(","),
      )
      .join("\n");
    const blob = new Blob([head + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 border-b border-border">
        {searchKeys && (
          <div className="relative md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Buscar..."
              aria-label="Buscar na tabela"
              className="w-full h-9 pl-9 pr-3 rounded-md bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}
        <div className="flex-1 flex items-center gap-2">{toolbar}</div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-secondary hover:bg-accent border border-border text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  scope="col"
                  className={`px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider ${c.align === "right" ? "text-right" : ""}`}
                >
                  <button
                    onClick={() => {
                      if (sortKey === c.key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      else { setSortKey(String(c.key)); setSortDir("asc"); }
                    }}
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {c.label}
                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={row.id} className={`border-t border-border hover:bg-accent/40 transition-colors ${rowClassName?.(row) ?? ""}`}>
                {columns.map((c) => (
                  <td
                    key={String(c.key)}
                    className={`px-4 py-3 ${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}
                  >
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key as string] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 p-4 border-t border-border text-sm">
        <p className="text-muted-foreground">
          {filtered.length} registro{filtered.length !== 1 ? "s" : ""} · página {curr} de {pageCount}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={curr === 1}
            aria-label="Página anterior"
            className="w-9 h-9 grid place-items-center rounded-md border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={curr === pageCount}
            aria-label="Próxima página"
            className="w-9 h-9 grid place-items-center rounded-md border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ kind, children }: { kind: "success" | "warn" | "danger" | "info"; children: React.ReactNode }) {
  const map = {
    success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    warn: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    danger: "bg-primary/15 text-primary border-primary/40",
    info: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[kind]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
