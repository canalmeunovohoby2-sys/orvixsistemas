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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          id: string
          is_temporary_password: boolean
          name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          id: string
          is_temporary_password?: boolean
          name?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          id?: string
          is_temporary_password?: boolean
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string
          created_at: string
          due_date: string | null
          fantasia: string
          id: string
          is_demo: boolean
          mrr: number
          onboarding_pending: boolean
          phone: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          razao_social: string
          segment: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          cnpj?: string
          created_at?: string
          due_date?: string | null
          fantasia: string
          id: string
          is_demo?: boolean
          mrr?: number
          onboarding_pending?: boolean
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          razao_social: string
          segment?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          due_date?: string | null
          fantasia?: string
          id?: string
          is_demo?: boolean
          mrr?: number
          onboarding_pending?: boolean
          phone?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          razao_social?: string
          segment?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          city: string
          company_id: string
          created_at: string
          credit_limit: number
          current_debt: number
          doc: string
          email: string
          id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          city?: string
          company_id: string
          created_at?: string
          credit_limit?: number
          current_debt?: number
          doc?: string
          email?: string
          id?: string
          name: string
          phone?: string
          updated_at?: string
        }
        Update: {
          city?: string
          company_id?: string
          created_at?: string
          credit_limit?: number
          current_debt?: number
          doc?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      global_products: {
        Row: {
          brand: string
          category: string
          created_at: string
          ean: string
          image_url: string | null
          name: string
          unit: string
          updated_at: string
        }
        Insert: {
          brand?: string
          category?: string
          created_at?: string
          ean: string
          image_url?: string | null
          name: string
          unit?: string
          updated_at?: string
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string
          ean?: string
          image_url?: string | null
          name?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          created_at: string
          date: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          color: string
          created_at: string
          description: string
          frequency: Json
          id: string
          name: string
          position: number
          reminder_time: string | null
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          frequency?: Json
          id?: string
          name: string
          position?: number
          reminder_time?: string | null
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          frequency?: Json
          id?: string
          name?: string
          position?: number
          reminder_time?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          company_id: string
          cost_amount: number
          created_at: string
          crediario: boolean
          customer_id: string | null
          customer_name: string | null
          id: string
          installments: number | null
          items: Json
          items_count: number
          local_id: string | null
          occurred_at: string
          payment_method: string | null
          total_amount: number
          updated_at: string
          user_email: string | null
        }
        Insert: {
          company_id: string
          cost_amount?: number
          created_at?: string
          crediario?: boolean
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          installments?: number | null
          items?: Json
          items_count?: number
          local_id?: string | null
          occurred_at?: string
          payment_method?: string | null
          total_amount: number
          updated_at?: string
          user_email?: string | null
        }
        Update: {
          company_id?: string
          cost_amount?: number
          created_at?: string
          crediario?: boolean
          customer_id?: string | null
          customer_name?: string | null
          id?: string
          installments?: number | null
          items?: Json
          items_count?: number
          local_id?: string | null
          occurred_at?: string
          payment_method?: string | null
          total_amount?: number
          updated_at?: string
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          company_id: string
          company_name: string
          created_at: string
          id: string
          message: string
          priority: string
          requester_name: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          company_name: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          requester_name: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          company_name?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          requester_name?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_accounts: {
        Row: {
          contacted_at: string | null
          created_at: string
          email: string
          id: string
          is_trial: boolean
          last_seen_at: string
          trial_start_date: string
          updated_at: string
        }
        Insert: {
          contacted_at?: string | null
          created_at?: string
          email: string
          id?: string
          is_trial?: boolean
          last_seen_at?: string
          trial_start_date?: string
          updated_at?: string
        }
        Update: {
          contacted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          is_trial?: boolean
          last_seen_at?: string
          trial_start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_super_admin: { Args: { _uid: string }; Returns: boolean }
      next_company_id: { Args: never; Returns: string }
      trial_server_now: {
        Args: never
        Returns: {
          now: string
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "cashier"
      plan_tier: "bronze" | "prata" | "ouro"
      subscription_status:
        | "trial"
        | "active"
        | "pending"
        | "blocked"
        | "canceled"
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
    Enums: {
      app_role: ["super_admin", "admin", "cashier"],
      plan_tier: ["bronze", "prata", "ouro"],
      subscription_status: [
        "trial",
        "active",
        "pending",
        "blocked",
        "canceled",
      ],
    },
  },
} as const
