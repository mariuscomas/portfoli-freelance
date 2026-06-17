export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      client_notes: {
        Row: {
          body: string
          client_id: string
          created_at: string
          id: string
        }
        Insert: {
          body: string
          client_id: string
          created_at?: string
          id?: string
        }
        Update: {
          body?: string
          client_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          is_spam: boolean
          message: string
          name: string | null
          source: string | null
          status: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_spam?: boolean
          message: string
          name?: string | null
          source?: string | null
          status?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_spam?: boolean
          message?: string
          name?: string | null
          source?: string | null
          status?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          content_about: Json | null
          content_deliverables: Json | null
          content_steps: Json | null
          content_why_us: Json | null
          created_at: string | null
          duration: Json | null
          icon_name: string
          id: string
          image_url: string | null
          is_published: boolean | null
          order_index: number | null
          payment_milestones: Json | null
          price_starts_at: number | null
          revisions: Json | null
          short_description: Json | null
          slug: Json
          title: Json
          updated_at: string
        }
        Insert: {
          content_about?: Json | null
          content_deliverables?: Json | null
          content_steps?: Json | null
          content_why_us?: Json | null
          created_at?: string | null
          duration?: Json | null
          icon_name: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          order_index?: number | null
          payment_milestones?: Json | null
          price_starts_at?: number | null
          revisions?: Json | null
          short_description?: Json | null
          slug: Json
          title: Json
          updated_at?: string
        }
        Update: {
          content_about?: Json | null
          content_deliverables?: Json | null
          content_steps?: Json | null
          content_why_us?: Json | null
          created_at?: string | null
          duration?: Json | null
          icon_name?: string
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          order_index?: number | null
          payment_milestones?: Json | null
          price_starts_at?: number | null
          revisions?: Json | null
          short_description?: Json | null
          slug?: Json
          title?: Json
          updated_at?: string
        }
        Relationships: []
      }
      work_roles: {
        Row: {
          id: string
          name: Json
          color: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: Json
          color?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: Json
          color?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      work_categories: {
        Row: {
          id: string
          name: Json
          color: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: Json
          color?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: Json
          color?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      works: {
        Row: {
          accent_color: string | null
          category: Json | null
          category_id: string | null
          client_id: string | null
          client_name: Json | null
          conclusion: Json | null
          content: Json | null
          created_at: string | null
          gallery_urls: Json | null
          hero_color: string | null
          id: string
          is_featured: boolean | null
          is_indexable: boolean
          is_published: boolean | null
          main_image_alt: string | null
          main_image_url: string | null
          meta_description: Json | null
          meta_title: Json | null
          og_image_url: string | null
          order_index: number | null
          role: Json | null
          role_id: string | null
          short_description: Json | null
          slug: Json
          title: Json
          updated_at: string
          year: string | null
        }
        Insert: {
          accent_color?: string | null
          category?: Json | null
          category_id?: string | null
          client_id?: string | null
          client_name?: Json | null
          conclusion?: Json | null
          content?: Json | null
          created_at?: string | null
          gallery_urls?: Json | null
          hero_color?: string | null
          id?: string
          is_featured?: boolean | null
          is_indexable?: boolean
          is_published?: boolean | null
          main_image_alt?: string | null
          main_image_url?: string | null
          meta_description?: Json | null
          meta_title?: Json | null
          og_image_url?: string | null
          order_index?: number | null
          role?: Json | null
          role_id?: string | null
          short_description?: Json | null
          slug: Json
          title: Json
          updated_at?: string
          year?: string | null
        }
        Update: {
          accent_color?: string | null
          category?: Json | null
          category_id?: string | null
          client_id?: string | null
          client_name?: Json | null
          conclusion?: Json | null
          content?: Json | null
          created_at?: string | null
          gallery_urls?: Json | null
          hero_color?: string | null
          id?: string
          is_featured?: boolean | null
          is_indexable?: boolean
          is_published?: boolean | null
          main_image_alt?: string | null
          main_image_url?: string | null
          meta_description?: Json | null
          meta_title?: Json | null
          og_image_url?: string | null
          order_index?: number | null
          role?: Json | null
          role_id?: string | null
          short_description?: Json | null
          slug?: Json
          title?: Json
          updated_at?: string
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "works_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

/* ------------------------------------------------------------------ */
/*  Hand-rolled aliases used by the app — derived from generated types */
/*  to keep React components decoupled from the verbose Tables<>       */
/*  helper.                                                            */
/* ------------------------------------------------------------------ */

/** Shape canonical d'un valor i18n a totes les Json columns. */
export type Translatable = { ca?: string; en?: string; es?: string }

export type Work = Tables<"works">
export type WorkInsert = TablesInsert<"works">
export type WorkUpdate = TablesUpdate<"works">

export type WorkRole = Tables<"work_roles">
export type WorkRoleInsert = TablesInsert<"work_roles">
export type WorkRoleUpdate = TablesUpdate<"work_roles">

export type WorkCategory = Tables<"work_categories">
export type WorkCategoryInsert = TablesInsert<"work_categories">
export type WorkCategoryUpdate = TablesUpdate<"work_categories">

export type Service = Tables<"services">
export type ServiceInsert = TablesInsert<"services">
export type ServiceUpdate = TablesUpdate<"services">

export type Client = Tables<"clients">
export type ClientInsert = TablesInsert<"clients">
export type ClientUpdate = TablesUpdate<"clients">

export type ClientNote = Tables<"client_notes">

export type ContactSubmission = Tables<"contact_submissions">
export type ContactSubmissionInsert = TablesInsert<"contact_submissions">

/* ------------------------------------------------------------------ */
/*  Client status — enum-like — usat al CRM admin                       */
/* ------------------------------------------------------------------ */

export const CLIENT_STATUSES = [
  'new',
  'contacted',
  'proposal',
  'client',
  'lost',
] as const
export type ClientStatus = (typeof CLIENT_STATUSES)[number]

type ClientStatusMeta = {
  label: string
  description: string
  tone: 'info' | 'neutral' | 'warning' | 'success' | 'error'
}

export const CLIENT_STATUS_META: Record<ClientStatus, ClientStatusMeta> = {
  new: {
    label: 'Nou',
    description: 'Contacte inicial encara sense activitat.',
    tone: 'info',
  },
  contacted: {
    label: 'Contactat',
    description: 'Hi ha hagut conversa inicial.',
    tone: 'info',
  },
  proposal: {
    label: 'Proposta enviada',
    description: 'Pendent de resposta a una proposta concreta.',
    tone: 'warning',
  },
  client: {
    label: 'Client',
    description: 'Projecte actiu o ja contractat.',
    tone: 'success',
  },
  lost: {
    label: 'Perdut',
    description: 'No s\'ha materialitzat (descartat per client o per nosaltres).',
    tone: 'error',
  },
}

/* ------------------------------------------------------------------ */
/*  Client source — origen de captació                                  */
/* ------------------------------------------------------------------ */

export const CLIENT_SOURCES = [
  'referral',
  'linkedin',
  'malt',
  'web',
  'other',
] as const
export type ClientSource = (typeof CLIENT_SOURCES)[number]

export const CLIENT_SOURCE_LABELS: Record<ClientSource, string> = {
  referral: 'Referit',
  linkedin: 'LinkedIn',
  malt: 'Malt',
  web: 'Web',
  other: 'Altre',
}
