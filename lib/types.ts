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

export interface Manufacturer {
  id: number;
  name_en: string;
  name_ko: string;
  slug: string;
  logo: string | null;
  website: string | null;
  description_en: string | null;
  description_ko: string | null;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: number;
  name_en: string;
  name_ko: string;
  slug: string;
  sku: string;
  category_id: number | null;
  type_id: number | null;
  manufacturer_id: number | null;
  description_en: string | null;
  description_ko: string | null;
  features_en: string | null;
  features_ko: string | null;
  image: string | null;
  is_published: number;
  is_featured: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  category_name_en?: string;
  category_name_ko?: string;
  type_name_en?: string;
  type_name_ko?: string;
  manufacturer_name_en?: string;
  manufacturer_name_ko?: string;
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
