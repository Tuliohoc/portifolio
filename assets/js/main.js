/* Shared page behaviour. The language layer lives in i18n/index.js; this file
   carries the hash guard, navigation state, scroll reveals, the accordions,
   the hero name animation and the API tester. Everything degrades: without
   JavaScript the content is already in the markup, in English. */
(function () {
"use strict";

/* A hash never reaches the server, so a wrong one cannot answer 404 by itself.
   Anchors from the previous design keep landing on the section that replaced
   them; anything else is a wrong address. */
const LEGACY = {me:"about", approach:"about", journey:"experience", work:"projects", reads:"projects"};
(function checkHash(){
  let id = "";
  try { id = decodeURIComponent(location.hash.slice(1)); } catch (e) { id = location.hash.slice(1); }
  if (!id || document.getElementById(id)) return;
  if (LEGACY[id]) { location.replace("#" + LEGACY[id]); return; }
  location.replace("404.html");
})();

/* A portfolio opens at the top; a shared address that names a section still wins. */
if ("scrollRestoration" in history){
  history.scrollRestoration = "manual";
  if (!location.hash) addEventListener("load", () => window.scrollTo(0, 0));
}
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- hero: the name rises letter by letter, never breaking a word ---------- */
const nameEl = document.getElementById("name");
if (nameEl && !reduce){
  let i = 0;
  const split = (node) => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3){
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(" ")); return; }
        const word = document.createElement("span");
        word.className = "word";
        word.setAttribute("aria-hidden","true");
        [...part].forEach(ch => {
          const s = document.createElement("span");
          s.className = "ch"; s.textContent = ch; s.style.animationDelay = (120 + i++ * 38) + "ms";
          word.appendChild(s);
        });
        frag.appendChild(word);
      });
      n.replaceWith(frag);
    } else split(n);
  });
  split(nameEl);
}

/* the avatar says hello on hover, keyboard focus, or a tap */
const avatar = document.getElementById("avatar");
if (avatar){
  avatar.addEventListener("click", () => avatar.classList.toggle("on"));
  document.addEventListener("click", e => { if (!avatar.contains(e.target)) avatar.classList.remove("on"); });
}

/* ---------- accordions: experience roles and the bug report ---------- */
document.addEventListener("click", e => {
  const head = e.target.closest && e.target.closest(".job-head");
  if (!head) return;
  head.setAttribute("aria-expanded", head.getAttribute("aria-expanded") === "true" ? "false" : "true");
});

/* ---------- reveal: only hide what is still below the fold ---------- */
if (!reduce && "IntersectionObserver" in window){
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in"); en.target.classList.remove("pre"); io.unobserve(en.target);
  }), {rootMargin:"0px 0px -8% 0px"});
  document.querySelectorAll(".rv").forEach(el => {
    if (el.getBoundingClientRect().top > innerHeight){ el.classList.add("pre"); io.observe(el); }
  });
}

