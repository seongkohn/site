export function isIndexingEnabled(): boolean {
  return process.env.SITE_INDEXING_ENABLED === 'true';
}
