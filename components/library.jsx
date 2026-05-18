// meditype - Library screen
// A curated shelf organized by mood. Cream paper, generous air, no ratings.

function LibraryScreen({ onOpenBook, tone = 'ink' }) {
  const [activeMood, setActiveMood] = React.useState('All');
  const [search, setSearch] = React.useState('');

  // Merge live per-book progress (from typing sessions) onto seed continue %.
  // Seed values give a populated demo; real reading overrides them.
  const liveProgress = (typeof window !== 'undefined' && window.loadProgress) ? window.loadProgress() : {};
  const booksWithProgress = BOOKS.map((b) => {
    const live = liveProgress[b.id];
    if (!live) return b;
    const passageIdx = Math.min(live.passageIdx ?? 0, Math.max(0, b.passages - 1));
    return { ...b, continue: passageIdx / b.passages, _livePassage: passageIdx + 1 };
  });

  const continuing = booksWithProgress.filter((b) => b.continue !== null);
  const moods = ['All', ...MOODS];

  const filtered = booksWithProgress.filter((b) => {
    if (activeMood !== 'All' && b.mood !== activeMood) return false;
    if (search && !(b.title + b.author).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const byMood = {};
  MOODS.forEach((m) => {byMood[m] = filtered.filter((b) => b.mood === m);});

  const isDark = tone !== 'ink';
  const bg = isDark ? 'var(--walnut)' : 'var(--paper)';
  const textInk = isDark ? 'var(--paper-warm)' : 'var(--ink)';
  const textSoft = isDark ? 'var(--paper-dim)' : 'var(--ink-soft)';
  const textFaint = isDark ? 'var(--paper-faint)' : 'var(--ink-faint)';
  const rule = isDark ? 'var(--hairline-d)' : 'var(--hairline)';
  const accent = isDark ? 'var(--ember)' : 'var(--accent)';

  return (
    <div className="paper-grain" style={{
      minHeight: '100%', background: bg, color: textInk,
      fontFamily: 'var(--serif)', position: 'relative'
    }}>
      {/* Masthead */}
      <header style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '36px 88px 28px',
        borderBottom: `1px solid ${rule}`
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.3em',
          textTransform: 'uppercase', color: textFaint
        }}>
          Vol. IV &nbsp;·&nbsp; {(() => {
            const d = new Date();
            const day = d.toLocaleDateString('en-US', { weekday: 'long' });
            const h = d.getHours();
            const part =
            h < 5 ? 'night' :
            h < 11 ? 'morning' :
            h < 14 ? 'midday' :
            h < 17 ? 'afternoon' :
            h < 21 ? 'evening' : 'night';
            return `${day} ${part}`;
          })()}
        </div>
        <div style={{
          fontSize: 26, fontWeight: 500, letterSpacing: '-0.015em',
          fontStyle: 'italic', fontVariationSettings: "'opsz' 144"
        }}>
          meditype
        </div>
        <div style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 28,
          color: textSoft
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, letterSpacing: '0.01em'
          }}>
            <IconSearch size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="find a book"
              style={{
                background: 'transparent', border: 0, outline: 0,
                fontSize: 14, width: 140, color: textInk,
                fontStyle: search ? 'normal' : 'italic'
              }} />
            
          </div>
          <div style={{ width: 1, height: 14, background: rule }} />
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: textFaint
          }}>Eleanor</div>
        </div>
      </header>

      {/* Title block */}
      <section style={{ padding: '64px 88px 72px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'end' }}>
        <div>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.3em',
            textTransform: 'uppercase', color: textFaint, marginBottom: 20
          }}>The Library</div>
          <h1 style={{
            margin: 0, fontSize: 64, lineHeight: 1.02, fontWeight: 400,
            letterSpacing: '-0.026em', fontVariationSettings: "'opsz' 144",
            textWrap: 'balance', paddingBottom: 4
          }}>
            Twenty minutes <span style={{ fontStyle: 'italic', color: textSoft }}>of quiet</span><br />
            with a book.
          </h1>
        </div>
        <div style={{ paddingBottom: 12, maxWidth: 460 }}>
          <p style={{
            margin: 0, fontSize: 16, lineHeight: 1.65, color: textSoft,
            fontWeight: 300, textWrap: 'pretty'
          }}>
            Forty titles from the public domain, arranged not by alphabet
            or popularity but by the hour of day they best belong to.
            Read one passage. Then the next. There is nowhere to be.
          </p>
          <div style={{
            marginTop: 28, display: 'flex', alignItems: 'center', gap: 16,
            fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: textFaint
          }}>
            <span>40 books</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: rule }} />
            <span>6 moods</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: rule }} />
            <span>always calm</span>
          </div>
        </div>
      </section>

      {/* Mood filter */}
      <nav style={{
        padding: '22px 88px', borderTop: `1px solid ${rule}`, borderBottom: `1px solid ${rule}`,
        display: 'flex', gap: 38, alignItems: 'center', fontSize: 14
      }}>
        {moods.map((m) => {
          const active = activeMood === m;
          return (
            <button key={m}
            onClick={() => setActiveMood(m)}
            style={{
              color: active ? textInk : textFaint,
              fontStyle: active ? 'italic' : 'normal',
              fontSize: 15, fontWeight: active ? 500 : 400,
              position: 'relative', paddingBottom: 2
            }}>
              
              {m}
              {active && <div style={{
                position: 'absolute', bottom: -21, left: 0, right: 0,
                height: 1, background: accent
              }} />}
            </button>);

        })}
        <div style={{ flex: 1 }} />
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: textFaint
        }}>
          {filtered.length} titles
        </div>
      </nav>

      {/* Continue reading row */}
      {continuing.length > 0 &&
      <section style={{ padding: '56px 88px 28px' }}>
          <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: 32
        }}>
            <h2 style={{
            margin: 0, fontSize: 14, letterSpacing: '0.3em',
            textTransform: 'uppercase', fontFamily: 'var(--mono)',
            fontWeight: 400, color: textFaint
          }}>Return to</h2>
            <div style={{
            fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: textFaint
          }}>{continuing.length} in progress</div>
          </div>
          <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${continuing.length}, 1fr)`, gap: 56
        }}>
            {continuing.map((book) =>
          <button key={book.id}
          onClick={() => onOpenBook(book)}
          style={{ textAlign: 'left', display: 'flex', gap: 22, alignItems: 'flex-start' }}>
                <BookCover book={book} width={86} height={122} small />
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <div style={{
                fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: textFaint, marginBottom: 8
              }}>Last sat · 2 days ago</div>
                  <div style={{ fontSize: 19, lineHeight: 1.25, marginBottom: 3, fontWeight: 500, letterSpacing: '-0.01em' }}>{book.title}</div>
                  <div style={{ fontSize: 13, color: textSoft, fontStyle: 'italic', marginBottom: 18 }}>{book.author}</div>
                  <ProgressLine value={book.continue} tone={tone} />
                  <div style={{
                marginTop: 10, fontFamily: 'var(--mono)', fontSize: 10,
                letterSpacing: '0.18em', textTransform: 'uppercase', color: textFaint,
                display: 'flex', justifyContent: 'space-between'
              }}>
                    <span>passage {book._livePassage ?? Math.round(book.continue * book.passages)} of {book.passages}</span>
                    <span>~{book.minutes} min</span>
                  </div>
                </div>
              </button>
          )}
          </div>
        </section>
      }

      {/* Mood sections */}
      <section style={{ padding: '36px 88px 120px' }}>
        {MOODS.filter((m) => activeMood === 'All' || m === activeMood).
        filter((m) => byMood[m].length > 0).
        map((mood, idx) =>
        <div key={mood} style={{
          paddingTop: idx === 0 ? 44 : 80,
          borderTop: idx === 0 ? 'none' : `1px solid ${rule}`,
          marginTop: idx === 0 ? 0 : 0
        }}>
              <div style={{
            display: 'grid', gridTemplateColumns: '240px 1fr', gap: 56,
            paddingTop: idx === 0 ? 0 : 44
          }}>
                <div style={{ position: 'sticky', top: 32, alignSelf: 'start' }}>
                  <div style={{
                fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.3em',
                textTransform: 'uppercase', color: textFaint, marginBottom: 16
              }}>Mood</div>
                  <h3 style={{
                margin: 0, fontSize: 32, lineHeight: 1.05, fontWeight: 400,
                letterSpacing: '-0.02em', fontStyle: 'italic',
                fontVariationSettings: "'opsz' 144"
              }}>{mood}</h3>
                  <div style={{ marginTop: 20, width: 32, height: 1, background: accent, opacity: 0.7 }} />
                  <p style={{
                marginTop: 20, fontSize: 13, lineHeight: 1.65,
                color: textSoft, fontWeight: 300, maxWidth: 200
              }}>{MOOD_COPY[mood]}</p>
                  <div style={{
                marginTop: 24, fontFamily: 'var(--mono)', fontSize: 10.5,
                letterSpacing: '0.22em', textTransform: 'uppercase', color: textFaint
              }}>{byMood[mood].length} volumes</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '48px 36px' }}>
                  {byMood[mood].map((book) =>
              <LibraryCard key={book.id} book={book} onClick={() => onOpenBook(book)}
              textInk={textInk} textSoft={textSoft} textFaint={textFaint} rule={rule} />
              )}
                </div>
              </div>
            </div>
        )}
      </section>

      {/* Footer colophon */}
      <footer style={{
        padding: '36px 88px', borderTop: `1px solid ${rule}`,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: textFaint
      }}>
        <span>meditype · a quiet reading practice</span>
        <span>all texts: public domain</span>
        <span>read slowly</span>
      </footer>
    </div>);

}

const MOOD_COPY = {
  'Slow Sundays': 'Long paragraphs for the part of the morning before anything begins.',
  'Mystical': 'Small lines that open sideways onto something larger.',
  'Stoic Mornings': 'Steady counsel for the first coffee.',
  'Wonder': 'To remember what a sentence can still do.',
  'Melancholy': 'Company for the blue hour. Nothing is fixed. Something is held.',
  'Adventure': 'A doorway, a harbor, a horizon. For when the room is too small.'
};

function LibraryCard({ book, onClick, textInk, textSoft, textFaint, rule }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left', color: textInk,
        display: 'flex', flexDirection: 'column',
        transition: 'transform 400ms cubic-bezier(.2,.8,.2,1)',
        transform: hover ? 'translateY(-3px)' : 'translateY(0)'
      }}>
      <div style={{ marginBottom: 18, position: 'relative' }}>
        <BookCover book={book} width={186} height={264} />
        <div style={{
          position: 'absolute', bottom: -4, left: 6, right: 6, height: 2,
          background: 'rgba(0,0,0,0.08)', filter: 'blur(2px)'
        }} />
      </div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: textFaint, marginBottom: 8
      }}>{book.mood}</div>
      <div style={{
        fontSize: 17, lineHeight: 1.22, marginBottom: 4,
        fontWeight: 500, letterSpacing: '-0.008em'
      }}>{book.title}</div>
      <div style={{
        fontSize: 13, color: textSoft, fontStyle: 'italic', marginBottom: 14
      }}>{book.author}</div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: textFaint,
        display: 'flex', justifyContent: 'space-between', paddingTop: 22,
        borderTop: `1px solid ${rule}`
      }}>
        <span>~{book.minutes} min</span>
        <span>{book.passages} passages</span>
      </div>
    </button>);

}

Object.assign(window, { LibraryScreen });