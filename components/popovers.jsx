// meditype — ambient audio engine (WebAudio, no external assets)
// + top-bar popovers (Sound / Background / Settings)

// ------------------------------------------------------------
// WebAudio ambient generator. Each preset is a small synth patch.
class Ambience {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.nodes = [];
    this.current = null;
    this.volume = 0.5;
  }
  _ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
  }
  _stopAll() {
    this.nodes.forEach(n => { try { n.stop && n.stop(); n.disconnect && n.disconnect(); } catch(e){} });
    this.nodes = [];
  }
  _noise(type = 'pink') {
    const ctx = this.ctx;
    const bufSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    if (type === 'white') {
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    } else if (type === 'brown') {
      let last = 0;
      for (let i = 0; i < bufSize; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    } else { // pink
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i = 0; i < bufSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886*b0 + white*0.0555179;
        b1 = 0.99332*b1 + white*0.0750759;
        b2 = 0.96900*b2 + white*0.1538520;
        b3 = 0.86650*b3 + white*0.3104856;
        b4 = 0.55000*b4 + white*0.5329522;
        b5 = -0.7616*b5 - white*0.0168980;
        data[i] = (b0+b1+b2+b3+b4+b5+b6+white*0.5362)*0.11;
        b6 = white*0.115926;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    this.nodes.push(src);
    return src;
  }
  play(preset) {
    this._ensure();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this._stopAll();
    this.current = preset;

    if (preset === 'off' || preset === 'silence') {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
      return;
    }

    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 1;
    out.connect(this.master);

    if (preset === 'rain') {
      // Loop the provided mp3 file for "rain on a window"
      const el = new Audio('assets/rain.mp3');
      el.loop = true;
      el.crossOrigin = 'anonymous';
      const src = ctx.createMediaElementSource(el);
      src.connect(out);
      el.play().catch(() => {});
      this._rainEl = el;
      this.nodes.push({ stop: () => { el.pause(); el.currentTime = 0; }, disconnect: () => src.disconnect() });
    }
    else if (preset === 'fire') {
      const el = new Audio('assets/fireplace.mp3');
      el.loop = true;
      el.crossOrigin = 'anonymous';
      const src = ctx.createMediaElementSource(el);
      src.connect(out);
      el.play().catch(() => {});
      this._fireEl = el;
      this.nodes.push({ stop: () => { el.pause(); el.currentTime = 0; }, disconnect: () => src.disconnect() });
    }
    else if (preset === 'forest') {
      const n = this._noise('pink');
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
      const g = ctx.createGain(); g.gain.value = 0.35;
      n.connect(lp); lp.connect(g); g.connect(out); n.start();
      // distant "bird" — soft sine blips
      const birdTick = () => {
        if (this.current !== 'forest') return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const base = 1400 + Math.random() * 1800;
        osc.frequency.setValueAtTime(base, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(base * (0.9 + Math.random()*0.3), ctx.currentTime + 0.18);
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.05);
        g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.22);
        osc.connect(g); g.connect(out); osc.start(); osc.stop(ctx.currentTime + 0.25);
        this._birdTimer = setTimeout(birdTick, 2500 + Math.random()*4500);
      };
      birdTick();
    }
    else if (preset === 'ocean') {
      const n = this._noise('brown');
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
      const g = ctx.createGain(); g.gain.value = 0.9;
      n.connect(lp); lp.connect(g); g.connect(out); n.start();
      // slow swell
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.12;
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.5;
      lfo.connect(lfoG); lfoG.connect(g.gain); lfo.start();
      this.nodes.push(lfo);
    }
    else if (preset === 'jazz') {
      const el = new Audio('assets/full.mp3');
      el.loop = true;
      el.crossOrigin = 'anonymous';
      const src = ctx.createMediaElementSource(el);
      src.connect(out);
      el.play().catch(() => {});
      this._jazzEl = el;
      this.nodes.push({ stop: () => { el.pause(); el.currentTime = 0; }, disconnect: () => src.disconnect() });
    }
    else if (preset === 'whitenoise') {
      const el = new Audio('assets/whitenoise.mp3');
      el.loop = true;
      el.crossOrigin = 'anonymous';
      const src = ctx.createMediaElementSource(el);
      src.connect(out);
      el.play().catch(() => {});
      this._whitenoiseEl = el;
      this.nodes.push({ stop: () => { el.pause(); el.currentTime = 0; }, disconnect: () => src.disconnect() });
    }
    else if (preset === 'bowl_REMOVED') {
      // Near silence with a low tone every ~90s
      const n = this._noise('pink');
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
      const g = ctx.createGain(); g.gain.value = 0.12;
      n.connect(lp); lp.connect(g); g.connect(out); n.start();
      const bowlTick = () => {
        if (this.current !== 'bowl') return;
        const osc = ctx.createOscillator(); osc.type = 'sine';
        osc.frequency.value = 196; // G3
        const osc2 = ctx.createOscillator(); osc2.type = 'sine';
        osc2.frequency.value = 196 * 2.76;
        const bg = ctx.createGain(); bg.gain.value = 0;
        osc.connect(bg); osc2.connect(bg); bg.connect(out);
        const t = ctx.currentTime;
        bg.gain.setValueAtTime(0, t);
        bg.gain.linearRampToValueAtTime(0.22, t + 0.05);
        bg.gain.exponentialRampToValueAtTime(0.001, t + 6);
        osc.start(t); osc2.start(t);
        osc.stop(t + 6.2); osc2.stop(t + 6.2);
        this._bowlTimer = setTimeout(bowlTick, 90000);
      };
      setTimeout(bowlTick, 1500);
    }

    // Fade master up gently
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setValueAtTime(this.master.gain.value, ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(this.volume, ctx.currentTime + 1.4);
  }
  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (!this.ctx) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.3);
  }
  stop(fadeMs = 800) {
    clearTimeout(this._crackleTimer);
    clearTimeout(this._birdTimer);
    clearTimeout(this._bowlTimer);
    if (!this.ctx) return;
    const fade = Math.max(80, fadeMs) / 1000;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    // Hold the current value for one tick, then ramp to 0 over `fade` seconds.
    this.master.gain.setValueAtTime(this.master.gain.value, this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + fade);
    // Also fade any HTMLAudioElement-backed presets (jazz, whitenoise) that
    // route through the master \u2014 the master gain DOES affect them, but we
    // also pause the elements after the fade so they don't keep streaming.
    const stopAtMs = fade * 1000 + 60;
    setTimeout(() => this._stopAll(), stopAtMs);
    this.current = null;
  }
}

