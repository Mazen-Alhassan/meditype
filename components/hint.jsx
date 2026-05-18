// meditype - onboarding hint card (bottom-right of reading screen)
// 3 pages, subtle slide/fade between them, dismisses with a quiet fade.
// Shown once per device (localStorage flag: meditype.hintSeen.v2).
// v2 so old dismissed state from prior sessions doesn't suppress the card.
// Derives surface colors from the active background (bgId) via the same
// palette map as the popovers - so it always looks like it belongs.

const HINT_COLORS = {
  paper: { bg: 'rgba(236,228,212,0.97)', border: '#D5CBB8', text: '#22201C', soft: '#5A5348', faint: '#8A8172', accent: '#B5705A' },
  linen: { bg: 'rgba(228,220,200,0.97)', border: '#CBBFA8', text: '#22201C', soft: '#5A5348', faint: '#8A8172', accent: '#B5705A' },
  mist:  { bg: 'rgba(218,219,210,0.97)', border: '#C2C4BA', text: '#22201C', soft: '#5A5348', faint: '#8A8172', accent: '#7A8070' },
  wood:  { bg: 'rgba(32,22,12,0.96)',    border: '#4A3A2A', text: '#E8DCC4', soft: '#B9A585', faint: '#7C6A50', accent: '#D9AE76' },
  sky:   { bg: 'rgba(40,46,64,0.97)',    border: '#3E4560', text: '#DDE0EC', soft: '#9AA0BC', faint: '#5C6480', accent: '#9AA8D8' },
  ink:   { bg: 'rgba(22,14,8,0.97)',     border: '#362515', text: '#E8DCC4', soft: '#B9A585', faint: '#7C6A50', accent: '#D9AE76' },
};

