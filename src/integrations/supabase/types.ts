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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          details_json: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details_json?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details_json?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      business_units: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar: {
        Row: {
          created_at: string
          id: string
          month: number
          period_key: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          period_key: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          period_key?: string
          year?: number
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      cost_monitoring: {
        Row: {
          actuals: number
          budget: number
          country: string | null
          department: string
          id: number
          inserted_at: string
          month: string
          updated_at: string
          variance: number | null
          variance_pct: number | null
        }
        Insert: {
          actuals?: number
          budget?: number
          country?: string | null
          department: string
          id?: never
          inserted_at?: string
          month: string
          updated_at?: string
          variance?: number | null
          variance_pct?: number | null
        }
        Update: {
          actuals?: number
          budget?: number
          country?: string | null
          department?: string
          id?: never
          inserted_at?: string
          month?: string
          updated_at?: string
          variance?: number | null
          variance_pct?: number | null
        }
        Relationships: []
      }
      dim_accounts: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          type: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      dim_channels: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      dim_markets: {
        Row: {
          country: string
          created_at: string
          id: string
        }
        Insert: {
          country: string
          created_at?: string
          id?: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      dim_products: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      fact_ledger: {
        Row: {
          account_id: string
          business_unit_id: string
          channel_id: string | null
          company_id: string
          created_at: string
          id: string
          market_id: string
          measure: string
          period_id: string
          product_id: string | null
          scenario: string
          updated_at: string
          value: number
        }
        Insert: {
          account_id: string
          business_unit_id: string
          channel_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          market_id: string
          measure: string
          period_id: string
          product_id?: string | null
          scenario: string
          updated_at?: string
          value?: number
        }
        Update: {
          account_id?: string
          business_unit_id?: string
          channel_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          market_id?: string
          measure?: string
          period_id?: string
          product_id?: string | null
          scenario?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "fact_ledger_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "dim_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ledger_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ledger_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "dim_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ledger_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ledger_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "dim_markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ledger_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "calendar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_ledger_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "dim_products"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_gwp: {
        Row: {
          contracts: number
          country: string
          growth_rate: number | null
          gwp: number
          id: number
          inserted_at: string
          month: string
          updated_at: string
        }
        Insert: {
          contracts?: number
          country: string
          growth_rate?: number | null
          gwp?: number
          id?: never
          inserted_at?: string
          month: string
          updated_at?: string
        }
        Update: {
          contracts?: number
          country?: string
          growth_rate?: number | null
          gwp?: number
          id?: never
          inserted_at?: string
          month?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      report_instances: {
        Row: {
          completed_at: string | null
          configuration: Json
          created_at: string
          download_url: string | null
          generated_by: string | null
          id: string
          status: string
          template_id: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          configuration?: Json
          created_at?: string
          download_url?: string | null
          generated_by?: string | null
          id?: string
          status?: string
          template_id: string
          title: string
        }
        Update: {
          completed_at?: string | null
          configuration?: Json
          created_at?: string
          download_url?: string | null
          generated_by?: string | null
          id?: string
          status?: string
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          download_url: string | null
          id: string
          params_json: Json
          status: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          download_url?: string | null
          id?: string
          params_json: Json
          status: string
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          download_url?: string | null
          id?: string
          params_json?: Json
          status?: string
          title?: string
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          branding_config: Json
          chart_styles: Json
          company_name: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean
          name: string
          slide_layouts: Json
          table_styles: Json
          template_type: string
          updated_at: string
        }
        Insert: {
          branding_config?: Json
          chart_styles?: Json
          company_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          slide_layouts?: Json
          table_styles?: Json
          template_type?: string
          updated_at?: string
        }
        Update: {
          branding_config?: Json
          chart_styles?: Json
          company_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          slide_layouts?: Json
          table_styles?: Json
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      scenario_inputs: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          params_json: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          params_json: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          params_json?: Json
        }
        Relationships: []
      }
      template_assets: {
        Row: {
          asset_name: string
          asset_type: string
          asset_url: string
          created_at: string
          id: string
          template_id: string
        }
        Insert: {
          asset_name: string
          asset_type: string
          asset_url: string
          created_at?: string
          id?: string
          template_id: string
        }
        Update: {
          asset_name?: string
          asset_type?: string
          asset_url?: string
          created_at?: string
          id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_assets_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
