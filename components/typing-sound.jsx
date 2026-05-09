// meditype — typing sound engine (sample-based playback)
// softkeys, thocky (sample-bank, 10 keystrokes from a real mech kbd), pen +
// synthesized wood block + silent.

const THOCKY_BANK = [
  'assets/thocky-01.wav', 'assets/thocky-02.wav', 'assets/thocky-03.wav',
  'assets/thocky-04.wav', 'assets/thocky-05.wav', 'assets/thocky-06.wav',
  'assets/thocky-07.wav', 'assets/thocky-08.wav',
];

class TypingSound {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.volume = 0.4;
    this.preset = 'softkeys';
    this.onMistake = true;
    this.buffers = {};
    this._loading = {};
    this._lastThockyIdx = -1; // avoid same sample twice in a row
  }
  _ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
  }
  async _load(id, url) {
    if (this.buffers[id]) return this.buffers[id];
    if (this._loading[id]) return this._loading[id];
    this._loading[id] = (async () => {
      const res = await fetch(url);
      const arr = await res.arrayBuffer();
      const buf = await this.ctx.decodeAudioData(arr);
      this.buffers[id] = buf;
      return buf;
    })();
    return this._loading[id];
  }
  setPreset(p) {
    this.preset = p;
    this._ensure();
    if (p === 'softkeys') this._load('softkeys', 'assets/typing-soft.wav');
    if (p === 'pen')      this._load('pen',      'assets/typing-pen.wav');
    if (p === 'thocky') {
      // preload bank
      THOCKY_BANK.forEach((url, i) => this._load(`thocky-${i}`, url));
    }
  }
  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master) this.master.gain.value = this.volume;
  }
  setMistake(on) { this.onMistake = !!on; }

  // Smooth fade for the typing-sound master gain. After the fade, restore
  // the gain to user volume so future sessions aren't silent.
  fadeOut(ms = 1000) {
    if (!this.ctx || !this.master) return;
    const fade = Math.max(60, ms) / 1000;
    const g = this.master.gain;
    const restoreTo = this.volume;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setValueAtTime(g.value, this.ctx.currentTime);
    g.linearRampToValueAtTime(0.0001, this.ctx.currentTime + fade);
    setTimeout(() => { try { g.setValueAtTime(restoreTo, this.ctx.currentTime); } catch {} }, fade * 1000 + 80);
  }

  _playSample(id, opts = {}) {
    const buf = this.buffers[id];
    if (!buf) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = opts.rate ?? (0.94 + Math.random() * 0.12);
    const g = ctx.createGain();
    g.gain.value = opts.gain ?? 1;
    src.connect(g); g.connect(this.master);
    src.start();
  }

  _playThocky() {
    // pick a random sample, but not the same one twice in a row
    let idx = Math.floor(Math.random() * THOCKY_BANK.length);
    if (idx === this._lastThockyIdx) idx = (idx + 1) % THOCKY_BANK.length;
    this._lastThockyIdx = idx;
    const id = `thocky-${idx}`;
    // No pitch jitter — rate stays at 1.0 so every sample sounds as recorded.
    // Only tiny gain variation (±8%) keeps consecutive keys from being robotically identical.
    const opts = { rate: 1.0, gain: 0.92 + Math.random() * 0.16 };
    if (this.buffers[id]) {
      this._playSample(id, opts);
    } else {
      this._load(id, THOCKY_BANK[idx]).then(() => this._playSample(id, opts));
    }
  }

  click(isMistake = false) {
    if (this.preset === 'silent') return;
    if (isMistake && !this.onMistake) return;
    this._ensure();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    if (this.preset === 'thocky') {
      this._playThocky();
      return;
    }

    if (this.preset === 'softkeys' || this.preset === 'pen') {
      if (this.buffers[this.preset]) {
        this._playSample(this.preset);
      } else {
        const urls = {
          softkeys: 'assets/typing-soft.wav',
          pen:      'assets/typing-pen.wav',
        };
        this._load(this.preset, urls[this.preset]).then(() => this._playSample(this.preset));
      }
      return;
    }

    // woodblock — synthesized (no sample provided)
    if (this.preset === 'woodblock') {
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const g = ctx.createGain(); g.connect(this.master);
      const osc = ctx.createOscillator(); osc.type = 'sine';
      const jitter = (a, b) => a + Math.random() * (b - a);
      osc.frequency.setValueAtTime(jitter(200, 260), t);
      osc.frequency.exponentialRampToValueAtTime(jitter(140, 180), t + 0.04);
      g.gain.setValueAtTime(0.6, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(g);
      osc.start(t); osc.stop(t + 0.1);
    }
  }

  preview(preset) {
    const prev = this.preset;
    this.setPreset(preset);
    const schedule = [0, 90, 180, 320, 410, 500, 650];
    schedule.forEach((ms, i) => setTimeout(() => this.click(i === 2), ms));
    setTimeout(() => { this.preset = prev; }, 800);
  }
}

