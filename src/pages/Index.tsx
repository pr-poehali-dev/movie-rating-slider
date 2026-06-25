import { useState, useMemo } from 'react';
import Icon from '@/components/ui/icon';

type Criteria = 'quality' | 'plot' | 'characters' | 'atmosphere';

interface Ratings {
  quality: number;
  plot: number;
  characters: number;
  atmosphere: number;
}

interface Movie {
  id: number;
  title: string;
  genre: string;
  year: number;
  poster: string;
  rating: number;
  myRatings: Ratings | null;
}

const POSTER_1 = 'https://cdn.poehali.dev/projects/f02656ba-cdf9-43a3-b9a4-9466ff930268/files/90ef7044-45a7-4d85-9580-eaf4c7b1ef89.jpg';
const POSTER_2 = 'https://cdn.poehali.dev/projects/f02656ba-cdf9-43a3-b9a4-9466ff930268/files/37ab2dbc-5585-4625-9276-0f15c016ff4e.jpg';
const POSTER_3 = 'https://cdn.poehali.dev/projects/f02656ba-cdf9-43a3-b9a4-9466ff930268/files/6e09ab1a-f06b-4e19-821c-6aa55237ff53.jpg';

const CRITERIA: { key: Criteria; label: string; icon: string }[] = [
  { key: 'quality', label: 'Качество', icon: 'Gem' },
  { key: 'plot', label: 'Сюжет', icon: 'BookOpen' },
  { key: 'characters', label: 'Персонажи', icon: 'Users' },
  { key: 'atmosphere', label: 'Атмосфера', icon: 'Sparkles' },
];

const initialMovies: Movie[] = [
  { id: 1, title: 'Призрак Ориона', genre: 'Фантастика', year: 2024, poster: POSTER_1, rating: 8.7, myRatings: { quality: 9, plot: 8, characters: 9, atmosphere: 10 } },
  { id: 2, title: 'Город закатов', genre: 'Драма', year: 2023, poster: POSTER_2, rating: 9.2, myRatings: { quality: 10, plot: 10, characters: 9, atmosphere: 10 } },
  { id: 3, title: 'Дождь над Невой', genre: 'Триллер', year: 2025, poster: POSTER_3, rating: 8.1, myRatings: null },
  { id: 4, title: 'Тёмная материя', genre: 'Фантастика', year: 2022, poster: POSTER_1, rating: 7.9, myRatings: { quality: 8, plot: 7, characters: 8, atmosphere: 9 } },
  { id: 5, title: 'Последний кадр', genre: 'Драма', year: 2024, poster: POSTER_2, rating: 8.4, myRatings: null },
  { id: 6, title: 'Полночный экспресс', genre: 'Триллер', year: 2023, poster: POSTER_3, rating: 9.0, myRatings: { quality: 9, plot: 9, characters: 8, atmosphere: 10 } },
];

const GENRES = ['Все жанры', 'Фантастика', 'Драма', 'Триллер'];
const NAV = [
  { id: 'home', label: 'Главная', icon: 'Clapperboard' },
  { id: 'my', label: 'Мои оценки', icon: 'Star' },
  { id: 'top', label: 'Топ рейтинги', icon: 'Trophy' },
] as const;

type Tab = typeof NAV[number]['id'];

const avg = (r: Ratings) => (r.quality + r.plot + r.characters + r.atmosphere) / 4;

function ratingColor(v: number) {
  if (v >= 8) return 'hsl(142 71% 45%)';
  if (v >= 5) return 'hsl(199 89% 60%)';
  return 'hsl(0 84% 60%)';
}

