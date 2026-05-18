// meditype - Dashboard: the typing portrait
// Two modes:
//   - 'home' (Library / Prepare / Complete): cross-book aggregate stats,
//     typing pulse from last session, WPM trend over time.
//   - 'book' (Reading screen): scope locked to the current book.
//     Shows live session pulse, this book's bigrams, fingerprint, etc.

function Dashboard({ tone = 'ink', bgId = 'paper', screen, book }) {
  const [open, setOpen] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  const isReading = screen === 'reading';
  const mode = isReading ? 'book' : 'home';

  // Button sizing - smaller on home, elevated/larger on reading
  const btnSize   = isReading ? 44 : 34;
  const btnBottom = isReading ? 72 : 22;
  const btnLeft   = isReading ? 24 : 22;

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); e.stopPropagation(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  // While in book mode, refresh the live panel every second so the pulse
  // updates as the user types (without re-rendering the reading surface).
  React.useEffect(() => {
    if (!open || mode !== 'book') return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [open, mode]);

  const handleOpen = () => { setTick(t => t + 1); setOpen(true); };
  const handleClose = () => setOpen(false);

  // Palette
  const isDark = ['wood','sky','ink'].includes(bgId) || tone !== 'ink';
  const palette = (typeof POPOVER_COLORS !== 'undefined' && POPOVER_COLORS[bgId])
    || (isDark
      ? { bg:'#38291A', border:'#513C24', text:'var(--paper-warm)', textSoft:'var(--paper-dim)', rule:'var(--hairline-d)' }
      : { bg:'#EAE2D0', border:'#D5CBB8', text:'var(--ink)',        textSoft:'var(--ink-soft)',  rule:'var(--hairline)' });
  const accent = isDark ? 'var(--ember)' : 'var(--accent)';
  const faint  = isDark ? 'var(--paper-faint)' : 'var(--ink-faint)';

  return (
    <React.Fragment>
      <button
        onClick={handleOpen}
        style={{
          position: 'fixed', left: btnLeft, bottom: btnBottom, zIndex: 32,
          width: btnSize, height: btnSize, padding: 0,
          background: palette.bg,
          border: `1px solid ${palette.border}`,
          color: palette.text,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          opacity: open ? 0 : 1,
          transform: open ? 'scale(0.85)' : 'scale(1)',
          transition: 'opacity 280ms ease, transform 280ms cubic-bezier(.4,.2,.2,1), background 320ms ease, border-color 320ms ease, left 380ms ease, bottom 380ms ease, width 320ms ease, height 320ms ease',
          pointerEvents: open ? 'none' : 'auto',
        }}
        aria-label="Open typing portrait"
      >
        <IconPulse size={isReading ? 18 : 15} stroke={accent} />
      </button>

      <div
        style={{
          position: 'fixed',
          top: 56, left: 56, right: 56, bottom: 56,
          background: palette.bg,
          border: `1px solid ${palette.border}`,
          color: palette.text,
          fontFamily: 'var(--serif)',
          transformOrigin: '0% 100%',
          transform: open
            ? 'translate(0, 0) scale(1, 1)'
            : 'translate(-32px, 32px) scale(0.06, 0.10)',
          opacity: open ? 1 : 0,
          transition: 'transform 540ms cubic-bezier(.32,.08,.20,1), opacity 380ms ease, background 320ms ease, border-color 320ms ease',
          zIndex: 33,
          pointerEvents: open ? 'auto' : 'none',
          overflow: 'hidden',
          boxShadow: isDark
            ? '0 16px 48px rgba(0,0,0,0.45)'
            : '0 16px 48px rgba(54,36,18,0.16)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <DashboardContent
          tick={tick}
          mode={mode}
          book={book}
          onClose={handleClose}
          palette={palette}
          accent={accent}
          faint={faint}
          isDark={isDark}
        />
      </div>

      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 31,
          background: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(54,36,18,0.18)',
          backdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          transition: 'opacity 380ms ease',
          pointerEvents: open ? 'auto' : 'none',
        }}
      />
    </React.Fragment>
  );
}

const IconPulse = (p) => <Icon sw={1.2} {...p} d={<>
  <path d="M3 12h3l2-5 4 10 2-3h7" />
</>} />;

// ═══════════════════════════════════════════════════════════════════════════
//                            CARD CONTENT
// ═══════════════════════════════════════════════════════════════════════════
function DashboardContent({ tick, mode, book, onClose, palette, accent, faint, isDark }) {
  const text = palette.text;
  const soft = palette.textSoft;
  const rule = palette.rule;

  // Scope: 'home' uses global aggregate; 'book' scopes to the current book id.
  const scope = mode === 'book' && book ? book.id : undefined;
  const livePulseEnabled = mode === 'book';

  // Recompute on every open / per-second tick when in book mode.
  const m = React.useMemo(() => {
    const M = window.metrics;
    if (!M) return null;
    return {
      summary:     M.summary(scope),
      slowest:     M.slowestBigram(scope),
      fastest:     M.fastestBigram(scope),
      hands:       M.handAsymmetry(scope),
      fingerprint: M.errorFingerprint(scope),
      pauseChar:   M.longestPauseChar(scope),
      // Only in home mode:
      overTime:    mode === 'home' ? M.wpmOverTime() : [],
      lastPulse:   mode === 'home' ? M.lastPulse() : [],
      // Only in book mode:
      livePulse:   livePulseEnabled ? M.livePulse() : [],
      sessionSummary: mode === 'book' ? M.summary('session') : null,
    };
  }, [tick, scope, mode]);

  if (!m) return null;

  // "Enough data?" thresholds differ slightly per mode
  const hasData = mode === 'book'
    ? (m.sessionSummary && m.sessionSummary.totalChars >= 10) || m.summary.totalChars >= 30
    : m.summary.totalChars >= 30;

  // Header copy
  const headerSuffix = mode === 'book' && book ? (
    <span style={{ marginLeft: 14, fontSize: 22, fontStyle: 'italic', color: accent }}>
      - <span style={{ fontStyle: 'italic' }}>{book.title}</span>
    </span>
  ) : null;

  return (
    <React.Fragment>
      <div style={{
        padding: '28px 40px 22px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: `1px solid ${rule}`,
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.3em',
            textTransform: 'uppercase', color: faint, marginBottom: 6,
          }}>
            {mode === 'book' ? 'This session' : 'Your typing'}
          </div>
          <div style={{
            fontSize: 26, fontWeight: 400, letterSpacing: '-0.015em',
            fontStyle: 'italic', color: text,
            display: 'flex', alignItems: 'baseline',
          }}>
            <span>a small portrait</span>{headerSuffix}
          </div>
        </div>
        <button onClick={onClose} style={{
          color: soft, fontSize: 11, fontFamily: 'var(--mono)',
          letterSpacing: '0.22em', textTransform: 'uppercase',
          padding: '6px 10px', cursor: 'pointer',
          borderBottom: `1px solid ${rule}`,
        }}>close</button>
      </div>

      {!hasData ? (
        <EmptyState faint={faint} soft={soft} mode={mode} />
      ) : mode === 'book' ? (
        <BookBody m={m} accent={accent} text={text} soft={soft} faint={faint} rule={rule} />
      ) : (
        <HomeBody m={m} accent={accent} text={text} soft={soft} faint={faint} rule={rule} isDark={isDark} />
      )}
    </React.Fragment>
  );
}

function EmptyState({ faint, soft, mode }) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 60, textAlign: 'center',
    }}>
      <div style={{ maxWidth: 380 }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.3em',
          textTransform: 'uppercase', color: faint, marginBottom: 14,
        }}>Not enough data yet</div>
        <div style={{ fontSize: 18, lineHeight: 1.6, color: soft, fontStyle: 'italic' }}>
          {mode === 'book'
            ? 'Start typing this passage. The portrait will fill in as you go.'
            : 'Type a passage or two and this page will fill itself. The portrait is built from your real keystrokes, not averages.'}
        </div>
      </div>
    </div>
  );
}

