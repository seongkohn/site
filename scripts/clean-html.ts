import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'data', 'seongkohn.db'));
db.pragma('journal_mode = WAL');

interface ProductRow {
  id: number;
  description_en: string | null;
  detail_en: string | null;
  features_en: string | null;
}

interface ProductSampleRow {
  name_en: string;
  d: string;
}

interface CountRow {
  c: number;
}

function cleanText(raw: string): string {
  if (!raw) return '';
  // First unescape literal \n and \t sequences from CSV export
  let s = raw.replace(/\\n/g, '\n').replace(/\\t/g, ' ');
  // Strip HTML tags, converting list items to plain text
  s = s.replace(/<li[^>]*>/gi, '- ');
  s = s.replace(/<\/li>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p>/gi, '\n');
  s = s.replace(/<\/h[1-6]>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  // Decode HTML entities
  s = s.replace(/&nbsp;/g, ' ');
  s = s.replace(/&amp;/g, '&');
  s = s.replace(/&lt;/g, '<');
  s = s.replace(/&gt;/g, '>');
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#039;/g, "'");
  // Clean whitespace
  s = s.replace(/[ \t]+/g, ' ');
  s = s.split('\n').map(l => l.trim()).filter(l => l).join('\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

const products = db.prepare('SELECT id, description_en, detail_en, features_en FROM products').all() as ProductRow[];
const updateDesc = db.prepare('UPDATE products SET description_en = ? WHERE id = ?');
const updateDetail = db.prepare('UPDATE products SET detail_en = ? WHERE id = ?');
const updateFeatures = db.prepare('UPDATE products SET features_en = ? WHERE id = ?');

let cleaned = 0;
for (const p of products) {
  if (p.description_en) {
    const c = cleanText(p.description_en);
    if (c !== p.description_en) {
      updateDesc.run(c, p.id);
      cleaned++;
    }
  }
  if (p.detail_en) {
    updateDetail.run(cleanText(p.detail_en), p.id);
  }
  if (p.features_en) {
    updateFeatures.run(cleanText(p.features_en), p.id);
  }
}

// Fix PANNORAMIC 1000 type
db.prepare("UPDATE products SET type_id = 1 WHERE name_en = 'PANNORAMIC 1000' AND type_id IS NULL").run();

// Verify
const sample = db.prepare('SELECT name_en, substr(detail_en, 1, 300) as d FROM products WHERE id = 11').get() as ProductSampleRow;
console.log(`Sample: ${sample.name_en}`);
console.log(sample.d);
console.log('---');
const nulls = db.prepare('SELECT count(*) as c FROM products WHERE type_id IS NULL').get() as CountRow;
console.log(`Null types remaining: ${nulls.c}`);
console.log(`Cleaned ${cleaned} descriptions`);

db.close();
