// meditype — Prepare screen
// After a book is chosen. Settling-in moment: cover, description,
// three selectors (ambient sound, background, length), one "Begin" button.

function PrepareScreen({ book, onBack, onBegin, tone = 'ink' }) {
  const [ambient, setAmbient] = React.useState(() => MTStorage.prefs.getField('ambient', 'rain'));
  const [background, setBackground] = React.useState(() => MTStorage.prefs.getField('background', 'paper'));
  const [length, setLength] = React.useState(() => MTStorage.prefs.getField('length', '15'));
  const [drift, setDrift] = React.useState(false);

  React.useEffect(() => { MTStorage.prefs.setField('ambient', ambient); }, [ambient]);
  React.useEffect(() => { MTStorage.prefs.setField('background', background); }, [background]);
  React.useEffect(() => { MTStorage.prefs.setField('length', length); }, [length]);

  const isDark = tone !== 'ink';
  const bg = isDark ? 'var(--walnut)' : 'var(--paper)';
  const textInk = isDark ? 'var(--paper-warm)' : 'var(--ink)';
  const textSoft = isDark ? 'var(--paper-dim)' : 'var(--ink-soft)';
  const textFaint = isDark ? 'var(--paper-faint)' : 'var(--ink-faint)';
  const rule = isDark ? 'var(--hairline-d)' : 'var(--hairline)';
  const accent = isDark ? 'var(--ember)' : 'var(--accent)';

  // Live progress overrides the seed `continue` value once the user has typed.
  const live = (typeof window !== 'undefined' && window.getProgressFor) ? window.getProgressFor(book.id) : null;
  const liveFraction = live ? (live.passageIdx / book.passages) : null;
  const effectiveContinue = liveFraction != null ? liveFraction : book.continue;
  const resuming = effectiveContinue !== null;
  const passagesDone = resuming ? (live ? live.passageIdx : Math.round(effectiveContinue * book.passages)) : 0;
  const remaining = book.passages - passagesDone;

  const description = BOOK_DESCRIPTIONS[book.id] || DEFAULT_DESC;

  return (
    <div className="paper-grain" style={{
      minHeight: '100%', background: bg, color: textInk,
      fontFamily: 'var(--serif)',
    }}>
      {/* Top bar */}
      <header style={{
        padding: '32px 88px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: `1px solid ${rule}`,
      }}>
        <button onClick={onBack} style={{
          display: 'flex', alignItems: 'center', gap: 10, color: textSoft,
          fontSize: 13, letterSpacing: '0.01em', fontStyle: 'italic',
        }}>
          <IconBack size={13} /> Back to the library
        </button>
        <div style={{
          fontSize: 18, fontStyle: 'italic', fontWeight: 500, letterSpacing: '-0.01em',
        }}>meditype</div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: textFaint,
        }}>
          {resuming ? 'Resuming' : 'New session'}
        </div>
      </header>

      <div style={{ padding: '80px 88px 64px', display: 'grid', gridTemplateColumns: '420px 1fr', gap: 96 }}>

        {/* Left — the book itself */}
        <div>
          <div style={{ position: 'relative', width: 300 }}>
            <BookCover book={book} width={300} height={426} />
            <div style={{
              position: 'absolute', bottom: -10, left: 10, right: 10, height: 10,
              background: 'rgba(0,0,0,0.10)', filter: 'blur(6px)', borderRadius: '50%',
            }} />
          </div>
          <div style={{
            marginTop: 44, fontFamily: 'var(--mono)', fontSize: 10.5,
            letterSpacing: '0.3em', textTransform: 'uppercase', color: textFaint,
          }}>{book.mood} · {book.year > 0 ? book.year : `${-book.year} BCE`}</div>
          <h1 style={{
            margin: '14px 0 6px', fontSize: 44, lineHeight: 1.02,
            fontWeight: 400, letterSpacing: '-0.022em',
            fontVariationSettings: "'opsz' 144", textWrap: 'balance',
          }}>{book.title}</h1>
          <div style={{
            fontSize: 17, fontStyle: 'italic', color: textSoft,
          }}>{book.author}</div>
        </div>

        {/* Right — settling in */}
        <div style={{ maxWidth: 560 }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.3em',
            textTransform: 'uppercase', color: textFaint, marginBottom: 22,
          }}>{resuming ? 'Pick up where you left off' : 'Before you begin'}</div>

          <p style={{
            margin: 0, fontSize: 20, lineHeight: 1.55, fontWeight: 300,
            color: textInk, textWrap: 'pretty',
          }}>{description}</p>

          {/* Passage meta */}
          <div style={{
            marginTop: 40, paddingTop: 28, paddingBottom: 28,
            borderTop: `1px solid ${rule}`, borderBottom: `1px solid ${rule}`,
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
          }}>
            <Stat label="Total passages" value={book.passages} textInk={textInk} textFaint={textFaint} />
            <Stat label={resuming ? 'Remaining' : 'Typical session'} value={resuming ? remaining : `~${book.minutes} min`} textInk={textInk} textFaint={textFaint} />
            <Stat label="Reading age" value={book.year > 0 ? `${2026 - book.year} yrs` : 'ancient'} textInk={textInk} textFaint={textFaint} />
          </div>

          {resuming && (
            <div style={{ marginTop: 24 }}>
              <ProgressLine value={effectiveContinue} tone={tone} />
              <div style={{
                marginTop: 10, display: 'flex', justifyContent: 'space-between',
                fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: textFaint,
              }}>
                <span>on passage {passagesDone}</span>
                <span>of {book.passages}</span>
              </div>
            </div>
          )}

          {/* Selectors */}
          <div style={{ marginTop: 56, display: 'grid', gap: 36 }}>
            <Selector title="Ambient sound" hint="what the room sounds like" textInk={textInk} textFaint={textFaint}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 24px' }}>
                {AMBIENTS.map(a => (
                  <AmbientRow key={a.id} ambient={a}
                    active={ambient === a.id} onClick={() => setAmbient(a.id)}
                    textInk={textInk} textFaint={textFaint} tone={tone} />
                ))}
              </div>
            </Selector>

            <Selector title="Background" hint="where the page sits" textInk={textInk} textFaint={textFaint}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {BACKGROUNDS.map(b => (
                  <BackgroundChip key={b.id} bg={b}
                    active={background === b.id && !drift} onClick={() => { setBackground(b.id); setDrift(false); }}
                    textInk={textInk} textFaint={textFaint} tone={tone} />
                ))}
                <BackgroundChip bg={{ id: 'drift', name: 'Drift' }}
                  active={drift} onClick={() => setDrift(true)}
                  textInk={textInk} textFaint={textFaint} tone={tone} isDrift />
              </div>
            </Selector>

            <Selector title="Session length" hint="no pressure — you can stop earlier" textInk={textInk} textFaint={textFaint}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {LENGTHS.map(l => {
                  const active = length === l.id;
                  return (
                    <button key={l.id} onClick={() => setLength(l.id)}
                      style={{
                        padding: '12px 22px',
                        borderTop: `1px solid ${active ? accent : rule}`,
                        borderBottom: `1px solid ${active ? accent : rule}`,
                        color: active ? textInk : textSoft,
                        fontSize: 15, fontStyle: active ? 'italic' : 'normal',
                        fontWeight: active ? 500 : 400,
                        letterSpacing: '-0.005em',
                        transition: 'all 200ms ease',
                      }}>
                      {l.name}
                    </button>
                  );
                })}
              </div>
            </Selector>
          </div>

          {/* Begin */}
          <div style={{ marginTop: 64, display: 'flex', alignItems: 'center', gap: 36 }}>
            <button onClick={() => onBegin({ ambient, background: drift ? 'drift' : background, length })}
              style={{
                padding: '22px 54px',
                background: 'transparent',
                border: `1px solid ${accent}`,
                color: textInk,
                fontSize: 22, fontStyle: 'italic', fontWeight: 400,
                letterSpacing: '-0.01em',
                fontVariationSettings: "'opsz' 144",
                position: 'relative',
                transition: 'background 200ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(217,174,118,0.08)' : 'rgba(181,112,90,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Begin
            </button>
            <div style={{
              fontSize: 13, color: textFaint, fontStyle: 'italic',
              lineHeight: 1.55, maxWidth: 260,
            }}>
              When you press Begin, the room will dim a little.
              You can close the book at any time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BOOK_DESCRIPTIONS = {
  aurelius: "Private notes from an emperor to himself, written at night on the edge of empire. Read in the morning, a sentence at a time, they are less like philosophy and more like a practice.",
  walden: "A man builds a small cabin on a pond and spends a year paying close attention. The weather, the light, his own mind. You are invited to do the same.",
  rumi: "Thirteenth-century verse that behaves like water — gentle on the surface and going somewhere deep. Slow down enough and it will carry you.",
  rilke: "Ten letters to a young poet who had asked how to live. Rilke answers, carefully, without ever giving instructions. Solitude and patience figure heavily.",
};
const DEFAULT_DESC = "A quiet book to sit with. Each passage is short; the pace is yours.";

function Stat({ label, value, textInk, textFaint }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: textFaint, marginBottom: 10,
      }}>{label}</div>
      <div style={{
        fontSize: 26, fontWeight: 400, letterSpacing: '-0.015em',
        color: textInk, fontVariationSettings: "'opsz' 144",
      }}>{value}</div>
    </div>
  );
}

