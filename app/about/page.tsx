import AboutClient from './AboutClient';
import { getDb } from '@/lib/db';
import { initializeSchema } from '@/lib/schema';
import { seedDatabase } from '@/lib/seed';
import { parseAboutTimeline } from '@/lib/about-timeline';

export const metadata = {
  title: 'About Us',
};

export default function AboutPage() {
  initializeSchema();
  seedDatabase();
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('about_timeline_json') as
    | { value: string }
    | undefined;
  const timelineEntries = parseAboutTimeline(row?.value);

  return <AboutClient timelineEntries={timelineEntries} />;
}
