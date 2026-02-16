import { getDb } from './db';

export function initializeSchema() {
  const db = getDb();

  // Migration: rename manufacturers → brands if old table exists
  const oldTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='manufacturers'").get();
  if (oldTable) {
    db.exec('ALTER TABLE manufacturers RENAME TO brands');
    try { db.exec('ALTER TABLE brands ADD COLUMN is_featured INTEGER DEFAULT 1'); } catch {}
    try { db.exec('ALTER TABLE products RENAME COLUMN manufacturer_id TO brand_id'); } catch {}
  }

  // Migration: add is_featured to brands if missing
  try { db.exec('ALTER TABLE brands ADD COLUMN is_featured INTEGER DEFAULT 1'); } catch {}

  // Migration: backfill brand logos if missing
  try {
    const brandsTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='brands'").get();
    if (brandsTable) {
      const logoMap: Record<string, string> = {
        epredia: '/images/brands/epredia.jpg',
        '3dhistech': '/images/brands/3dh.jpg',
        hologic: '/images/brands/hologic.jpg',
        grundium: '/images/brands/grundium.jpg',
        milestone: '/images/brands/milestone.jpg',
        biocartis: '/images/brands/biocartis.jpg',
      };
      const update = db.prepare('UPDATE brands SET logo = ? WHERE slug = ? AND logo IS NULL');
      for (const [slug, logo] of Object.entries(logoMap)) {
        update.run(logo, slug);
      }
    }
  } catch {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_ko TEXT DEFAULT '',
      slug TEXT NOT NULL UNIQUE,
      parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_ko TEXT DEFAULT '',
      slug TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_ko TEXT DEFAULT '',
      slug TEXT NOT NULL UNIQUE,
      logo TEXT,
      website TEXT,
      description_en TEXT,
      description_ko TEXT,
      is_featured INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_ko TEXT DEFAULT '',
      mode TEXT NOT NULL DEFAULT 'simple',
      slug TEXT NOT NULL UNIQUE,
      sku TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      type_id INTEGER REFERENCES types(id) ON DELETE SET NULL,
      brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL,
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

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name_en TEXT NOT NULL,
      name_ko TEXT DEFAULT '',
      sku TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
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

    CREATE TABLE IF NOT EXISTS hero_slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT NOT NULL,
      title_ko TEXT DEFAULT '',
      subtitle_en TEXT,
      subtitle_ko TEXT,
      image TEXT,
      link_url TEXT,
      text_color TEXT DEFAULT 'light',
      text_align TEXT DEFAULT 'left',
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      type TEXT DEFAULT 'image',
      alt_en TEXT,
      alt_ko TEXT,
      variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS product_specs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      key_en TEXT NOT NULL,
      key_ko TEXT DEFAULT '',
      value_en TEXT NOT NULL,
      value_ko TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0
    );
  `);

  // Migration: add detail_en/detail_ko to products if missing
  try { db.exec('ALTER TABLE products ADD COLUMN detail_en TEXT'); } catch {}
  try { db.exec('ALTER TABLE products ADD COLUMN detail_ko TEXT'); } catch {}
  // Migration: add mode to products if missing
  try { db.exec("ALTER TABLE products ADD COLUMN mode TEXT NOT NULL DEFAULT 'simple'"); } catch {}
  // Migration: backfill mode by existing variants
  try { db.exec("UPDATE products SET mode = 'simple' WHERE mode IS NULL OR mode = ''"); } catch {}
  try { db.exec("UPDATE products SET mode = 'variable' WHERE id IN (SELECT DISTINCT product_id FROM product_variants)"); } catch {}

  // Migration: add featured_order to products if missing
  try { db.exec('ALTER TABLE products ADD COLUMN featured_order INTEGER DEFAULT 0'); } catch {}

  // Migration: seed default SMTP settings if not present
  const smtpDefaults: [string, string][] = [
    ['smtp_from', 'noreply@seongkohn.com'],
    ['contact_recipients', 'seongkohn@outlook.com'],
    ['turnstile_enabled', 'false'],
    ['leads_auto_delete_days', '30'],
  ];
  const upsertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO NOTHING');
  for (const [key, value] of smtpDefaults) {
    upsertSetting.run(key, value);
  }

  // Migration: backfill product_images from products.image for products that have a thumbnail but no gallery images
  db.exec(`
    INSERT INTO product_images (product_id, url, type, sort_order)
    SELECT id, image, 'image', 0
    FROM products
    WHERE image IS NOT NULL AND image != ''
      AND id NOT IN (SELECT DISTINCT product_id FROM product_images)
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
