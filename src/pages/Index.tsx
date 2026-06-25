import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';

const API = 'https://functions.poehali.dev/dd761295-606f-4837-8f0d-df2232766f43';

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
  if (v >= 5) return 'hsl(272 88% 68%)';
  return 'hsl(0 84% 62%)';
}

const EMPTY_RATINGS: Ratings = { quality: 7, plot: 7, characters: 7, atmosphere: 7 };

/* ═══════════════════ Main ═══════════════════ */
const Index = () => {
  const [tab, setTab] = useState<Tab>('home');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('Все жанры');
  const [year, setYear] = useState('Все годы');

  // rate modal
  const [active, setActive] = useState<Movie | null>(null);
  const [draft, setDraft] = useState<Ratings>(EMPTY_RATINGS);
  const [draftReview, setDraftReview] = useState('');

  // add / edit / delete
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Movie | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Movie | null>(null);

  const loadMovies = useCallback(async () => {
    setLoading(true);
    const res = await fetch(API);
    const data = await res.json();
    setMovies(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadMovies(); }, [loadMovies]);

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

  const saveRating = async () => {
    if (!active) return;
    const updated = { ...active, myRatings: { ...draft }, review: draftReview };
    setMovies((prev) => prev.map((m) => m.id === active.id ? updated : m));
    setActive(null);
    try {
      await fetch(`${API}?id=${active.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.error('saveRating failed', e);
    }
  };

  const addMovie = async (m: Movie) => {
    setShowAdd(false);
    const tempId = Date.now();
    setMovies((prev) => [{ ...m, id: tempId }, ...prev]);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(m),
      });
      const { id } = await res.json();
      setMovies((prev) => prev.map((x) => x.id === tempId ? { ...x, id } : x));
    } catch (e) {
      console.error('addMovie failed', e);
    }
  };

  const saveEdit = async (updated: Movie) => {
    setMovies((prev) => prev.map((m) => m.id === updated.id ? updated : m));
    setEditTarget(null);
    try {
      await fetch(`${API}?id=${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      console.error('saveEdit failed', e);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setMovies((prev) => prev.filter((m) => m.id !== id));
    setDeleteTarget(null);
    try {
      await fetch(`${API}?id=${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('confirmDelete failed', e);
    }
  };

  return (
    <div className="min-h-screen pb-24">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 glass border-b border-border/60">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary grid place-items-center glow-sm">
              <Icon name="Film" size={20} className="text-primary-foreground" />
            </div>
            <span className="font-display text-2xl font-700 tracking-tight">
              Р<span className="text-gradient">ЗТ</span>
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
                <Icon name={n.icon} size={15} />{n.label}
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

      {/* ── Hero ── */}
      {tab === 'home' && (
        <section className="container pt-16 pb-10 animate-fade-in">
          <p className="text-primary font-600 tracking-widest text-sm mb-4 uppercase">Оценивай кино как критик</p>
          <h1 className="font-display text-5xl md:text-7xl font-700 leading-[0.92] max-w-3xl">
            Каждый фильм заслуживает <span className="text-gradient">честного балла</span>
          </h1>
          <p className="text-muted-foreground text-lg mt-6 max-w-xl">
            Оценивай по 4 критериям, пиши рецензии, добавляй и редактируй фильмы в своей коллекции.
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

      {/* ── Search ── */}
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

      {/* ── Grid ── */}
      <section className="container pt-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border/50 animate-pulse">
                <div className="aspect-[2/3] bg-secondary/60" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-secondary/80 rounded-lg w-3/4" />
                  <div className="h-3 bg-secondary/60 rounded-lg w-1/2" />
                  <div className="h-9 bg-secondary/60 rounded-xl mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {tab === 'top' && filtered.length >= 3 && <Podium movies={filtered.slice(0, 3)} onRate={openRate} />}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-6">
              {filtered.map((m, i) => (
                <MovieCard
                  key={m.id}
                  movie={m}
                  rank={tab === 'top' ? i + 1 : undefined}
                  onRate={() => openRate(m)}
                  onEdit={() => setEditTarget(m)}
                  onDelete={() => setDeleteTarget(m)}
                />
              ))}
            </div>
            {!loading && filtered.length === 0 && (
              <div className="text-center py-24 text-muted-foreground">
                <Icon name={movies.length === 0 ? 'FilmIcon' : 'SearchX'} fallback="SearchX" size={48} className="mx-auto mb-4 opacity-40" />
                <p>{movies.length === 0 ? 'Коллекция пуста — добавь первый фильм!' : 'Ничего не найдено. Попробуй изменить фильтры.'}</p>
              </div>
            )}
          </>
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
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs ${tab === n.id ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Icon name={n.icon} size={20} />{n.label}
          </button>
        ))}
      </nav>

      {/* Modals */}
      {active && (
        <RateModal
          movie={active} draft={draft} review={draftReview}
          setDraft={setDraft} setReview={setDraftReview}
          onClose={() => setActive(null)} onSave={saveRating}
        />
      )}
      {showAdd && <MovieFormModal onClose={() => setShowAdd(false)} onSave={addMovie} />}
      {editTarget && <MovieFormModal movie={editTarget} onClose={() => setEditTarget(null)} onSave={saveEdit} />}
      {deleteTarget && (
        <DeleteModal movie={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      )}
    </div>
  );
};

/* ═══════════════════ Dropdown ═══════════════════ */
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

/* ═══════════════════ MovieCard ═══════════════════ */
const MovieCard = ({ movie, rank, onRate, onEdit, onDelete }: {
  movie: Movie; rank?: number;
  onRate: () => void; onEdit: () => void; onDelete: () => void;
}) => {
  const myAvg = movie.myRatings ? avg(movie.myRatings) : null;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div className="group rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 animate-fade-in">
      <div className="relative aspect-[2/3] overflow-hidden">
        <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />

        {/* Rank badge */}
        {rank && (
          <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-display font-700 text-lg">
            {rank}
          </div>
        )}

        {/* Rating badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 glass px-2.5 py-1 rounded-lg">
          <Icon name="Star" size={12} className="text-accent" fill="currentColor" />
          <span className="font-600 text-xs tabular-nums">{movie.rating > 0 ? movie.rating.toFixed(1) : '—'}</span>
        </div>

        {/* Context menu button — visible on hover */}
        <div ref={menuRef} className="absolute bottom-3 right-3">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity glass w-8 h-8 rounded-lg grid place-items-center hover:bg-secondary/80"
          >
            <Icon name="MoreVertical" size={15} className="text-foreground" />
          </button>
          {menuOpen && (
            <div className="absolute bottom-10 right-0 w-44 glass-card border border-border/60 rounded-xl overflow-hidden shadow-xl z-20 animate-fade-in">
              <button
                onClick={() => { setMenuOpen(false); onEdit(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors text-left"
              >
                <Icon name="Pencil" size={14} className="text-primary" /> Редактировать
              </button>
              <button
                onClick={() => { setMenuOpen(false); onRate(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors text-left"
              >
                <Icon name="SlidersHorizontal" size={14} className="text-accent" /> Оценить
              </button>
              <div className="border-t border-border/40 mx-3" />
              <button
                onClick={() => { setMenuOpen(false); onDelete(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-destructive/10 transition-colors text-left text-destructive"
              >
                <Icon name="Trash2" size={14} /> Удалить
              </button>
            </div>
          )}
        </div>

        {/* Review badge */}
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

/* ═══════════════════ Rate Modal ═══════════════════ */
const RateModal = ({ movie, draft, review, setDraft, setReview, onClose, onSave }: {
  movie: Movie; draft: Ratings; review: string;
  setDraft: (r: Ratings) => void; setReview: (s: string) => void;
  onClose: () => void; onSave: () => void;
}) => {
  const total = avg(draft);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto" onClick={onClose}>
      <div className="glass-card border border-border/60 rounded-3xl p-7 max-w-lg w-full my-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-4 mb-7">
          <img src={movie.poster} alt={movie.title} className="w-20 h-28 object-cover rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-2xl font-600 leading-tight">{movie.title}</h3>
            <p className="text-muted-foreground text-sm mt-1">{movie.genre} · {movie.year}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-5xl font-700 tabular-nums leading-none" style={{ color: ratingColor(total) }}>{total.toFixed(1)}</span>
              <span className="text-muted-foreground text-sm">средний балл</span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground self-start flex-shrink-0">
            <Icon name="X" size={22} />
          </button>
        </div>

        <div className="space-y-5 mb-7">
          {CRITERIA.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 text-sm font-500">
                  <Icon name={c.icon} size={15} className="text-primary" />{c.label}
                </span>
                <span className="font-display text-xl font-700 tabular-nums w-7 text-right" style={{ color: ratingColor(draft[c.key]) }}>
                  {draft[c.key]}
                </span>
              </div>
              <input
                type="range" min={1} max={10} step={1}
                value={draft[c.key]}
                onChange={(e) => setDraft({ ...draft, [c.key]: Number(e.target.value) })}
                className="rating-slider"
                style={{ background: `linear-gradient(90deg, ${ratingColor(draft[c.key])} ${((draft[c.key] - 1) / 9) * 100}%, hsl(246 30% 16%) ${((draft[c.key] - 1) / 9) * 100}%)` }}
              />
            </div>
          ))}
        </div>

        <div className="mb-7">
          <label className="flex items-center gap-2 text-sm font-500 mb-3">
            <Icon name="FileText" size={15} className="text-primary" />
            Рецензия <span className="text-muted-foreground font-400 ml-1">(необязательно)</span>
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Напиши пару слов о фильме — что понравилось, что нет..."
            rows={4}
            maxLength={500}
            className="w-full bg-secondary/50 border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:border-primary/50 transition-colors"
          />
          <p className="text-muted-foreground text-xs mt-1.5 text-right">{review.length} / 500</p>
        </div>

        <button onClick={onSave} className="w-full bg-primary text-primary-foreground font-600 py-3.5 rounded-xl hover:opacity-90 transition-opacity glow-sm">
          Сохранить оценку
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════ Movie Form Modal (Add & Edit) ═══════════════════ */
const MovieFormModal = ({ movie, onClose, onSave }: {
  movie?: Movie; onClose: () => void; onSave: (m: Movie) => void;
}) => {
  const isEdit = !!movie;
  const [title, setTitle] = useState(movie?.title ?? '');
  const [posterSrc, setPosterSrc] = useState<string>(movie?.poster ?? '');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Можно загружать только изображения'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setPosterSrc(ev.target?.result as string); setError(''); };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPosterSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!title.trim()) { setError('Введи название фильма'); return; }
    onSave({
      id: movie?.id ?? Date.now(),
      title: title.trim(),
      genre: movie?.genre ?? ALL_GENRES[0],
      year: movie?.year ?? new Date().getFullYear(),
      poster: posterSrc || POSTER_1,
      rating: movie?.rating ?? 0,
      myRatings: movie?.myRatings ?? null,
      review: movie?.review ?? '',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass-card border border-border/60 rounded-3xl p-7 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-2xl font-600">{isEdit ? 'Редактировать фильм' : 'Добавить фильм'}</h3>
            <p className="text-muted-foreground text-sm mt-0.5">{isEdit ? 'Измени данные и сохрани' : 'Заполни данные о фильме'}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <Icon name="X" size={22} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Poster upload */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-500 uppercase tracking-wide">
              Постер <span className="font-400 normal-case">(необязательно)</span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative cursor-pointer rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors overflow-hidden"
              style={{ minHeight: posterSrc ? undefined : '140px' }}
            >
              {posterSrc ? (
                <div className="flex items-center gap-4 p-3">
                  <img src={posterSrc} alt="poster" className="w-20 h-28 object-cover rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-500">Постер загружен</p>
                    <p className="text-muted-foreground text-xs mt-1">Нажми, чтобы заменить</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPosterSrc(''); }}
                      className="mt-2 text-xs text-destructive hover:underline flex items-center gap-1"
                    >
                      <Icon name="Trash2" size={12} /> Удалить постер
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                  <div className="w-12 h-12 rounded-xl bg-secondary/80 grid place-items-center">
                    <Icon name="ImagePlus" size={22} className="text-primary" />
                  </div>
                  <p className="text-sm font-500 text-foreground">Загрузить постер</p>
                  <p className="text-xs">Перетащи файл или нажми сюда</p>
                  <p className="text-xs opacity-60">JPG, PNG, WEBP до 10 МБ</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-500 uppercase tracking-wide">Название *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
              placeholder="Например: Интерстеллар"
              className="w-full bg-secondary/60 border border-border/60 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <Icon name="AlertCircle" size={15} />{error}
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
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-600 hover:opacity-90 transition-opacity glow-sm"
          >
            {isEdit ? 'Сохранить изменения' : 'Добавить в коллекцию'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════ Delete Confirm Modal ═══════════════════ */
const DeleteModal = ({ movie, onClose, onConfirm }: {
  movie: Movie; onClose: () => void; onConfirm: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" onClick={onClose}>
    <div className="glass-card border border-border/60 rounded-3xl p-7 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="w-14 h-14 rounded-2xl bg-destructive/15 grid place-items-center mx-auto mb-5">
        <Icon name="Trash2" size={26} className="text-destructive" />
      </div>
      <h3 className="font-display text-2xl font-600 text-center mb-2">Удалить фильм?</h3>
      <p className="text-muted-foreground text-sm text-center mb-1">
        Фильм <span className="text-foreground font-600">«{movie.title}»</span> будет удалён из коллекции.
      </p>
      <p className="text-muted-foreground text-xs text-center mb-7">Оценки и рецензия тоже удалятся.</p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-border/60 text-muted-foreground text-sm font-500 hover:text-foreground hover:border-border transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-3 rounded-xl bg-destructive text-white text-sm font-600 hover:opacity-90 transition-opacity"
        >
          Удалить
        </button>
      </div>
    </div>
  </div>
);

/* ═══════════════════ Podium ═══════════════════ */
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
            src={m.poster} alt={m.title} onClick={() => onRate(m)}
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