const Index = () => {
  const [tab, setTab] = useState<Tab>('home');
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('Все жанры');
  const [year, setYear] = useState('Все годы');
  const [active, setActive] = useState<Movie | null>(null);
  const [draft, setDraft] = useState<Ratings>({ quality: 7, plot: 7, characters: 7, atmosphere: 7 });
  const [showAdd, setShowAdd] = useState(false);

  const years = useMemo(
    () => ['Все годы', ...Array.from(new Set(movies.map((m) => m.year))).sort((a, b) => b - a).map(String)],
    [movies]
  );

  const filtered = useMemo(() => {
    let list = movies;
    if (tab === 'my') list = list.filter((m) => m.myRatings !== null);
    if (tab === 'top') list = [...list].sort((a, b) => b.rating - a.rating);
    return list.filter((m) => {
      const okQ = m.title.toLowerCase().includes(query.toLowerCase());
      const okG = genre === 'Все жанры' || m.genre === genre;
      const okY = year === 'Все годы' || String(m.year) === year;
      return okQ && okG && okY;
    });
  }, [movies, query, genre, year, tab]);

  const openRate = (m: Movie) => {
    setActive(m);
    setDraft(m.myRatings ?? { quality: 7, plot: 7, characters: 7, atmosphere: 7 });
  };

  const saveRating = () => {
    if (!active) return;
    setMovies((prev) => prev.map((m) => (m.id === active.id ? { ...m, myRatings: { ...draft } } : m)));
    setActive(null);
  };

  const addMovie = (m: Movie) => {
    setMovies((prev) => [m, ...prev]);
    setShowAdd(false);
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-30 glass border-b border-border/60">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary grid place-items-center glow">
              <Icon name="Film" size={20} className="text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-700 tracking-tight">КИНО<span className="text-gradient">БАЛЛ</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-1 bg-secondary/60 rounded-full p-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-500 transition-all ${
                  tab === n.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name={n.icon} size={16} />
                {n.label}
              </button>
            ))}
          </nav>
          <button
            onClick={() => setShowAdd(true)}
            className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-600 hover:opacity-90 transition-opacity"
          >
            <Icon name="Plus" size={16} /> Добавить
          </button>
        </div>
      </header>

      {tab === 'home' && (
        <section className="container pt-16 pb-10 animate-fade-in">
          <p className="text-primary font-600 tracking-widest text-sm mb-4 uppercase">Оценивай кино как критик</p>
          <h1 className="font-display text-5xl md:text-7xl font-700 leading-[0.95] max-w-3xl">
            Каждый фильм заслуживает <span className="text-gradient">честного балла</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-6 max-w-xl">
            Оценивай кино по 4 критериям: качество, сюжет, персонажи и атмосфера. Добавляй фильмы из Кинопоиска.
          </p>
        </section>
      )}

      {tab !== 'home' && (
        <section className="container pt-12 pb-2 animate-fade-in">
          <h1 className="font-display text-4xl md:text-5xl font-700">
            {tab === 'my' ? 'Мои оценки и рейтинги' : 'Топ рейтинги и лучшие фильмы'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {tab === 'my' ? 'Фильмы, которым ты поставил оценку.' : 'Лучшее кино по среднему баллу зрителей.'}
          </p>
        </section>
      )}

      <section className="container pt-8">
        <div className="glass rounded-2xl border border-border/60 p-3 flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-3 flex-1 bg-secondary/60 rounded-xl px-4">
            <Icon name="Search" size={18} className="text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию фильма..."
              className="bg-transparent outline-none py-3 w-full text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Dropdown icon="Tag" value={genre} options={GENRES} onChange={setGenre} />
          <Dropdown icon="Calendar" value={year} options={years} onChange={setYear} />
        </div>
      </section>

      <section className="container pt-8">
        {tab === 'top' && filtered.length > 0 && <Podium movies={filtered.slice(0, 3)} onRate={openRate} />}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-6">
          {filtered.map((m, i) => (
            <MovieCard key={m.id} movie={m} rank={tab === 'top' ? i + 1 : undefined} onRate={() => openRate(m)} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            <Icon name="SearchX" size={48} className="mx-auto mb-4 opacity-50" />
            Ничего не найдено. Попробуй изменить фильтры.
          </div>
        )}
      </section>

      <button
        onClick={() => setShowAdd(true)}
        className="md:hidden fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground grid place-items-center glow"
      >
        <Icon name="Plus" size={26} />
      </button>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-border/60 flex">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs ${
              tab === n.id ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon name={n.icon} size={20} />
            {n.label}
          </button>
        ))}
      </nav>

      {active && (
        <RateModal
          movie={active}
          draft={draft}
          setDraft={setDraft}
          onClose={() => setActive(null)}
          onSave={saveRating}
        />
      )}

      {showAdd && <AddMovieModal onClose={() => setShowAdd(false)} onAdd={addMovie} />}
    </div>
  );
};

