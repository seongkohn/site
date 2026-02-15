export type Lang = 'en' | 'ko';

export const translations = {
  nav: {
    home: { en: 'Home', ko: '홈페이지' },
    products: { en: 'Products', ko: '제품' },
    about: { en: 'About Us', ko: '회사소개' },
    partners: { en: 'Partners', ko: '파트너' },
    contact: { en: 'Contact Us', ko: '문의' },
  },
  home: {
    heroTitle: { en: 'Precision Instruments for Pathology', ko: '병리학을 위한 정밀 기기' },
    heroSubtitle: { en: 'Korea\'s trusted distributor of world-class laboratory equipment since 1988', ko: '1988년부터 신뢰받는 세계적 실험 장비 한국 총판' },
    viewProducts: { en: 'View Products', ko: '제품 보기' },
    contactUs: { en: 'Contact Us', ko: '문의하기' },
    ourProducts: { en: 'Our Products', ko: '제품 안내' },
    featured: { en: 'Featured Products', ko: '주요 제품' },
    viewAll: { en: 'View All', ko: '전체 보기' },
    since1988: { en: 'SINCE 1988', ko: '1988년 설립' },
    companyTagline: { en: 'Korea\'s Trusted Pathology Partner', ko: '한국의 신뢰받는 병리 파트너' },
    companyIntro: {
      en: 'Seongkohn Traders Corporation has been at the forefront of introducing advanced pathology solutions to Korean laboratories for over 35 years.',
      ko: '성곤무역(주)는 35년 이상 한국 검사실에 첨단 병리 솔루션을 도입해 온 선도 기업입니다.',
    },
    learnMore: { en: 'Learn More', ko: '자세히 보기' },
    stat_years: { en: 'Years', ko: '년 이상' },
    stat_partners: { en: 'Global Partners', ko: '글로벌 파트너' },
    stat_products: { en: 'Products', ko: '제품' },
    stat_labs: { en: 'Lab Customers', ko: '검사실 고객' },
    ourPartners: { en: 'OUR PARTNERS', ko: '파트너사' },
  },
  // Homepage category cards
  homeCats: {
    histology: { en: 'Histology', ko: '조직병리' },
    histologyDesc: { en: 'Tissue processors, microtomes, stainers, coverslippers', ko: '조직처리기, 마이크로톰, 염색기, 봉입기' },
    cytology: { en: 'Cytology', ko: '세포병리' },
    cytologyDesc: { en: 'Liquid-based cytology, cytocentrifuges, cell blocks', ko: '액상세포검사, 사이토센트리퓨지, 셀블록' },
    digitalPathology: { en: 'Digital Pathology', ko: '디지털병리' },
    digitalPathologyDesc: { en: 'Slide scanners, image analysis, AI', ko: '슬라이드 스캐너, 이미지 분석, AI' },
    instruments: { en: 'Instruments', ko: '장비' },
    instrumentsDesc: { en: 'All laboratory instruments and equipment', ko: '모든 검사실 장비 및 기기' },
    consumables: { en: 'Consumables', ko: '소모품' },
    consumablesDesc: { en: 'Blades, slides, coverglass, cassettes', ko: '블레이드, 슬라이드, 커버글라스, 카세트' },
    reagents: { en: 'Reagents', ko: '시약' },
    reagentsDesc: { en: 'Stains, fixatives, mounting media', ko: '염색시약, 고정액, 마운팅 매체' },
  },
  products: {
    title: { en: 'Products', ko: '제품' },
    search: { en: 'Search...', ko: '검색...' },
    searchAll: { en: 'Search For Products...', ko: '제품 검색...' },
    allCategories: { en: 'All categories', ko: '전체 카테고리' },
    category: { en: 'CATEGORY', ko: '카테고리' },
    type: { en: 'TYPE', ko: '유형' },
    manufacturer: { en: 'BRAND', ko: '브랜드' },
    all: { en: 'All', ko: '전체' },
    noResults: { en: 'No products found.', ko: '제품이 없습니다.' },
    nProducts: { en: 'products', ko: '개 제품' },
    filters: { en: 'Filters', ko: '필터' },
    clearFilters: { en: 'Clear Filters', ko: '필터 초기화' },
    requestQuote: { en: 'Request a Quote', ko: '견적 요청' },
    keyFeatures: { en: 'Key Features', ko: '주요 특징' },
    description: { en: 'Description', ko: '설명' },
    relatedProducts: { en: 'Related Products', ko: '관련 제품' },
    sku: { en: 'SKU', ko: 'SKU' },
  },
  about: {
    title: { en: 'About Seongkohn', ko: '성곤무역 소개' },
    subtitle: { en: 'Advancing pathology in Korea since 1988', ko: '1988년 이래 한국 병리학의 발전을 이끌어 온 기업' },
    description1: {
      en: 'Seongkohn is a leading supplier of instruments, reagents, and consumables to pathology laboratories across Korea. Our company is committed to innovation and excellence, having introduced a range of widely adopted technologies in the field, such as liquid-based cytology, digital pathology, and image analysis.',
      ko: '성곤무역은 1988년 설립이래 국내 병리검사실의 자동화를 위한 필수 장비, 시약 및 소모품을 전문적으로 공급해온 해부병리분야의 선두 기업입니다. 혁신과 탁월함을 기업 이념으로 삼고 있는 저희는 세포원심분리기, 자동 면역염색기, 당일 진단 조직처리, 액상세포병리검사, 디지털 병리, 이미지 분석 등 이제는 병리검사에 널리 사용되고 있는 새로운 기술들을 국내최초로 도입해왔습니다.',
    },
    description2: {
      en: 'Our focus remains on delivering high-quality, reliable solutions to meet the evolving needs of pathology labs nationwide.',
      ko: '성곤무역은 높은 품질과 신뢰성 높은 솔루션을 지속적으로 제공함으로써, 병리검사실들이 직면한 다양하고 변화하는 요구사항을 충족시키기 위해 노력하고 있습니다.',
    },
    mission: { en: 'Our Mission', ko: '미션' },
    missionText: {
      en: 'To enhance diagnostic accuracy and laboratory efficiency through world-class pathology solutions.',
      ko: '세계 최고 수준의 병리 솔루션을 통해 진단 정확도와 검사실 효율성을 향상시킵니다.',
    },
    vision: { en: 'Our Vision', ko: '비전' },
    visionText: {
      en: 'To be Korea\'s most trusted partner in pathology laboratory advancement.',
      ko: '한국에서 가장 신뢰받는 병리 검사실 발전 파트너가 되겠습니다.',
    },
  },
  partners: {
    title: { en: 'Our Partners', ko: '파트너사' },
    subtitle: {
      en: 'We partner with the world\'s leading manufacturers of pathology laboratory equipment.',
      ko: '세계 최고의 병리학 실험 장비 제조업체와 파트너십을 맺고 있습니다.',
    },
    visitWebsite: { en: 'Visit Website', ko: '웹사이트 방문' },
  },
  contact: {
    title: { en: 'Contact Us', ko: '문의하기' },
    getInTouch: { en: 'Get in Touch', ko: '연락처' },
    sendMessage: { en: 'Send a Message', ko: '메시지 보내기' },
    name: { en: 'Name', ko: '성함' },
    email: { en: 'Email', ko: '이메일' },
    phone: { en: 'Phone', ko: '전화번호' },
    organization: { en: 'Organization', ko: '소속' },
    message: { en: 'Message', ko: '메시지' },
    send: { en: 'Send', ko: '보내기' },
    success: { en: 'Thank you for your inquiry. Our representative will reach out to you shortly.', ko: '문의해 주셔서 감사합니다. 담당자가 곧 연락드리겠습니다.' },
    error: { en: 'Failed to send message. Please try again.', ko: '메시지 전송에 실패했습니다. 다시 시도해 주세요.' },
    requiredName: { en: 'Please enter your name.', ko: '성함을 입력해 주세요.' },
    requiredEmail: { en: 'Please enter your email.', ko: '이메일을 입력해 주세요.' },
    invalidEmail: { en: 'Please enter a valid email address.', ko: '올바른 이메일 주소를 입력해 주세요.' },
    requiredMessage: { en: 'Please enter a message.', ko: '메시지를 입력해 주세요.' },
    address: { en: 'Address', ko: '주소' },
    addressValue: { en: '38, Hakdong-ro 50-gil, Gangnam-gu, Seoul 06100', ko: '서울 강남구 학동로50길 38, 06100' },
    phoneValue: { en: '+82-2-540-3311', ko: '02-540-3311' },
    emailValue: { en: 'labsales@seongkohn.com', ko: 'labsales@seongkohn.com' },
  },
  footer: {
    tagline: { en: 'Trusted partner for pathology laboratories since 1988.', ko: '1988년 이래 병리 검사실의 신뢰받는 파트너.' },
    contact: { en: 'CONTACT', ko: '연락처' },
    products: { en: 'PRODUCTS', ko: '제품' },
    rights: { en: 'All rights reserved.', ko: 'All rights reserved.' },
    location: { en: '38, Hakdong-ro 50-gil, Gangnam-gu, Seoul 06100, Korea', ko: '서울 강남구 학동로50길 38, 06100' },
    phone: { en: '+82-2-540-3311', ko: '02-540-3311' },
  },
  common: {
    home: { en: 'Home', ko: '홈' },
    loading: { en: 'Loading...', ko: '로딩 중...' },
    notFound: { en: 'Page Not Found', ko: '페이지를 찾을 수 없습니다' },
    notFoundDesc: { en: 'The page you\'re looking for doesn\'t exist.', ko: '찾으시는 페이지가 존재하지 않습니다.' },
    backHome: { en: 'Back to Home', ko: '홈으로 돌아가기' },
    allDepartments: { en: 'All Departments', ko: '전체 부서' },
    companyNameEn: { en: 'SEONGKOHN TRADERS', ko: '성곤무역(주)' },
    companySubtitle: { en: 'SEONGKOHN TRADERS CORP.', ko: 'SEONGKOHN TRADERS CORP.' },
  },
} as const;

export function t(key: string, lang: Lang): string {
  const keys = key.split('.');
  let current: unknown = translations;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  if (current && typeof current === 'object' && lang in current) {
    return (current as Record<string, string>)[lang];
  }
  return key;
}
