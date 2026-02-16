export type AboutTimelineEntry = {
  id: string;
  year: string;
  title_en: string;
  title_ko: string;
  description_en: string;
  description_ko: string;
  image?: string;
  image_alt_en?: string;
  image_alt_ko?: string;
};

export const defaultAboutTimeline: AboutTimelineEntry[] = [
  {
    id: 'milestone-1988',
    year: '1988',
    title_en: 'Seongkohn Founded',
    title_ko: '성곤무역 설립',
    description_en: 'Started distributing core pathology consumables to Korean laboratories.',
    description_ko: '국내 병리 검사실에 핵심 소모품 공급을 시작했습니다.',
    image: '/images/hero/slide-banner.jpg',
    image_alt_en: 'Seongkohn history milestone',
    image_alt_ko: '성곤무역 연혁 이미지',
  },
  {
    id: 'milestone-1996',
    year: '1996',
    title_en: 'Global Partnership Expansion',
    title_ko: '글로벌 파트너십 확대',
    description_en: 'Built long-term partnerships with leading pathology manufacturers.',
    description_ko: '주요 병리 제조사와 장기 파트너십을 구축했습니다.',
    image: '/images/brands/epredia.jpg',
    image_alt_en: 'Partner milestone',
    image_alt_ko: '파트너십 연혁 이미지',
  },
  {
    id: 'milestone-2008',
    year: '2008',
    title_en: 'Liquid-Based Cytology Introduction',
    title_ko: '액상세포병리 도입',
    description_en: 'Introduced liquid-based cytology workflows to high-volume Korean labs.',
    description_ko: '국내 대형 검사실에 액상세포병리 검사 워크플로우를 소개했습니다.',
  },
  {
    id: 'milestone-2016',
    year: '2016',
    title_en: 'Digital Pathology Rollout',
    title_ko: '디지털 병리 확장',
    description_en: 'Expanded product portfolio with digital pathology and image analysis solutions.',
    description_ko: '디지털 병리와 이미지 분석 솔루션으로 제품군을 확장했습니다.',
  },
  {
    id: 'milestone-2024',
    year: '2024+',
    title_en: 'Next Growth Phase',
    title_ko: '차세대 성장 단계',
    description_en: 'Scaling nationwide support, service response, and strategic manufacturer collaborations.',
    description_ko: '전국 기술지원, 서비스 대응, 제조사 협력을 지속 확대하고 있습니다.',
  },
];

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeEntry(input: unknown, index: number): AboutTimelineEntry | null {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;

  const year = toNonEmptyString(record.year);
  const title_en = toNonEmptyString(record.title_en);
  const title_ko = toNonEmptyString(record.title_ko);
  const description_en = toNonEmptyString(record.description_en);
  const description_ko = toNonEmptyString(record.description_ko);

  if (!year || !title_en || !title_ko || !description_en || !description_ko) {
    return null;
  }

  return {
    id: toNonEmptyString(record.id) ?? `timeline-${index + 1}`,
    year,
    title_en,
    title_ko,
    description_en,
    description_ko,
    image: toOptionalString(record.image),
    image_alt_en: toOptionalString(record.image_alt_en),
    image_alt_ko: toOptionalString(record.image_alt_ko),
  };
}

export function parseAboutTimeline(rawValue: string | null | undefined): AboutTimelineEntry[] {
  if (!rawValue) return defaultAboutTimeline;

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsed)) return defaultAboutTimeline;

    return parsed
      .map((entry, index) => normalizeEntry(entry, index))
      .filter((entry): entry is AboutTimelineEntry => entry !== null);
  } catch {
    return defaultAboutTimeline;
  }
}

export function serializeAboutTimeline(entries: AboutTimelineEntry[]): string {
  return JSON.stringify(entries);
}

export function createEmptyAboutTimelineEntry(): AboutTimelineEntry {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id: `timeline-${unique}`,
    year: '20XX',
    title_en: 'New Milestone',
    title_ko: '새 마일스톤',
    description_en: 'Add milestone details here.',
    description_ko: '마일스톤 설명을 입력하세요.',
    image: '',
    image_alt_en: '',
    image_alt_ko: '',
  };
}
