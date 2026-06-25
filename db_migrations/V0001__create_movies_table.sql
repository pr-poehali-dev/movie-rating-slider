CREATE TABLE IF NOT EXISTS movies (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  genre TEXT NOT NULL DEFAULT '',
  year INTEGER NOT NULL DEFAULT 0,
  poster TEXT NOT NULL DEFAULT '',
  rating NUMERIC(4,2) NOT NULL DEFAULT 0,
  rating_quality INTEGER,
  rating_plot INTEGER,
  rating_characters INTEGER,
  rating_atmosphere INTEGER,
  review TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
