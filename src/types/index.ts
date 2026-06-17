export interface Project {
  id: string | number;
  title: string;
  category: string;
  slug: string;
  image?: string;
  description?: string;
  bgColor?: string;
}

/**
 * Service — model "lleuger" usat als components públics.
 * Manté camps com a string-or-translatable per ser tolerant amb dades
 * antigues. Per al CRUD admin estricte, usar `Service` de @/types/database.
 */
type I18nField = string | { ca?: string; [key: string]: unknown } | null;

export interface Service {
  id: number | string;
  title: I18nField;
  slug: I18nField;
  short_description: I18nField;
  long_description?: I18nField;
  icon_name: string;
  image_url?: string | null;
  order_index?: number | null;
  is_published?: boolean | null;
  price_starts_at?: number | null;
  content_about: I18nField;
  content_steps: I18nField;
  content_deliverables: I18nField;
  content_why_us: I18nField;
  revisions?: I18nField;
  duration?: I18nField;
}
