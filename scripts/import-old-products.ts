import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import slugify from 'slugify';

const DB_PATH = path.join(process.cwd(), 'data', 'seongkohn.db');
const IMAGES_SRC = path.join(process.cwd(), '2024');
const IMAGES_DEST = path.join(process.cwd(), 'public', 'images', 'products');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Ensure images destination exists
fs.mkdirSync(IMAGES_DEST, { recursive: true });

// ── Simple CSV parser that handles quoted fields ───────────────────────
function parseCSV(text: string): Record<string, string>[] {
  const lines: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        current.push(field);
        field = '';
      } else if (ch === '\n') {
        current.push(field);
        field = '';
        if (current.length > 1) lines.push(current);
        current = [];
      } else if (ch !== '\r') {
        field += ch;
      }
    }
  }
  // Last line
  if (field || current.length > 0) {
    current.push(field);
    if (current.length > 1) lines.push(current);
  }

  const headers = lines[0];
  return lines.slice(1).map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h.trim()] = (row[i] || '').trim(); });
    return obj;
  });
}

// ── Parse CSV ──────────────────────────────────────────────────────────────
const csvRaw = fs.readFileSync(path.join(process.cwd(), 'old.csv'), 'utf-8');
const csvClean = csvRaw.replace(/^\uFEFF/, '');
const records = parseCSV(csvClean);

console.log(`Parsed ${records.length} rows from CSV`);

