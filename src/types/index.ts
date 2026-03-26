export interface Project {
  id: number;
  title: string;
  category: string;
  slug: string;
  image?: string;
  description?: string;
}

export interface Service {
  id: number;
  title: string;
  description: string;
}
