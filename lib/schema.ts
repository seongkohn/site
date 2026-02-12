import { getDb } from './db';

export function initializeSchema() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_ko TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_ko TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS manufacturers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_ko TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo TEXT,
      website TEXT,
      description_en TEXT,
      description_ko TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_ko TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      sku TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      type_id INTEGER REFERENCES types(id) ON DELETE SET NULL,
      manufacturer_id INTEGER REFERENCES manufacturers(id) ON DELETE SET NULL,
      description_en TEXT,
      description_ko TEXT,
      features_en TEXT,
      features_ko TEXT,
      image TEXT,
      is_published INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_related (
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      related_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, related_id)
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      message TEXT NOT NULL,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // FTS5 virtual table for product search
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
      name_en, name_ko, sku, description_en, description_ko,
      content='products',
      content_rowid='id'
    );
  `);

  // Triggers to keep FTS in sync
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products BEGIN
      INSERT INTO products_fts(rowid, name_en, name_ko, sku, description_en, description_ko)
      VALUES (new.id, new.name_en, new.name_ko, new.sku, new.description_en, new.description_ko);
    END;

    CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products BEGIN
      INSERT INTO products_fts(products_fts, rowid, name_en, name_ko, sku, description_en, description_ko)
      VALUES ('delete', old.id, old.name_en, old.name_ko, old.sku, old.description_en, old.description_ko);
    END;

    CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE ON products BEGIN
      INSERT INTO products_fts(products_fts, rowid, name_en, name_ko, sku, description_en, description_ko)
      VALUES ('delete', old.id, old.name_en, old.name_ko, old.sku, old.description_en, old.description_ko);
      INSERT INTO products_fts(rowid, name_en, name_ko, sku, description_en, description_ko)
      VALUES (new.id, new.name_en, new.name_ko, new.sku, new.description_en, new.description_ko);
    END;
  `);
}