// ── Helper: copy image from 2024/ to public/images/products/ ───────────
function findAndCopyImage(filename: string): string | null {
  if (!filename) return null;

  // Already copied?
  const destPath = path.join(IMAGES_DEST, filename);
  if (fs.existsSync(destPath)) return `/images/products/${filename}`;

  // Search in 2024 subfolders
  for (const month of fs.readdirSync(IMAGES_SRC)) {
    const srcPath = path.join(IMAGES_SRC, month, filename);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  Copied: ${month}/${filename} -> products/${filename}`);
      return `/images/products/${filename}`;
    }
  }

  console.log(`  WARNING: Image not found: ${filename}`);
  return null;
}

// ── Helper: extract image filenames from CSV Images column ─────────────
function parseImageUrls(imagesField: string): string[] {
  if (!imagesField) return [];
  return imagesField
    .split(',')
    .map(url => url.trim())
    .filter(Boolean)
    .map(url => {
      const parts = url.split('/');
      return parts[parts.length - 1];
    });
}

// ── Helper: strip HTML to plain text ────────────────────────────────────
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── Helper: extract feature bullets from HTML ───────────────────────────
function extractFeatures(html: string): string {
  if (!html) return '';
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const features: string[] = [];
  let match;
  while ((match = liRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim();
    if (text && features.length < 8) {
      features.push(text);
    }
  }
  return features.join('\n');
}

// ── Category mapping (CSV category string -> DB category ID) ───────────
// Based on existing DB categories
const CATEGORY_MAP: Record<string, number> = {
  'cytocentrifuge': 13,
  'cytology': 2,
  'histology': 1,
  'microtomy': 8,
  'microtomes': 8,
  'microtomy > microtomes': 8,
  'tissue processing': 7,
  'embedding': 9,
  'embedding > embedding stations': 9,
  'staining': 10,
  'staining > stainers': 10,
  'coverslipping': 11,
  'coverslipping > coverslippers': 11,
  'digital pathology': 3,
  'slide scanners': 15,
  'image analysis': 16,
  'immunohistochemistry': 4,
  'frozen section': 20,
  'frozen section > cryostats': 19,
  'frozen section > embedding medium': 20,
  'cryostats': 19,
  'slide printers': 24,
  'cassette printers': 25,
  'grossing': 33,
  'grossing > grossing stations': 26,
  'grossing > gross imaging': 27,
  'grossing > tissue marking dye': 32,
  'decalcification': 1, // under histology
  'glass slides': 21,
  'glass slides > adhesion slides': 21,
  'glass slides > non-adhesion slides': 21,
  'staining > stains': 28,
  'microtomy > microtome blades': 23,
  'coverslipping > coverglass': 22,
  'coverslipping > mounting media': 30,
  'cell block': 2, // under cytology
  'thinprep': 12,
};

// Pick the most specific category from CSV categories string
function pickCategory(categoriesStr: string): number | null {
  if (!categoriesStr) return null;
  const cats = categoriesStr.split(',').map(c => c.trim().toLowerCase());

  // Prefer subcategories (those with >) first
  for (const cat of cats) {
    if (cat.includes('>') && CATEGORY_MAP[cat]) {
      return CATEGORY_MAP[cat];
    }
  }
  // Then specific categories
  const priority = [
    'cytocentrifuge', 'slide scanners', 'cryostats', 'slide printers',
    'cassette printers', 'tissue processing', 'embedding', 'microtomy',
    'staining', 'coverslipping', 'frozen section', 'glass slides',
    'cell block', 'decalcification', 'grossing', 'image analysis',
    'digital pathology', 'immunohistochemistry', 'cytology', 'histology',
  ];
  for (const p of priority) {
    if (cats.includes(p)) return CATEGORY_MAP[p]!;
  }
  return null;
}

// ── Type mapping ────────────────────────────────────────────────────────
const TYPE_MAP: Record<string, number> = {
  'instruments': 1,
  'consumables': 2,
  'reagents': 3,
  'accessories': 5,
  'software': 6,
};

function pickType(tags: string): number | null {
  if (!tags) return null;
  const t = tags.trim().toLowerCase();
  return TYPE_MAP[t] || null;
}

// ── Brand detection (from product name / description) ───────────────────
// Most products are Epredia; scanners are 3DHISTECH or Grundium; some are Milestone
function detectBrand(name: string, categories: string): number {
  const n = name.toLowerCase();
  if (n.includes('pannoramic') || n.includes('halo')) return 2; // 3DHISTECH
  if (n.includes('ocus')) return 4; // Grundium
  if (['magnus', 'logos', 'ultragross', 'macropath', 'prestochill', 'presto pro', 'decalmate'].some(m => n.includes(m.toLowerCase()))) return 5; // Milestone
  return 1; // Epredia (default)
}

// ── Main import ─────────────────────────────────────────────────────────
const insertProduct = db.prepare(`
  INSERT INTO products (name_en, name_ko, slug, sku, category_id, type_id, brand_id,
    description_en, description_ko, features_en, features_ko, detail_en, image, is_published, is_featured)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertVariant = db.prepare(`
  INSERT INTO product_variants (product_id, name_en, name_ko, sku, sort_order)
  VALUES (?, ?, ?, ?, ?)
`);

const insertImage = db.prepare(`
  INSERT INTO product_images (product_id, url, type, alt_en, sort_order)
  VALUES (?, ?, 'image', ?, ?)
`);

// Track parent products for variant linking (old WooCommerce ID -> new DB ID)
const oldIdToNewId = new Map<string, number>();
// Track product names to new IDs for parent matching by SKU
const skuToNewId = new Map<string, number>();

let created = 0;
let variants = 0;
let skipped = 0;

// First pass: insert parent products (simple, variable, grouped)
for (const row of records) {
  const rowType = row['Type']?.trim();
  if (rowType === 'variation') continue; // handle in second pass

  const name = row['Name']?.trim();
  if (!name) { skipped++; continue; }

  // Skip orphan entries
  if (name === 'SlideMate AS - On-Demand') { skipped++; continue; }

  const sku = row['SKU']?.trim() || slugify(name, { lower: true, strict: true });
  const shortDesc = row['Short description']?.trim() || '';
  const fullDesc = row['Description']?.trim() || '';
  const categories = row['Categories']?.trim() || '';
  const tags = row['Tags']?.trim() || '';
  const isFeatured = row['Is featured?']?.trim() === '1' ? 1 : 0;
  const oldId = row['ID']?.trim() || '';

  // Check for duplicate slug
  const slug = slugify(name, { lower: true, strict: true });
  const existingSlug = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
  if (existingSlug) {
    console.log(`  SKIP (duplicate slug): ${name}`);
    skipped++;
    continue;
  }

  const categoryId = pickCategory(categories);
  const typeId = pickType(tags);
  const brandId = detectBrand(name, categories);

  // Handle images
  const imageFilenames = parseImageUrls(row['Images']?.trim() || '');
  const mainImageFilename = imageFilenames[0] || '';
  const mainImagePath = mainImageFilename ? findAndCopyImage(mainImageFilename) : null;

  // Extract features from HTML description
  const features = extractFeatures(fullDesc);

  console.log(`Inserting: ${name} [cat:${categoryId}, type:${typeId}, brand:${brandId}]`);

  const result = insertProduct.run(
    name,           // name_en
    '',             // name_ko (will need translation later)
    slug,
    sku,
    categoryId,
    typeId,
    brandId,
    shortDesc,      // description_en
    '',             // description_ko
    features,       // features_en
    '',             // features_ko
    fullDesc,       // detail_en (full HTML)
    mainImagePath,  // image
    1,              // is_published
    isFeatured,
  );

  const newId = Number(result.lastInsertRowid);
  oldIdToNewId.set(oldId, newId);
  if (sku) skuToNewId.set(sku, newId);

  // Insert additional gallery images
  if (imageFilenames.length > 1) {
    for (let i = 1; i < imageFilenames.length; i++) {
      const imgPath = findAndCopyImage(imageFilenames[i]);
      if (imgPath) {
        insertImage.run(newId, imgPath, name, i);
      }
    }
  }

  created++;
}

// Second pass: insert variations as product_variants
for (const row of records) {
  const rowType = row['Type']?.trim();
  if (rowType !== 'variation') continue;

  const name = row['Name']?.trim() || '';
  const sku = row['SKU']?.trim() || '';
  const parentRef = row['Parent']?.trim() || '';

  if (!parentRef) { skipped++; continue; }

  // Parent can be "id:XXXX" or a SKU
  let parentNewId: number | undefined;
  if (parentRef.startsWith('id:')) {
    const oldParentId = parentRef.replace('id:', '');
    parentNewId = oldIdToNewId.get(oldParentId);
  } else {
    parentNewId = skuToNewId.get(parentRef);
  }

  if (!parentNewId) {
    console.log(`  SKIP variant (parent not found): ${name} -> ${parentRef}`);
    skipped++;
    continue;
  }

  // Extract variant label from name (e.g., "SlideMate Slides - White" -> "White")
  const variantLabel = name.includes(' - ') ? name.split(' - ').pop()!.trim() : name;

  console.log(`  Variant: ${variantLabel} (SKU: ${sku}) -> parent ${parentNewId}`);
  insertVariant.run(parentNewId, variantLabel, '', sku || variantLabel, variants);
  variants++;
}

console.log(`\nDone! Created: ${created} products, ${variants} variants, Skipped: ${skipped}`);

db.close();
