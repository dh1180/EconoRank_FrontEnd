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
- Country pages with 2022–2024 observations and country-specific discussion entry.
- English/Korean routes and UI dictionaries, locale-aware number formatting, language metadata and locale switching that keeps the current path. World Bank economy/region names remain in their official English form.
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

The API defaults to the reviewed 2024 reference year, with 2022–2024 in the initial snapshot. Refresh data through the backend importer, then rebuild/restart. The initial community displays the first 100 replies in a thread and moderation's first 50 reports; API report pagination is available for future UI extension. No live chat or auto translation is claimed. See the backend README for single-instance session/rate-limit constraints and deployment preparation.