// ─── HOME BODY ───────────────────────────────────────────────────────────────
function HomeBody({ m, accent, text, soft, faint, rule, isDark }) {
  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      padding: '32px 40px 40px',
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px 56px',
    }}>
      <SectionPulse pulse={m.lastPulse} title="Your typing pulse - last session" subtitle="Each tick - one keypress. Height - the pause before it."
        accent={accent} text={text} soft={soft} faint={faint} rule={rule} fullWidth />
      <SectionSummary summary={m.summary} accent={accent} text={text} soft={soft} faint={faint} rule={rule} mode="home" />
      <SectionHands hands={m.hands} accent={accent} text={text} soft={soft} faint={faint} rule={rule} />
      <SectionBigrams slowest={m.slowest} fastest={m.fastest} accent={accent} text={text} soft={soft} faint={faint} rule={rule} />
      <SectionFingerprint fp={m.fingerprint} accent={accent} text={text} soft={soft} faint={faint} rule={rule} />
      <SectionPause pauseChar={m.pauseChar} accent={accent} text={text} soft={soft} faint={faint} rule={rule} />
      <SectionOverTime overTime={m.overTime} accent={accent} text={text} soft={soft} faint={faint} rule={rule} />
    </div>
  );
}

// ─── BOOK BODY ───────────────────────────────────────────────────────────────
function BookBody({ m, accent, text, soft, faint, rule }) {
  return (
    <div style={{
      flex: 1, overflowY: 'auto',
      padding: '32px 40px 40px',
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px 56px',
    }}>
      <SectionPulse pulse={m.livePulse} title="Your typing pulse - so far this session" subtitle="Live - updates as you type."
        accent={accent} text={text} soft={soft} faint={faint} rule={rule} fullWidth />
      <SectionBookSummary book={m.summary} session={m.sessionSummary} accent={accent} text={text} soft={soft} faint={faint} rule={rule} />
      <SectionHands hands={m.hands} accent={accent} text={text} soft={soft} faint={faint} rule={rule} />
      <SectionBigrams slowest={m.slowest} fastest={m.fastest} accent={accent} text={text} soft={soft} faint={faint} rule={rule} />
      <SectionFingerprint fp={m.fingerprint} accent={accent} text={text} soft={soft} faint={faint} rule={rule} />
      <SectionPause pauseChar={m.pauseChar} accent={accent} text={text} soft={soft} faint={faint} rule={rule} />
    </div>
  );
}

