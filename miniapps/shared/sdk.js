/* Loopapp miniapp SDK v1 — inlined into every miniapp at build time.
 * The miniapp runs in a sandboxed iframe with an opaque origin: no cookies,
 * no storage, no network. It can only talk to the host through postMessage. */
(function () {
  var params = new URLSearchParams(location.search);
  var lang = params.get("lang") === "en" ? "en" : "es";
  var theme = params.get("theme") === "light" ? "light" : "dark";
  document.documentElement.lang = lang;
  document.documentElement.setAttribute("data-theme", theme);

  function send(type, extra) {
    var msg = { source: "loop-miniapp", v: 1, type: type };
    if (extra) for (var k in extra) msg[k] = extra[k];
    try { window.parent.postMessage(msg, "*"); } catch { /* host unavailable */ }
  }

  window.addEventListener("error", function (e) {
    send("error", { message: String((e && e.message) || "error").slice(0, 200) });
  });
  window.addEventListener("unhandledrejection", function () {
    send("error", { message: "unhandled rejection" });
  });

  window.Loop = {
    lang: lang,
    theme: theme,
    /** Pick the string for the current language: Loop.t({ es: "Hola", en: "Hi" }) */
    t: function (pair) { return pair[lang] || pair.es; },
    /** Report a meaningful interaction (used for anonymous analytics only). */
    interaction: function (name) { send("interaction", { name: String(name).slice(0, 40) }); },
    ready: function () { send("ready"); },
  };
})();
