export interface Category {
  id: number;
  name_en: string;
  name_ko: string;
  slug: string;
  parent_id: number | null;
  sort_order: number;
  created_at: string;
}

export interface Type {
  id: number;
  name_en: string;
  name_ko: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

export interface Brand {
  id: number;
  name_en: string;
  name_ko: string;
  slug: string;
  logo: string | null;
  website: string | null;
  description_en: string | null;
  description_ko: string | null;
  is_featured: number;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: number;
  name_en: string;
  name_ko: string;
  mode: 'simple' | 'variable';
  slug: string;
  sku: string;
  category_id: number | null;
  type_id: number | null;
  brand_id: number | null;
  description_en: string | null;
  description_ko: string | null;
  features_en: string | null;
  features_ko: string | null;
  image: string | null;
  is_published: number;
  detail_en: string | null;
  detail_ko: string | null;
  is_featured: number;
  featured_order: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  category_name_en?: string;
  category_name_ko?: string;
  type_name_en?: string;
  type_name_ko?: string;
  brand_name_en?: string;
  brand_name_ko?: string;
}

export interface Variant {
  id: number;
  product_id: number;
  name_en: string;
  name_ko: string;
  sku: string;
  sort_order: number;
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  type: 'image' | 'video';
  alt_en: string | null;
  alt_ko: string | null;
  variant_id: number | null;
  sort_order: number;
}

export interface ProductSpec {
  id: number;
  product_id: number;
  key_en: string;
  key_ko: string;
  value_en: string;
  value_ko: string;
  sort_order: number;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  product_id: number | null;
  is_read: number;
  created_at: string;
}

export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface HeroSlide {
  id: number;
  title_en: string;
  title_ko: string;
  subtitle_en: string | null;
  subtitle_ko: string | null;
  image: string | null;
  link_url: string | null;
  text_color: 'light' | 'dark';
  text_align: 'left' | 'right';
  is_active: number;
  sort_order: number;
  created_at: string;
}