// ═══ Shared primitives ═══════════════════════════════════════════════════════
function SectionTitle({ children, color }) {
  return (
    <div style={{
      fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.3em',
      textTransform: 'uppercase', color, marginBottom: 16,
    }}>{children}</div>
  );
}

function Stat({ label, value, soft, faint }) {
  return (
    <div>
      <div style={{
        fontSize: 22, fontWeight: 400, letterSpacing: '-0.012em',
        fontVariationSettings: "'opsz' 144", color: soft,
      }}>{value}</div>
      <div style={{
        marginTop: 4, fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: faint,
      }}>{label}</div>
    </div>
  );
}

// ═══ Sections ═══════════════════════════════════════════════════════════════

function SectionPulse({ pulse, title, subtitle, accent, text, soft, faint, rule, fullWidth }) {
  const data = (pulse || []).filter(d => d > 0 && d < 1500);
  return (
    <div style={fullWidth ? { gridColumn: 'span 2' } : null}>
      <SectionTitle color={faint}>{title}</SectionTitle>
      {data.length < 10 ? (
        <div style={{ color: soft, fontStyle: 'italic', fontSize: 13 }}>
          {subtitle.startsWith('Live') ? 'Type a few characters to see your rhythm appear.' : 'No recent session captured.'}
        </div>
      ) : (
        <div>
          <Sparkline values={data} stroke={accent} height={64} max={1000} />
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 10,
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: faint,
          }}>
            <span>{data.length} keystrokes</span>
            <span>{subtitle}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Cross-book summary (home)
function SectionSummary({ summary, accent, text, soft, faint, rule }) {
  const minutes = Math.round(summary.totalMs / 60000);
  return (
    <div>
      <SectionTitle color={faint}>Across all sessions</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <Stat label="Sessions"      value={summary.totalSessions} soft={soft} faint={faint} />
        <Stat label="Minutes typed" value={minutes}               soft={soft} faint={faint} />
        <Stat label="Avg WPM"       value={summary.avgWpm}        soft={soft} faint={faint} />
      </div>
      <div style={{ marginTop: 18, fontSize: 12.5, color: soft, fontStyle: 'italic', lineHeight: 1.6 }}>
        {summary.totalChars.toLocaleString()} characters typed.{' '}
        {summary.avgAccuracy}% of them were correct on the first try.
      </div>
    </div>
  );
}

// Book-mode summary: this book lifetime + this-session live stats
function SectionBookSummary({ book, session, accent, text, soft, faint, rule }) {
  // session live stats: pull WPM/accuracy if any chars typed
  const liveChars = session?.totalChars || 0;
  const liveErr   = session?.totalErrors || 0;
  const liveMs    = session?.totalMs || 0;
  const liveWpm   = liveMs > 0 ? Math.round((liveChars / 5) / (liveMs / 60000)) : 0;
  const liveAcc   = liveChars > 0 ? Math.round(((liveChars - liveErr) / liveChars) * 100) : 100;

  return (
    <div>
      <SectionTitle color={faint}>This book</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 18 }}>
        <Stat label="Sessions on book"  value={book.totalSessions || 0}         soft={soft} faint={faint} />
        <Stat label="Minutes on book"   value={Math.round((book.totalMs || 0) / 60000)} soft={soft} faint={faint} />
        <Stat label="Avg WPM on book"   value={book.avgWpm || 0}                soft={soft} faint={faint} />
      </div>
      <div style={{
        paddingTop: 16, borderTop: `1px solid ${rule}`,
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
      }}>
        <Stat label="Now - keystrokes"  value={liveChars} soft={soft} faint={faint} />
        <Stat label="Now - WPM"         value={liveWpm}   soft={soft} faint={faint} />
        <Stat label="Now - accuracy"    value={liveAcc + '%'}  soft={soft} faint={faint} />
      </div>
    </div>
  );
}

