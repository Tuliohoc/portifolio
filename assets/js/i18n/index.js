/* The translation layer. One dictionary per language, applied in place: no
   page is duplicated, no reload happens, and the choice is remembered in
   localStorage so a visitor never picks it twice.

   Markup contract:
     data-i18n="key"          -> textContent
     data-i18n-html="key"     -> innerHTML (only for strings that carry markup)
     data-i18n-attr="a:key;b:k" -> attributes, e.g. aria-label and title
   Anything missing falls back to English, then to whatever the markup already
   says, so a key that is forgotten blanks nothing out.

   Technical artifacts never come through here: test names, files, endpoints,
   assertions and errors live in the markup or in the suite data, in English. */
(function () {
  "use strict";

  var STORE = "lang";
  var dicts = { en: window.I18N_EN || {}, pt: window.I18N_PT || {} };
  var listeners = [];
  var current = "en";

  function read() {
    var saved = null;
    try { saved = localStorage.getItem(STORE); } catch (e) {}
    if (saved && dicts[saved]) return saved;
    var nav = (navigator.language || "en").toLowerCase();
    return nav.indexOf("pt") === 0 ? "pt" : "en";
  }

  function t(key, vars) {
    var dict = dicts[current] || {};
    var value = dict[key];
    if (value == null) value = dicts.en[key];
    if (value == null) return null;
    if (vars) Object.keys(vars).forEach(function (k) {
      value = String(value).split("{" + k + "}").join(vars[k]);
    });
    return value;
  }

  /* text() is the public form of t(): it never returns null, and it takes the
     same substitution variables, so a template like {shown} always arrives
     with its numbers filled in */
  function text(key, vars) {
    var value = t(key, vars);
    return value == null ? "" : value;
  }

  function setMeta(selector, value) {
    if (!value) return;
    var node = document.head.querySelector(selector);
    if (node) node.setAttribute("content", value);
  }

  function apply() {
    document.documentElement.lang = current;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var value = t(el.getAttribute("data-i18n"));
      if (value != null) el.textContent = value;
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var value = t(el.getAttribute("data-i18n-html"));
      if (value != null) el.innerHTML = value;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var i = pair.indexOf(":");
        if (i < 0) return;
        var value = t(pair.slice(i + 1).trim());
        if (value != null) el.setAttribute(pair.slice(0, i).trim(), value);
      });
    });

    document.querySelectorAll("[data-lang]").forEach(function (button) {
      button.setAttribute("aria-pressed", button.getAttribute("data-lang") === current ? "true" : "false");
    });

    var title = t("meta.title");
    if (title) document.title = title;
    setMeta('meta[name="description"]', t("meta.description"));
    setMeta('meta[property="og:title"]', t("meta.title"));
    setMeta('meta[property="og:description"]', t("meta.description"));

    /* theme.js writes its own label on click; it asks this layer first, and
       this layer refreshes the label whenever the language moves under it */
    var theme = document.getElementById("theme");
    if (theme) {
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      theme.setAttribute("aria-label", text(dark ? "theme.toLight" : "theme.toDark"));
      theme.setAttribute("title", text("theme.label"));
    }
  }

  function set(lang) {
    if (!dicts[lang] || lang === current) return;
    current = lang;
    try { localStorage.setItem(STORE, lang); } catch (e) {}
    apply();
    notify();
  }

  function notify() {
    listeners.forEach(function (fn) { fn(current); });
  }

  function onChange(fn) {
    listeners.push(fn);
    fn(current);
  }

  current = read();

  document.addEventListener("DOMContentLoaded", function () {
    apply();
    notify();
    document.addEventListener("click", function (event) {
      var button = event.target.closest ? event.target.closest("[data-lang]") : null;
      if (button) set(button.getAttribute("data-lang"));
    });
  });

  window.I18n = {
    t: t,
    text: text,
    set: set,
    lang: function () { return current; },
    onChange: onChange
  };
})();