function Selector({ title, hint, children, textInk, textFaint }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.3em',
          textTransform: 'uppercase', color: textInk, fontWeight: 500,
        }}>{title}</div>
        <div style={{
          fontSize: 12, fontStyle: 'italic', color: textFaint,
        }}>{hint}</div>
      </div>
      {children}
    </div>
  );
}

function AmbientRow({ ambient, active, onClick, textInk, textFaint, tone }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 2px', textAlign: 'left',
        color: active ? textInk : (hover ? textInk : textFaint),
        transition: 'color 200ms ease',
      }}>
      <Waveform active={active} tone={tone} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, letterSpacing: '-0.005em', fontStyle: active ? 'italic' : 'normal', fontWeight: active ? 500 : 400 }}>
          {ambient.name}
        </div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: textFaint, marginTop: 3,
        }}>{ambient.hint}</div>
      </div>
      {active && (
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: tone === 'ink' ? 'var(--accent)' : 'var(--ember)',
        }}>on</div>
      )}
    </button>
  );
}

function BackgroundChip({ bg, active, onClick, textInk, textFaint, isDrift, tone }) {
  return (
    <button onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
        textAlign: 'left',
      }}>
      <BackgroundSwatch bg={bg} active={active} tone={tone} />
      <div style={{
        fontSize: 12.5, color: active ? textInk : textFaint,
        fontStyle: active ? 'italic' : 'normal', fontWeight: active ? 500 : 400,
        letterSpacing: '-0.005em',
      }}>{bg.name}{isDrift ? ' ↺' : ''}</div>
    </button>
  );
}

Object.assign(window, { PrepareScreen });
