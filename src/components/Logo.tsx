import { useEffect, useState } from "react";
import logoDark from "@/assets/orvix-logo-dark.png.asset.json";
import logoLight from "@/assets/orvix-logo-light.png.asset.json";

/**
 * Logo dinâmica da ORVIX SISTEMAS.
 * - Modo DARK   → versão clara (vermelho vivo) sobre fundo preto
 * - Modo LIGHT  → versão escura (vermelho profundo) sobre fundo branco
 *
 * O componente observa a classe `dark` em <html> e troca a fonte
 * com transição suave. Aspecto fixo 832×224 (~3.71:1).
 */
type LogoProps = {
  /** Altura em px; largura é calculada para preservar o aspecto. */
  height?: number;
  className?: string;
  /** Sobrescreve o tema detectado (útil em telas de fundo fixo). */
  forceTheme?: "dark" | "light";
  priority?: boolean;
};

const ASPECT = 832 / 224; // ≈ 3.7143

export function Logo({ height = 32, className = "", forceTheme, priority }: LogoProps) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return true;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (forceTheme) return;
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));
    const obs = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, [forceTheme]);

  const effectiveDark = forceTheme ? forceTheme === "dark" : isDark;
  const src = effectiveDark ? logoDark.url : logoLight.url;
  const width = Math.round(height * ASPECT);

  return (
    <img
      src={src}
      alt="ORVIX SISTEMAS"
      width={width}
      height={height}
      style={{ height, width }}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      className={`select-none object-contain transition-opacity duration-300 ${className}`}
      draggable={false}
    />
  );
}