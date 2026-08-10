# AutomatedTests

A self-contained project: a small "Product Manager" website + REST API (the app under test), plus a Playwright (TypeScript) suite that tests it via both API calls and the browser UI. Runs in CI on every push to `main`.

## Project structure

```
.
├── app/                      # The app under test — a standalone Express server
│   ├── server.js             # REST API (/api/products) + serves the static site
│   └── public/                # The website itself (vanilla HTML/CSS/JS)
│       ├── index.html
│       ├── app.js
│       └── styles.css
├── tests/
│   ├── api/                  # API tests (no browser) — the "api" Playwright project
│   │   └── products.spec.ts
│   └── e2e/                  # Browser UI tests — chromium/firefox/webkit projects
│       └── products.spec.ts
├── playwright.config.ts      # Projects, baseURL, auto-starts app/server.js
├── tsconfig.json             # TypeScript config used for typechecking
├── .env.example              # Template for local env vars — copy to .env
├── .github/
│   └── workflows/
│       └── playwright.yml    # CI: runs tests on push to main, uploads HTML report
├── package.json
└── package-lock.json
```

### The app under test

`app/server.js` is a plain Express server with an in-memory product store:

| Method | Path                | Purpose                                  |
|--------|----------------------|-------------------------------------------|
| GET    | `/api/products`      | List all products                         |
| GET    | `/api/products/:id`  | Get one product (404 if unknown)          |
| POST   | `/api/products`      | Create a product (validates the body)     |
| DELETE | `/api/products/:id`  | Delete a product (404 if unknown)         |

It also serves `app/public/` as the website itself — a form to add products and a table listing them, backed by the same API.

You can run it standalone (without Playwright) to poke at it manually:

```bash
npm start
# then open http://localhost:3000
```

### Playwright projects

- **api** — runs everything in `tests/api/`, no browser needed, hits `/api/products` directly.
- **chromium / firefox / webkit** — run everything in `tests/e2e/`, driving the actual website in a real browser.

Playwright's `webServer` config (in `playwright.config.ts`) automatically starts `app/server.js` before any test run and shuts it down after — you never need to start the app manually before running tests.

Because all projects share one running server instance, tests generate a unique product name per run and delete whatever they create, so parallel workers/projects don't collide or leave junk data behind.

## Install

```bash
npm install
npx playwright install --with-deps   # downloads browser binaries (chromium/firefox/webkit)
```

No `.env` is required to get started — `PORT` defaults to `3000`. Copy `.env.example` to `.env` only if you want to override it.

## Build / typecheck

There's no compile step — Playwright transpiles TypeScript on the fly, and `app/server.js` is plain Node. To typecheck the test suite:

```bash
npm run typecheck
```

## Run locally

```bash
npm test           # run all projects (api + chromium + firefox + webkit); auto-starts the app
npm run test:api   # run only the API tests
npm run test:ui    # open Playwright's UI mode
npm run report     # open the last HTML report
```

## CI

`.github/workflows/playwright.yml` runs the full suite on every push to `main`. No secrets are required — the app under test is spun up locally inside the CI job by Playwright's `webServer` config, the same as running locally.
