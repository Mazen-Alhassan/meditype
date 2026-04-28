// meditype — seed data (public domain books, passages, ambient options)

const MOODS = [
  'Slow Sundays',
  'Mystical',
  'Stoic Mornings',
  'Wonder',
  'Melancholy',
  'Adventure',
];

const BOOKS = [
  // Stoic Mornings
  { id: 'aurelius',   title: 'Meditations',              author: 'Marcus Aurelius',      year: 180,  mood: 'Stoic Mornings', passages: 184, minutes: 16, continue: 0.42, colorA: '#C5B39A', colorB: '#8F7554' },
  { id: 'epictetus',  title: 'The Enchiridion',          author: 'Epictetus',            year: 125,  mood: 'Stoic Mornings', passages:  53, minutes: 12, continue: null, colorA: '#D6C4A8', colorB: '#9A7F5A' },
  { id: 'seneca',     title: 'Letters from a Stoic',     author: 'Seneca',               year:   65, mood: 'Stoic Mornings', passages: 124, minutes: 22, continue: null, colorA: '#B7A485', colorB: '#6E5A3A' },
  { id: 'emerson',    title: 'Self-Reliance',            author: 'Ralph Waldo Emerson',  year: 1841, mood: 'Stoic Mornings', passages:  42, minutes: 18, continue: null, colorA: '#C9B89A', colorB: '#7E6845' },

  // Slow Sundays
  { id: 'walden',     title: 'Walden',                   author: 'Henry David Thoreau',  year: 1854, mood: 'Slow Sundays',   passages: 211, minutes: 20, continue: 0.18, colorA: '#B9C1A5', colorB: '#5E6B4A' },
  { id: 'grass',      title: 'Leaves of Grass',          author: 'Walt Whitman',         year: 1855, mood: 'Slow Sundays',   passages: 168, minutes: 15, continue: null, colorA: '#C8CBB0', colorB: '#6F7653' },
  { id: 'pastoral',   title: 'A Pastoral Diary',         author: 'Dorothy Wordsworth',   year: 1803, mood: 'Slow Sundays',   passages:  94, minutes: 12, continue: null, colorA: '#D4CFB6', colorB: '#807A5C' },
  { id: 'montaigne',  title: 'Essays',                   author: 'Michel de Montaigne',  year: 1580, mood: 'Slow Sundays',   passages: 276, minutes: 22, continue: null, colorA: '#BBB19A', colorB: '#6B5F47' },

  // Mystical
  { id: 'rumi',       title: 'The Masnavi',              author: 'Rumi',                 year: 1273, mood: 'Mystical',       passages: 102, minutes: 14, continue: 0.67, colorA: '#C8A886', colorB: '#7A4E2C' },
  { id: 'tao',        title: 'Tao Te Ching',             author: 'Laozi',                year: -400, mood: 'Mystical',       passages:  81, minutes: 10, continue: null, colorA: '#B5A89A', colorB: '#5F554A' },
  { id: 'blake',      title: 'Songs of Innocence',       author: 'William Blake',        year: 1789, mood: 'Mystical',       passages:  46, minutes:  9, continue: null, colorA: '#C4A58F', colorB: '#6F4A32' },
  { id: 'hafiz',      title: 'The Divan',                author: 'Hafiz',                year: 1389, mood: 'Mystical',       passages: 119, minutes: 11, continue: null, colorA: '#CEB08B', colorB: '#80562E' },

  // Wonder
  { id: 'alice',      title: 'Alice in Wonderland',      author: 'Lewis Carroll',        year: 1865, mood: 'Wonder',         passages: 136, minutes: 15, continue: null, colorA: '#C6B299', colorB: '#785E42' },
  { id: 'bluebird',   title: 'The Blue Bird',            author: 'Maurice Maeterlinck',  year: 1908, mood: 'Wonder',         passages:  88, minutes: 18, continue: null, colorA: '#A9B2B6', colorB: '#4F5C66' },
  { id: 'wind',       title: 'The Wind in the Willows',  author: 'Kenneth Grahame',      year: 1908, mood: 'Wonder',         passages: 154, minutes: 17, continue: null, colorA: '#B3BDA0', colorB: '#5B6A44' },
  { id: 'secret',     title: 'The Secret Garden',        author: 'Frances H. Burnett',   year: 1911, mood: 'Wonder',         passages: 162, minutes: 16, continue: null, colorA: '#BFC2A2', colorB: '#606C46' },

  // Melancholy
  { id: 'rilke',      title: 'Letters to a Young Poet',  author: 'Rainer Maria Rilke',   year: 1929, mood: 'Melancholy',     passages:  32, minutes: 14, continue: 0.09, colorA: '#AAA398', colorB: '#4E473C' },
  { id: 'pessoa',     title: 'The Book of Disquiet',     author: 'Fernando Pessoa',      year: 1935, mood: 'Melancholy',     passages: 248, minutes: 19, continue: null, colorA: '#A29887', colorB: '#4B4334' },
  { id: 'dickinson',  title: 'Selected Poems',           author: 'Emily Dickinson',      year: 1890, mood: 'Melancholy',     passages:  74, minutes:  9, continue: null, colorA: '#B4A692', colorB: '#5C4E3A' },
  { id: 'kierkegaard',title: 'Either/Or',                author: 'S\u00f8ren Kierkegaard',year: 1843, mood: 'Melancholy',     passages: 192, minutes: 22, continue: null, colorA: '#9E9789', colorB: '#464034' },

  // Adventure
  { id: 'mobydick',   title: 'Moby-Dick',                author: 'Herman Melville',      year: 1851, mood: 'Adventure',      passages: 412, minutes: 24, continue: null, colorA: '#A8B5B8', colorB: '#485A63' },
  { id: 'verne',      title: 'Twenty Thousand Leagues',  author: 'Jules Verne',          year: 1870, mood: 'Adventure',      passages: 236, minutes: 20, continue: null, colorA: '#A0AEB4', colorB: '#3F525C' },
  { id: 'treasure',   title: 'Treasure Island',          author: 'Robert L. Stevenson',  year: 1883, mood: 'Adventure',      passages: 168, minutes: 17, continue: null, colorA: '#B5A890', colorB: '#6E5D42' },
  { id: 'kim',        title: 'Kim',                      author: 'Rudyard Kipling',      year: 1901, mood: 'Adventure',      passages: 195, minutes: 19, continue: null, colorA: '#BFA682', colorB: '#7A5B33' },
];

