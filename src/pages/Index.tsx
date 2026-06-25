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
  review: string;
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

const ALL_GENRES = ['Фантастика', 'Драма', 'Триллер', 'Комедия', 'Боевик', 'Ужасы', 'Анимация', 'Документальный'];

const initialMovies: Movie[] = [
  { id: 1, title: 'Призрак Ориона', genre: 'Фантастика', year: 2024, poster: POSTER_1, rating: 8.7, myRatings: { quality: 9, plot: 8, characters: 9, atmosphere: 10 }, review: 'Захватывающий визуальный опыт. Сценарий не без дыр, но атмосфера с лихвой компенсирует.' },
  { id: 2, title: 'Город закатов', genre: 'Драма', year: 2023, poster: POSTER_2, rating: 9.2, myRatings: { quality: 10, plot: 10, characters: 9, atmosphere: 10 }, review: 'Безупречная драма о потере и возрождении. Финал разрывает сердце.' },
  { id: 3, title: 'Дождь над Невой', genre: 'Триллер', year: 2025, poster: POSTER_3, rating: 8.1, myRatings: null, review: '' },
  { id: 4, title: 'Тёмная материя', genre: 'Фантастика', year: 2022, poster: POSTER_1, rating: 7.9, myRatings: { quality: 8, plot: 7, characters: 8, atmosphere: 9 }, review: 'Хорошая идея, слабая реализация второго акта, но в целом смотрится.' },
  { id: 5, title: 'Последний кадр', genre: 'Драма', year: 2024, poster: POSTER_2, rating: 8.4, myRatings: null, review: '' },
  { id: 6, title: 'Полночный экспресс', genre: 'Триллер', year: 2023, poster: POSTER_3, rating: 9.0, myRatings: { quality: 9, plot: 9, characters: 8, atmosphere: 10 }, review: 'Эталонный триллер. Напряжение не спадает ни на минуту.' },
];

const GENRE_FILTER = ['Все жанры', ...ALL_GENRES];
const NAV = [
  { id: 'home', label: 'Главная', icon: 'Clapperboard' },
  { id: 'my', label: 'Мои оценки', icon: 'Star' },
  { id: 'top', label: 'Топ рейтинги', icon: 'Trophy' },
] as const;
type Tab = typeof NAV[number]['id'];

const avg = (r: Ratings) => Math.round(((r.quality + r.plot + r.characters + r.atmosphere) / 4) * 10) / 10;

function ratingColor(v: number) {
  if (v >= 8) return 'hsl(142 71% 48%)';
  if (v >= 5) return 'hsl(210 100% 66%)';
  return 'hsl(0 84% 62%)';
}

const EMPTY_RATINGS: Ratings = { quality: 7, plot: 7, characters: 7, atmosphere: 7 };

