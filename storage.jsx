// meditype — versioned persistence layer
//
// Wraps localStorage so we can evolve the preference schema without bricking
// returning users. Keys live under `meditype.v{N}.{key}` with a self-describing
// envelope `{ __v, value }`. If the stored version doesn't match what the
// caller asks for, get() returns the fallback — old data is silently ignored
// (and overwritten on the next set), so a schema bump is a one-line change.
//
// Per-book typing progress (window.getProgressFor / `meditype.progress`) is
// intentionally NOT routed through here — that schema is stable and lives in
// passages.jsx. This layer is for app-wide *preferences* only.
window.MTStorage = (function () {
  const NS = 'meditype';
  const fullKey = (key, version) => `${NS}.v${version}.${key}`;

  function get(key, version, fallback) {
    try {
      const raw = localStorage.getItem(fullKey(key, version));
      if (raw == null) return fallback;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.__v !== version) return fallback;
      return parsed.value;
    } catch (e) { return fallback; }
  }

  function set(key, version, value) {
    try {
      localStorage.setItem(fullKey(key, version), JSON.stringify({ __v: version, value }));
    } catch (e) { /* quota / private mode — silently ignore */ }
  }

  function remove(key, version) {
    try { localStorage.removeItem(fullKey(key, version)); } catch (e) {}
  }

  // One-time silent migration of legacy unversioned keys into v1.
  (function migrateLegacy() {
    const FLAG = `${NS}.migrated.v1`;
    if (localStorage.getItem(FLAG)) return;
    try {
      // Old `meditype` blob — rehydrated session state in earlier builds.
      // Keep only true preferences; drop screen/book/settings (session-only now).
      const legacyRaw = localStorage.getItem(NS);
      if (legacyRaw) {
        try {
          const legacy = JSON.parse(legacyRaw);
          if (legacy && typeof legacy === 'object') {
            const carry = {};
            if (legacy.libraryTone) carry.libraryTone = legacy.libraryTone;
            if (legacy.readingVariant) carry.readingVariant = legacy.readingVariant;
            if (Object.keys(carry).length) {
              const existing = get('prefs', 1, {});
              set('prefs', 1, { ...existing, ...carry });
            }
          }
        } catch (e) {}
        localStorage.removeItem(NS);
      }

      // Old `meditype.typingSound` — fold into the v1 prefs blob.
      const tsRaw = localStorage.getItem(`${NS}.typingSound`);
      if (tsRaw) {
        try {
          const ts = JSON.parse(tsRaw);
          if (ts && typeof ts === 'object') {
            const carry = {};
            if (ts.preset) carry.typingPreset = ts.preset;
            if (typeof ts.volume === 'number') carry.typingVolume = ts.volume;
            if (typeof ts.mistake === 'boolean') carry.typingMistake = ts.mistake;
            if (ts.rainHintDismissed) carry.rainHintDismissed = ts.rainHintDismissed;
            if (Object.keys(carry).length) {
              const existing = get('prefs', 1, {});
              set('prefs', 1, { ...existing, ...carry });
            }
          }
        } catch (e) {}
        localStorage.removeItem(`${NS}.typingSound`);
      }
    } catch (e) {}
    try { localStorage.setItem(FLAG, '1'); } catch (e) {}
  })();

  // Convenience helpers for the single v1 prefs blob — saves callers from
  // repeating read-modify-write boilerplate when changing one field.
  const prefs = {
    all() { return get('prefs', 1, {}); },
    getField(field, fallback) {
      const blob = get('prefs', 1, {});
      return Object.prototype.hasOwnProperty.call(blob, field) ? blob[field] : fallback;
    },
    setField(field, value) {
      const blob = get('prefs', 1, {});
      blob[field] = value;
      set('prefs', 1, blob);
    },
  };

  return { get, set, remove, prefs };
})();
