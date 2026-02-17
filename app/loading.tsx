import { cookies } from 'next/headers';

export default async function Loading() {
  const cookieStore = await cookies();
  const lang = cookieStore.get('lang')?.value === 'ko' ? 'ko' : 'en';

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand-magenta border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-400">{lang === 'ko' ? '로딩 중...' : 'Loading...'}</p>
      </div>
    </div>
  );
}