window.typingSound = window.typingSound || new TypingSound();

// ------------------------------------------------------------
// Icons for typing-sound options (hairline, restrained)
const IKey = (p) => <Icon sw={1} {...p} d={<>
  <rect x="5" y="6" width="14" height="12" rx="1.5" />
  <path d="M8.5 10h.01M12 10h.01M15.5 10h.01M8 14h8" />
</>} />;
// Thocky switch — a square keycap viewed from a slight angle, with the cross-stem visible.
const IThocky = (p) => <Icon sw={1} {...p} d={<>
  <rect x="5" y="6" width="14" height="12" rx="1.4" />
  <path d="M7.5 8.5h9v7h-9z" opacity="0.55" />
  <path d="M12 10.5v3M10.5 12h3" />
</>} />;
const IPen = (p) => <Icon sw={1} {...p} d={<>
  <path d="M5 19l3-1 10-10-2-2L6 16l-1 3z" />
  <path d="M14 8l2 2" />
</>} />;
const IWood = (p) => <Icon sw={1} {...p} d={<>
  <rect x="5" y="9" width="14" height="8" rx="1" />
  <path d="M5 11h14M5 15h14" opacity="0.4" />
</>} />;
const ISilent = (p) => <Icon sw={1} {...p} d={<>
  <path d="M4 10v4h3l4 3V7l-4 3H4z" />
  <path d="M15 9l5 6M20 9l-5 6" />
</>} />;
const ITyping = (p) => <Icon sw={1} {...p} d={<>
  <rect x="3" y="8" width="18" height="9" rx="1" />
  <path d="M6 11h.01M9 11h.01M12 11h.01M15 11h.01M18 11h.01M8 14h8" />
</>} />;

const TYPING_PRESETS = [
  { id: 'softkeys',  name: 'Soft Keys',     desc: 'Modern, quiet',       Icon: IKey },
  { id: 'thocky',    name: 'Thocky Switches', desc: 'Deep, satisfying',  Icon: IThocky },
  { id: 'pen',       name: 'Fountain Pen',  desc: 'The signature',       Icon: IPen },
  { id: 'woodblock', name: 'Wood Block',    desc: 'Zen mode',            Icon: IWood },
  { id: 'silent',    name: 'Silent',        desc: 'Just the ambient',    Icon: ISilent },
];

