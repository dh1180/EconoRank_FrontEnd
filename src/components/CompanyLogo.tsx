"use client";
import { useState } from "react";

const FALLBACK_BG = [
  "#0B6E5C",
  "#2563EB",
  "#B4781C",
  "#7C3AED",
  "#BE123C",
  "#0891B2",
  "#334155",
];

function hashColor(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return FALLBACK_BG[Math.abs(h) % FALLBACK_BG.length];
}

function initialsOf(name: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9가-힣\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function CompanyLogo({
  symbol,
  name,
  size = "md",
}: {
  symbol: string;
  name: string;
  size?: "sm" | "md";
}) {
  const [failed, setFailed] = useState(false);
  const cleanSymbol = symbol.trim();
  const px = size === "sm" ? 20 : 28;

  if (!cleanSymbol || failed) {
    return (
      <span
        className={`company-logo-fallback company-logo-${size}`}
        style={{ background: hashColor(name || cleanSymbol) }}
        aria-hidden="true"
      >
        {initialsOf(name || cleanSymbol)}
      </span>
    );
  }

  return (
    <span className={`company-logo-wrap company-logo-${size}`} aria-hidden="true">
      <img
        src={`https://companiesmarketcap.com/img/company-logos/64/${encodeURIComponent(cleanSymbol)}.webp`}
        width={px}
        height={px}
        alt=""
        loading="lazy"
        decoding="async"
        className="company-logo-img"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
