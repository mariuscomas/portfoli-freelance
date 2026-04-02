export interface Project {
  id: string | number;
  title: string;
  category: string;
  slug: string;
  image?: string;
  description?: string;
  bgColor?: string;
}

export interface Service {
  id: number;
  title: string | { ca?: string;[key: string]: unknown };
  short_description: string | { ca?: string;[key: string]: unknown };
  long_description?: string | { ca?: string;[key: string]: unknown };
  icon_name: string;
  image_url?: string;
  order_index: number;
  is_published: boolean;
  price_starts_at?: number;
  content_about: string | { ca?: string;[key: string]: unknown };
  content_steps: string | { ca?: string;[key: string]: unknown };
  content_deliverables: string | { ca?: string;[key: string]: unknown };
  content_why_us: string | { ca?: string;[key: string]: unknown };
  revisions?: string | { ca?: string;[key: string]: unknown };
  duration?: string | { ca?: string;[key: string]: unknown };
}