window.ambience = window.ambience || new Ambience();

// ------------------------------------------------------------
// Popover shell
function Popover({ children, anchor = 'right', top = 76, right = 88, tone }) {
  const isDark = tone !== 'ink';
  return (
    <div style={{
      position: 'fixed', top, right,
      width: 340,
      background: isDark ? 'var(--walnut-edge)' : 'var(--paper-deep)',
      border: `1px solid ${isDark ? 'var(--hairline-d)' : 'var(--hairline)'}`,
      padding: '22px 24px 20px',
      fontFamily: 'var(--serif)',
      color: isDark ? 'var(--paper-warm)' : 'var(--ink)',
      zIndex: 40,
      boxShadow: isDark
        ? '0 2px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(217,174,118,0.04) inset'
        : '0 2px 20px rgba(54,40,20,0.08)',
    }}>
      {/* hairline tick pointing up to the anchor */}
      <div style={{
        position: 'absolute', top: -6, right: anchor === 'right' ? 40 : 'auto', left: anchor === 'left' ? 40 : 'auto',
        width: 10, height: 10,
        background: isDark ? 'var(--walnut-edge)' : 'var(--paper-deep)',
        borderTop: `1px solid ${isDark ? 'var(--hairline-d)' : 'var(--hairline)'}`,
        borderLeft: `1px solid ${isDark ? 'var(--hairline-d)' : 'var(--hairline)'}`,
        transform: 'rotate(45deg)',
      }} />
      {children}
    </div>
  );
}

function PopoverHeader({ title, hint, tone }) {
  const isDark = tone !== 'ink';
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      marginBottom: 18, paddingBottom: 14,
      borderBottom: `1px solid ${isDark ? 'var(--hairline-d)' : 'var(--hairline)'}`,
    }}>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.3em',
        textTransform: 'uppercase', fontWeight: 500,
      }}>{title}</div>
      <div style={{
        fontSize: 11, fontStyle: 'italic',
        color: isDark ? 'var(--paper-faint)' : 'var(--ink-faint)',
      }}>{hint}</div>
    </div>
  );
}

