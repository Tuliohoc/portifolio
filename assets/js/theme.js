/* Runs in the head, before the page paints, so a returning visitor never sees the wrong theme flash.
   The theme follows the system until the visitor picks one, then remembers that choice. */
(function () {
  "use strict";
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem("theme");
    root.setAttribute("data-theme", saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  } catch (e) {}

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.getElementById("theme");
    var bar = document.getElementById("bar");
    function label() {
      if (!button) return;
      var dark = root.getAttribute("data-theme") === "dark";
      var key = dark ? "theme.toLight" : "theme.toDark";
      var local = window.I18n && window.I18n.t(key);
      button.setAttribute("aria-label", local || (dark ? "Switch to light theme" : "Switch to dark theme"));
    }
    label();
    if (button) button.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      label();
    });
    if (bar) {
      var sync = function () { bar.classList.toggle("scrolled", window.scrollY > 8); };
      window.addEventListener("scroll", sync, { passive: true });
      sync();
    }
  });
})();