// ------------------------------------------------------------
// TYPING SOUND POPOVER
function TypingSoundPopover({ preset, volume, onMistake, showRainHint, onPreset, onVolume, onMistakeToggle, onDismissHint, tone, bgId }) {
  const isDark = ['wood','sky','ink'].includes(bgId) || tone !== 'ink';
  const COLORS = { paper:{bg:'#EAE2D0',border:'#D5CBB8',text:'var(--ink)',soft:'var(--ink-soft)',rule:'var(--hairline)'}, linen:{bg:'#E2DAC7',border:'#CBBFA8',text:'var(--ink)',soft:'var(--ink-soft)',rule:'var(--hairline)'}, mist:{bg:'#D8D9D1',border:'#C2C4BA',text:'var(--ink)',soft:'var(--ink-soft)',rule:'#B5B9AF'}, wood:{bg:'#38291A',border:'#513C24',text:'var(--paper-warm)',soft:'var(--paper-dim)',rule:'var(--hairline-d)'}, sky:{bg:'#30354A',border:'#3E4560',text:'#DDE0EC',soft:'#9AA0BC',rule:'#44506A'}, ink:{bg:'#221810',border:'#362515',text:'var(--paper-warm)',soft:'var(--paper-dim)',rule:'var(--hairline-d)'} };
  const c = COLORS[bgId] || (isDark ? COLORS.wood : COLORS.paper);
  const ink   = c.text;
  const soft  = c.soft;
  const faint = c.soft;
  const rule  = c.rule;
  const accent = isDark ? 'var(--ember)' : 'var(--accent)';

  const isSilent = preset === 'silent';
  const dimStyle = isSilent ? { opacity: 0.5, pointerEvents: 'none' } : {};

  return (
    <Popover tone={tone} bgId={bgId}>
      <PopoverHeader title="Typing Sound" hint={TYPING_PRESETS.find(p => p.id === preset)?.name.toLowerCase()} tone={tone} bgId={bgId} />

      <div style={{ display: 'grid', gap: 2 }}>
        {TYPING_PRESETS.map(p => {
          const active = preset === p.id;
          const IconC = p.Icon;
          return (
            <button key={p.id} onClick={() => onPreset(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '10px 4px 10px 10px', textAlign: 'left',
                color: active ? ink : soft,
                borderLeft: `2px solid ${active ? accent : 'transparent'}`,
                marginLeft: -12,
                transition: 'color 180ms ease, border-color 180ms ease',
              }}>
              <IconC size={16} stroke={active ? accent : (isDark ? 'var(--paper-dim)' : 'var(--ink-soft)')} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14, letterSpacing: '-0.005em',
                  fontStyle: active ? 'italic' : 'normal',
                  fontWeight: active ? 500 : 400,
                }}>{p.name}</div>
                <div style={{
                  fontSize: 11, color: faint, marginTop: 2, fontStyle: 'italic',
                }}>{p.desc}</div>
              </div>
              {active && (
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: accent,
                }} />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${rule}` }}>
        <div style={dimStyle}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: faint, marginBottom: 10,
          }}>
            <span>Volume</span>
            <span>{Math.round(volume * 100)}</span>
          </div>
          <input type="range" min="0" max="100" value={Math.round(volume * 100)}
            onChange={(e) => onVolume(parseInt(e.target.value, 10) / 100)}
            style={{ width: '100%', accentColor: isDark ? '#D9AE76' : '#B5705A' }}
          />

          {showRainHint && (
            <div style={{
              marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start',
              fontSize: 11, color: faint, fontStyle: 'italic', lineHeight: 1.5,
            }}>
              <span>Tip — with rain playing, you may prefer Silent.</span>
              <button onClick={onDismissHint} style={{
                color: faint, fontFamily: 'var(--mono)', fontSize: 9,
                letterSpacing: '0.22em', textTransform: 'uppercase',
                opacity: 0.7,
              }}>dismiss</button>
            </div>
          )}

          <div style={{
            marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: 12.5, color: soft, fontStyle: 'italic' }}>Play sound on mistakes</div>
            <MinimalSwitch on={onMistake} onToggle={onMistakeToggle} tone={tone} />
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 16, paddingTop: 12, borderTop: `1px solid ${rule}`,
        display: 'flex', justifyContent: 'flex-end',
      }}>
        <button onClick={() => window.typingSound.preview(preset)}
          disabled={isSilent}
          style={{
            fontFamily: 'var(--serif)', fontSize: 12, fontStyle: 'italic',
            color: isSilent ? faint : soft,
            borderBottom: `1px solid ${isSilent ? 'transparent' : rule}`,
            padding: '2px 0',
            cursor: isSilent ? 'default' : 'pointer',
          }}>
          Preview
        </button>
      </div>
    </Popover>
  );
}

function MinimalSwitch({ on, onToggle, tone }) {
  const isDark = tone !== 'ink';
  const rule = isDark ? 'var(--hairline-d)' : 'var(--hairline)';
  const accent = isDark ? 'var(--ember)' : 'var(--accent)';
  return (
    <button onClick={() => onToggle(!on)} style={{
      width: 34, height: 16, position: 'relative',
      border: `1px solid ${on ? accent : rule}`,
      background: 'transparent', padding: 0,
      transition: 'border-color 200ms ease',
    }}>
      <div style={{
        position: 'absolute', top: 1, left: on ? 18 : 1,
        width: 12, height: 12,
        background: on ? accent : (isDark ? 'var(--paper-faint)' : 'var(--ink-faint)'),
        transition: 'left 220ms cubic-bezier(.4,.2,.2,1), background 200ms ease',
      }} />
    </button>
  );
}

Object.assign(window, { TypingSoundPopover, TYPING_PRESETS, ITyping });