function SectionHands({ hands, accent, text, soft, faint, rule }) {
  if (!hands) {
    return (
      <div>
        <SectionTitle color={faint}>Your hands</SectionTitle>
        <div style={{ color: soft, fontStyle: 'italic', fontSize: 13 }}>
          Type a bit more and we can compare your hands.
        </div>
      </div>
    );
  }
  const max = Math.max(hands.left, hands.right);
  const lpct = (hands.left / max) * 100;
  const rpct = (hands.right / max) * 100;
  const slower = hands.left < hands.right ? 'left' : 'right';
  const gap = Math.abs(hands.left - hands.right);
  const gapPct = max > 0 ? Math.round((gap / max) * 100) : 0;
  return (
    <div>
      <SectionTitle color={faint}>The hand that&apos;s slower</SectionTitle>
      <div style={{ display: 'grid', gap: 14 }}>
        <HandBar label="left"  cpm={hands.left}  pct={lpct} accent={accent} soft={soft} faint={faint} highlight={slower === 'left'} />
        <HandBar label="right" cpm={hands.right} pct={rpct} accent={accent} soft={soft} faint={faint} highlight={slower === 'right'} />
      </div>
      <div style={{ marginTop: 14, fontSize: 12.5, color: soft, fontStyle: 'italic', lineHeight: 1.6 }}>
        Your {slower} hand types {gapPct}% slower than your other.
      </div>
    </div>
  );
}
function HandBar({ label, cpm, pct, accent, soft, faint, highlight }) {
  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginBottom: 5,
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: faint,
      }}>
        <span style={{ color: highlight ? accent : faint }}>{label}</span>
        <span style={{ color: soft }}>{cpm} cpm</span>
      </div>
      <div style={{ height: 3, background: 'currentColor', opacity: 0.18 }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: highlight ? accent : soft,
          transition: 'width 700ms cubic-bezier(.32,.08,.2,1)',
        }} />
      </div>
    </div>
  );
}

