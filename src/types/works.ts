export interface WorkMedia {
  id: string;
  url: string;
  type?: 'image' | 'video'; // In case we support videos
  alt?: string;
}

export interface WorkTextSection {
  id: string;
  number: string; // e.g. "01"
  title: string;  // e.g. "El Repte", "El que vam fer"
  heading: string; // Right column big text
  description: string;
  listType?: 'characteristics' | 'what-we-did' | 'none';
  listItems?: string[]; // Array of strings for the list
  listDetails?: { label: string; value: string }[]; // For UI/UX Design -> Type structure
}

export interface WorkBlock {
  id: string;
  textSection: WorkTextSection;
  media: WorkMedia[]; // Grid can be 1 to 4 images/videos, length dictates grid type
}

export interface WorkNextProject {
  title: string;
  slug: string;
}

export interface WorkDetailData {
  id: string;
  slug: string;
  hero: {
    title: string;
    description: string;
    /**
     * Mode de fons del hero. Per defecte 'color' per retrocompatibilitat amb
     * works existents que només tenien `backgroundColor`.
     */
    backgroundMode?: 'color' | 'image';
    backgroundColor: string; // e.g., "#5C7894"
    /** URL de la imatge de fons quan backgroundMode === 'image'. */
    backgroundImage?: string;
    /** Overlay fosc sobre la imatge (0–80). Per defecte 0. */
    overlayOpacity?: number;
    /**
     * Color del text del hero (títol + descripció + bottom content). Per
     * defecte 'light' — perquè la majoria de works tenen fons foscos o
     * imatges. Canvia a 'dark' si tries un color de fons clar.
     */
    textColor?: 'light' | 'dark';
  };
  blocks: WorkBlock[];
  conclusion?: string;
  finalMedia?: WorkMedia[];
  nextProject: WorkNextProject;
}
