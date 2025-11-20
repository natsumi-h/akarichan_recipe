export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ingredient_synonyms: {
        Row: {
          created_at: string | null
          id: number
          ingredient_id: number
          synonym_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          ingredient_id: number
          synonym_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          ingredient_id?: number
          synonym_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_ingredient_synonyms_ingredient"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ingredient_synonyms_synonym"
            columns: ["synonym_id"]
            isOneToOne: false
            referencedRelation: "synonyms"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          canonical_name: string
          group_name: string
          id: number
          normalized_name: string
        }
        Insert: {
          canonical_name: string
          group_name: string
          id?: number
          normalized_name: string
        }
        Update: {
          canonical_name?: string
          group_name?: string
          id?: number
          normalized_name?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          amount: string | null
          id: number
          ingredient_id: number | null
          note: string | null
          original_name: string
          recipe_id: number
        }
        Insert: {
          amount?: string | null
          id?: number
          ingredient_id?: number | null
          note?: string | null
          original_name: string
          recipe_id: number
        }
        Update: {
          amount?: string | null
          id?: number
          ingredient_id?: number | null
          note?: string | null
          original_name?: string
          recipe_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_recipe_ingredients_ingredient"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_recipe_ingredients_recipe"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_tags: {
        Row: {
          id: number
          recipe_id: number
          tag_id: number
        }
        Insert: {
          id?: number
          recipe_id: number
          tag_id: number
        }
        Update: {
          id?: number
          recipe_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_recipe_tags_recipe"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_recipe_tags_tag"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: number
          source_image_url: string | null
          steps_text: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: number
          source_image_url?: string | null
          steps_text?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: number
          source_image_url?: string | null
          steps_text?: string | null
          title?: string
        }
        Relationships: []
      }
      synonyms: {
        Row: {
          created_at: string | null
          id: number
          synonym: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          synonym: string
        }
        Update: {
          created_at?: string | null
          id?: number
          synonym?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          description: string | null
          id: number
          name: string
          normalized_name: string
          sort_order: number
        }
        Insert: {
          description?: string | null
          id?: number
          name: string
          normalized_name: string
          sort_order?: number
        }
        Update: {
          description?: string | null
          id?: number
          name?: string
          normalized_name?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_recipes_with_synonyms: {
        Args: {
          search_query: string
        }
        Returns: {
          id: number
          title: string
          description: string
          category: string
          created_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

