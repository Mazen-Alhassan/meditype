// meditype — Reading & Typing screen
// The core. Three variations:
//   A · SPLIT       — book on left (55%), typing surface on right (45%). Classic brief.
//   B · UNIFIED     — one continuous column, typing surface overlays the book. Feels like one page.
//   C · CANDLELIT   — dark mode variation of A, warmer type, lower contrast, lamp-lit feel.
//
// Typing rules:
//   - Same serif, same size as book.
//   - Correct letters = ink color. Mistyped = soft muted red, STAY until backspaced.
//   - No cursor blink, no auto-advance. Space/enter at end turns the page.
//   - No WPM. No accuracy %.

function ReadingScreen({ book, variant = 'A', settings: initialSettings, onExit, onComplete, onVariantChange }) {
  const passages = PASSAGES[book.id] || PASSAGES.aurelius;

  // Hydrate from saved progress for THIS book
  const savedProgress = window.getProgressFor ? window.getProgressFor(book.id) : null;
  const initialIdx = savedProgress
    ? Math.min(savedProgress.passageIdx ?? 0, passages.length - 1)
    : 0;
  // Only restore typed-text mid-passage if it isn't already complete
  const initialTyped = (() => {
    if (!savedProgress) return '';
    const p = passages[initialIdx] || '';
    const len = Math.min(savedProgress.typedLen ?? 0, Math.max(0, p.length - 1));
    return p.slice(0, len);
  })();

  const [passageIdx, setPassageIdx] = React.useState(initialIdx);
  const [typed, setTyped]   = React.useState(initialTyped);
  const [elapsed, setElapsed] = React.useState(0);
  const [showTurn, setShowTurn] = React.useState(false);
  const containerRef = React.useRef(null);

  // Live session state
  const [ambientId, setAmbientId] = React.useState(initialSettings?.ambient || 'rain');
  const [volume, setVolume] = React.useState(() => MTStorage.prefs.getField('ambientVolume', 0.45));
  const [backgroundId, setBackgroundId] = React.useState(initialSettings?.background || 'paper');
  const [sessionSettings, setSessionSettings] = React.useState(() => ({
    typeSize: MTStorage.prefs.getField('typeSize', 'M'),
    strict: MTStorage.prefs.getField('strict', false),
    showTimer: MTStorage.prefs.getField('showTimer', true),
    margins: MTStorage.prefs.getField('margins', 50),
  }));
  const [openPopover, setOpenPopover] = React.useState(null);

  // Typing sound — persists globally via the versioned prefs blob.
  const [tsPreset, setTsPreset] = React.useState(() => MTStorage.prefs.getField('typingPreset', 'softkeys'));
  const [tsVolume, setTsVolume] = React.useState(() => MTStorage.prefs.getField('typingVolume', 0.4));
  const [tsMistake, setTsMistake] = React.useState(() => MTStorage.prefs.getField('typingMistake', true));
  const [rainHintDismissed, setRainHintDismissed] = React.useState(() => MTStorage.prefs.getField('rainHintDismissed', false));

  React.useEffect(() => {
    MTStorage.prefs.setField('typingPreset', tsPreset);
    MTStorage.prefs.setField('typingVolume', tsVolume);
    MTStorage.prefs.setField('typingMistake', tsMistake);
    MTStorage.prefs.setField('rainHintDismissed', rainHintDismissed);
    window.typingSound.setPreset(tsPreset);
    window.typingSound.setVolume(tsVolume);
    window.typingSound.setMistake(tsMistake);
  }, [tsPreset, tsVolume, tsMistake, rainHintDismissed]);

  React.useEffect(() => { MTStorage.prefs.setField('ambientVolume', volume); }, [volume]);
  React.useEffect(() => {
    MTStorage.prefs.setField('typeSize', sessionSettings.typeSize);
    MTStorage.prefs.setField('strict', sessionSettings.strict);
    MTStorage.prefs.setField('showTimer', sessionSettings.showTimer);
    MTStorage.prefs.setField('margins', sessionSettings.margins);
  }, [sessionSettings]);

  const current = passages[passageIdx] || '';
  const isLast = passageIdx >= passages.length - 1;
  const isComplete = typed.length >= current.length;

  // Dark vs light — now either variant C forces dark, OR background id is a dark one
  const darkBackgrounds = ['wood', 'sky', 'ink'];
  const bgIsDark = darkBackgrounds.includes(backgroundId);
  const isDark = variant === 'C' || bgIsDark;

  const bgMap = {
    paper: 'var(--paper)', linen: '#ECE5D2', mist: '#E6E4DB',
    wood:  '#2A1F16', sky: '#3A3D4A', ink: 'var(--walnut)',
  };
  // The user's background pick always wins. Variant C just means "default to walnut
  // if they haven't picked a bg yet" — but any explicit bgMap entry overrides.
  const bg = bgMap[backgroundId] || (variant === 'C' ? 'var(--walnut)' : 'var(--paper)');
  const textInk   = isDark ? 'var(--paper-warm)' : 'var(--ink)';
  const textSoft  = isDark ? 'var(--paper-dim)'  : 'var(--ink-soft)';
  const textFaint = isDark ? 'var(--paper-faint)': 'var(--ink-faint)';
  const rule      = isDark ? 'var(--hairline-d)' : 'var(--hairline)';
  const accent    = isDark ? 'var(--ember)'      : 'var(--accent)';
  const errorClr  = isDark ? 'var(--error-d)'    : 'var(--error)';
  const dim       = isDark ? 'var(--paper-faint)': 'var(--ink-faint)';

  // Timer
  React.useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Ambient audio — arm immediately on mount (the "Begin" click counts as a user
  // gesture, so AudioContext can start without waiting for another keypress).
  const audioArmedRef = React.useRef(false);
  React.useEffect(() => {
    if (audioArmedRef.current) return;
    audioArmedRef.current = true;
    if (ambientId && ambientId !== 'off') {
      window.ambience.setVolume(volume);
      window.ambience.play(ambientId);
    }
    // Fallback: also arm on first keydown/mousedown in case mount fires before ctx resumes
    const arm = () => {
      if (audioArmedRef.current && !window.ambience.ctx) return;
      if (ambientId && ambientId !== 'off' && !window.ambience.current) {
        window.ambience.setVolume(volume);
        window.ambience.play(ambientId);
      }
    };
    window.addEventListener('keydown', arm, { once: true });
    window.addEventListener('mousedown', arm, { once: true });
    return () => {
      window.removeEventListener('keydown', arm);
      window.removeEventListener('mousedown', arm);
    };
  }, []);

  // When ambient changes, swap
  React.useEffect(() => {
    if (!audioArmedRef.current) return;
    if (ambientId === 'off') window.ambience.stop();
    else window.ambience.play(ambientId);
  }, [ambientId]);

  // When volume changes
  React.useEffect(() => {
    if (!audioArmedRef.current) return;
    window.ambience.setVolume(volume);
  }, [volume]);

  // Stop audio on exit (component unmount). If a graceful fadeAndDo already
  // started, don't override its longer ramp with a default 800ms one.
  React.useEffect(() => () => {
    if (fadingOutRef.current) return;
    window.ambience.stop();
  }, []);

  // ── Persist reading position per book ────────────────────────────────
  // Save on every passage/typed change (debounced light) so closing the book
  // anywhere — back arrow, ESC, or browser refresh — leaves a bookmark.
  React.useEffect(() => {
    if (!window.saveProgressFor) return;
    const id = setTimeout(() => {
      window.saveProgressFor(book.id, passageIdx, typed.length);
    }, 200);
    return () => clearTimeout(id);
  }, [book.id, passageIdx, typed]);

  // Helpers used by exit / complete handlers — fade audio first, then navigate.
  const FADE_MS = 1500;
  const fadingOutRef = React.useRef(false);
  const fadeAndDo = React.useCallback((fn) => {
    fadingOutRef.current = true;
    try { window.ambience?.stop(FADE_MS); } catch {}
    try { window.typingSound?.fadeOut?.(FADE_MS); } catch {}
    // Navigate immediately — Ambience is a singleton and continues fading
    // even after this component unmounts.
    fn?.();
  }, []);

  // Close popover on outside click
  React.useEffect(() => {
    if (!openPopover) return;
    const handler = (e) => {
      if (e.target.closest('[data-popover]') || e.target.closest('[data-popover-trigger]')) return;
      setOpenPopover(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openPopover]);

  // Keyboard — the only input surface
  React.useEffect(() => {
    const handler = (e) => {
      // allow escape
      if (e.key === 'Escape') { fadeAndDo(onExit); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'Tab') {
        // Tab (or Tab+Enter on Mac) resets the current passage — like monkeytype
        e.preventDefault();
        setTyped('');
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        setTyped(t => t.slice(0, -1));
        return;
      }
      if (e.key === 'Enter' || (e.key === ' ' && isComplete)) {
        e.preventDefault();
        if (isComplete) {
          if (isLast) {
            // Book finished — clear bookmark, fade audio, then signal complete.
            try { window.clearProgressFor?.(book.id); } catch {}
            fadeAndDo(onComplete);
            return;
          }
          setShowTurn(true);
          setTimeout(() => {
            setPassageIdx(i => i + 1);
            setTyped('');
            setShowTurn(false);
          }, 550);
        } else if (e.key === ' ') {
          // treat space as a character during typing
          const wrong = isMistake({ expected: current[typed.length], typedCh: ' ', strict: sessionSettings.strict });
          window.typingSound?.click(wrong);
          setTyped(t => t + ' ');
        }
        return;
      }
      if (e.key.length === 1) {
        e.preventDefault();
        const wrong = isMistake({ expected: current[typed.length], typedCh: e.key, strict: sessionSettings.strict });
        window.typingSound?.click(wrong);
        setTyped(t => t + e.key);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isComplete, isLast, onComplete, onExit, current, typed, sessionSettings.strict, fadeAndDo]);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const prev = passages[passageIdx - 1];
  const next = passages[passageIdx + 1];

  // Fade-in on mount — smooth transition from Begin → reading
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  return (
    <div className="paper-grain" style={{
      minHeight: '100%', background: bg, color: textInk,
      fontFamily: 'var(--serif)', position: 'relative',
      transition: 'background 800ms ease, color 800ms ease, opacity 600ms ease',
      opacity: mounted ? 1 : 0,
    }}>
      {/* ambient vignette in dark mode */}
      {isDark && <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 40%, rgba(217,174,118,0.08), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.45), transparent 60%)',
      }} />}

      {/* Top bar */}
      <TopBar book={book} passageIdx={passageIdx} total={passages.length}
        elapsed={fmt(elapsed)} onExit={() => fadeAndDo(onExit)}
        openPopover={openPopover} setOpenPopover={setOpenPopover}
        showTimer={sessionSettings.showTimer !== false}
        textInk={textInk} textSoft={textSoft} textFaint={textFaint} rule={rule} />

      {/* Popovers */}
      {openPopover === 'sound' && (
        <div data-popover>
          <SoundPopover
            currentId={ambientId} volume={volume}
            onSelect={setAmbientId} onVolume={setVolume}
            tone={isDark ? 'ember' : 'ink'} bgId={backgroundId} />
        </div>
      )}
      {openPopover === 'background' && (
        <div data-popover>
          <BackgroundPopover
            currentId={backgroundId}
            onSelect={(id) => {
              setBackgroundId(id);
            }}
            tone={isDark ? 'ember' : 'ink'} bgId={backgroundId} />
        </div>
      )}
      {openPopover === 'typing' && (
        <div data-popover>
          <TypingSoundPopover
            preset={tsPreset} volume={tsVolume} onMistake={tsMistake}
            showRainHint={ambientId === 'rain' && !rainHintDismissed && tsPreset !== 'silent'}
            onPreset={setTsPreset}
            onVolume={setTsVolume}
            onMistakeToggle={setTsMistake}
            onDismissHint={() => setRainHintDismissed(true)}
            tone={isDark ? 'ember' : 'ink'} bgId={backgroundId} />
        </div>
      )}
      {openPopover === 'settings' && (
        <div data-popover>
          <SettingsPopover
            settings={{ ...sessionSettings, variant }}
            onChange={(patch) => {
              if (patch.variant && patch.variant !== variant) {
                onVariantChange?.(patch.variant);
              }
              const { variant: _v, ...rest } = patch;
              if (Object.keys(rest).length) setSessionSettings(s => ({ ...s, ...rest }));
            }}
            tone={isDark ? 'ember' : 'ink'} bgId={backgroundId}
            onToggleTone={(t) => onVariantChange?.(t === 'ember' ? 'C' : 'A')}
          />
        </div>
      )}

      {/* Body */}
      <main ref={containerRef} style={{
        minHeight: 'calc(100vh - 128px)',
        padding: variant === 'B' ? '104px 0 132px' : '72px 88px 120px',
      }}>
        {variant === 'A' && (
          <SplitLayout
            book={book} passageIdx={passageIdx} total={passages.length}
            prev={prev} current={current} next={next}
            typed={typed} showTurn={showTurn}
            strict={sessionSettings.strict} typeSize={sessionSettings.typeSize}
            textInk={textInk} textSoft={textSoft} textFaint={textFaint} rule={rule}
            accent={accent} errorClr={errorClr} dim={dim} />
        )}
        {variant === 'B' && (
          <UnifiedLayout
            book={book} passageIdx={passageIdx} total={passages.length}
            prev={prev} current={current} next={next}
            typed={typed} showTurn={showTurn}
            strict={sessionSettings.strict} typeSize={sessionSettings.typeSize}
            textInk={textInk} textSoft={textSoft} textFaint={textFaint} rule={rule}
            accent={accent} errorClr={errorClr} dim={dim} />
        )}
        {variant === 'C' && (
          <SplitLayout dark
            book={book} passageIdx={passageIdx} total={passages.length}
            prev={prev} current={current} next={next}
            typed={typed} showTurn={showTurn}
            strict={sessionSettings.strict} typeSize={sessionSettings.typeSize}
            textInk={textInk} textSoft={textSoft} textFaint={textFaint} rule={rule}
            accent={accent} errorClr={errorClr} dim={dim} />
        )}
      </main>

      {/* Bottom — thin progress + prompt */}
      <BottomBar
        passageIdx={passageIdx} total={passages.length}
        typed={typed} current={current} isComplete={isComplete} isLast={isLast}
        textInk={textInk} textSoft={textSoft} textFaint={textFaint} rule={rule}
        accent={accent} />

      {/* Onboarding hint card */}
      <ReadingHint
        isDark={isDark} accent={accent} rule={rule} bgId={backgroundId}
        textInk={textInk} textSoft={textSoft} textFaint={textFaint} />
    </div>
  );
}

// ------------------------------------------------------------
// TOP BAR
function TopBar({ book, passageIdx, total, elapsed, onExit, openPopover, setOpenPopover, showTimer, textInk, textSoft, textFaint, rule }) {
  const toggle = (id) => setOpenPopover(openPopover === id ? null : id);
  return (
    <header style={{
      padding: '22px 88px', display: 'grid', gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center', borderBottom: `1px solid ${rule}`,
      position: 'relative', zIndex: 30,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <button onClick={onExit} style={{ color: textSoft, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconBack size={13} />
          <span style={{ fontSize: 12.5, fontStyle: 'italic' }}>close the book</span>
        </button>
        <div style={{ width: 1, height: 14, background: rule }} />
        <div style={{ fontSize: 14, fontStyle: 'italic', letterSpacing: '-0.008em', color: textInk }}>
          {book.title}
        </div>
        <div style={{ fontSize: 12, color: textFaint, fontStyle: 'italic' }}>
          — {book.author}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 26, justifyContent: 'center' }}>
        {showTimer && (
          <>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: textFaint, fontVariantNumeric: 'tabular-nums',
            }}>{elapsed}</span>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: rule }} />
          </>
        )}
        <span style={{
          fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: textFaint,
        }}>passage {String(passageIdx + 1).padStart(2,'0')} / {String(total).padStart(2,'0')}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, color: textSoft, paddingLeft: 80 }}>
        <IconButton id="sound" active={openPopover === 'sound'} onClick={() => toggle('sound')}
          label="sound" icon={<IconSound size={15} />} textFaint={textFaint} textInk={textInk} />
        <IconButton id="typing" active={openPopover === 'typing'} onClick={() => toggle('typing')}
          label="typing" icon={<ITyping size={15} />} textFaint={textFaint} textInk={textInk} />
        <IconButton id="background" active={openPopover === 'background'} onClick={() => toggle('background')}
          label="background" icon={<IconBackground size={15} />} textFaint={textFaint} textInk={textInk} />
        <IconButton id="settings" active={openPopover === 'settings'} onClick={() => toggle('settings')}
          label="settings" icon={<IconSettings size={15} />} textFaint={textFaint} textInk={textInk} />
      </div>
    </header>
  );
}