// ------------------------------------------------------------
// SOUND POPOVER
function SoundPopover({ currentId, volume, onSelect, onVolume, tone }) {
  const isDark = tone !== 'ink';
  const faint = isDark ? 'var(--paper-faint)' : 'var(--ink-faint)';
  const soft = isDark ? 'var(--paper-dim)' : 'var(--ink-soft)';
  const rule = isDark ? 'var(--hairline-d)' : 'var(--hairline)';
  const accent = isDark ? 'var(--ember)' : 'var(--accent)';

  return (
    <Popover tone={tone}>
      <PopoverHeader title="Sound" hint={currentId === 'off' ? 'off' : 'playing'} tone={tone} />
      <div style={{ display: 'grid', gap: 2 }}>
        {[{ id: 'off', name: 'Off', hint: 'no sound' }, ...AMBIENTS].map(a => {
          const active = currentId === a.id;
          return (
            <button key={a.id} onClick={() => onSelect(a.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '9px 4px', textAlign: 'left',
                color: active ? (isDark ? 'var(--paper-warm)' : 'var(--ink)') : soft,
                borderLeft: `2px solid ${active ? accent : 'transparent'}`,
                paddingLeft: 10, marginLeft: -12,
                transition: 'color 180ms ease, border-color 180ms ease',
              }}>
              <Waveform active={active} tone={tone} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14, letterSpacing: '-0.005em',
                  fontStyle: active ? 'italic' : 'normal',
                  fontWeight: active ? 500 : 400,
                }}>{a.name}</div>
              </div>
              <div style={{
                fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: faint,
              }}>{a.hint || ''}</div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${rule}` }}>
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
      </div>
    </Popover>
  );
}

// ------------------------------------------------------------
// BACKGROUND POPOVER
function BackgroundPopover({ currentId, onSelect, tone }) {
  const isDark = tone !== 'ink';
  const soft = isDark ? 'var(--paper-dim)' : 'var(--ink-soft)';
  const faint = isDark ? 'var(--paper-faint)' : 'var(--ink-faint)';

  return (
    <Popover tone={tone}>
      <PopoverHeader title="Background" hint="where the page sits" tone={tone} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {BACKGROUNDS.map(b => {
          const active = currentId === b.id;
          return (
            <button key={b.id} onClick={() => onSelect(b.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10,
                textAlign: 'left',
              }}>
              <BackgroundSwatch bg={b} active={active} tone={tone} />
              <div style={{
                fontSize: 12, color: active ? (isDark ? 'var(--paper-warm)' : 'var(--ink)') : soft,
                fontStyle: active ? 'italic' : 'normal',
                fontWeight: active ? 500 : 400, letterSpacing: '-0.005em',
              }}>{b.name}</div>
            </button>
          );
        })}
      </div>
      <div style={{
        marginTop: 18, fontSize: 11, fontStyle: 'italic', color: faint, lineHeight: 1.5,
      }}>Changes apply quietly — the page will shift once.</div>
    </Popover>
  );
}

// ------------------------------------------------------------
// SETTINGS POPOVER
function SettingsPopover({ settings, onChange, tone, onToggleTone }) {
  const isDark = tone !== 'ink';
  const soft = isDark ? 'var(--paper-dim)' : 'var(--ink-soft)';
  const faint = isDark ? 'var(--paper-faint)' : 'var(--ink-faint)';
  const rule = isDark ? 'var(--hairline-d)' : 'var(--hairline)';
  const accent = isDark ? 'var(--ember)' : 'var(--accent)';
  const ink = isDark ? 'var(--paper-warm)' : 'var(--ink)';

  const Row = ({ label, children }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: `1px solid ${rule}`,
    }}>
      <div style={{ fontSize: 13, color: soft, fontStyle: 'italic' }}>{label}</div>
      <div style={{ display: 'flex', gap: 6 }}>{children}</div>
    </div>
  );

  const Chip = ({ active, children, onClick }) => (
    <button onClick={onClick} style={{
      padding: '5px 12px', fontSize: 11.5, fontFamily: 'var(--serif)',
      color: active ? ink : soft,
      background: 'transparent',
      borderTop: `1px solid ${active ? accent : rule}`,
      borderBottom: `1px solid ${active ? accent : rule}`,
      borderLeft: 0, borderRight: 0,
      fontStyle: active ? 'italic' : 'normal',
      fontWeight: active ? 500 : 400,
      letterSpacing: '-0.005em',
    }}>{children}</button>
  );

  return (
    <Popover tone={tone}>
      <PopoverHeader title="Settings" hint="the room" tone={tone} />

      <Row label="Theme">
        <Chip active={!isDark} onClick={() => onToggleTone('ink')}>Paper</Chip>
        <Chip active={isDark}  onClick={() => onToggleTone('ember')}>Candlelit</Chip>
      </Row>
      <Row label="Type size">
        {['S','M','L'].map(s => (
          <Chip key={s} active={settings.typeSize === s} onClick={() => onChange({ typeSize: s })}>{s}</Chip>
        ))}
      </Row>
      <Row label="Mistakes">
        <Chip active={settings.strict === false} onClick={() => onChange({ strict: false })}>Soft</Chip>
        <Chip active={settings.strict === true}  onClick={() => onChange({ strict: true })}>Strict</Chip>
      </Row>
      <Row label="Show timer">
        <Chip active={settings.showTimer !== false} onClick={() => onChange({ showTimer: true })}>On</Chip>
        <Chip active={settings.showTimer === false} onClick={() => onChange({ showTimer: false })}>Off</Chip>
      </Row>
      <div style={{ padding: '12px 0 0' }}>
        <div style={{ fontSize: 13, color: soft, fontStyle: 'italic', marginBottom: 10 }}>Margins</div>
        <input type="range" min="0" max="100" value={settings.margins ?? 50}
          onChange={(e) => onChange({ margins: parseInt(e.target.value, 10) })}
          style={{ width: '100%', accentColor: isDark ? '#D9AE76' : '#B5705A' }}
        />
        <div style={{
          display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)',
          fontSize: 9.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: faint,
          marginTop: 6,
        }}>
          <span>narrow</span><span>wide</span>
        </div>
      </div>

      <div style={{
        marginTop: 16, paddingTop: 14, borderTop: `1px solid ${rule}`,
        fontSize: 11, fontStyle: 'italic', color: faint, lineHeight: 1.5,
      }}>Press <span style={{ fontFamily: 'var(--mono)', fontStyle: 'normal', fontSize: 10 }}>ESC</span> at any time to close the book.</div>
    </Popover>
  );
}

Object.assign(window, { SoundPopover, BackgroundPopover, SettingsPopover });
