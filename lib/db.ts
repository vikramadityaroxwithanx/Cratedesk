import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

declare global {
  // eslint-disable-next-line no-var
  var __cd_sql: Sql | undefined;
  // eslint-disable-next-line no-var
  var __cd_init: Promise<void> | undefined;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS listings (
  id            SERIAL PRIMARY KEY,
  category      TEXT,
  title         TEXT NOT NULL,
  edition       TEXT,
  condition     TEXT,
  includes      TEXT,
  price_inr     INTEGER,
  fair_low_inr  INTEGER,
  fair_high_inr INTEGER,
  source        TEXT,
  source_url    TEXT,
  seller        TEXT,
  location      TEXT,
  claude_notes  TEXT,
  my_notes      TEXT,
  status        TEXT NOT NULL DEFAULT 'new',
  target_buy_inr INTEGER,
  created_by    TEXT NOT NULL DEFAULT 'claude',
  last_edited_by TEXT NOT NULL DEFAULT 'claude',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS price_points (
  id          SERIAL PRIMARY KEY,
  listing_id  INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  price_inr   INTEGER NOT NULL,
  note        TEXT,
  actor       TEXT NOT NULL DEFAULT 'claude',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS wants (
  id            SERIAL PRIMARY KEY,
  category      TEXT,
  title         TEXT NOT NULL,
  edition       TEXT,
  min_condition TEXT,
  max_price_inr INTEGER,
  notes         TEXT,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_by    TEXT NOT NULL DEFAULT 'claude',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS offers (
  id          SERIAL PRIMARY KEY,
  want_id     INTEGER NOT NULL REFERENCES wants(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  contact     TEXT NOT NULL,
  price_inr   INTEGER,
  condition   TEXT,
  message     TEXT,
  status      TEXT NOT NULL DEFAULT 'new',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS activity (
  id         SERIAL PRIMARY KEY,
  actor      TEXT NOT NULL,
  action     TEXT NOT NULL,
  detail     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

function connectionString() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

function client(): Sql {
  const url = connectionString();
  if (!url) throw new Error("DATABASE_URL is not set. Add a Postgres database in Vercel → Storage.");
  if (!globalThis.__cd_sql) {
    const local = /localhost|127\.0\.0\.1|\/tmp|host=\//.test(url);
    globalThis.__cd_sql = postgres(url, {
      ssl: local ? false : "require",
      max: 3,
      idle_timeout: 20,
      prepare: false,
      onnotice: () => {},
    });
  }
  return globalThis.__cd_sql;
}

/** Returns a ready-to-use client; creates tables on first use. */
export async function db(): Promise<Sql> {
  const sql = client();
  if (!globalThis.__cd_init) {
    globalThis.__cd_init = sql.unsafe(SCHEMA).then(() => undefined).catch((e) => {
      globalThis.__cd_init = undefined;
      throw e;
    });
  }
  await globalThis.__cd_init;
  return sql;
}
