# StatAgora Frontend

Next.js 16 App Router / React / TypeScript frontend for the [Spring Boot API](https://github.com/dh1180/StatAgora_BackEnd).

## Run

Node.js 24+:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Windows: `Copy-Item .env.example .env.local`. Start the backend on port 8080, then open `http://localhost:3000/en` or `/ko`.

| Environment    | Default                 | Purpose                                             |
| -------------- | ----------------------- | --------------------------------------------------- |
| `API_BASE_URL` | `http://127.0.0.1:8080` | Server-side API and browser `/api` rewrite upstream |
| `SITE_URL`     | `http://localhost:3000` | Canonical, hreflang, sitemap and robots origin      |

`API_BASE_URL` is used by the rewrite at build time: rebuild when changing the API host. Do not expose backend/database secrets through `NEXT_PUBLIC_*`. The Dockerfile uses standalone Next.js output; the backend repository includes sibling-directory Compose instructions for the full stack. Configure the real HTTPS origin at build time for deployment. No hosting deployment is included.

## Implemented

- Server-rendered GDP, GDP at PPP, and exports rankings with metric/year filters, pagination and country detail links.
- Genuine World Bank WDI data from the API. Reference year, retrieval date, source links, unit and goods/services definition displayed. No made-up fallback values.
- Searchable comparison selector for up to five economies, common-year bar charts and explicit missing values.
- Country pages with historical observations and labeled current-year IMF estimates/forecasts and country-specific discussion entry.
- English/Korean routes and UI dictionaries, locale-aware number formatting, language metadata and locale switching that keeps the current path. Korean country and region names are used throughout rankings, comparison search/chips, country profiles and community selectors; English preserves publisher names.
- Page metadata, canonical/hreflang links, sitemap, robots, semantic tables, skip link, visible keyboard focus, responsive layouts and reduced-motion support.
- Real session-based registration/login/logout, plain-text posts/comments, author soft deletion, reports, blocked-author management and an administrator report/hide panel. Community pages are excluded from indexing in the MVP.
- Readable empty, loading, error and API-unavailable states. Fetch failures are not replaced with mock statistics.

Browser calls go to the same origin at `/api`, and the Next.js rewrite forwards them to Spring Boot. The browser stores an HttpOnly session cookie. Before each mutation the client fetches a CSRF token and returns it in the server-selected header. Never store credentials/tokens in local storage. Frontend JSX escapes user text; do not introduce `dangerouslySetInnerHTML` for community content.

## Routes

| Route                    | Page                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| `/`                      | Redirect to `/en`                                                |
| `/{en,ko}`               | Ranking dashboard; `indicator`, `year`, `page` query filters     |
| `/{en,ko}/compare`       | Repeated `country=USA&country=KOR` and `year` query filters      |
| `/{en,ko}/countries/KOR` | Country history and discussion entry                             |
| `/{en,ko}/community`     | `space=global` or `space=country-KOR`, optional `post` deep link |

## Validation

```sh
npm test
npm run build
npm run typecheck
```

Tests cover URL input boundaries, missing versus zero values, both number locales and explicit upstream failures. Production build and strict type checking are also run by CI. Local browser verification covered rankings, comparison changes, registration, post creation with script-like text rendered safely, and comment persistence through the actual Spring Boot proxy. No production accounts or data are seeded.

The API now defaults to the latest IMF GDP/PPP release and latest available reference year up to the current year; exports use World Bank actuals. The source selector can switch to WDI actuals. Every view shows source publication vintage, reference year and actual/estimate/forecast status, with available source/retrieval details. The backend polls the official sources every six hours without rebuilding the frontend. Missing exports for a chosen year remain unavailable, without silently switching years.

The comparison screen uses selected-country chips, compact searchable choices, consistent country colors, metric cards with units and per-card source information. Korean headings use deliberate line grouping and Korean fonts; table rank headings do not split. Flexible grids, shrinkable fieldsets, wrapping country names and locally scrollable tables preserve content at narrow widths.

The community still displays the first 100 replies and the first 50 reports. No live chat or auto translation is claimed. See the backend README for source update configuration and single-instance operating constraints. Tests now include Korean country/region display and English-name preservation (5 frontend tests total).
