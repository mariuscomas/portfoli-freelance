export interface WorkMedia {
  id: string;
  url: string;
  type?: 'image' | 'video'; // In case we support videos
  alt?: string;
  /**
   * Dimensions nadiues del fitxer pujat, en píxels. Les fa servir
   * WorkMediaGrid per donar a la cel·la l'aspect ratio de la pròpia imatge
   * (com al Figma, on la casella fa 828 d'ample i l'alçada la marca el
   * contingut) i així evitar qualsevol crop. Opcionals: les imatges pujades
   * abans que existís aquest camp cauen al fallback height:auto.
   */
  width?: number;
  height?: number;
}

export interface WorkTextSection {
  id: string;
  number: string; // e.g. "01"
  title: string;  // e.g. "El Repte", "El que vam fer"
  heading: string; // Right column big text
  description: string;
  listType?: 'characteristics' | 'what-we-did' | 'none';
  listItems?: string[]; // Array of strings for the list
  /**
   * Files de la taula "Details" (bloc 01). `href` és opcional: quan hi és, el
   * valor es mostra com a enllaç amb aquest destí (p. ex. "App Store" →
   * apps.apple.com). Sense `href`, un valor que sembli una adreça web
   * s'enllaça igualment de forma automàtica.
   */
  listDetails?: { label: string; value: string; href?: string }[];
}

/**
 * Disposició del media d'un bloc a la vista Visual. Es tria a l'editor:
 * · 'auto' (per defecte) — la graella es dedueix del recompte d'imatges.
 * · 'row' — força la graella de dues columnes a partir de `md:`.
 * · 'column' — apila les imatges a amplada completa i respecta el ratio
 *   natiu de cadascuna, sense retall. Pensat per a captures apaïsades.
 */
export type WorkMediaLayout = 'auto' | 'row' | 'column';

export interface WorkBlock {
  id: string;
  textSection: WorkTextSection;
  media: WorkMedia[]; // Grid can be 1 to 4 images/videos, length dictates grid type
  /** Disposició del media. Absent = 'auto' (retrocompatible). */
  mediaLayout?: WorkMediaLayout;
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
