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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          cached_tokens: number | null
          clinic_id: string
          conversation_id: string | null
          cost_usd: number | null
          created_at: string
          error: string | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model: string | null
          outcome: string | null
          output_tokens: number | null
          provider: string | null
          steps: number | null
          tools_called: string[]
        }
        Insert: {
          cached_tokens?: number | null
          clinic_id: string
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          outcome?: string | null
          output_tokens?: number | null
          provider?: string | null
          steps?: number | null
          tools_called?: string[]
        }
        Update: {
          cached_tokens?: number | null
          clinic_id?: string
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string
          error?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          outcome?: string | null
          output_tokens?: number | null
          provider?: string | null
          steps?: number | null
          tools_called?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          clinic_id: string
          contact_id: string
          created_at: string
          ends_at: string
          google_event_id: string | null
          id: string
          lead_id: string | null
          notes: string | null
          patient_name: string | null
          professional_id: string
          reminder_sent_at: string | null
          source: string
          starts_at: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          contact_id: string
          created_at?: string
          ends_at: string
          google_event_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          patient_name?: string | null
          professional_id: string
          reminder_sent_at?: string | null
          source?: string
          starts_at: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          contact_id?: string
          created_at?: string
          ends_at?: string
          google_event_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          patient_name?: string | null
          professional_id?: string
          reminder_sent_at?: string | null
          source?: string
          starts_at?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_blocks: {
        Row: {
          clinic_id: string
          ends_at: string
          id: string
          professional_id: string | null
          reason: string | null
          starts_at: string
        }
        Insert: {
          clinic_id: string
          ends_at: string
          id?: string
          professional_id?: string | null
          reason?: string | null
          starts_at: string
        }
        Update: {
          clinic_id?: string
          ends_at?: string
          id?: string
          professional_id?: string | null
          reason?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_blocks_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          active: boolean
          appointment_type: string
          clinic_id: string
          end_time: string
          id: string
          professional_id: string
          slot_minutes: number
          start_time: string
          weekday: number
        }
        Insert: {
          active?: boolean
          appointment_type?: string
          clinic_id: string
          end_time: string
          id?: string
          professional_id: string
          slot_minutes?: number
          start_time: string
          weekday: number
        }
        Update: {
          active?: boolean
          appointment_type?: string
          clinic_id?: string
          end_time?: string
          id?: string
          professional_id?: string
          slot_minutes?: number
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_rules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_members: {
        Row: {
          clinic_id: string
          created_at: string
          name: string | null
          role: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          name?: string | null
          role: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          name?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinic_members_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          profile: Json
          settings: Json
          slug: string
          timezone: string
          updated_at: string
          wa_access_token: string | null
          wa_display_phone: string | null
          wa_phone_number_id: string | null
          wa_waba_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          profile?: Json
          settings?: Json
          slug: string
          timezone?: string
          updated_at?: string
          wa_access_token?: string | null
          wa_display_phone?: string | null
          wa_phone_number_id?: string | null
          wa_waba_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          profile?: Json
          settings?: Json
          slug?: string
          timezone?: string
          updated_at?: string
          wa_access_token?: string | null
          wa_display_phone?: string | null
          wa_phone_number_id?: string | null
          wa_waba_id?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          clinic_id: string
          first_seen_at: string
          id: string
          last_seen_at: string
          name: string | null
          opted_out: boolean
          referral: Json | null
          source: string
          wa_id: string
        }
        Insert: {
          clinic_id: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          name?: string | null
          opted_out?: boolean
          referral?: Json | null
          source?: string
          wa_id: string
        }
        Update: {
          clinic_id?: string
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          name?: string | null
          opted_out?: boolean
          referral?: Json | null
          source?: string
          wa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_to: string | null
          clinic_id: string
          contact_id: string
          created_at: string
          handoff_reason: string | null
          id: string
          last_inbound_at: string | null
          last_message_at: string | null
          last_outbound_at: string | null
          status: string
          summary: string | null
          updated_at: string
          window_expires_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          clinic_id: string
          contact_id: string
          created_at?: string
          handoff_reason?: string | null
          id?: string
          last_inbound_at?: string | null
          last_message_at?: string | null
          last_outbound_at?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
          window_expires_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          clinic_id?: string
          contact_id?: string
          created_at?: string
          handoff_reason?: string | null
          id?: string
          last_inbound_at?: string | null
          last_message_at?: string | null
          last_outbound_at?: string | null
          status?: string
          summary?: string | null
          updated_at?: string
          window_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          active: boolean
          answer: string
          clinic_id: string
          created_at: string
          id: string
          question: string
          tags: string[]
        }
        Insert: {
          active?: boolean
          answer: string
          clinic_id: string
          created_at?: string
          id?: string
          question: string
          tags?: string[]
        }
        Update: {
          active?: boolean
          answer?: string
          clinic_id?: string
          created_at?: string
          id?: string
          question?: string
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "faqs_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          clinic_id: string
          conversation_id: string
          created_at: string
          error: string | null
          id: string
          lead_id: string
          mode: string
          scheduled_for: string
          sent_message_id: string | null
          status: string
          step: number
          template_name: string | null
        }
        Insert: {
          clinic_id: string
          conversation_id: string
          created_at?: string
          error?: string | null
          id?: string
          lead_id: string
          mode: string
          scheduled_for: string
          sent_message_id?: string | null
          status?: string
          step: number
          template_name?: string | null
        }
        Update: {
          clinic_id?: string
          conversation_id?: string
          created_at?: string
          error?: string | null
          id?: string
          lead_id?: string
          mode?: string
          scheduled_for?: string
          sent_message_id?: string | null
          status?: string
          step?: number
          template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_sent_message_id_fkey"
            columns: ["sent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      insurances: {
        Row: {
          accepted: boolean
          clinic_id: string
          created_at: string
          id: string
          name: string
          notes: string | null
          plans: string[]
        }
        Insert: {
          accepted?: boolean
          clinic_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          plans?: string[]
        }
        Update: {
          accepted?: boolean
          clinic_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          plans?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "insurances_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_events: {
        Row: {
          actor: string
          clinic_id: string
          created_at: string
          from_status: string | null
          id: string
          lead_id: string
          payload: Json | null
          to_status: string | null
          type: string
        }
        Insert: {
          actor: string
          clinic_id: string
          created_at?: string
          from_status?: string | null
          id?: string
          lead_id: string
          payload?: Json | null
          to_status?: string | null
          type: string
        }
        Update: {
          actor?: string
          clinic_id?: string
          created_at?: string
          from_status?: string | null
          id?: string
          lead_id?: string
          payload?: Json | null
          to_status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          clinic_id: string
          contact_id: string
          conversation_id: string | null
          created_at: string
          follow_up_count: number
          id: string
          insurance_name: string | null
          last_status_change_at: string
          lost_reason: string | null
          next_follow_up_at: string | null
          notes: string | null
          service_id: string | null
          service_interest: string | null
          source: string | null
          status: string
          updated_at: string
          urgency: string | null
        }
        Insert: {
          clinic_id: string
          contact_id: string
          conversation_id?: string | null
          created_at?: string
          follow_up_count?: number
          id?: string
          insurance_name?: string | null
          last_status_change_at?: string
          lost_reason?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          service_id?: string | null
          service_interest?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          clinic_id?: string
          contact_id?: string
          conversation_id?: string | null
          created_at?: string
          follow_up_count?: number
          id?: string
          insurance_name?: string | null
          last_status_change_at?: string
          lost_reason?: string | null
          next_follow_up_at?: string | null
          notes?: string | null
          service_id?: string | null
          service_interest?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          clinic_id: string
          conversation_id: string
          created_at: string
          direction: string
          error: Json | null
          id: string
          media: Json | null
          sender: string
          status: string
          transcript: string | null
          type: string
          wa_message_id: string | null
        }
        Insert: {
          body?: string | null
          clinic_id: string
          conversation_id: string
          created_at?: string
          direction: string
          error?: Json | null
          id?: string
          media?: Json | null
          sender: string
          status?: string
          transcript?: string | null
          type?: string
          wa_message_id?: string | null
        }
        Update: {
          body?: string | null
          clinic_id?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          error?: Json | null
          id?: string
          media?: Json | null
          sender?: string
          status?: string
          transcript?: string | null
          type?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean
          bio: string | null
          clinic_id: string
          color: string | null
          created_at: string
          id: string
          name: string
          specialty: string | null
        }
        Insert: {
          active?: boolean
          bio?: string | null
          clinic_id: string
          color?: string | null
          created_at?: string
          id?: string
          name: string
          specialty?: string | null
        }
        Update: {
          active?: boolean
          bio?: string | null
          clinic_id?: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          specialty?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          category: string | null
          clinic_id: string
          created_at: string
          description: string | null
          id: string
          keywords: string[]
          name: string
          price_from: number | null
          price_note: string | null
          price_policy: string | null
          price_to: number | null
          requires_evaluation: boolean
          sort_order: number
        }
        Insert: {
          active?: boolean
          category?: string | null
          clinic_id: string
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string[]
          name: string
          price_from?: number | null
          price_note?: string | null
          price_policy?: string | null
          price_to?: number | null
          requires_evaluation?: boolean
          sort_order?: number
        }
        Update: {
          active?: boolean
          category?: string | null
          clinic_id?: string
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string[]
          name?: string
          price_from?: number | null
          price_note?: string | null
          price_policy?: string | null
          price_to?: number | null
          requires_evaluation?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          body: string
          category: string
          clinic_id: string
          created_at: string
          id: string
          language: string
          meta_template_id: string | null
          name: string
          status: string
        }
        Insert: {
          body: string
          category: string
          clinic_id: string
          created_at?: string
          id?: string
          language?: string
          meta_template_id?: string | null
          name: string
          status?: string
        }
        Update: {
          body?: string
          category?: string
          clinic_id?: string
          created_at?: string
          id?: string
          language?: string
          meta_template_id?: string | null
          name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          clinic_id: string | null
          error: string | null
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          received_at: string
        }
        Insert: {
          clinic_id?: string | null
          error?: string | null
          id?: string
          payload: Json
          processed_at?: string | null
          provider?: string
          received_at?: string
        }
        Update: {
          clinic_id?: string | null
          error?: string | null
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          received_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_clinic_daily_metrics: {
        Row: {
          calificados: number | null
          clinic_id: string | null
          consultas: number | null
          day: string | null
          derivados: number | null
          en_seguimiento: number | null
          recuperados: number | null
          turnos: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_clinic_ids: { Args: never; Returns: string[] }
      book_appointment: {
        Args: {
          p_clinic_id: string
          p_contact_id: string
          p_lead_id: string
          p_minutes: number
          p_patient_name: string
          p_professional_id: string
          p_source?: string
          p_starts_at: string
        }
        Returns: {
          clinic_id: string
          contact_id: string
          created_at: string
          ends_at: string
          google_event_id: string | null
          id: string
          lead_id: string | null
          notes: string | null
          patient_name: string | null
          professional_id: string
          reminder_sent_at: string | null
          source: string
          starts_at: string
          status: string
          type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "appointments"
          isOneToOne: true
          isSetofReturn: false
        }
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