function IconButton({ icon, label, textFaint, textInk, onClick, active, id }) {
  return (
    <button onClick={onClick} data-popover-trigger
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        color: active ? textInk : 'inherit',
        fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
        fontFamily: 'var(--mono)', position: 'relative',
        paddingBottom: 4,
      }}>
      {icon}
      <span style={{ color: active ? textInk : textFaint, fontSize: 10 }}>{label}</span>
      {active && <div style={{
        position: 'absolute', bottom: -23, left: 0, right: 0, height: 1,
        background: 'currentColor', opacity: 0.6,
      }} />}
    </button>
  );
}

// Determines whether a typed char counts as a "mistake" for coloring/sound.
// - strict=true  : any difference counts (case, punctuation, everything).
// - strict=false : forgive case differences on letters; forgive punctuation
//                  the user omits or substitutes — but a missing SPACE where one
//                  is expected is always a mistake (typing the next word's first
//                  letter where a space belongs reads as a wrong character).
const PUNCT = /[.,;:!?"'()—–\-\[\]…]/;
function isMistake({ expected, typedCh, strict }) {
  if (typedCh === expected) return false;
  if (strict) return true;
  // Soft mode forgiveness:
  // 1. Case-insensitive letter match → not a mistake
  if (expected && typedCh && expected.toLowerCase() === typedCh.toLowerCase()) return false;
  // 2. If the expected char is punctuation, the user can skip or substitute it freely.
  //    We can't know mid-keystroke that they skipped it (that would require lookahead
  //    logic in the reducer); here we only judge per-position. So: if they typed a
  //    punctuation where a different punctuation was expected — fine.
  if (PUNCT.test(expected) && (PUNCT.test(typedCh) || typedCh === ' ')) return false;
  // 3. Typing a letter/number where a punctuation was expected — also fine in soft.
  if (PUNCT.test(expected)) return false;
  // 4. Missing-space rule: expected is a space, typed is not → this IS a mistake.
  //    (Running words together is the one thing soft mode still catches.)
  return true;
}

// ------------------------------------------------------------
// TYPED PASSAGE — renders per-character with state
function TypedPassage({ text, typed, textInk, textFaint, errorClr, accent, size = 26, emphasisCurrentWord = true, mode = 'split-right', strict = false }) {
  // mode:
  //  'book'        — book side (left). Renders plain prose in soft ink.
  //  'split-right' — typing side. Characters colored by state.
  //  'unified'     — single surface, shows typed progress inline.

  if (mode === 'book') {
    // Find current word index (based on typed length)
    const currentWordStart = typed.length;
    const words = [];
    let i = 0;
    while (i < text.length) {
      if (text[i] === ' ') { words.push({ ch: ' ', i }); i++; continue; }
      let end = text.indexOf(' ', i);
      if (end === -1) end = text.length;
      words.push({ word: text.slice(i, end), start: i, end });
      i = end;
    }
    // emphasized: the word containing `currentWordStart`
    return (
      <p style={{
        margin: 0, fontSize: size, lineHeight: 1.55, color: textInk,
        fontWeight: 400, letterSpacing: '-0.012em',
        fontVariationSettings: "'opsz' 36",
        textWrap: 'pretty',
      }}>
        {words.map((w, idx) => {
          if (w.ch === ' ') return ' ';
          const isCurrent = emphasisCurrentWord && currentWordStart >= w.start && currentWordStart < w.end;
          return (
            <span key={idx} style={{
              color: isCurrent ? textInk : (currentWordStart > w.end ? textFaint : textInk),
              opacity: currentWordStart > w.end ? 0.4 : 1,
              fontWeight: isCurrent ? 500 : 400,
              transition: 'color 400ms ease, opacity 400ms ease',
            }}>{w.word}</span>
          );
        })}
      </p>
    );
  }

  // split-right / unified — per-char coloring
  return (
    <p style={{
      margin: 0, fontSize: size, lineHeight: 1.55,
      fontWeight: 400, letterSpacing: '-0.012em',
      fontVariationSettings: "'opsz' 36",
      color: textFaint,
      textWrap: 'pretty',
    }}>
      {text.split('').map((ch, i) => {
        let state = 'untyped';
        if (i < typed.length) {
          state = isMistake({ expected: ch, typedCh: typed[i], strict }) ? 'wrong' : 'correct';
        }
        else if (i === typed.length) state = 'cursor';

        const style =
          state === 'correct' ? { color: textInk, fontWeight: 400 } :
          state === 'wrong'   ? { color: errorClr, textDecorationLine: ch === ' ' ? 'underline' : 'none', fontWeight: 500 } :
          state === 'cursor'  ? { color: textFaint, borderLeft: `1.5px solid ${accent}`, marginLeft: -1.5, paddingLeft: 0 } :
                                { color: textFaint, opacity: 0.55 };

        // for wrong space, show a visible underscore
        const display = state === 'wrong' && ch === ' ' ? '_' : ch;
        return <span key={i} style={style}>{display}</span>;
      })}
    </p>
  );
}

// ------------------------------------------------------------
// VARIATION A · SPLIT
function SplitLayout({ book, passageIdx, total, prev, current, next, typed, showTurn,
                      strict = false, typeSize = 'M',
                      textInk, textSoft, textFaint, rule, accent, errorClr, dim, dark }) {
  const sizePx = typeSize === 'S' ? 19 : typeSize === 'L' ? 30 : 24;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 64,
      maxWidth: 1260, margin: '0 auto',
      opacity: showTurn ? 0 : 1, transition: 'opacity 500ms ease',
    }}>
      {/* LEFT — the book */}
      <div style={{ paddingRight: 8, position: 'relative' }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.3em',
          textTransform: 'uppercase', color: textFaint, marginBottom: 36,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span>The book</span>
          <span style={{ flex: 1, height: 1, background: rule }} />
          <span>passage {String(passageIdx + 1).padStart(2,'0')}</span>
        </div>

        {prev && (
          <div style={{ opacity: 0.45, marginBottom: 28 }}>
            <TypedPassage text={prev} typed={prev} size={17}
              textInk={textFaint} textFaint={textFaint} errorClr={errorClr} accent={accent}
              mode="book" />
          </div>
        )}

        <div style={{ position: 'relative' }}>
          {/* small marginal flourish */}
          <div style={{
            position: 'absolute', left: -28, top: 10, width: 14, height: 1,
            background: accent, opacity: 0.6,
          }} />
          <TypedPassage text={current} typed={typed} size={sizePx}
            textInk={textInk} textFaint={textFaint} errorClr={errorClr} accent={accent}
            mode="book" />
        </div>

        {next && (
          <div style={{ opacity: 0.45, marginTop: 32 }}>
            <TypedPassage text={next} typed="" size={17}
              textInk={textFaint} textFaint={textFaint} errorClr={errorClr} accent={accent}
              mode="book" emphasisCurrentWord={false} />
          </div>
        )}
      </div>

      {/* Hairline divider */}
      <div style={{ background: rule, opacity: 0.5 }} />

      {/* RIGHT — the typing surface */}
      <div style={{ paddingLeft: 8 }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.3em',
          textTransform: 'uppercase', color: textFaint, marginBottom: 36,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span>Your hand</span>
          <span style={{ flex: 1, height: 1, background: rule }} />
          <span>{typed.length} / {current.length}</span>
        </div>

        <TypedPassage text={current} typed={typed} size={sizePx} strict={strict}
          textInk={textInk} textFaint={dim} errorClr={errorClr} accent={accent} />

        <div style={{
          marginTop: 56, display: 'flex', alignItems: 'center', gap: 14,
          fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: textFaint,
        }}>
          <span style={{ width: 8, height: 1, background: accent, opacity: 0.7 }} />
          <span>
            {typed.length === 0 ? 'begin when you are ready' :
             typed.length < current.length ? 'no hurry · backspace to correct' :
             'press space to turn the page'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// VARIATION B · UNIFIED — single column, one continuous page
function UnifiedLayout({ book, passageIdx, total, prev, current, next, typed, showTurn,
                        strict = false, typeSize = 'M',
                        textInk, textSoft, textFaint, rule, accent, errorClr, dim }) {
  const sizePx = typeSize === 'S' ? 21 : typeSize === 'L' ? 32 : 26;
  return (
    <div style={{
      maxWidth: 880, margin: '0 auto', padding: '0 56px',
      opacity: showTurn ? 0 : 1, transition: 'opacity 500ms ease',
    }}>
      {/* Header rule — book title ─── passage NN */}
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.3em',
        textTransform: 'uppercase', color: textFaint, marginBottom: 72,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <span>{book.title}</span>
        <span style={{ flex: 1, height: 1, background: rule }} />
        <span>passage {String(passageIdx+1).padStart(2,'0')}</span>
      </div>

      {/* Previous — softly visible, above */}
      {prev && (
        <div style={{ opacity: 0.45, marginBottom: 40 }}>
          <TypedPassage text={prev} typed={prev} size={17}
            textInk={textFaint} textFaint={textFaint} errorClr={errorClr} accent={accent}
            mode="book" emphasisCurrentWord={false} />
        </div>
      )}

      {/* Current — the ONE surface. Book and typing are the same thing. */}
      <div style={{ position: 'relative' }}>
        {/* drop cap — sits well to the left of the text body */}
        <div style={{
          position: 'absolute', left: -130, top: -8,
          fontSize: 84, lineHeight: 1, fontWeight: 400, color: accent,
          fontStyle: 'italic', opacity: 0.6,
          fontVariationSettings: "'opsz' 144",
        }}>{String(passageIdx+1).padStart(2, '0')}</div>

        <TypedPassage text={current} typed={typed} size={sizePx} strict={strict}
          textInk={textInk} textFaint={dim} errorClr={errorClr} accent={accent} />
      </div>

      {/* Next — softly visible, below */}
      {next && (
        <div style={{ opacity: 0.45, marginTop: 40 }}>
          <TypedPassage text={next} typed="" size={17}
            textInk={textFaint} textFaint={textFaint} errorClr={errorClr} accent={accent}
            mode="book" emphasisCurrentWord={false} />
        </div>
      )}

      <div style={{
        marginTop: 88, paddingTop: 28, borderTop: `1px solid ${rule}`,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: textFaint,
      }}>
        <span>{book.author}</span>
        <span>
          {typed.length < current.length ? `${typed.length} of ${current.length}` : '⏎  turn the page'}
        </span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// BOTTOM BAR — thin progress + quiet prompt
function BottomBar({ passageIdx, total, typed, current, isComplete, isLast, textInk, textSoft, textFaint, rule, accent }) {
  const passageProgress = current.length ? Math.min(1, typed.length / current.length) : 0;
  const bookProgress = (passageIdx + passageProgress) / total;
  return (
    <footer style={{
      position: 'fixed', left: 0, right: 0, bottom: 0,
      padding: '18px 88px',
      borderTop: `1px solid ${rule}`,
      background: 'inherit',
      display: 'grid', gridTemplateColumns: 'auto 1fr auto',
      alignItems: 'center', gap: 28,
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: textFaint,
      }}>{String(passageIdx+1).padStart(2,'0')}</div>
      <div style={{ height: 1, background: rule, opacity: 0.6, position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: 1,
          width: `${bookProgress * 100}%`, background: accent, opacity: 0.8,
          transition: 'width 200ms linear',
        }} />
        {/* tick marks per passage */}
        {Array.from({ length: total - 1 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${((i+1)/total) * 100}%`, top: -2,
            width: 1, height: 5, background: textFaint, opacity: 0.4,
          }} />
        ))}
      </div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: textFaint,
      }}>{String(total).padStart(2,'0')}</div>
    </footer>
  );
}

Object.assign(window, { ReadingScreen });
