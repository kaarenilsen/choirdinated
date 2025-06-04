// Generated database types from Supabase
// This file is auto-generated - do not edit manually
// Run `npm run sync-types` to update
// Generated at: 2025-06-04T07:02:26.674Z

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance_expectations: {
        Row: {
          calculated_at: string | null
          event_id: string | null
          expected_total: number
          id: string
          on_leave_count: number
          voice_group_breakdown: Json
        }
        Insert: {
          calculated_at?: string | null
          event_id?: string | null
          expected_total: number
          id?: string
          on_leave_count: number
          voice_group_breakdown: Json
        }
        Update: {
          calculated_at?: string | null
          event_id?: string | null
          expected_total?: number
          id?: string
          on_leave_count?: number
          voice_group_breakdown?: Json
        }
        Relationships: [
          {
            foreignKeyName: "attendance_expectations_event_id_events_id_fk"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_files: {
        Row: {
          duration_seconds: number
          file_size_bytes: number
          file_url: string
          id: string
          sheet_music_id: string
          title: string
          uploaded_at: string | null
          uploaded_by: string
          voice_group_id: string | null
          voice_type_id: string | null
        }
        Insert: {
          duration_seconds: number
          file_size_bytes: number
          file_url: string
          id?: string
          sheet_music_id: string
          title: string
          uploaded_at?: string | null
          uploaded_by: string
          voice_group_id?: string | null
          voice_type_id?: string | null
        }
        Update: {
          duration_seconds?: number
          file_size_bytes?: number
          file_url?: string
          id?: string
          sheet_music_id?: string
          title?: string
          uploaded_at?: string | null
          uploaded_by?: string
          voice_group_id?: string | null
          voice_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_files_sheet_music_id_sheet_music_id_fk"
            columns: ["sheet_music_id"]
            isOneToOne: false
            referencedRelation: "sheet_music"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_files_uploaded_by_user_profiles_id_fk"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_files_voice_group_id_list_of_values_id_fk"
            columns: ["voice_group_id"]
            isOneToOne: false
            referencedRelation: "list_of_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_files_voice_type_id_list_of_values_id_fk"
            columns: ["voice_type_id"]
            isOneToOne: false
            referencedRelation: "list_of_values"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_active: boolean | null
          membership_type_ids: Json | null
          name: string | null
          type: string
          voice_group_id: string | null
          voice_type_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_active?: boolean | null
          membership_type_ids?: Json | null
          name?: string | null
          type: string
          voice_group_id?: string | null
          voice_type_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_active?: boolean | null
          membership_type_ids?: Json | null
          name?: string | null
          type?: string
          voice_group_id?: string | null
          voice_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_created_by_user_profiles_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_voice_group_id_list_of_values_id_fk"
            columns: ["voice_group_id"]
            isOneToOne: false
            referencedRelation: "list_of_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chats_voice_type_id_list_of_values_id_fk"
            columns: ["voice_type_id"]
            isOneToOne: false
            referencedRelation: "list_of_values"
            referencedColumns: ["id"]
          },
        ]
      }
      choirs: {
        Row: {
          created_at: string | null
          description: string | null
          founded_year: number | null
          id: string
          logo_url: string | null
          name: string
          organization_type: string
          settings: Json | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          founded_year?: number | null
          id?: string
          logo_url?: string | null
          name: string
          organization_type: string
          settings?: Json | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          founded_year?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          organization_type?: string
          settings?: Json | null
          website?: string | null
        }
        Relationships: []
      }
      event_attendance: {
        Row: {
          actual_status: string | null
          event_id: string | null
          id: string
          intended_reason: string | null
          intended_status: string
          marked_at: string | null
          marked_by: string | null
          member_id: string | null
          member_response_at: string | null
          notes: string | null
        }
        Insert: {
          actual_status?: string | null
          event_id?: string | null
          id?: string
          intended_reason?: string | null
          intended_status?: string
          marked_at?: string | null
          marked_by?: string | null
          member_id?: string | null
          member_response_at?: string | null
          notes?: string | null
        }
        Update: {
          actual_status?: string | null
          event_id?: string | null
          id?: string
          intended_reason?: string | null
          intended_status?: string
          marked_at?: string | null
          marked_by?: string | null
          member_id?: string | null
          member_response_at?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_event_id_events_id_fk"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_marked_by_user_profiles_id_fk"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_member_id_members_id_fk"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          attendance_mode: string
          calendar_sync_enabled: boolean | null
          choir_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string
          exclude_holidays: boolean | null
          id: string
          include_all_active: boolean | null
          is_recurring: boolean | null
          location: string
          notes: string | null
          parent_event_id: string | null
          recurrence_rule: Json | null
          setlist_id: string | null
          start_time: string
          status_id: string | null
          target_membership_types: Json | null
          target_voice_groups: Json | null
          target_voice_types: Json | null
          title: string
          type_id: string | null
        }
        Insert: {
          attendance_mode?: string
          calendar_sync_enabled?: boolean | null
          choir_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time: string
          exclude_holidays?: boolean | null
          id?: string
          include_all_active?: boolean | null
          is_recurring?: boolean | null
          location: string
          notes?: string | null
          parent_event_id?: string | null
          recurrence_rule?: Json | null
          setlist_id?: string | null
          start_time: string
          status_id?: string | null
          target_membership_types?: Json | null
          target_voice_groups?: Json | null
          target_voice_types?: Json | null
          title: string
          type_id?: string | null
        }
        Update: {
          attendance_mode?: string
          calendar_sync_enabled?: boolean | null
          choir_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string
          exclude_holidays?: boolean | null
          id?: string
          include_all_active?: boolean | null
          is_recurring?: boolean | null
          location?: string
          notes?: string | null
          parent_event_id?: string | null
          recurrence_rule?: Json | null
          setlist_id?: string | null
          start_time?: string
          status_id?: string | null
          target_membership_types?: Json | null
          target_voice_groups?: Json | null
          target_voice_types?: Json | null
          title?: string
          type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_choir_id_choirs_id_fk"
            columns: ["choir_id"]
            isOneToOne: false
            referencedRelation: "choirs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_user_profiles_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_parent_event_id_events_id_fk"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_setlist_id_setlists_id_fk"
            columns: ["setlist_id"]
            isOneToOne: false
            referencedRelation: "setlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_status_id_list_of_values_id_fk"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "list_of_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_type_id_list_of_values_id_fk"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "list_of_values"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          created_at: string | null
          date: string
          id: string
          is_active: boolean | null
          name: string
          region: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          is_active?: boolean | null
          name: string
          region: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          is_active?: boolean | null
          name?: string
          region?: string
        }
        Relationships: []
      }
      info_feed: {
        Row: {
          allows_comments: boolean | null
          author_id: string
          content: string
          id: string
          include_all_active: boolean | null
          is_pinned: boolean | null
          published_at: string | null
          target_membership_types: Json | null
          target_voice_groups: Json | null
          target_voice_types: Json | null
          title: string
        }
        Insert: {
          allows_comments?: boolean | null
          author_id: string
          content: string
          id?: string
          include_all_active?: boolean | null
          is_pinned?: boolean | null
          published_at?: string | null
          target_membership_types?: Json | null
          target_voice_groups?: Json | null
          target_voice_types?: Json | null
          title: string
        }
        Update: {
          allows_comments?: boolean | null
          author_id?: string
          content?: string
          id?: string
          include_all_active?: boolean | null
          is_pinned?: boolean | null
          published_at?: string | null
          target_membership_types?: Json | null
          target_voice_groups?: Json | null
          target_voice_types?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "info_feed_author_id_user_profiles_id_fk"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      list_of_values: {
        Row: {
          category: string
          choir_id: string | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          parent_id: string | null
          sort_order: number | null
          value: string
        }
        Insert: {
          category: string
          choir_id?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          parent_id?: string | null
          sort_order?: number | null
          value: string
        }
        Update: {
          category?: string
          choir_id?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          parent_id?: string | null
          sort_order?: number | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_of_values_choir_id_choirs_id_fk"
            columns: ["choir_id"]
            isOneToOne: false
            referencedRelation: "choirs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_of_values_parent_id_list_of_values_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "list_of_values"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          additional_data: Json | null
          choir_id: string
          created_at: string | null
          id: string
          membership_type_id: string
          notes: string | null
          updated_at: string | null
          user_profile_id: string
          voice_group_id: string
          voice_type_id: string | null
        }
        Insert: {
          additional_data?: Json | null
          choir_id: string
          created_at?: string | null
          id?: string
          membership_type_id: string
          notes?: string | null
          updated_at?: string | null
          user_profile_id: string
          voice_group_id: string
          voice_type_id?: string | null
        }
        Update: {
          additional_data?: Json | null
          choir_id?: string
          created_at?: string | null
          id?: string
          membership_type_id?: string
          notes?: string | null
          updated_at?: string | null
          user_profile_id?: string
          voice_group_id?: string
          voice_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_choir_id_choirs_id_fk"
            columns: ["choir_id"]
            isOneToOne: false
            referencedRelation: "choirs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_membership_type_id_membership_types_id_fk"
            columns: ["membership_type_id"]
            isOneToOne: false
            referencedRelation: "membership_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_user_profile_id_user_profiles_id_fk"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_voice_group_id_list_of_values_id_fk"
            columns: ["voice_group_id"]
            isOneToOne: false
            referencedRelation: "list_of_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_voice_type_id_list_of_values_id_fk"
            columns: ["voice_type_id"]
            isOneToOne: false
            referencedRelation: "list_of_values"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_leaves: {
        Row: {
          actual_return_date: string | null
          approved_at: string | null
          approved_by: string | null
          expected_return_date: string | null
          id: string
          leave_type: string
          member_id: string
          notes: string | null
          reason: string
          requested_at: string | null
          start_date: string
          status: string
        }
        Insert: {
          actual_return_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          expected_return_date?: string | null
          id?: string
          leave_type: string
          member_id: string
          notes?: string | null
          reason: string
          requested_at?: string | null
          start_date: string
          status?: string
        }
        Update: {
          actual_return_date?: string | null
          approved_at?: string | null
          approved_by?: string | null
          expected_return_date?: string | null
          id?: string
          leave_type?: string
          member_id?: string
          notes?: string | null
          reason?: string
          requested_at?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_leaves_approved_by_user_profiles_id_fk"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_leaves_member_id_members_id_fk"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_periods: {
        Row: {
          created_at: string | null
          end_date: string | null
          end_reason: string | null
          id: string
          member_id: string
          membership_type_id: string
          notes: string | null
          start_date: string
          voice_group_id: string
          voice_type_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          end_reason?: string | null
          id?: string
          member_id: string
          membership_type_id: string
          notes?: string | null
          start_date: string
          voice_group_id: string
          voice_type_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          end_reason?: string | null
          id?: string
          member_id?: string
          membership_type_id?: string
          notes?: string | null
          start_date?: string
          voice_group_id?: string
          voice_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_periods_member_id_members_id_fk"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_periods_membership_type_id_membership_types_id_fk"
            columns: ["membership_type_id"]
            isOneToOne: false
            referencedRelation: "membership_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_periods_voice_group_id_list_of_values_id_fk"
            columns: ["voice_group_id"]
            isOneToOne: false
            referencedRelation: "list_of_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_periods_voice_type_id_list_of_values_id_fk"
            columns: ["voice_type_id"]
            isOneToOne: false
            referencedRelation: "list_of_values"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_types: {
        Row: {
          can_access_system: boolean | null
          can_vote: boolean | null
          choir_id: string
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active_membership: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          can_access_system?: boolean | null
          can_vote?: boolean | null
          choir_id: string
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active_membership?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          can_access_system?: boolean | null
          can_vote?: boolean | null
          choir_id?: string
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active_membership?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_types_choir_id_choirs_id_fk"
            columns: ["choir_id"]
            isOneToOne: false
            referencedRelation: "choirs"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          id: string
          sender_id: string
          sent_at: string | null
        }
        Insert: {
          chat_id: string
          content: string
          id?: string
          sender_id: string
          sent_at?: string | null
        }
        Update: {
          chat_id?: string
          content?: string
          id?: string
          sender_id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_chats_id_fk"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_user_profiles_id_fk"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      setlist_items: {
        Row: {
          id: string
          notes: string | null
          order_index: number
          setlist_id: string
          sheet_music_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          order_index: number
          setlist_id: string
          sheet_music_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          order_index?: number
          setlist_id?: string
          sheet_music_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "setlist_items_setlist_id_setlists_id_fk"
            columns: ["setlist_id"]
            isOneToOne: false
            referencedRelation: "setlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_items_sheet_music_id_sheet_music_id_fk"
            columns: ["sheet_music_id"]
            isOneToOne: false
            referencedRelation: "sheet_music"
            referencedColumns: ["id"]
          },
        ]
      }
      setlists: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "setlists_created_by_user_profiles_id_fk"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_music: {
        Row: {
          arranger: string | null
          composer: string
          difficulty_level: number | null
          duration_minutes: number | null
          file_size_bytes: number
          file_type: string
          file_url: string
          genre: string | null
          id: string
          is_public: boolean | null
          key_signature: string | null
          language: string
          time_signature: string | null
          title: string
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          arranger?: string | null
          composer: string
          difficulty_level?: number | null
          duration_minutes?: number | null
          file_size_bytes: number
          file_type: string
          file_url: string
          genre?: string | null
          id?: string
          is_public?: boolean | null
          key_signature?: string | null
          language: string
          time_signature?: string | null
          title: string
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          arranger?: string | null
          composer?: string
          difficulty_level?: number | null
          duration_minutes?: number | null
          file_size_bytes?: number
          file_type?: string
          file_url?: string
          genre?: string | null
          id?: string
          is_public?: boolean | null
          key_signature?: string | null
          language?: string
          time_signature?: string | null
          title?: string
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheet_music_uploaded_by_user_profiles_id_fk"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string
          created_at: string | null
          email: string
          emergency_contact: string | null
          emergency_phone: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date: string
          created_at?: string | null
          email: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          id: string
          is_active?: boolean | null
          last_login?: string | null
          name: string
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string
          created_at?: string | null
          email?: string
          emergency_contact?: string | null
          emergency_phone?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expand_voice_targets: {
        Args: { p_voice_group_ids: string[]; p_voice_type_ids: string[] }
        Returns: {
          voice_type_id: string
          voice_group_id: string
        }[]
      }
      get_members_by_voice_group: {
        Args: { p_choir_id: string; p_voice_group_ids: string[] }
        Returns: {
          member_id: string
        }[]
      }
      get_user_choir_ids: {
        Args: { user_id: string }
        Returns: string[]
      }
      get_voice_types_for_group: {
        Args: { group_id: string }
        Returns: {
          id: string
          value: string
          display_name: string
        }[]
      }
      is_choir_admin: {
        Args: { user_id: string; choir_id: string }
        Returns: boolean
      }
      member_in_voice_targets: {
        Args: {
          p_member_id: string
          p_target_voice_groups: Json
          p_target_voice_types: Json
        }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
