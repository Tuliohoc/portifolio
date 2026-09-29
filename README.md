# QA Engineer portfolio

Portfolio and test lab for **Tulio Ramos Lopes da Silva**, QA Engineer.
Live at <https://tuliohoc.github.io/portifolio/>.

Static HTML, CSS and vanilla JavaScript. No framework, no build step, no runtime
dependencies. The only third party request the page makes is to Google Fonts.

Two pages, one shared stylesheet, and a language switch that covers all of it:

- **`index.html`** — hero, about, experience, skills, what I do, projects, the
  Test Lab, API testing, a bug investigation, observability, education, GitHub
  and contact. The whole interface speaks English or Portuguese, instantly and
  without a reload.
- **`academybugs.html`** — the AcademyBugs project page: the simulated run of
  three suites (Playwright, Cypress, API) and the full report it produces,
  with steps, assertions, errors and evidence per test.

## Layout

```
.
|-- index.html                   # the landing page
|-- academybugs.html             # the project page: run + report
|-- 404.html                     # what GitHub Pages serves for an unknown path
|-- assets/
|   |-- css/site.css             # design tokens first, then components
|   |-- js/i18n/en.js            # the English dictionary
|   |-- js/i18n/pt.js            # the Portuguese dictionary
|   |-- js/i18n/index.js         # the i18n engine: apply, switch, persist
|   |-- js/theme.js              # colour theme, restores before first paint
|   |-- js/main.js               # nav, name split, accordions, API tester
|   |-- js/lab.js                # suite runs and the report they produce
|   \-- img/                     # portrait, favicon, social icons
|-- scripts/serve.mjs            # the static server the tests and previews run on
|-- scripts/ci-summary.mjs       # turns the Playwright JSON report into the summary CI draws
|-- tests/smoke.spec.ts          # Playwright suite, 32 tests x 2 projects
|-- .github/workflows/           # ci.yml, deploy.yml
\-- SECURITY.md, LICENSE.md      # hardening, and all rights reserved
```

## Run it

```bash
yarn install
yarn serve          # http://127.0.0.1:5173
yarn playwright:install:chromium
yarn test
```

Serve the folder rather than opening the files: the Content Security Policy and
the relative paths behave differently over `file://`. `scripts/serve.mjs` is a
few lines of Node with no dependencies, and it answers an unknown path with
`404.html` and a 404 the way GitHub Pages does.

## The language switch

Every translatable string carries a key (`data-i18n="hero.role"`) and lives in
one of the two dictionaries. `assets/js/i18n/index.js` fills the page from the
dictionary in use, updates the title and meta tags, and notifies the scripted
content — the lab runner, the report — so it can redraw itself. The choice
persists in `localStorage` and defaults to Portuguese when the browser asks
for it.

The boundary is deliberate: interface text is translated, artifacts are not.
Test names, file paths, endpoints, status codes, assertion output and tool
names stay in English in both languages, because that is how they appear in
the reports they come from.

## Tests

`yarn test` runs 32 checks twice — desktop Chromium and a Pixel 7 viewport —
64 in total, covering the paths a visitor actually takes: navigation, the
experience and bug accordions, the skills groups, the API tester, the PT/EN
switch and its persistence, the theme, the lab run and its report down to a
single failed test's evidence chips, the not found page, and the legacy
anchors this design replaced.

Everything is local: the suites the lab "runs" are recorded in `lab.js`, so a
red run is testable without waiting on anything.

## CI

Two jobs, and the shape is deliberate. GitHub draws the graph on the run page
from the `needs` between them.

```
smoke ────→ summary
```

`smoke` runs the suite on Chromium. `summary` waits for it and writes a
markdown summary onto the run page: totals, a split per project, the slowest
five, and a mermaid chart. It runs even when the suite went red, because that
is exactly when somebody wants to see what fell over without downloading an
artifact. A run that never started is reported as a failure, not as zero
failures out of zero tests.

Runs are serialised per branch: a new push cancels the one already in flight
rather than racing it.

## Deployment

A push to `main` triggers `deploy.yml`, which uploads the repository as a Pages
artifact and publishes it. Deployments share a `concurrency` group, so two never
publish at once. Workflows run with `contents: read`; only the publish job is
granted `pages: write` and `id-token: write`.

## Three things to know before editing

**Bump the `?v=` token** on `site.css` and the scripts in every page whenever
either file changes. GitHub Pages lets a browser hold them past a deploy, so
without it a visitor keeps the old stylesheet against the new markup and the
site looks unchanged after a successful publish.

**Keep the copyright comment inside `assets/img/linkedin.svg`.** It comes from
Font Awesome Free under CC BY 4.0 and that comment is what satisfies the
attribution. Both social icons are CSS masks rather than images, so they take
the link's colour instead of arriving in their own blue or black; a
replacement whose cut outs are drawn as white shapes rather than as real holes
will fill in solid under a mask. If either file goes missing the plain word
carries the link.

**`assets/js/lab.js` holds the numbers the Test Lab shows** — 22 tests, 20
passed, 2 failed, 90.9%, 01:42. They are recorded, not measured. When a real
suite exists to replace them, that file and the report section of
`academybugs.html` are where it plugs in.

## Licence

Copyright (c) 2026 Tulio Ramos Lopes da Silva. All rights reserved. See `LICENSE.md`.
The design, code and written content of this site are not free to reuse.