function ReadingHint({ isDark, bgId, accent: accentProp, rule, textInk: textInkProp, textSoft: textSoftProp, textFaint: textFaintProp }) {
  const seen = (() => { try { return !!localStorage.getItem('meditype.hintSeen.v2'); } catch { return false; } })();
  const [visible, setVisible] = React.useState(!seen);
  const [page, setPage] = React.useState(0);
  const [exiting, setExiting] = React.useState(false);

  // Derive exact surface colors from bgId
  const c = HINT_COLORS[bgId] || (isDark ? HINT_COLORS.wood : HINT_COLORS.paper);
  const textInk   = c.text;
  const textSoft  = c.soft;
  const textFaint = c.faint;
  const accent    = c.accent;
  const border    = c.border;

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      try { localStorage.setItem('meditype.hintSeen.v2', '1'); } catch {}
    }, 380);
  };

  const goTo = (next) => {
    if (next >= 0 && next <= 2) setPage(next);
  };

  if (!visible) return null;

  const pageContent = [
    <Page1 key="p1" textInk={textInk} textSoft={textSoft} textFaint={textFaint} accent={accent} border={border} />,
    <Page2 key="p2" textInk={textInk} textSoft={textSoft} textFaint={textFaint} accent={accent} border={border} isDark={isDark} bgId={bgId} />,
    <Page3 key="p3" textInk={textInk} textSoft={textSoft} textFaint={textFaint} accent={accent} border={border} isDark={isDark} bgId={bgId} />,
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 72, right: 28,
      width: 264, zIndex: 35,
      opacity: exiting ? 0 : 1,
      transform: exiting ? 'translateY(10px) scale(0.96)' : 'translateY(0) scale(1)',
      transition: 'opacity 340ms ease, transform 340ms cubic-bezier(.2,.8,.2,1)',
      fontFamily: 'var(--serif)',
    }}>
      <div style={{
        background: c.bg,
        border: `1px solid ${border}`,
        backdropFilter: 'blur(14px)',
        boxShadow: isDark
          ? '0 4px 28px rgba(0,0,0,0.55)'
          : '0 4px 28px rgba(54,36,18,0.13)',
        overflow: 'hidden',
      }}>

        {/* Page area */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          {pageContent.map((p, i) => (
            <div key={i} style={{
              position: i === page ? 'relative' : 'absolute',
              top: 0, left: 0, width: '100%',
              padding: '16px 18px 10px',
              opacity: i === page ? 1 : 0,
              transform: i === page ? 'translateX(0)' : `translateX(${i < page ? '-12px' : '12px'})`,
              transition: 'opacity 280ms ease, transform 280ms cubic-bezier(.2,.8,.2,1)',
              pointerEvents: i === page ? 'auto' : 'none',
            }}>
              {p}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 18px 13px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: `1px solid ${border}`,
        }}>
          {/* dot indicators */}
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {[0, 1, 2].map(i => (
              <button key={i} onClick={() => goTo(i)} style={{
                width: i === page ? 14 : 4, height: 4,
                background: i === page ? accent : textFaint,
                opacity: i === page ? 0.9 : 0.4,
                border: 0, padding: 0, cursor: 'pointer',
                transition: 'width 220ms ease, background 180ms ease, opacity 180ms ease',
              }} />
            ))}
          </div>

          {/* buttons */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {page < 2 && (
              <button onClick={() => goTo(page + 1)} style={{
                fontSize: 11, fontFamily: 'var(--serif)', fontStyle: 'italic',
                color: textSoft, borderBottom: `1px solid ${border}`, padding: '1px 0',
              }}>next</button>
            )}
            <button onClick={dismiss} style={{
              fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.2em',
              textTransform: 'uppercase', color: textFaint,
            }}>{page === 2 ? 'got it' : 'skip'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── page 1: what the buttons do ──────────────────────────────────────────────
function Page1({ textInk, textSoft, textFaint, accent }) {
  const items = [
    { Icon: IconSound,      label: 'Sound',      note: 'ambient for the room' },
    { Icon: ITyping,        label: 'Typing',     note: 'per-keystroke sound'  },
    { Icon: IconBackground, label: 'Background', note: 'surface & palette'    },
    { Icon: IconLayout,     label: 'Layout',     note: 'split or unified view' },
    { Icon: IconSettings,   label: 'Settings',   note: 'size, mistakes'       },
  ];
  return (
    <div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.3em',
        textTransform: 'uppercase', color: textFaint, marginBottom: 12,
      }}>Customise your session</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map(({ Icon, label, note }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon size={12} stroke={accent} />
            <span style={{ fontSize: 12, fontWeight: 500, color: textInk }}>{label}</span>
            <span style={{ fontSize: 11, fontStyle: 'italic', color: textSoft, marginLeft: 2 }}>{note}</span>
          </div>
        ))}
      </div>
      <div style={{
        marginTop: 12, fontSize: 10.5, fontStyle: 'italic', color: textFaint, lineHeight: 1.5,
      }}>All five buttons live in the top-right corner. Defaults: <span style={{ fontStyle: 'normal', color: accent }}>Single</span> layout, <span style={{ fontStyle: 'normal', color: accent }}>Strict</span> mistakes - change anytime in Settings.</div>
    </div>
  );
}

// ── page 2: starter recommendation ──────────────────────────────────────────
function Page2({ textInk, textSoft, textFaint, accent, border, isDark, bgId }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.3em',
        textTransform: 'uppercase', color: textFaint, marginBottom: 12,
      }}>A quiet place to start</div>
      <div style={{ display: 'grid', gap: 11 }}>
        <Rec icon={<IconSound size={12} stroke={accent} />} label="Rain on a window" isDark={isDark}
          note="Real field recording. Fills the room without competing with the words."
          textInk={textInk} textSoft={textSoft} accent={accent} border={border} />
        <div style={{ height: 1, background: border, opacity: 0.6 }} />
        <Rec icon={<ITyping size={12} stroke={accent} />} label="Soft Keys"
          note="Quiet click on every letter. Lets you feel the pace of the sentence."
          textInk={textInk} textSoft={textSoft} accent={accent} border={border} />
      </div>
    </div>
  );
}

function Rec({ icon, label, note, textInk, textSoft, accent, border }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ marginTop: 1, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: textInk, marginBottom: 2 }}>
          <span style={{ fontStyle: 'italic', color: accent }}>{label}</span>
        </div>
        <div style={{ fontSize: 11, color: textSoft, fontStyle: 'italic', lineHeight: 1.45 }}>{note}</div>
      </div>
    </div>
  );
}

// ── page 3: keyboard shortcuts ───────────────────────────────────────────────
function Page3({ textInk, textSoft, textFaint, accent, border, isDark, bgId }) {
  const keys = [
    { k: 'Tab',     desc: 'Reset this passage - start from the top.' },
    { k: 'Esc',     desc: 'Close the book, return to Prepare.' },
    { k: 'Space ↵', desc: 'At passage end, turn to the next page.' },
  ];
  return (
    <div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.3em',
        textTransform: 'uppercase', color: textFaint, marginBottom: 12,
      }}>Coming from monkeytype?</div>
      <div style={{ display: 'grid', gap: 9 }}>
        {keys.map(({ k, desc }) => (
          <div key={k} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
            <kbd style={{
              fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.06em',
              padding: '2px 6px', flexShrink: 0, marginTop: 1,
              border: `1px solid ${border}`,
              color: accent, background: 'transparent', whiteSpace: 'nowrap',
            }}>{k}</kbd>
            <div style={{ fontSize: 11, color: textSoft, fontStyle: 'italic', lineHeight: 1.45 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { ReadingHint });