// A handful of representative passages — the "current" book for the reading screens
const PASSAGES = {
  aurelius: [
    "Begin the morning by saying to thyself, I shall meet with the busy-body, the ungrateful, arrogant, deceitful, envious, unsocial. All these things happen to them by reason of their ignorance of what is good and evil. But I who have seen the nature of the good, that it is beautiful, and of the bad, that it is ugly, and the nature of him who does wrong, that it is akin to me, not only of the same blood or seed, but that it participates in the same intelligence and the same portion of the divinity, I can neither be injured by any of them, for no one can fix on me what is ugly, nor can I be angry with my kinsman, nor hate him.",
    "At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work as a human being. What do I have to complain of, if I am going to do what I was born for, the things for which I was brought into the world? Or was I created to wrap myself in blankets and stay warm?",
    "Every hour focus your mind attentively on the performance of the task in hand, with dignity, human sympathy, benevolence and freedom, and leave aside all other thoughts. You will achieve this, if you perform each action as if it were your last.",
    "The soul becomes dyed with the colour of its thoughts. Think only those thoughts that are in keeping with the character of a rose; weigh carefully what gives a passage its calm, and refuse to be carried by appetites that do not belong to you.",
  ],
  walden: [
    "I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived. I did not wish to live what was not life, living is so dear; nor did I wish to practise resignation, unless it was quite necessary. I wanted to live deep and suck out all the marrow of life.",
    "The mass of men lead lives of quiet desperation. What is called resignation is confirmed desperation. From the desperate city you go into the desperate country, and have to console yourself with the bravery of mink and muskrats.",
    "Time is but the stream I go a-fishing in. I drink at it; but while I drink I see the sandy bottom and detect how shallow it is. Its thin current slides away, but eternity remains.",
  ],
  rumi: [
    "Out beyond ideas of wrongdoing and rightdoing, there is a field. I will meet you there. When the soul lies down in that grass, the world is too full to talk about. Ideas, language, even the phrase each other, do not make any sense.",
    "You were born with wings, why prefer to crawl through life? The breeze at dawn has secrets to tell you. Do not go back to sleep. You must ask for what you really want. Do not go back to sleep.",
    "Let yourself be silently drawn by the strange pull of what you really love. It will not lead you astray. There are thousands of ways to kneel and kiss the ground; there are thousands of ways to go home again.",
  ],
  rilke: [
    "Have patience with everything unresolved in your heart and try to love the questions themselves as if they were locked rooms or books written in a very foreign language. Do not search for the answers, which could not be given to you now, because you would not be able to live them. And the point is, to live everything. Live the questions now. Perhaps then, someday far in the future, you will gradually, without even noticing it, live your way into the answer.",
    "Perhaps all the dragons in our lives are princesses who are only waiting to see us act, just once, with beauty and courage. Perhaps everything that frightens us is, in its deepest essence, something helpless that wants our love.",
  ],
};

const AMBIENTS = [
  { id: 'rain',       name: 'Rain on a window',  hint: 'soft · 40 min loop' },
  { id: 'fire',       name: 'Hearth fire',       hint: 'warm · crackle'     },
  { id: 'forest',     name: 'Forest at dusk',    hint: 'birds · distant'    },
  { id: 'ocean',      name: 'Ocean sounds',      hint: 'slow swell · deep'  },
  { id: 'jazz',       name: 'Soft piano',        hint: 'quiet · looped'     },
  { id: 'whitenoise', name: 'White noise',       hint: 'steady · masking'   },
];

const BACKGROUNDS = [
  { id: 'paper',   name: 'Warm paper',     swatch: '#F2ECE0' },
  { id: 'wood',    name: 'Candlelit wood', swatch: '#2A1F16' },
  { id: 'mist',    name: 'Misty morning',  swatch: '#DDDED6' },
  { id: 'sky',     name: 'Evening sky',    swatch: '#3A3D4A' },
  { id: 'linen',   name: 'Linen',          swatch: '#E6DFCE' },
  { id: 'ink',     name: 'Dark ink',       swatch: '#1C140E' },
];

const LENGTHS = [
  { id: '5',    name: '5 min'      },
  { id: '15',   name: '15 min'     },
  { id: '30',   name: '30 min'     },
  { id: 'open', name: 'Open-ended' },
];

const REFLECTIONS = [
  "Whatever you read stays with you, even when you forget it.",
  "Attention is the rarest and purest form of generosity.",
  "You were here. The book was here. That is enough.",
  "A passage read slowly is a room entered fully.",
  "The evening is longer when you do not hurry it.",
];

Object.assign(window, { MOODS, BOOKS, PASSAGES, AMBIENTS, BACKGROUNDS, LENGTHS, REFLECTIONS });
