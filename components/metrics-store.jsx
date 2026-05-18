// meditype - typing metrics store
// Records per-keystroke data and aggregates both globally and per-book.
// Schema is namespaced v2 (v2 added per-book bucketing).

const METRICS_KEY = 'meditype.metrics.v2';
const PULSE_KEY = 'meditype.metrics.pulse';

const LEFT_KEYS = new Set('qwertasdfgzxcvb'.split(''));
const RIGHT_KEYS = new Set('yuiophjklnm'.split(''));

function emptyBucket() {
  return {
    sessions: [],
    bigrams: {},
    chars: {},
    hands: { left: { count: 0, totalMs: 0 }, right: { count: 0, totalMs: 0 } },
    totalChars: 0, totalErrors: 0, totalMs: 0, totalSessions: 0,
  };
}

class Metrics {
  constructor() {
    this.data = this._load();
    this.session = null;
  }
  _empty() {
    return { ...emptyBucket(), byBook: {} };
  }
  _load() {
    try {
      const v = JSON.parse(localStorage.getItem(METRICS_KEY));
      if (v && v.sessions && v.chars && v.byBook) return v;
    } catch {}
    // Try to migrate v1 if present
    try {
      const old = JSON.parse(localStorage.getItem('meditype.metrics.v1'));
      if (old && old.sessions) {
        const fresh = this._empty();
        // Copy global aggregates; per-book starts empty (v1 didn't track it)
        fresh.sessions    = old.sessions || [];
        fresh.bigrams     = old.bigrams || {};
        fresh.chars       = old.chars || {};
        fresh.hands       = old.hands || fresh.hands;
        fresh.totalChars  = old.totalChars || 0;
        fresh.totalErrors = old.totalErrors || 0;
        fresh.totalMs     = old.totalMs || 0;
        fresh.totalSessions = old.totalSessions || 0;
        return fresh;
      }
    } catch {}
    return this._empty();
  }
  _save() {
    try { localStorage.setItem(METRICS_KEY, JSON.stringify(this.data)); } catch {}
  }
  _bucket(bookId) {
    if (!bookId) return null;
    if (!this.data.byBook[bookId]) this.data.byBook[bookId] = emptyBucket();
    return this.data.byBook[bookId];
  }
  reset() {
    this.data = this._empty();
    this._save();
    try { localStorage.removeItem(PULSE_KEY); } catch {}
  }

  startSession(bookId) {
    this.session = {
      bookId, startedAt: Date.now(),
      chCount: 0, errCount: 0, totalMs: 0,
      lastKeyTs: null, lastChar: null, pulse: [],
      // Per-session aggregates (chars MAP, bigrams MAP, hands)
      bigrams: {}, chars: {},
      hands: { left: { count: 0, totalMs: 0 }, right: { count: 0, totalMs: 0 } },
      totalChars: 0, totalErrors: 0,
    };
  }

  recordKey({ expected, typed }) {
    if (!this.session) this.startSession(null);
    const now = Date.now();
    const dt = this.session.lastKeyTs ? now - this.session.lastKeyTs : 0;
    this.session.lastKeyTs = now;

    const ch = ((expected ?? typed) || '').toLowerCase();
    const correct = expected === typed;
    const book = this._bucket(this.session.bookId);

    // Helper: update a bucket's chars[ch]
    const bumpChar = (bucket) => {
      if (!bucket.chars[ch]) bucket.chars[ch] = { count: 0, errors: 0, pauseSum: 0, pauseN: 0 };
      const cd = bucket.chars[ch];
      cd.count++;
      if (!correct) cd.errors++;
      if (dt > 80 && dt < 4000) { cd.pauseSum += dt; cd.pauseN++; }
    };
    bumpChar(this.data);
    bumpChar(this.session);
    if (book) bumpChar(book);

    // Bigrams (a..z only, correct only)
    if (correct && this.session.lastChar && /^[a-z]$/.test(ch) && /^[a-z]$/.test(this.session.lastChar)) {
      const pair = this.session.lastChar + ch;
      const bumpBigram = (bucket) => {
        if (!bucket.bigrams[pair]) bucket.bigrams[pair] = { count: 0, totalMs: 0 };
        bucket.bigrams[pair].count++;
        if (dt > 40 && dt < 1500) bucket.bigrams[pair].totalMs += dt;
      };
      bumpBigram(this.data);
      bumpBigram(this.session);
      if (book) bumpBigram(book);
    }

    // Hands
    const side = LEFT_KEYS.has(ch) ? 'left' : (RIGHT_KEYS.has(ch) ? 'right' : null);
    if (side) {
      const bumpHand = (bucket) => {
        bucket.hands[side].count++;
        if (dt > 0 && dt < 2000) bucket.hands[side].totalMs += dt;
      };
      bumpHand(this.data);
      bumpHand(this.session);
      if (book) bumpHand(book);
    }

    // Totals
    const bumpTotals = (bucket) => {
      bucket.totalChars = (bucket.totalChars || 0) + 1;
      if (!correct) bucket.totalErrors = (bucket.totalErrors || 0) + 1;
      if (dt > 0 && dt < 4000) bucket.totalMs = (bucket.totalMs || 0) + dt;
    };
    bumpTotals(this.data);
    if (book) bumpTotals(book);

    // Session-only state (renamed counter so it doesn't collide with the chars MAP)
    this.session.chCount++;
    if (!correct) this.session.errCount++;
    if (dt > 0 && dt < 4000) this.session.totalMs += dt;
    if (correct) this.session.lastChar = ch;
    this.session.pulse.push(Math.min(dt, 1500));

    this._save();
  }

