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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      option: {
        Row: {
          created_at: string
          id: string
          position: number
          question_id: string
          score: number | null
          tags: string[]
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          question_id: string
          score?: number | null
          tags?: string[]
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          question_id?: string
          score?: number | null
          tags?: string[]
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "option_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question"
            referencedColumns: ["id"]
          },
        ]
      }
      question: {
        Row: {
          created_at: string
          id: string
          position: number
          quiz_id: string
          text: string
          type: Database["public"]["Enums"]["question_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          quiz_id: string
          text: string
          type: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          quiz_id?: string
          text?: string
          type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz"
            referencedColumns: ["id"]
          },
        ]
      }
      questions_answered: {
        Row: {
          answered_at: string
          created_at: string
          id: string
          numeric_answer: number | null
          option_chosen_id: string | null
          question_id: string
          selected_option_ids: string[] | null
          session_id: string
          updated_at: string
        }
        Insert: {
          answered_at?: string
          created_at?: string
          id?: string
          numeric_answer?: number | null
          option_chosen_id?: string | null
          question_id: string
          selected_option_ids?: string[] | null
          session_id: string
          updated_at?: string
        }
        Update: {
          answered_at?: string
          created_at?: string
          id?: string
          numeric_answer?: number | null
          option_chosen_id?: string | null
          question_id?: string
          selected_option_ids?: string[] | null
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_answered_option_chosen_id_fkey"
            columns: ["option_chosen_id"]
            isOneToOne: false
            referencedRelation: "option"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_answered_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_answered_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_answered_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_outcome"
            referencedColumns: ["session_id"]
          },
        ]
      }
      quiz: {
        Row: {
          created_at: string
          description: string
          id: string
          title: string
          type: Database["public"]["Enums"]["quiz_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          title: string
          type: Database["public"]["Enums"]["quiz_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          title?: string
          type?: Database["public"]["Enums"]["quiz_type"]
          updated_at?: string
        }
        Relationships: []
      }
      result: {
        Row: {
          created_at: string
          cta_text: string
          cta_url: string
          description: string
          id: string
          quiz_id: string
          range_hi: number
          range_lo: number
          title_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_text?: string
          cta_url?: string
          description?: string
          id?: string
          quiz_id: string
          range_hi: number
          range_lo: number
          title_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_text?: string
          cta_url?: string
          description?: string
          id?: string
          quiz_id?: string
          range_hi?: number
          range_lo?: number
          title_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "result_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz"
            referencedColumns: ["id"]
          },
        ]
      }
      result_screen_clicked: {
        Row: {
          created_at: string
          id: string
          result_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          result_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          result_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "result_screen_clicked_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "result"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_screen_clicked_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_screen_clicked_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_outcome"
            referencedColumns: ["session_id"]
          },
        ]
      }
      session: {
        Row: {
          browser: string | null
          created_at: string
          device: string | null
          end_time: string | null
          id: string
          quiz_id: string
          referrer: string | null
          start_time: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device?: string | null
          end_time?: string | null
          id?: string
          quiz_id: string
          referrer?: string | null
          start_time?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          browser?: string | null
          created_at?: string
          device?: string | null
          end_time?: string | null
          id?: string
          quiz_id?: string
          referrer?: string | null
          start_time?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      session_outcome: {
        Row: {
          end_time: string | null
          quiz_id: string | null
          session_id: string | null
          start_time: string | null
          tag_counts: Json | null
          total_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_quiz_diff: { Args: { p_quiz: Json }; Returns: string }
    }
    Enums: {
      question_type: "multiple_choice" | "select_multiple" | "slider"
      quiz_type: "score" | "card" | "tag"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      question_type: ["multiple_choice", "select_multiple", "slider"],
      quiz_type: ["score", "card", "tag"],
    },
  },
} as const
