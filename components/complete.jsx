// meditype — Session Complete screen
// Dignified, quiet. "You read X words of [book] tonight."
// One line of rotating reflection. Two buttons: Continue / Close the book.

function CompleteScreen({ book, stats, onContinue, onClose, tone = 'ink' }) {
  const isDark = tone !== 'ink';
  const bg = isDark ? 'var(--walnut)' : 'var(--paper)';
  const textInk = isDark ? 'var(--paper-warm)' : 'var(--ink)';
  const textSoft = isDark ? 'var(--paper-dim)' : 'var(--ink-soft)';
  const textFaint = isDark ? 'var(--paper-faint)' : 'var(--ink-faint)';
  const rule = isDark ? 'var(--hairline-d)' : 'var(--hairline)';
  const accent = isDark ? 'var(--ember)' : 'var(--accent)';

  const reflection = React.useMemo(
    () => REFLECTIONS[Math.floor(Math.random() * REFLECTIONS.length)], []);

  return (
    <div className="paper-grain" style={{
      minHeight: '100vh', background: bg, color: textInk,
      fontFamily: 'var(--serif)',
      display: 'flex', flexDirection: 'column',
    }}>
      {isDark && <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 40%, rgba(217,174,118,0.10), transparent 60%)',
      }} />}

      <header style={{
        padding: '32px 88px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{
          fontSize: 18, fontStyle: 'italic', fontWeight: 500, letterSpacing: '-0.01em',
        }}>meditype</div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.3em',
          textTransform: 'uppercase', color: textFaint,
        }}>Session · complete</div>
      </header>

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '40px 88px 80px', textAlign: 'center',
        maxWidth: 820, margin: '0 auto',
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.3em',
          textTransform: 'uppercase', color: textFaint, marginBottom: 48,
        }}>{(() => {
          const d = new Date();
          const day = d.toLocaleDateString('en-US', { weekday: 'long' });
          const h = d.getHours();
          const part = h < 5 ? 'night' : h < 11 ? 'morning' : h < 14 ? 'midday' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
          const month = d.toLocaleDateString('en-US', { month: 'long' });
          return `${day} · an ${part} in ${month}`;
        })()}</div>

        <h1 style={{
          margin: 0, fontSize: 56, lineHeight: 1.15, fontWeight: 400,
          letterSpacing: '-0.022em', fontVariationSettings: "'opsz' 144",
          textWrap: 'balance', maxWidth: 720,
        }}>
          You read <span style={{ color: accent, fontStyle: 'italic' }}>{stats.words.toLocaleString()}</span> words of <br/>
          <em style={{ fontStyle: 'italic' }}>{book.title}</em> tonight.
        </h1>

        <div style={{
          margin: '56px 0', width: 56, height: 1, background: accent, opacity: 0.8,
        }} />

        <p style={{
          margin: 0, fontSize: 22, fontStyle: 'italic', lineHeight: 1.55,
          color: textSoft, fontWeight: 300, maxWidth: 560,
          textWrap: 'pretty',
        }}>{reflection}</p>

        <div style={{
          marginTop: 72, display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 80,
          paddingTop: 36, borderTop: `1px solid ${rule}`,
        }}>
          <CompleteStat label="Time sat" value={stats.time} textInk={textInk} textFaint={textFaint} />
          <CompleteStat label="Passages" value={stats.passages} textInk={textInk} textFaint={textFaint} />
          <CompleteStat label="Of the book" value={stats.bookPosition} textInk={textInk} textFaint={textFaint} />
        </div>

        <div style={{ marginTop: 88, display: 'flex', gap: 20 }}>
          <button onClick={onContinue} style={{
            padding: '20px 44px',
            border: `1px solid ${accent}`,
            color: textInk, fontSize: 18, fontStyle: 'italic',
            letterSpacing: '-0.008em',
            background: 'transparent',
          }}>Continue</button>
          <button onClick={onClose} style={{
            padding: '20px 44px', color: textSoft, fontSize: 18,
            fontStyle: 'italic', letterSpacing: '-0.008em',
            borderBottom: `1px solid transparent`,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderBottomColor = textFaint; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderBottomColor = 'transparent'; }}
          >Close the book</button>
        </div>
      </main>

      <footer style={{
        padding: '32px 88px', borderTop: `1px solid ${rule}`,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: textFaint,
      }}>
        <span>no streaks · no scores</span>
        <span>the book will be here tomorrow</span>
      </footer>
    </div>
  );
}

function CompleteStat({ label, value, textInk, textFaint }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: textFaint, marginBottom: 12,
      }}>{label}</div>
      <div style={{
        fontSize: 30, fontWeight: 400, letterSpacing: '-0.015em',
        color: textInk, fontVariationSettings: "'opsz' 144",
      }}>{value}</div>
    </div>
  );
}

Object.assign(window, { CompleteScreen });