const Dropdown = ({ icon, value, options, onChange }: { icon: string; value: string; options: string[]; onChange: (v: string) => void }) => (
  <div className="relative flex items-center gap-2 bg-secondary/60 rounded-xl px-4">
    <Icon name={icon} size={16} className="text-muted-foreground" />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent outline-none py-3 pr-6 text-sm text-foreground appearance-none cursor-pointer"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-card">{o}</option>
      ))}
    </select>
    <Icon name="ChevronDown" size={14} className="text-muted-foreground pointer-events-none absolute right-3" />
  </div>
);

const MovieCard = ({ movie, rank, onRate }: { movie: Movie; rank?: number; onRate: () => void }) => {
  const myAvg = movie.myRatings ? avg(movie.myRatings) : null;
  return (
    <div className="group relative rounded-2xl overflow-hidden bg-card border border-border/60 hover:border-primary/50 transition-all hover:-translate-y-1 animate-fade-in">
      <div className="relative aspect-[2/3] overflow-hidden">
        <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
        {rank && (
          <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display font-700 text-lg">
            {rank}
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-1 glass px-2.5 py-1 rounded-lg">
          <Icon name="Star" size={13} className="text-accent" fill="currentColor" />
          <span className="font-600 text-sm tabular-nums">{movie.rating.toFixed(1)}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-600 leading-tight truncate">{movie.title}</h3>
        <p className="text-muted-foreground text-xs mt-1">{movie.genre} · {movie.year}</p>
        <button
          onClick={onRate}
          className={`w-full mt-3 py-2.5 rounded-xl text-sm font-600 transition-all flex items-center justify-center gap-2 ${
            myAvg !== null ? 'bg-secondary text-foreground hover:bg-secondary/70' : 'bg-primary text-primary-foreground hover:opacity-90'
          }`}
        >
          {myAvg !== null ? (
            <><Icon name="CheckCircle2" size={15} /> Моя оценка: {myAvg.toFixed(1)}</>
          ) : (
            <><Icon name="SlidersHorizontal" size={15} /> Оценить</>
          )}
        </button>
      </div>
    </div>
  );
};

const RateModal = ({ movie, draft, setDraft, onClose, onSave }: {
  movie: Movie;
  draft: Ratings;
  setDraft: (r: Ratings) => void;
  onClose: () => void;
  onSave: () => void;
}) => {
  const total = avg(draft);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto" onClick={onClose}>
      <div className="glass border border-border rounded-3xl p-7 max-w-md w-full my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-4 mb-6">
          <img src={movie.poster} alt={movie.title} className="w-20 h-28 object-cover rounded-xl" />
          <div>
            <h3 className="font-display text-2xl font-600 leading-tight">{movie.title}</h3>
            <p className="text-muted-foreground text-sm mt-1">{movie.genre} · {movie.year}</p>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-700 tabular-nums" style={{ color: ratingColor(total) }}>{total.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">средний балл</span>
            </div>
          </div>
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground self-start">
            <Icon name="X" size={22} />
          </button>
        </div>

        <div className="space-y-5">
          {CRITERIA.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 text-sm font-500">
                  <Icon name={c.icon} size={16} className="text-primary" /> {c.label}
                </span>
                <span className="font-display text-lg font-700 tabular-nums w-7 text-right" style={{ color: ratingColor(draft[c.key]) }}>
                  {draft[c.key]}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={draft[c.key]}
                onChange={(e) => setDraft({ ...draft, [c.key]: Number(e.target.value) })}
                className="rating-slider"
                style={{
                  background: `linear-gradient(90deg, ${ratingColor(draft[c.key])} ${((draft[c.key] - 1) / 9) * 100}%, hsl(222 18% 20%) ${((draft[c.key] - 1) / 9) * 100}%)`,
                }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={onSave}
          className="w-full mt-7 bg-primary text-primary-foreground font-600 py-3.5 rounded-xl hover:opacity-90 transition-opacity glow"
        >
          Сохранить оценку
        </button>
      </div>
    </div>
  );
};

const KP_RESULTS: Omit<Movie, 'id' | 'rating' | 'myRatings'>[] = [
  { title: 'Звёздный путь', genre: 'Фантастика', year: 2025, poster: POSTER_1 },
  { title: 'Тихая гавань', genre: 'Драма', year: 2024, poster: POSTER_2 },
  { title: 'Кровь и тени', genre: 'Триллер', year: 2023, poster: POSTER_3 },
];

const AddMovieModal = ({ onClose, onAdd }: { onClose: () => void; onAdd: (m: Movie) => void }) => {
  const [q, setQ] = useState('');
  const results = KP_RESULTS.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass border border-border rounded-3xl p-7 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display text-2xl font-600">Добавить фильм</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={22} />
          </button>
        </div>
        <p className="text-muted-foreground text-sm mb-5">Найди фильм по названию или вставь ссылку на Кинопоиск.</p>

        <div className="flex items-center gap-3 bg-secondary/60 rounded-xl px-4 mb-5">
          <Icon name="Search" size={18} className="text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Например: Звёздный путь"
            className="bg-transparent outline-none py-3 w-full text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.title}
              onClick={() => onAdd({ ...r, id: Date.now(), rating: 0, myRatings: null })}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/60 transition-colors text-left"
            >
              <img src={r.poster} alt={r.title} className="w-12 h-16 object-cover rounded-lg" />
              <div className="flex-1">
                <p className="font-600">{r.title}</p>
                <p className="text-muted-foreground text-xs">{r.genre} · {r.year}</p>
              </div>
              <Icon name="Plus" size={18} className="text-primary" />
            </button>
          ))}
          {results.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">Фильм не найден в Кинопоиске.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const Podium = ({ movies, onRate }: { movies: Movie[]; onRate: (m: Movie) => void }) => (
  <div className="grid grid-cols-3 gap-4 items-end">
    {[1, 0, 2].map((idx, pos) => {
      const m = movies[idx];
      if (!m) return <div key={pos} />;
      const heights = ['h-28', 'h-36', 'h-20'];
      const medals = ['🥈', '🥇', '🥉'];
      return (
        <div key={m.id} className="flex flex-col items-center animate-fade-in">
          <img src={m.poster} alt={m.title} onClick={() => onRate(m)} className="w-full max-w-[160px] aspect-[2/3] object-cover rounded-2xl border border-border cursor-pointer hover:border-primary transition-colors" />
          <p className="font-display font-600 mt-3 text-center text-sm truncate w-full">{m.title}</p>
          <div className="flex items-center gap-1 text-accent text-sm font-700">
            <Icon name="Star" size={13} fill="currentColor" /> {m.rating.toFixed(1)}
          </div>
          <div className={`w-full mt-2 ${heights[pos]} rounded-t-xl bg-gradient-to-t from-secondary to-primary/20 grid place-items-center text-3xl border-t-2 border-primary`}>
            {medals[pos]}
          </div>
        </div>
      );
    })}
  </div>
);

export default Index;
