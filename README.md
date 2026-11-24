# EconoRank Frontend

Next.js 16 (App Router / React / TypeScript) frontend for **EconoRank** (`econorank.com`).

## Key Features
- **Editorial Sovereign Intelligence Design**: Warm ivory light mode & obsidian dark mode (`ThemeToggle`), country flags (`CountryFlag`), company logos (`CompanyLogo`), and custom brand favicon set (`icon.svg`, `favicon.ico`, `apple-icon.png`).
- **IMF WEO Economic Explorer (`/[lang]`, `/[lang]/compare`, `/[lang]/countries/[code]`)**:
  - Nominal GDP, GDP per capita, and PPP GDP rankings with instant search, regional share stacked bar, floating quick-compare dock, and UTF-8 CSV export (`econorank-*.csv`).
  - Interactive 2022–2031 SVG trend chart separating actuals from IMF forecasts.
  - Multi-country comparison with quick regional presets and async year switching.
- **Live Global Company Market Cap (`/[lang]/companies`)**:
  - Global Top 250 plus on-demand Top 100 rankings by world region and 30+ national stock exchanges.
- **78 World Languages & Auto-Locale Redirect (`/`)**:
  - Detects saved cookie (`econorank_lang`), edge geolocation headers (`CF-IPCountry`, `X-Vercel-IP-Country`), `/api/geo`, and `Accept-Language` with RTL support for Arabic, Hebrew, Persian, Urdu, Pashto, and Kurdish.
- **Global Economic Community (`/[lang]/community`)**:
  - Member accounts (sign-up country lock + No-VPN notice) and anonymous posting with IP-country default nicknames & deletion passwords.
  - Live GDP & Market Cap stat card picker/embeds (`StatEmbed`) and on-demand `Translate` / `Show original` toggle backed by LibreTranslate + DB cache.

## Run Locally

Node.js 20+:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

| Environment | Default | Purpose |
|---|---|---|
| `API_BASE_URL` | `http://127.0.0.1:8080` | Upstream Spring Boot API URL |
| `SITE_URL` | `http://localhost:3000` | Canonical, sitemap, and OpenGraph origin |

## Verification

```sh
npm test
npm run typecheck
npm run build
```
