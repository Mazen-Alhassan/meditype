// meditype — shared primitives

// Soft book cover placeholder — no cover art competing; two muted tones + stamped title
function BookCover({ book, width = 120, height = 170, small }) {
  const ratio = height / 170;
  const titleSize = small ? 11 : 13;
  return (
    <div
      style={{
        width, height,
        background: `linear-gradient(155deg, ${book.colorA} 0%, ${book.colorB} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05), inset 12px 0 24px -16px rgba(0,0,0,0.20)',
        fontFamily: 'var(--serif)',
        color: '#F2ECE0',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: `${14 * ratio}px ${12 * ratio}px`,
      }}
    >
      {/* Stamped hairline frame */}
      <div style={{
        position: 'absolute', inset: `${6 * ratio}px`,
        border: '0.5px solid rgba(255,255,255,0.25)',
        pointerEvents: 'none',
      }} />
      <div style={{
        fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase',
        opacity: 0.7, fontWeight: 400, fontFamily: 'var(--mono)',
      }}>{book.mood.split(' ')[0].toLowerCase()}</div>
      <div>
        <div style={{
          fontSize: titleSize, lineHeight: 1.15,
          fontWeight: 500, letterSpacing: '-0.005em',
          fontVariationSettings: "'opsz' 14",
          textWrap: 'balance',
        }}>{book.title}</div>
        <div style={{
          marginTop: 6, fontSize: 8, letterSpacing: '0.18em',
          textTransform: 'uppercase', opacity: 0.65, fontFamily: 'var(--mono)',
        }}>{book.author.split(' ').slice(-1)[0]}</div>
      </div>
    </div>
  );
}

// Thin progress line — never a percentage
function ProgressLine({ value, tone = 'ink', width = '100%', height = 1 }) {
  const bg = tone === 'ink' ? 'var(--hairline)' : 'var(--hairline-d)';
  const fg = tone === 'ink' ? 'var(--ink-soft)' : 'var(--ember)';
  return (
    <div style={{ width, height, background: bg, position: 'relative', opacity: 0.55 }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: `${Math.round(value * 100)}%`,
        height: '100%', background: fg, opacity: 0.85,
      }} />
    </div>
  );
}

// Tiny icons — hairline only
const Icon = ({ d, size = 14, stroke = 'currentColor', sw = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const IconSound = (p) => <Icon sw={1} {...p} d={<>
  <path d="M4 10v4h3l4 3V7l-4 3H4z" />
  <path d="M15 9c1.2 1 1.2 5 0 6" opacity="0.5" />
  <path d="M17 7c2.4 2 2.4 8 0 10" opacity="0.3" />
</>} />;
const IconBackground = (p) => <Icon sw={1} {...p} d={<>
  <rect x="4" y="4" width="16" height="16" rx="0" />
  <path d="M4 14l5-5 4 4 3-3 4 4" />
  <circle cx="15" cy="8" r="1" />
</>} />;
const IconSettings = (p) => <Icon sw={1} {...p} d={<>
  <circle cx="12" cy="12" r="2" />
  <path d="M12 4v3M12 17v3M4 12h3M17 12h3M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M6.3 17.7l2.1-2.1M15.6 8.4l2.1-2.1" opacity="0.7" />
</>} />;
const IconLayout = (p) => <Icon sw={1} {...p} d={<>
  <rect x="4" y="5" width="16" height="14" rx="0" />
  <path d="M12 5v14" />
</>} />;
const IconBack = (p) => <Icon sw={1} {...p} d={<path d="M14 5l-7 7 7 7" />} />;
const IconSearch = (p) => <Icon sw={1} {...p} d={<>
  <circle cx="11" cy="11" r="5" />
  <path d="M15 15l4 4" />
</>} />;
const IconPlay = (p) => <Icon sw={1} {...p} d={<path d="M8 5v14l11-7-11-7z" />} />;
const IconMoon = (p) => <Icon sw={1} {...p} d={<path d="M19 14A7 7 0 0110 5a7 7 0 109 9z" />} />;
const IconSun = (p) => <Icon sw={1} {...p} d={<>
  <circle cx="12" cy="12" r="3.5" />
  <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
</>} />;
const IconCheck = (p) => <Icon sw={1} {...p} d={<path d="M5 12l4 4 10-10" />} />;

// Tiny waveform for ambient selector
function Waveform({ active, tone = 'ink' }) {
  const bars = [3, 6, 10, 14, 9, 5, 11, 7, 4, 8, 13, 6, 3];
  const color = tone === 'ink'
    ? (active ? 'var(--accent)' : 'var(--ink-faint)')
    : (active ? 'var(--ember)' : 'var(--paper-faint)');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 16 }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 1, height: h, background: color, opacity: active ? 0.85 : 0.55,
          transition: 'all 200ms ease',
        }} />
      ))}
    </div>
  );
}

// Background swatch rendered as a gradient chip
function BackgroundSwatch({ bg, active, tone = 'ink' }) {
  const map = {
    paper: 'linear-gradient(140deg, #F4EEE1, #ECE2CB)',
    wood:  'linear-gradient(140deg, #3C2A1B, #1C120A)',
    mist:  'linear-gradient(140deg, #E6E4DB, #CFD1C7)',
    sky:   'linear-gradient(140deg, #44485A, #262938)',
    linen: 'linear-gradient(140deg, #ECE5D2, #D9D1B8)',
    ink:   'linear-gradient(140deg, #2A1F15, #110A06)',
    drift: 'linear-gradient(140deg, #F4EEE1 0%, #DDD3BC 35%, #3C2A1B 100%)',
  };
  const borderColor = tone === 'ink' ? 'var(--hairline)' : 'var(--hairline-d)';
  return (
    <div style={{
      width: 44, height: 44,
      background: map[bg.id] || bg.swatch,
      border: `1px solid ${borderColor}`,
      outline: active ? `1px solid var(--${tone === 'ink' ? 'accent' : 'ember'})` : 'none',
      outlineOffset: 3,
      transition: 'outline 180ms ease',
    }} />
  );
}

Object.assign(window, {
  BookCover, ProgressLine, Icon, Waveform, BackgroundSwatch,
  IconSound, IconBackground, IconSettings, IconLayout, IconBack, IconSearch,
  IconPlay, IconMoon, IconSun, IconCheck,
});