/* ---------- header state and active section ---------- */
const bar = document.getElementById("bar");
const nav = document.getElementById("nav");
const links = nav ? [...nav.querySelectorAll("a")].filter(a => (a.getAttribute("href") || "").startsWith("#")) : [];
const sections = links.map(a => document.querySelector(a.hash)).filter(Boolean);
let lastActive = "";
function setActive(id){
  if (id === lastActive) return; lastActive = id;
  links.forEach(a => a.setAttribute("aria-current", a.hash === "#" + id ? "true" : "false"));
  const cur = links.find(a => a.hash === "#" + id);
  if (cur && nav.scrollWidth > nav.clientWidth){
    nav.scrollTo({left: cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth"});
  }
}
let ticking = false;
function onScroll(){
  ticking = false;
  if (bar) bar.classList.toggle("scrolled", scrollY > 8);
  if (!sections.length) return;
  const probe = scrollY + innerHeight * .35;
  let id = sections[0].id;
  sections.forEach(s => { if (s.offsetTop <= probe) id = s.id; });
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) id = sections[sections.length - 1].id;
  setActive(id);
}
addEventListener("scroll", () => { if (!ticking){ ticking = true; requestAnimationFrame(onScroll); } }, {passive:true});
addEventListener("resize", onScroll);
links.forEach(a => a.addEventListener("click", () => setActive(a.hash.slice(1))));
onScroll();

/* ---------- API tester: endpoints are technical and stay in English ---------- */
const ENDPOINTS = [
  { m:"GET", path:"/users", status:"200 OK", panes:{
    response:'HTTP/1.1 200 OK\ncontent-type: application/json\n\n[\n  { "id": 1, "name": "ana",   "role": "admin" },\n  { "id": 2, "name": "bruno", "role": "user"  }\n]',
    assertions:'✓ status is 200\n✓ response time < 500 ms\n✓ body is an array of 2 users\n✓ every user carries id, name and role',
    time:'238 ms',
    status:'200 OK',
    payload:'{\n  "count": 2,\n  "page": 1\n}' }},
  { m:"POST", path:"/login", status:"200 OK", panes:{
    response:'HTTP/1.1 200 OK\ncontent-type: application/json\n\n{\n  "token": "eyJhbGciOiJIUzI1NiJ9…",\n  "expiresIn": 3600\n}',
    assertions:'✓ status is 200\n✓ token is present and not empty\n✓ expiresIn is 3600',
    time:'412 ms',
    status:'200 OK',
    payload:'{\n  "email": "qa@academybugs.dev",\n  "password": "••••••••"\n}' }},
  { m:"POST", path:"/login-invalid", status:"401 Unauthorized", panes:{
    response:'HTTP/1.1 401 Unauthorized\ncontent-type: application/json\n\n{\n  "error": "invalid_credentials",\n  "message": "E-mail or password is incorrect"\n}',
    assertions:'✓ status is 401\n✓ error is invalid_credentials\n✓ no token is issued',
    time:'197 ms',
    status:'401 Unauthorized',
    payload:'{\n  "email": "qa@academybugs.dev",\n  "password": "wrong"\n}' }},
  { m:"GET", path:"/products", status:"200 OK", panes:{
    response:'HTTP/1.1 200 OK\ncontent-type: application/json\n\n[\n  { "id": 101, "name": "Blue T-Shirt", "price": 29.9 },\n  { "id": 102, "name": "Sneakers",     "price": 89.0 }\n]',
    assertions:'✓ status is 200\n✓ body is an array\n✓ every product has id, name and price\n✓ prices are greater than 0',
    time:'265 ms',
    status:'200 OK',
    payload:'{\n  "count": 2,\n  "currency": "BRL"\n}' }}
];

const apiList = document.getElementById("apiList");
if (apiList){
  const hint = document.getElementById("apiHint");
  const tabs = document.getElementById("apiTabs");
  const pane = document.getElementById("apiPane");
  const code = pane.querySelector("code");
  let selected = -1;
  let tab = "response";

  apiList.innerHTML = ENDPOINTS.map((e, k) => `
    <button class="api-row" type="button" data-k="${k}" aria-pressed="false">
      <span class="meth ${e.m.toLowerCase()}">${e.m}</span>
      <code>${e.path}</code>
      <span class="code ${e.status.startsWith("2") ? "ok" : "warn"}">${e.status}</span>
    </button>`).join("");

  function draw(){
    if (selected < 0) return;
    code.textContent = ENDPOINTS[selected].panes[tab];
  }
  apiList.addEventListener("click", e => {
    const row = e.target.closest(".api-row"); if (!row) return;
    selected = +row.dataset.k;
    apiList.querySelectorAll(".api-row").forEach(r => r.setAttribute("aria-pressed", r === row ? "true" : "false"));
    hint.hidden = true; tabs.hidden = false; pane.hidden = false;
    draw();
  });
  tabs.addEventListener("click", e => {
    const button = e.target.closest("[data-tab]"); if (!button) return;
    tab = button.dataset.tab;
    tabs.querySelectorAll("[role=tab]").forEach(b => b.setAttribute("aria-selected", b === button ? "true" : "false"));
    draw();
  });
}
})();
