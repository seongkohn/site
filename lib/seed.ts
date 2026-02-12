import { getDb } from './db';
import { initializeSchema } from './schema';
import bcryptjs from 'bcryptjs';

export function seedDatabase() {
  initializeSchema();
  const db = getDb();

  // Check if already seeded
  const existing = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (existing.count > 0) return;

  // Manufacturers
  const insertMfr = db.prepare(`
    INSERT INTO manufacturers (name_en, name_ko, slug, website, description_en, description_ko, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertMfr.run('Epredia', '에프레디아', 'epredia', 'https://www.epredia.com', 'Formerly Thermo Fisher Scientific Anatomical Pathology. Instruments, reagents, and consumables for histology and cytology laboratories.', '구 Thermo Fisher Scientific Anatomical Pathology. 조직병리 및 세포병리 검사실용 장비, 시약 및 소모품.', 1);
  insertMfr.run('3DHISTECH', '3D히스테크', '3dhistech', 'https://www.3dhistech.com', 'Digital pathology pioneer offering slide scanners, image analysis, and telepathology solutions.', '슬라이드 스캐너, 이미지 분석, 원격병리 솔루션을 제공하는 디지털 병리 선도 기업.', 2);
  insertMfr.run('Hologic', '홀로직', 'hologic', 'https://www.hologic.com', 'Global leader in women\'s health diagnostics including the ThinPrep and Genius Digital Cytology systems.', '씬프렙 및 Genius 디지털 세포병리 시스템을 포함한 여성 건강 진단 분야의 글로벌 리더.', 3);
  insertMfr.run('Grundium', '그런디움', 'grundium', 'https://www.grundium.com', 'Finnish innovator in portable digital microscopy and remote pathology solutions.', '휴대용 디지털 현미경 및 원격 병리 솔루션 분야의 핀란드 혁신 기업.', 4);
  insertMfr.run('Milestone', '마일스톤', 'milestone', 'https://www.milestoneimaging.com', 'Pioneer in immunohistochemistry automation and digital pathology solutions.', '면역조직화학 자동화 및 디지털 병리 솔루션 분야의 선도 기업.', 5);
  insertMfr.run('Biocartis', '바이오카르티스', 'biocartis', 'https://www.biocartis.com', 'Belgian molecular diagnostics company specializing in rapid, high-quality molecular testing solutions.', '신속하고 고품질의 분자진단 테스트 솔루션을 전문으로 하는 벨기에 회사.', 6);

  // Categories (parent categories)
  const insertCat = db.prepare(`
    INSERT INTO categories (name_en, name_ko, slug, parent_id, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertCat.run('Histology', '조직병리', 'histology', null, 1);
  insertCat.run('Cytology', '세포병리', 'cytology', null, 2);
  insertCat.run('Digital Pathology', '디지털 병리', 'digital-pathology', null, 3);
  insertCat.run('Immunohistochemistry', '면역조직화학', 'ihc', null, 4);
  insertCat.run('Molecular Pathology', '분자병리', 'molecular', null, 5);
  insertCat.run('Hematology', '혈액병리', 'hematology', null, 6);

  // Subcategories for Histology (parent_id = 1)
  insertCat.run('Tissue Processing', '조직처리', 'tissue-processing', 1, 1);
  insertCat.run('Microtomy', '박절', 'microtomy', 1, 2);
  insertCat.run('Embedding', '포매', 'embedding', 1, 3);
  insertCat.run('Staining', '염색', 'staining', 1, 4);
  insertCat.run('Coverslipping', '커버슬리핑', 'coverslipping', 1, 5);

  // Subcategories for Cytology (parent_id = 2)
  insertCat.run('ThinPrep', '씬프렙', 'thinprep', 2, 1);
  insertCat.run('Cytocentrifuge', '사이토센트리퓨지', 'cytocentrifuge', 2, 2);
  insertCat.run('Cell Block', '셀블록', 'cell-block', 2, 3);

  // Subcategories for Digital Pathology (parent_id = 3)
  insertCat.run('Slide Scanners', '슬라이드 스캐너', 'slide-scanners', 3, 1);
  insertCat.run('Image Analysis', '이미지 분석', 'image-analysis', 3, 2);

  // Types
  const insertType = db.prepare(`
    INSERT INTO types (name_en, name_ko, slug, sort_order) VALUES (?, ?, ?, ?)
  `);
  insertType.run('Instruments', '장비', 'instruments', 1);
  insertType.run('Consumables', '소모품', 'consumables', 2);
  insertType.run('Reagents', '시약', 'reagents', 3);

  // Products
  const insertProd = db.prepare(`
    INSERT INTO products (name_en, name_ko, slug, sku, category_id, type_id, manufacturer_id, description_en, description_ko, features_en, features_ko, is_published, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  // 1. Revos Tissue Processor (Epredia, Histology > Tissue Processing, Instruments)
  insertProd.run(
    'Revos\u2122 Tissue Processor', 'Revos\u2122 자동 조직처리기', 'revos', 'A84100001A',
    7, 1, 1,
    'The Epredia\u2122 Revos\u2122 workflow-enhancing tissue processor overcomes common workflow challenges with reduced processing time and less risk of tissue damage.',
    'Epredia\u2122 Revos\u2122 조직처리기는 처리 시간을 단축하고 조직 손상 위험을 줄이면서 일반적인 워크플로우 문제를 해결합니다.',
    'Canted chamber for enhanced reagent distribution\nIntelligent reagent management with RFID\nDual-filtration and down-draft ventilation\nReduced processing time',
    '기울어진 챔버로 시약 분배 향상\nRFID 기반 지능형 시약 관리\n이중 필터 및 하향식 환기 시스템\n처리 시간 단축',
    1
  );

  // 2. ClearVue Coverslipper (Epredia, Histology > Coverslipping, Instruments)
  insertProd.run(
    'ClearVue\u2122 Coverslipper', 'ClearVue\u2122 커버슬리퍼', 'clearvue', '4568',
    11, 1, 1,
    'Delivering speed and accuracy for the busiest laboratories. Accepts pre-loaded coverslip hoppers to deliver a clean, single coverslip every time.',
    '가장 바쁜 검사실의 커버슬리핑 작업을 빠르고 정확하게 완료합니다.',
    'Compatible with Varistain Gemini ES and DRS2000\nHandles histology and cytology simultaneously\nAutomatic mountant amount recognition',
    'Varistain Gemini ES, DRS2000 호환\n조직 및 세포 검체 동시 처리\n자동 마운턴트 양 인식',
    1
  );

  // 3. PANNORAMIC 250 Flash III (3DHISTECH, Digital Pathology > Slide Scanners, Instruments)
  insertProd.run(
    'PANNORAMIC 250 Flash III', 'PANNORAMIC 250 Flash III', 'pannoramic-250', 'P250-F3',
    15, 1, 2,
    'Award-winning Flash scanning technology \u2014 35 sec/slide, 60 slides/hour, 300-slide capacity with continuous loading.',
    '수상 경력의 Flash 스캐닝 기술 \u2014 슬라이드당 35초, 시간당 60슬라이드, 300슬라이드 용량.',
    '35 sec/slide scanning\n300 slide capacity\nContinuous loading\nBrightfield & fluorescence',
    '슬라이드당 35초 스캔\n300 슬라이드 용량\n연속 로딩\n명시야 및 형광',
    1
  );

  // 4. PANNORAMIC 480 DX (3DHISTECH, Digital Pathology > Slide Scanners, Instruments)
  insertProd.run(
    'PANNORAMIC 480 DX', 'PANNORAMIC 480 DX', 'pannoramic-480', 'P480-DX',
    15, 1, 2,
    'Polarization-powered digital scanner for precision, performance, and workflow efficiency in high-volume clinical environments.',
    '고용량 임상 환경에서 정밀도, 성능 및 워크플로우 효율성을 위한 편광 기반 디지털 스캐너.',
    'Polarization-based scanning\nDX-grade image quality\nHigh throughput\nClinical workflow integration',
    '편광 기반 스캐닝\nDX 등급 이미지 품질\n높은 처리량\n임상 워크플로우 통합',
    1
  );

  // 5. HP35 Disposable Microtome Blades (Epredia, Histology > Microtomy, Consumables)
  insertProd.run(
    'HP35 Disposable Microtome Blades', 'HP35 일회용 마이크로톰 블레이드', 'hp35', '3052835',
    8, 2, 1,
    'Coated for reliable and consistent thin sectioning. High-profile design compatible with standard microtome blade holders.',
    '신뢰할 수 있고 일관된 박절을 위해 코팅. 표준 마이크로톰 블레이드 홀더 호환.',
    'Coated blade surface\nConsistent thin sectioning\nHigh-profile design\nStandard holder compatible',
    '코팅된 블레이드 표면\n일관된 박절\n하이프로파일 디자인\n표준 홀더 호환',
    0
  );

  // 6. Ocus Slide Scanners (Grundium, Digital Pathology > Slide Scanners, Instruments)
  insertProd.run(
    'Ocus\u00ae Slide Scanners', 'Ocus\u00ae 슬라이드 스캐너', 'ocus', 'OCUS-40',
    15, 1, 4,
    'Remote pathology made effortless. Compact, portable microscope slide scanners enabling digital pathology anywhere.',
    '원격 병리를 손쉽게 구현. 소형 휴대용 슬라이드 스캐너로 어디서든 디지털 병리 가능.',
    'Compact and portable\nRemote scanning\nHigh-quality images\nEasy integration',
    '소형 및 휴대용\n원격 스캐닝\n고품질 이미지\n간편한 통합',
    0
  );

  // 7. Genius Digital Cytology (Hologic, Cytology > ThinPrep, Instruments)
  insertProd.run(
    'Genius\u2122 Digital Cytology', 'Genius\u2122 디지털 세포병리', 'genius', 'GEN-DC',
    12, 1, 3,
    'AI-powered digital cytology combining advanced imaging with artificial intelligence for cervical cancer screening.',
    '자궁경부암 선별검사를 위한 첨단 이미징과 AI를 결합한 디지털 세포병리.',
    'AI-powered analysis\nDigital cytology workflow\nThinPrep compatible\nAdvanced imaging',
    'AI 기반 분석\n디지털 세포병리 워크플로우\nThinPrep 호환\n첨단 이미징',
    0
  );

  // 8. HALO Image Analysis Platform (3DHISTECH, Digital Pathology > Image Analysis, Software)
  insertProd.run(
    'HALO\u00ae Image Analysis Platform', 'HALO\u00ae 이미지 분석 플랫폼', 'halo', 'HALO-V4',
    16, 4, 2,
    'Quantitative tissue analysis software for brightfield and fluorescence whole slide images with AI and machine learning tools.',
    'AI 및 머신러닝 도구가 포함된 정량적 조직 분석 소프트웨어.',
    'Quantitative tissue analysis\nAI/ML modules\nMultiplex analysis\nSpatial biology tools',
    '정량적 조직 분석\nAI/ML 모듈\n다중 분석\n공간 생물학 도구',
    0
  );

  // Related products
  const insertRelated = db.prepare('INSERT INTO product_related (product_id, related_id) VALUES (?, ?)');
  insertRelated.run(1, 2); // Revos -> ClearVue
  insertRelated.run(3, 4); // PANNORAMIC 250 -> PANNORAMIC 480
  insertRelated.run(3, 8); // PANNORAMIC 250 -> HALO
  insertRelated.run(4, 3); // PANNORAMIC 480 -> PANNORAMIC 250
  insertRelated.run(7, 6); // Genius -> Ocus

  // Default admin user (password: admin123)
  const hash = bcryptjs.hashSync('admin123', 10);
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);

  // Default settings
  const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('company_name_en', 'Seongkohn Traders Corp.');
  insertSetting.run('company_name_ko', '성곤무역(주)');
  insertSetting.run('company_address_en', '38, Hakdong-ro 50-gil, Gangnam-gu, Seoul 06100, Korea');
  insertSetting.run('company_address_ko', '서울 강남구 학동로 50길 38, 06100');
  insertSetting.run('company_phone', '+82-2-540-3311');
  insertSetting.run('company_fax', '+82-2-540-3312');
  insertSetting.run('company_email', 'labsales@seongkohn.com');
}
