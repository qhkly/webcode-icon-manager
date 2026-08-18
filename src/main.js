// ── Theme Utilities + Initialization (runs before React) ──
(function () {
  const KEY = 'icon-manager.theme';
  const MEDIA = window.matchMedia('(prefers-color-scheme: dark)');

  function readPref() {
    const saved = localStorage.getItem(KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  }

  function resolve(pref) {
    if (pref === 'light' || pref === 'dark') return pref;
    return MEDIA.matches ? 'dark' : 'light';
  }

  function apply(pref) {
    const resolved = resolve(pref);
    document.documentElement.dataset.theme = resolved;
    return resolved;
  }

  window.themeUtil = { KEY, MEDIA, readPref, resolve, apply };

  // Paint before first render to avoid a flash of the wrong theme
  apply(readPref());
})();