/* ─── Main ─── */
const Index = () => {
  const [tab, setTab] = useState<Tab>('home');
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('Все жанры');
  const [year, setYear] = useState('Все годы');

  const [active, setActive] = useState<Movie | null>(null);
  const [draft, setDraft] = useState<Ratings>(EMPTY_RATINGS);
  const [draftReview, setDraftReview] = useState('');

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
    setDraft(m.myRatings ?? EMPTY_RATINGS);
    setDraftReview(m.review);
  };

  const saveRating = () => {
    if (!active) return;
    setMovies((prev) =>
      prev.map((m) => m.id === active.id ? { ...m, myRatings: { ...draft }, review: draftReview } : m)
    );
    setActive(null);
  };

  const addMovie = (m: Movie) => {
    setMovies((prev) => [m, ...prev]);
    setShowAdd(false);
  };

  return (
    <div className="min-h-screen pb-24">

      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-border/60">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary grid place-items-center glow-sm">
              <Icon name="Film" size={20} className="text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-700 tracking-tight">
              КИНО<span className="text-gradient">БАЛЛ</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-secondary/70 rounded-full p-1">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-500 transition-all ${
                  tab === n.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon name={n.icon} size={15} />
                {n.label}
              </button>
            ))}
          </nav>

          <button
            onClick={() => setShowAdd(true)}
            className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-600 hover:opacity-90 transition-opacity glow-sm"
          >
            <Icon name="Plus" size={16} /> Добавить фильм
          </button>
        </div>
      </header>

      {/* Hero */}
      {tab === 'home' && (
        <section className="container pt-16 pb-10 animate-fade-in">
          <p className="text-primary font-600 tracking-widest text-sm mb-4 uppercase">Оценивай кино как критик</p>
          <h1 className="font-display text-5xl md:text-7xl font-700 leading-[0.92] max-w-3xl">
            Каждый фильм заслуживает <span className="text-gradient">честного балла</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-6 max-w-xl">
            Оценивай по 4 критериям, пиши рецензии и добавляй любые фильмы в свою коллекцию.
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

      {/* Search */}
      <section className="container pt-8">
        <div className="glass rounded-2xl border border-border/60 p-3 flex flex-col md:flex-row gap-3">
          <div className="flex items-center gap-3 flex-1 bg-secondary/60 rounded-xl px-4">
            <Icon name="Search" size={17} className="text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию фильма..."
              className="bg-transparent outline-none py-3 w-full text-foreground placeholder:text-muted-foreground text-sm"
            />
          </div>
          <Dropdown icon="Tag" value={genre} options={GENRE_FILTER} onChange={setGenre} />
          <Dropdown icon="Calendar" value={year} options={years} onChange={setYear} />
        </div>
      </section>

      {/* Grid */}
      <section className="container pt-8">
        {tab === 'top' && filtered.length >= 3 && (
          <Podium movies={filtered.slice(0, 3)} onRate={openRate} />
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-6">
          {filtered.map((m, i) => (
            <MovieCard
              key={m.id}
              movie={m}
              rank={tab === 'top' ? i + 1 : undefined}
              onRate={() => openRate(m)}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-24 text-muted-foreground">
            <Icon name="SearchX" size={48} className="mx-auto mb-4 opacity-40" />
            <p>Ничего не найдено. Попробуй изменить фильтры.</p>
          </div>
        )}
      </section>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="md:hidden fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-primary text-primary-foreground grid place-items-center glow"
      >
        <Icon name="Plus" size={26} />
      </button>

      {/* Mobile nav */}
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

      {/* Rate Modal */}
      {active && (
        <RateModal
          movie={active}
          draft={draft}
          review={draftReview}
          setDraft={setDraft}
          setReview={setDraftReview}
          onClose={() => setActive(null)}
          onSave={saveRating}
        />
      )}

      {/* Add Movie Modal */}
      {showAdd && (
        <AddMovieModal onClose={() => setShowAdd(false)} onAdd={addMovie} />
      )}
    </div>
  );
};

/* ─── Dropdown ─── */
const Dropdown = ({ icon, value, options, onChange }: {
  icon: string; value: string; options: string[]; onChange: (v: string) => void;
}) => (
  <div className="relative flex items-center gap-2 bg-secondary/60 rounded-xl px-4">
    <Icon name={icon} size={15} className="text-muted-foreground" />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent outline-none py-3 pr-6 text-sm text-foreground appearance-none cursor-pointer"
    >
      {options.map((o) => <option key={o} value={o} className="bg-card">{o}</option>)}
    </select>
    <Icon name="ChevronDown" size={13} className="text-muted-foreground pointer-events-none absolute right-3" />
  </div>
);

/* ─── MovieCard ─── */
const MovieCard = ({ movie, rank, onRate }: { movie: Movie; rank?: number; onRate: () => void }) => {
  const myAvg = movie.myRatings ? avg(movie.myRatings) : null;
  return (
    <div className="group rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 animate-fade-in">
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
        {rank && (
          <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display font-700 text-lg">
            {rank}
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-1 glass px-2.5 py-1 rounded-lg">
          <Icon name="Star" size={12} className="text-accent" fill="currentColor" />
          <span className="font-600 text-xs tabular-nums">{movie.rating > 0 ? movie.rating.toFixed(1) : '—'}</span>
        </div>
        {movie.review && (
          <div className="absolute bottom-3 left-3">
            <div className="glass px-2 py-1 rounded-md flex items-center gap-1">
              <Icon name="FileText" size={11} className="text-primary" />
              <span className="text-xs text-muted-foreground">Рецензия</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-[17px] font-600 leading-tight truncate">{movie.title}</h3>
        <p className="text-muted-foreground text-xs mt-1">{movie.genre} · {movie.year}</p>
        <button
          onClick={onRate}
          className={`w-full mt-3 py-2.5 rounded-xl text-sm font-600 transition-all flex items-center justify-center gap-2 ${
            myAvg !== null
              ? 'bg-secondary text-foreground hover:bg-secondary/70'
              : 'bg-primary text-primary-foreground hover:opacity-90'
          }`}
        >
          {myAvg !== null
            ? <><Icon name="CheckCircle2" size={14} /> Оценка: {myAvg}</>
            : <><Icon name="SlidersHorizontal" size={14} /> Оценить</>
          }
        </button>
      </div>
    </div>
  );
};

/* ─── Rate Modal ─── */
const RateModal = ({ movie, draft, review, setDraft, setReview, onClose, onSave }: {
  movie: Movie;
  draft: Ratings;
  review: string;
  setDraft: (r: Ratings) => void;
  setReview: (s: string) => void;
  onClose: () => void;
  onSave: () => void;
}) => {
  const total = avg(draft);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="glass-card border border-border/60 rounded-3xl p-7 max-w-lg w-full my-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex gap-4 mb-7">
          <img src={movie.poster} alt={movie.title} className="w-20 h-28 object-cover rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-2xl font-600 leading-tight">{movie.title}</h3>
            <p className="text-muted-foreground text-sm mt-1">{movie.genre} · {movie.year}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span
                className="font-display text-5xl font-700 tabular-nums leading-none"
                style={{ color: ratingColor(total) }}
              >
                {total.toFixed(1)}
              </span>
              <span className="text-muted-foreground text-sm">средний балл</span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground self-start flex-shrink-0">
            <Icon name="X" size={22} />
          </button>
        </div>

        {/* Criteria sliders */}
        <div className="space-y-5 mb-7">
          {CRITERIA.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 text-sm font-500">
                  <Icon name={c.icon} size={15} className="text-primary" />
                  {c.label}
                </span>
                <span
                  className="font-display text-xl font-700 tabular-nums w-7 text-right"
                  style={{ color: ratingColor(draft[c.key]) }}
                >
                  {draft[c.key]}
                </span>
              </div>
              <input
                type="range" min={1} max={10} step={1}
                value={draft[c.key]}
                onChange={(e) => setDraft({ ...draft, [c.key]: Number(e.target.value) })}
                className="rating-slider"
                style={{
                  background: `linear-gradient(90deg, ${ratingColor(draft[c.key])} ${((draft[c.key] - 1) / 9) * 100}%, hsl(224 28% 13%) ${((draft[c.key] - 1) / 9) * 100}%)`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Review */}
        <div className="mb-7">
          <label className="flex items-center gap-2 text-sm font-500 mb-3">
            <Icon name="FileText" size={15} className="text-primary" />
            Рецензия
            <span className="text-muted-foreground font-400 ml-1">(необязательно)</span>
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Напиши пару слов о фильме — что понравилось, что нет..."
            rows={4}
            className="w-full bg-secondary/50 border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:border-primary/50 transition-colors"
          />
          <p className="text-muted-foreground text-xs mt-1.5 text-right">{review.length} / 500</p>
        </div>

        <button
          onClick={onSave}
          className="w-full bg-primary text-primary-foreground font-600 py-3.5 rounded-xl hover:opacity-90 transition-opacity glow-sm"
        >
          Сохранить оценку
        </button>
      </div>
    </div>
  );
};

/* ─── Add Movie Modal ─── */
const AddMovieModal = ({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (m: Movie) => void;
}) => {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState(ALL_GENRES[0]);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [posterUrl, setPosterUrl] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!title.trim()) { setError('Введи название фильма'); return; }
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2030) { setError('Укажи корректный год (1900–2030)'); return; }
    onAdd({
      id: Date.now(),
      title: title.trim(),
      genre,
      year: yearNum,
      poster: posterUrl.trim() || POSTER_1,
      rating: 0,
      myRatings: null,
      review: '',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="glass-card border border-border/60 rounded-3xl p-7 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-2xl font-600">Добавить фильм</h3>
            <p className="text-muted-foreground text-sm mt-0.5">Заполни данные о фильме вручную</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={22} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-500 uppercase tracking-wide">
              Название фильма *
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              placeholder="Например: Интерстеллар"
              className="w-full bg-secondary/60 border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Genre + Year row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-500 uppercase tracking-wide">Жанр</label>
              <div className="relative bg-secondary/60 border border-border/60 rounded-xl px-3 flex items-center">
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-transparent outline-none py-3 pr-5 text-sm text-foreground appearance-none cursor-pointer"
                >
                  {ALL_GENRES.map((g) => <option key={g} value={g} className="bg-card">{g}</option>)}
                </select>
                <Icon name="ChevronDown" size={13} className="text-muted-foreground pointer-events-none absolute right-3" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-500 uppercase tracking-wide">Год выпуска</label>
              <input
                type="number"
                value={year}
                onChange={(e) => { setYear(e.target.value); setError(''); }}
                placeholder="2024"
                className="w-full bg-secondary/60 border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Poster URL */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-500 uppercase tracking-wide">
              Ссылка на постер
              <span className="ml-1 font-400 normal-case">(необязательно)</span>
            </label>
            <input
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-secondary/60 border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
            />
            <p className="text-muted-foreground text-xs mt-1.5">
              Можно взять прямую ссылку на постер с Кинопоиска или любого сайта
            </p>
          </div>

          {/* Preview */}
          {(posterUrl || title) && (
            <div className="flex items-center gap-4 p-3 bg-secondary/40 rounded-xl border border-border/40">
              <img
                src={posterUrl || POSTER_1}
                alt="preview"
                className="w-14 h-20 object-cover rounded-lg"
                onError={(e) => { (e.target as HTMLImageElement).src = POSTER_1; }}
              />
              <div>
                <p className="font-600 text-sm">{title || 'Название фильма'}</p>
                <p className="text-muted-foreground text-xs mt-0.5">{genre} · {year}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <Icon name="AlertCircle" size={15} />
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-border/60 text-muted-foreground text-sm font-500 hover:text-foreground hover:border-border transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-600 hover:opacity-90 transition-opacity glow-sm"
          >
            Добавить в коллекцию
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Podium ─── */
const Podium = ({ movies, onRate }: { movies: Movie[]; onRate: (m: Movie) => void }) => (
  <div className="grid grid-cols-3 gap-4 items-end">
    {[1, 0, 2].map((idx, pos) => {
      const m = movies[idx];
      if (!m) return <div key={pos} />;
      const heights = ['h-24', 'h-32', 'h-16'];
      const medals = ['🥈', '🥇', '🥉'];
      return (
        <div key={m.id} className="flex flex-col items-center animate-fade-in">
          <img
            src={m.poster}
            alt={m.title}
            onClick={() => onRate(m)}
            className="w-full max-w-[150px] aspect-[2/3] object-cover rounded-2xl border border-border cursor-pointer hover:border-primary/60 transition-colors"
          />
          <p className="font-display font-600 mt-3 text-center text-sm truncate w-full">{m.title}</p>
          <div className="flex items-center gap-1 text-accent text-sm font-700">
            <Icon name="Star" size={13} fill="currentColor" />
            {m.rating > 0 ? m.rating.toFixed(1) : '—'}
          </div>
          <div className={`w-full mt-2 ${heights[pos]} rounded-t-xl bg-gradient-to-t from-secondary to-primary/20 grid place-items-center text-3xl border-t-2 border-primary/60`}>
            {medals[pos]}
          </div>
        </div>
      );
    })}
  </div>
);

export default Index;
