# AutomatedTests

Playwright test suite (TypeScript) for an external API, run in CI on every push to `main`.

## Project structure

```
.
├── tests/
│   ├── api/                 # API tests (no browser) — the "api" Playwright project
│   │   └── products.spec.ts
│   └── e2e/                 # Reserved for future browser-based UI tests
│       └── .gitkeep         # (chromium/firefox/webkit projects, currently empty)
├── playwright.config.ts     # Projects, baseURL, auth header, reporters
├── tsconfig.json            # TypeScript config used for typechecking
├── .env.example             # Template for local env vars — copy to .env
├── .github/
│   └── workflows/
│       └── playwright.yml   # CI: runs tests on push to main, uploads HTML report
├── package.json
└── package-lock.json
```

### Playwright projects

- **api** — runs everything in `tests/api/`, no browser needed, this is where the external API tests live.
- **chromium / firefox / webkit** — run everything in `tests/e2e/`, scaffolded for future UI tests. They currently match zero test files, so they're a no-op until tests are added there.

### Configuration

`playwright.config.ts` reads these environment variables (via `dotenv`, loaded from `.env` locally or from the CI environment):

| Variable     | Purpose                                              |
|--------------|-------------------------------------------------------|
| `BASE_URL`   | Base URL of the external API                          |
| `API_KEY`    | Sent as the `X-API-Key` header on every request        |
| `PROJECT_ID` | Query param used by the example test                   |

## Install

```bash
npm install
npx playwright install --with-deps   # downloads browser binaries (chromium/firefox/webkit)
```

Then create your local env file:

```bash
cp .env.example .env
# edit .env and fill in the real API_KEY
```

## Build / typecheck

There's no compile step — Playwright transpiles TypeScript on the fly. To typecheck the project:

```bash
npm run typecheck
```

## Run locally

```bash
npm test           # run all projects (api + chromium + firefox + webkit)
npm run test:api   # run only the API tests
npm run test:ui    # open Playwright's UI mode
npm run report     # open the last HTML report
```

## CI

`.github/workflows/playwright.yml` runs the full suite on every push to `main`. It expects a repository secret named `API_KEY`:

```bash
gh secret set API_KEY --repo Santina77/AutomatedTests
```

`BASE_URL` and `PROJECT_ID` are set directly in the workflow file since they aren't sensitive. The HTML report is uploaded as a build artifact on every run (pass or fail).