function SectionBigrams({ slowest, fastest, accent, text, soft, faint, rule }) {
  if (!slowest && !fastest) {
    return (
      <div>
        <SectionTitle color={faint}>Your stumble</SectionTitle>
        <div style={{ color: soft, fontStyle: 'italic', fontSize: 13 }}>
          More typing needed to find your tricky pair.
        </div>
      </div>
    );
  }
  return (
    <div>
      <SectionTitle color={faint}>Your slowest letter pair</SectionTitle>
      {slowest && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
          <span style={{
            fontSize: 64, fontWeight: 400, lineHeight: 1, color: accent,
            fontStyle: 'italic', letterSpacing: '-0.04em',
            fontVariationSettings: "'opsz' 144",
          }}>{slowest.pair}</span>
          <div>
            <div style={{ fontSize: 15, color: text }}>
              {Math.round(slowest.avg)}<span style={{ color: soft, fontStyle: 'italic', marginLeft: 4 }}>ms avg</span>
            </div>
            <div style={{
              marginTop: 4, fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: faint,
            }}>typed {slowest.count}×</div>
          </div>
        </div>
      )}
      {fastest && (
        <div style={{
          marginTop: 16, paddingTop: 14, borderTop: `1px solid ${rule}`,
          display: 'flex', alignItems: 'baseline', gap: 12,
          fontSize: 12.5, color: soft, fontStyle: 'italic',
        }}>
          <span>Fastest:</span>
          <span style={{ color: text, fontStyle: 'italic', fontSize: 16 }}>{fastest.pair}</span>
          <span style={{ color: faint, fontFamily: 'var(--mono)', fontStyle: 'normal', fontSize: 10, letterSpacing: '0.18em' }}>
            {Math.round(fastest.avg)}MS
          </span>
        </div>
      )}
    </div>
  );
}

function SectionFingerprint({ fp, accent, text, soft, faint, rule }) {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const maxRate = Math.max(0.01, ...letters.map(ch => fp[ch].rate));
  const totalErr = letters.reduce((s, ch) => s + fp[ch].errors, 0);
  return (
    <div>
      <SectionTitle color={faint}>Error fingerprint</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 4 }}>
        {letters.map(ch => {
          const cell = fp[ch];
          const intensity = maxRate > 0 ? cell.rate / maxRate : 0;
          const hasData = cell.count >= 3;
          return (
            <div key={ch} title={`${ch.toUpperCase()} - ${(cell.rate * 100).toFixed(1)}% of ${cell.count}`}
              style={{
                aspectRatio: '1', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 500, color: text,
                background: hasData
                  ? `rgba(${(accent || '').includes('ember') ? '217,174,118' : '181,112,90'}, ${0.06 + intensity * 0.85})`
                  : 'transparent',
                border: `1px solid ${rule}`,
                opacity: hasData ? 1 : 0.35,
                transition: 'background 400ms ease',
              }}>{ch.toUpperCase()}</div>
          );
        })}
      </div>
      <div style={{
        marginTop: 12, fontSize: 12.5, color: soft, fontStyle: 'italic', lineHeight: 1.6,
      }}>
        {totalErr === 0
          ? 'No errors recorded yet.'
          : `${totalErr.toLocaleString()} mistypes - darker cells are the letters you miss most.`}
      </div>
    </div>
  );
}