  endSession() {
    if (!this.session) return;
    const s = this.session;
    if (s.chCount >= 30 && s.totalMs > 5000) {
      const minutes = s.totalMs / 60000;
      const words = s.chCount / 5;
      const wpm = minutes > 0 ? Math.round(words / minutes) : 0;
      const acc = s.chCount > 0 ? Math.round(((s.chCount - s.errCount) / s.chCount) * 100) : 100;
      const entry = {
        ts: s.startedAt, ms: s.totalMs,
        chars: s.chCount, errors: s.errCount,
        wpm, accuracy: acc, bookId: s.bookId,
      };
      this.data.sessions.push(entry);
      this.data.totalSessions++;
      const book = this._bucket(s.bookId);
      if (book) { book.sessions.push(entry); book.totalSessions++; }
    }
    try { localStorage.setItem(PULSE_KEY, JSON.stringify(s.pulse.slice(-300))); } catch {}
    this._save();
    this.session = null;
  }

  // ── Bucket-aware derivers ────────────────────────────────────────────────
  _resolveBucket(scope) {
    // scope: undefined = global, 'session' = current session, otherwise treated as bookId
    if (!scope) return this.data;
    if (scope === 'session') return this.session;
    return this.data.byBook[scope] || null;
  }

  summary(scope) {
    const b = this._resolveBucket(scope);
    if (!b) return { totalChars: 0, totalErrors: 0, totalMs: 0, totalSessions: 0, avgWpm: 0, avgAccuracy: 0 };
    return {
      totalChars:   b.totalChars   || 0,
      totalErrors:  b.totalErrors  || 0,
      totalMs:      b.totalMs      || 0,
      totalSessions: b.totalSessions || 0,
      avgWpm: b.totalMs > 0
        ? Math.round((b.totalChars / 5) / (b.totalMs / 60000))
        : 0,
      avgAccuracy: b.totalChars > 0
        ? Math.round(((b.totalChars - b.totalErrors) / b.totalChars) * 100)
        : 0,
    };
  }
  slowestBigram(scope, minCount = 6) {
    const b = this._resolveBucket(scope);
    if (!b) return null;
    let best = null;
    for (const [pair, d] of Object.entries(b.bigrams || {})) {
      if (d.count < minCount) continue;
      const avg = d.totalMs / d.count;
      if (!isFinite(avg) || avg <= 0) continue;
      if (!best || avg > best.avg) best = { pair, avg, count: d.count };
    }
    return best;
  }
  fastestBigram(scope, minCount = 6) {
    const b = this._resolveBucket(scope);
    if (!b) return null;
    let best = null;
    for (const [pair, d] of Object.entries(b.bigrams || {})) {
      if (d.count < minCount) continue;
      const avg = d.totalMs / d.count;
      if (!isFinite(avg) || avg <= 0) continue;
      if (!best || avg < best.avg) best = { pair, avg, count: d.count };
    }
    return best;
  }
  handAsymmetry(scope) {
    const b = this._resolveBucket(scope);
    if (!b) return null;
    const l = b.hands.left, r = b.hands.right;
    if (l.count < 30 || r.count < 30 || l.totalMs <= 0 || r.totalMs <= 0) return null;
    const lcpm = Math.round(l.count / (l.totalMs / 60000));
    const rcpm = Math.round(r.count / (r.totalMs / 60000));
    return { left: lcpm, right: rcpm, leftCount: l.count, rightCount: r.count };
  }
  errorFingerprint(scope) {
    const b = this._resolveBucket(scope);
    const out = {};
    for (const ch of 'abcdefghijklmnopqrstuvwxyz'.split('')) {
      const d = b ? b.chars[ch] : null;
      out[ch] = d
        ? { count: d.count, errors: d.errors, rate: d.count > 0 ? d.errors / d.count : 0 }
        : { count: 0, errors: 0, rate: 0 };
    }
    return out;
  }
  longestPauseChar(scope) {
    const b = this._resolveBucket(scope);
    if (!b) return null;
    let best = null;
    const allowed = /^[a-z.,!?;:'"]$/;
    for (const [ch, d] of Object.entries(b.chars || {})) {
      if (d.pauseN < 6 || !allowed.test(ch)) continue;
      const avg = d.pauseSum / d.pauseN;
      if (!best || avg > best.avg) best = { char: ch, avg, count: d.pauseN };
    }
    return best;
  }
  wpmOverTime(scope) {
    const b = this._resolveBucket(scope);
    if (!b) return [];
    return (b.sessions || [])
      .filter(s => s.wpm > 0 && s.wpm < 250)
      .map(s => ({ ts: s.ts, wpm: s.wpm, accuracy: s.accuracy }));
  }
  lastPulse() {
    try { return JSON.parse(localStorage.getItem(PULSE_KEY) || '[]'); } catch { return []; }
  }
  // Live pulse from the current in-progress session (for the in-book dashboard)
  livePulse() {
    return this.session ? this.session.pulse.slice() : [];
  }
}

window.metrics = window.metrics || new Metrics();
