import Database from 'better-sqlite3';

const db = new Database('./data/seongkohn.db');

// Check current logo paths
const manufacturers = db.prepare('SELECT id, name_en, logo FROM manufacturers WHERE logo IS NOT NULL').all();

console.log('Current logo paths:');
manufacturers.forEach(m => {
  console.log(`  ${m.name_en}: ${m.logo}`);
});

// Update paths
const updated = db.prepare(`
  UPDATE manufacturers
  SET logo = REPLACE(logo, '/logos/', '/images/brands/')
  WHERE logo LIKE '/logos/%'
`).run();

console.log(`\nUpdated ${updated.changes} logo paths.`);

// Verify
const after = db.prepare('SELECT id, name_en, logo FROM manufacturers WHERE logo IS NOT NULL').all();
console.log('\nUpdated logo paths:');
after.forEach(m => {
  console.log(`  ${m.name_en}: ${m.logo}`);
});

db.close();
console.log('\n✓ Done');
