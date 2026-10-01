/* The Test Lab: pick a suite, watch it run, open the results.
   The numbers are the recorded run of the AcademyBugs environment — the shape
   a real Playwright or Cypress report leaves behind, kept in one place so the
   interface around it can change language without touching the artifacts.
   Test names, files, assertions and errors stay in English in every language. */
(function () {
"use strict";

const SUITES = {
  playwright: {
    suite: "Playwright Test Suite",
    browser: "Chromium",
    env: "Production/Test",
    allure: "./allure/index.html",
    total: 22, passed: 20, failed: 2, skipped: 0,
    rate: "90.9%", duration: "01:42",
    feed: ["Login with valid credentials", "Invalid login validation", "Product search", "Add product to cart", "Checkout validation", "Registration with existing email"],
    tests: [
      { name: "Login with valid credentials", status: "passed", duration: "1.21s",
        file: "tests/auth/login.spec.ts",
        steps: ["Open the application", "Fill in valid credentials", "Submit the form", "Assert the dashboard is visible"],
        assertions: ["✓ response.status() is 200", "✓ the user is redirected to /dashboard", "✓ the welcome message is visible"] },
      { name: "Invalid login validation", status: "passed", duration: "0.83s",
        file: "tests/auth/login.spec.ts",
        steps: ["Open the application", "Fill in a wrong password", "Submit the form", "Assert the error message"],
        assertions: ["✓ response.status() is 401", "✓ the error message matches invalid_credentials"] },
      { name: "Product search", status: "passed", duration: "1.42s",
        file: "tests/catalog/search.spec.ts",
        steps: ["Open the catalog", "Type the search term", "Submit the search", "Assert the result list"],
        assertions: ["✓ response.status() is 200", "✓ every result contains the search term", "✓ at least one product is listed"] },
      { name: "Add product to cart", status: "passed", duration: "2.31s",
        file: "tests/cart/cart.spec.ts",
        steps: ["Open a product", "Click add to cart", "Open the cart", "Assert the line item"],
        assertions: ["✓ the cart badge shows 1", "✓ the product name matches", "✓ the price matches the catalog"] },
      { name: "Checkout validation", status: "failed", duration: "1.98s",
        file: "tests/checkout/checkout.spec.ts",
        steps: ["Access checkout", "Add product", "Fill customer information", "Submit order", "Validate confirmation"],
        assertions: ["✓ response.status() is 200", "✓ the order payload carries the cart", "✕ the confirmation view is displayed"],
        expected: "Order confirmation should be displayed.",
        actual: "Checkout returned an unexpected response.",
        error: "Error: expect(received).toBe(expected)\n\nExpected view: \"confirmation\"\nReceived view: \"error\"\n\n  at tests/checkout/checkout.spec.ts:88:31",
        evi: {
          "Screenshot": "checkout-validation.png · 1440×900 · captured at the failing assertion",
          "Trace": "trace.zip · Playwright trace · 3 files",
          "Video": "video.webm · 00:04 · the last seconds of the run",
          "Error": "Error: expect(received).toBe(expected)\n\nExpected view: \"confirmation\"\nReceived view: \"error\"\n\n  at tests/checkout/checkout.spec.ts:88:31"
        } },
      { name: "Registration with existing email", status: "failed", duration: "1.07s",
        file: "tests/auth/registration.spec.ts",
        steps: ["Open the sign-up form", "Fill in an email that already exists", "Submit the form", "Assert the field error"],
        assertions: ["✓ response.status() is 409", "✓ the form stays on the page", "✕ the inline error message is shown"],
        expected: "An inline error should appear on the email field.",
        actual: "The form stayed silent after the 409 response.",
        error: "Error: expect(locator).toBeVisible()\n\nExpected: visible\nReceived: hidden\n\n  at tests/auth/registration.spec.ts:52:29",
        evi: {
          "Screenshot": "registration-existing-email.png · 1440×900 · captured at the failing assertion",
          "Trace": "trace.zip · Playwright trace · 3 files",
          "Error": "Error: expect(locator).toBeVisible()\n\nExpected: visible\nReceived: hidden\n\n  at tests/auth/registration.spec.ts:52:29"
        } }
    ]
  },
  cypress: {
    suite: "Cypress UI Suite",
    browser: "Chrome",
    env: "Staging",
    allure: "./allure/cypress.html",
    total: 15, passed: 14, failed: 1, skipped: 0,
    rate: "93.3%", duration: "00:58",
    feed: ["renders the product grid", "adds an item to the cart", "validates required fields", "applies a discount code", "updates the cart total"],
    tests: [
      { name: "renders the product grid", status: "passed", duration: "1.05s",
        file: "cypress/e2e/catalog.cy.js",
        steps: ["Visit the catalog", "Wait for the grid request", "Assert the product cards"],
        assertions: ["✓ the grid holds 8 products", "✓ every card carries a price"] },
      { name: "adds an item to the cart", status: "passed", duration: "1.76s",
        file: "cypress/e2e/cart.cy.js",
        steps: ["Visit a product", "Click add to cart", "Open the cart drawer"],
        assertions: ["✓ the cart badge shows 1", "✓ the line item matches the product"] },
      { name: "validates required fields", status: "passed", duration: "0.88s",
        file: "cypress/e2e/forms.cy.js",
        steps: ["Open the checkout form", "Submit it empty", "Assert the field errors"],
        assertions: ["✓ four field errors are shown", "✓ no request is sent"] },
      { name: "applies a discount code", status: "failed", duration: "1.44s",
        file: "cypress/e2e/discount.cy.js",
        steps: ["Open the cart", "Apply discount code SAVE10", "Assert the discounted total"],
        assertions: ["✓ the code is accepted", "✕ the total reflects the discount"],
        expected: "Total should reflect the 10% discount.",
        actual: "Total stayed unchanged after applying the code.",
        error: "AssertionError: expected 118.90 to equal 107.01\n\n  at Context.<anonymous> (cypress/e2e/discount.cy.js:24:31)",
        evi: {
          "Screenshot": "discount-code.cy.js.png · 1440×900 · captured at the failing assertion",
          "Video": "discount-code.cy.js.mp4 · 00:03 · the last seconds of the run",
          "Error": "AssertionError: expected 118.90 to equal 107.01\n\n  at Context.<anonymous> (cypress/e2e/discount.cy.js:24:31)"
        } }
    ]
  },
  api: {
    suite: "REST API Suite",
    browser: "Node 20",
    env: "Production/Test",
    allure: null,
    total: 12, passed: 12, failed: 0, skipped: 0,
    rate: "100%", duration: "00:21",
    feed: ["GET /users", "POST /login", "POST /login-invalid", "GET /products", "GET /health"],
    tests: [
      { name: "GET /users", status: "passed", duration: "0.31s",
        file: "tests/api/users.spec.ts",
        steps: ["Send GET /users", "Read the response body"],
        assertions: ["✓ status is 200", "✓ body is an array", "✓ every user carries id, name and role"] },
      { name: "POST /login", status: "passed", duration: "0.42s",
        file: "tests/api/auth.spec.ts",
        steps: ["Send POST /login with valid credentials", "Read the token"],
        assertions: ["✓ status is 200", "✓ token is present and not empty", "✓ expiresIn is 3600"] },
      { name: "POST /login-invalid", status: "passed", duration: "0.36s",
        file: "tests/api/auth.spec.ts",
        steps: ["Send POST /login with a wrong password", "Read the error body"],
        assertions: ["✓ status is 401", "✓ error is invalid_credentials", "✓ no token is issued"] },
      { name: "GET /products", status: "passed", duration: "0.29s",
        file: "tests/api/catalog.spec.ts",
        steps: ["Send GET /products", "Read the response body"],
        assertions: ["✓ status is 200", "✓ every product has id, name and price", "✓ prices are greater than 0"] },
      { name: "GET /health", status: "passed", duration: "0.11s",
        file: "tests/api/health.spec.ts",
        steps: ["Send GET /health"],
        assertions: ["✓ status is 200", "✓ status field is ok"] }
    ]
  }
};

const RUN_MS = 4200;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const $ = id => document.getElementById(id);
const pick = $("suitePick");
if (!pick) return;

const runner = $("runner"), runDone = $("runDone"), runSuite = $("runSuite"), runBadge = $("runBadge");
const progFill = $("progFill"), progPct = $("progPct"), curTest = $("curTest");
const repList = $("repList"), repNote = $("repNote"), repHint = $("repHint"), repBody = $("repBody");
const runAgain = $("runAgain"), openFull = $("openFull"), fullNote = $("fullNote");
const allure = $("allure"), allureFrame = $("allureFrame"), allureMeta = $("allureMeta"), allureClose = $("allureClose");

let current = null;
let running = false;
let timer = null;
let selected = -1;
let eviKey = null;

const text = (key, vars) => {
  if (window.I18n) return window.I18n.text(key, vars);
  const dict = window.I18N_EN || {};
  let value = dict[key] != null ? dict[key] : key;
  if (vars) Object.keys(vars).forEach(k => { value = String(value).split("{" + k + "}").join(vars[k]); });
  return value;
};

function esc(s){
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function setBusy(busy){
  pick.querySelectorAll("button[data-suite]").forEach(b => { b.disabled = busy; });
}

function drawRunner(){
  if (!current) return;
  const s = SUITES[current];
  runSuite.textContent = text("ab.prefix.running") + " " + s.suite;
  $("fBrowser").textContent = s.browser;
  $("fEnv").textContent = s.env;
  $("fTests").textContent = String(s.total);
}

function drawReportNote(){
  if (!current){ repNote.textContent = text("ab.report.empty"); return; }
  const s = SUITES[current];
  repNote.textContent = text("ab.report.note", { shown: String(s.tests.length), total: String(s.total) });
}

function drawReport(){
  if (!current){ repList.innerHTML = ""; return; }
  const s = SUITES[current];
  repList.innerHTML = s.tests.map((test, i) => `
    <button class="rep-row" type="button" data-i="${i}" aria-pressed="${i === selected}">
      <span class="rep-mark ${test.status}" aria-hidden="true">${test.status === "passed" ? "✓" : "✕"}</span>
      <span class="rep-name">${esc(test.name)}</span>
      <span class="st-label ${test.status}">${text("st." + test.status)}</span>
      <span class="rep-dur">${esc(test.duration)}</span>
    </button>`).join("");
  drawReportNote();
}

function drawDetail(){
  if (!current || selected < 0){ repHint.hidden = false; repBody.hidden = true; repBody.innerHTML = ""; return; }
  const test = SUITES[current].tests[selected];
  const failed = test.status === "failed";
  const eviKeys = test.evi ? Object.keys(test.evi) : [];
  if (!eviKeys.includes(eviKey)) eviKey = failed && eviKeys.length ? eviKeys[0] : null;

  repHint.hidden = true;
  repBody.hidden = false;
  repBody.innerHTML = `
    <div class="rep-head">
      <h3>${esc(test.name)}</h3>
      <span class="st-label big ${test.status}">${text("st." + test.status)}</span>
    </div>
    <dl class="rep-facts">
      <div><dt>${text("ab.d.duration")}</dt><dd>${esc(test.duration)}</dd></div>
      <div><dt>${text("ab.d.browser")}</dt><dd>${esc(SUITES[current].browser)}</dd></div>
      <div><dt>${text("ab.d.file")}</dt><dd class="mono">${esc(test.file)}</dd></div>
    </dl>
    <h4>${text("ab.d.steps")}</h4>
    <ol class="rep-steps">${test.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
    <h4>${text("ab.d.assertions")}</h4>
    <pre class="rep-pre">${esc(test.assertions.join("\n"))}</pre>
    ${failed ? `<h4>${text("ab.d.error")}</h4><pre class="rep-pre err">${esc(test.error)}</pre>` : ""}
    ${eviKeys.length ? `<h4>${text("ab.d.evidence")}</h4>
      <div class="evi-row btns">${eviKeys.map(k => `<button type="button" class="evi" data-evi="${esc(k)}" aria-pressed="${k === eviKey}">${text(eviKeyLabel(k))}</button>`).join("")}</div>
      <pre class="rep-pre">${esc(test.evi[eviKey])}</pre>` : ""}
    <div class="rep-close"><button class="btn btn-s" type="button" id="repClose">${text("ab.d.close")}</button></div>`;
}

/* the chip labels translate, the content behind them does not */
function eviKeyLabel(key){
  return ({ "Screenshot": "ab.ev.screenshot", "Trace": "ab.ev.trace", "Video": "ab.ev.video", "Error": "ab.ev.error" })[key] || key;
}

function finish(){
  const s = SUITES[current];
  clearInterval(timer); timer = null; running = false;
  progFill.style.width = "100%";
  progPct.textContent = "100%";
  curTest.textContent = s.feed[s.feed.length - 1];
  runner.hidden = true;
  runDone.hidden = false;
  $("stTotal").textContent = String(s.total);
  $("stPassed").textContent = String(s.passed);
  $("stFailed").textContent = String(s.failed);
  $("stSkipped").textContent = String(s.skipped);
  $("stRate").textContent = s.rate;
  $("stDur").textContent = s.duration;
  selected = -1; eviKey = null;
  drawReport();
  drawDetail();
  setBusy(false);
  runDone.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
}

function run(key){
  if (timer) clearInterval(timer);
  current = key; running = true; selected = -1; eviKey = null;
  const s = SUITES[current];
  setBusy(true);
  fullNote.hidden = true;
  closeAllure();
  if (allureFrame) allureFrame.removeAttribute("src");
  runDone.hidden = true;
  runner.hidden = false;
  runBadge.hidden = false;
  drawRunner();
  runner.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  repList.innerHTML = "";
  repNote.textContent = text("ab.report.empty");
  drawDetail();

  const started = Date.now();
  timer = setInterval(() => {
    const pct = Math.min(100, ((Date.now() - started) / RUN_MS) * 100);
    progFill.style.width = pct.toFixed(1) + "%";
    progPct.textContent = Math.round(pct) + "%";
    const i = Math.min(s.feed.length - 1, Math.floor((pct / 100) * s.feed.length));
    curTest.textContent = s.feed[i];
    if (pct >= 100) finish();
  }, 60);
}

pick.addEventListener("click", e => {
  const button = e.target.closest("button[data-suite]");
  if (button && !button.disabled) run(button.dataset.suite);
});

/* ---------- the full Allure report, opened below the run ----------
   The report is a static folder this site serves itself: one constant per
   suite decides where it comes from, and null keeps the text fallback for a
   suite that has not published one. The iframe only gets its src the first
   time the visitor asks for it, so nobody downloads Allure before clicking. */
function drawAllureMeta(){
  if (!current || !allureMeta) return;
  const s = SUITES[current];
  allureMeta.textContent = text("ab.allure.meta", { suite: s.suite, env: s.env, total: String(s.total) });
}
function closeAllure(){
  if (!allure) return;
  allure.hidden = true;
  openFull.setAttribute("aria-expanded", "false");
}

runAgain.addEventListener("click", () => { if (current) run(current); });

openFull.addEventListener("click", () => {
  const s = SUITES[current];
  if (!s || !s.allure){ fullNote.hidden = !fullNote.hidden; return; }
  if (allure && !allure.hidden){ closeAllure(); return; }
  if (!allureFrame.getAttribute("src")) allureFrame.src = s.allure;
  drawAllureMeta();
  allure.hidden = false;
  openFull.setAttribute("aria-expanded", "true");
  allure.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
});

if (allureClose) allureClose.addEventListener("click", () => { closeAllure(); openFull.focus(); });

repList.addEventListener("click", e => {
  const row = e.target.closest(".rep-row"); if (!row) return;
  selected = +row.dataset.i; eviKey = null;
  repList.querySelectorAll(".rep-row").forEach(r => r.setAttribute("aria-pressed", r === row ? "true" : "false"));
  drawDetail();
});

repBody.addEventListener("click", e => {
  const evi = e.target.closest(".evi");
  if (evi){
    eviKey = evi.dataset.evi;
    drawDetail();
    return;
  }
  if (e.target.closest("#repClose")){
    selected = -1;
    repList.querySelectorAll(".rep-row").forEach(r => r.setAttribute("aria-pressed", "false"));
    drawDetail();
  }
});

repNote.textContent = text("ab.report.empty");

if (window.I18n){
  window.I18n.onChange(() => {
    if (running) drawRunner();
    drawReport();
    drawDetail();
    drawAllureMeta();
  });
}
})();