function SectionPause({ pauseChar, accent, text, soft, faint, rule }) {
  if (!pauseChar) {
    return (
      <div>
        <SectionTitle color={faint}>Where you pause</SectionTitle>
        <div style={{ color: soft, fontStyle: 'italic', fontSize: 13 }}>
          Not enough pauses to read yet.
        </div>
      </div>
    );
  }
  const display = pauseChar.char === ' ' ? '␣' : pauseChar.char;
  return (
    <div>
      <SectionTitle color={faint}>The letter you pause longest before</SectionTitle>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 22 }}>
        <span style={{
          fontSize: 96, fontWeight: 400, lineHeight: 1, color: accent,
          fontStyle: 'italic', fontVariationSettings: "'opsz' 144",
        }}>{display}</span>
        <div>
          <div style={{ fontSize: 15, color: text }}>
            {Math.round(pauseChar.avg)}<span style={{ color: soft, fontStyle: 'italic', marginLeft: 4 }}>ms on average</span>
          </div>
          <div style={{
            marginTop: 4, fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: faint,
          }}>across {pauseChar.count} times</div>
        </div>
      </div>
      <div style={{ marginTop: 14, fontSize: 12.5, color: soft, fontStyle: 'italic', lineHeight: 1.6 }}>
        Often this is the letter your fingers brace for - the start of a word, or the breath before a comma.
      </div>
    </div>
  );
}

function SectionOverTime({ overTime, accent, text, soft, faint, rule }) {
  const series = overTime || [];
  return (
    <div style={{ gridColumn: 'span 2' }}>
      <SectionTitle color={faint}>How you&apos;ve gotten faster</SectionTitle>
      {series.length < 3 ? (
        <div style={{ color: soft, fontStyle: 'italic', fontSize: 13 }}>
          A few sessions in and a curve appears here.
        </div>
      ) : (
        <div>
          <Lineline
            values={series.map(s => s.wpm)} stroke={accent} height={92}
            yMin={Math.max(0, Math.min(...series.map(s => s.wpm)) - 10)}
            yMax={Math.max(...series.map(s => s.wpm)) + 10}
            rule={rule} />
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 10,
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: faint,
          }}>
            <span>{new Date(series[0].ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>{series.length} sessions</span>
            <span>{new Date(series[series.length - 1].ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tiny visualizations ────────────────────────────────────────────────────
function Sparkline({ values, stroke = 'currentColor', height = 60, max }) {
  if (!values || values.length === 0) return null;
  const w = 100;
  const lim = max || Math.max(...values, 1);
  const step = w / Math.max(values.length - 1, 1);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" width="100%" height={height}>
      {values.map((v, i) => {
        const h = (Math.min(v, lim) / lim) * height;
        return <rect key={i} x={i * step} y={height - h} width={step * 0.7} height={h} fill={stroke} opacity={0.65} />;
      })}
    </svg>
  );
}

function Lineline({ values, stroke = 'currentColor', height = 80, yMin = 0, yMax = 100, rule = '#ccc' }) {
  if (!values || values.length === 0) return null;
  const w = 100;
  const range = Math.max(1, yMax - yMin);
  const step = w / Math.max(values.length - 1, 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - yMin) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" width="100%" height={height}>
      <line x1="0" y1={height} x2={w} y2={height} stroke={rule} strokeWidth="0.5" />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => {
        const x = i * step;
        const y = height - ((v - yMin) / range) * height;
        return <circle key={i} cx={x} cy={y} r="1.3" fill={stroke} />;
      })}
    </svg>
  );
}

Object.assign(window, { Dashboard });
