# QA Engineer portfolio

Portfolio for **Tulio Ramos**, QA Engineer.
Live at <https://tuliohoc.github.io/portifolio/>.

Static HTML, CSS and vanilla JavaScript. No framework, no build step, no runtime
dependencies. The only third party request the pages make is to Google Fonts.

The **Test Lab does not live here**: it is published from the test suite
repository at <https://tuliohoc.github.io/academybugs-tests-/>, and every entry
point in this site — the nav item, the three cards, the project card — links
straight to it. This repository keeps the doorway, not the screen.

Two pages, one shared stylesheet, and a language switch that covers all of it:

- **`index.html`** — hero, about, experience, skills, what I do, projects, the
  Test Lab section, API testing, a bug investigation, observability, education,
  GitHub and contact. The whole interface speaks English or Portuguese,
  instantly and without a reload. The Test Lab entry in the navigation and the
  whole Test Lab card open the deployed lab at
  <https://tuliohoc.github.io/academybugs-tests-/>.
- **`academybugs.html`** — the doorway to the Test Lab: it states where the lab
  moved and hands the visitor over to it, with a link for whoever lands there
  with redirects turned off.

## Layout

```
.
|-- index.html                   # the landing page
|-- academybugs.html             # the doorway: redirects to the Test Lab
|-- 404.html                     # what GitHub Pages serves for an unknown path
|-- assets/
|   |-- css/site.css             # design tokens first, then components
|   |-- js/i18n/en.js            # the English dictionary
|   |-- js/i18n/pt.js            # the Portuguese dictionary
|   |-- js/i18n/index.js         # the i18n engine: apply, switch, persist
|   |-- js/theme.js              # colour theme, restores before first paint
|   |-- js/main.js               # nav, name split, accordions, API tester
|   \-- img/                     # portrait, favicon, social icons
|-- scripts/serve.mjs            # the static server the tests and previews run on
|-- scripts/ci-summary.mjs       # turns the Playwright JSON report into the summary CI draws
|-- tests/smoke.spec.ts          # Playwright suite, 28 tests x 2 projects
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
content — the bug report, the API tester — so it can redraw itself. The choice
persists in `localStorage` and defaults to Portuguese when the browser asks
for it.

The boundary is deliberate: interface text is translated, artifacts are not.
Test names, file paths, endpoints, status codes, assertion output and tool
names stay in English in both languages, because that is how they appear in
the reports they come from.

## Tests

`yarn test` runs 28 checks twice — desktop Chromium and a Pixel 7 viewport —
56 in total, covering the paths a visitor actually takes: navigation, the
experience and bug accordions, the skills groups, the API tester, the PT/EN
switch and its persistence, the theme, the Test Lab doorway and where it hands
you over to, the not found page, and the legacy anchors this design replaced.

The doorway at `academybugs.html` is one screen deep: it says the lab moved,
offers the link for anyone who lands there without following the redirect, and
hands the browser over to the published Test Lab. Every entry point in this
site — the nav item, the three cards, the project card — carries the same
address, `https://tuliohoc.github.io/academybugs-tests-/`, and the tests check
that they all do.

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

**The Test Lab is published from the `academybugs-tests-` suite repository**,
at <https://tuliohoc.github.io/academybugs-tests-/>, and this site only points
at it: the nav item, the three cards and the project card all carry that
address, and `academybugs.html` redirects there. The numbers the lab shows are
recorded, not measured: they come out of the real Allure run against
`academybugs.com`, and the workflow that publishes the lab rewrites
`site/assets/js/lab.js` from each run (`scripts/lab-data.mjs` then
`scripts/sync-lab.mjs`), so the page can never drift away from the report it
sits beside. `SUITES.<suite>.allure` in that same file is the address of the
report the button opens — one line per suite, pointing at the published
report, and `null` when a suite has nothing published yet.

## Licence

Copyright (c) 2026 Tulio Ramos. All rights reserved. See `LICENSE.md`.
The design, code and written content of this site are not free to reuse.
