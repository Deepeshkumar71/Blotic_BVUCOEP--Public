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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // Navigation Analytics Tables (New)
      navigation_analytics: {
        Row: {
          id: string
          user_id: string | null
          session_id: string | null
          page_from: string | null
          page_to: string | null
          navigation_type: string | null
          device_info: Json | null
          timestamp: string | null
          load_time_ms: number | null
          scroll_position: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          page_from?: string | null
          page_to?: string | null
          navigation_type?: string | null
          device_info?: Json | null
          timestamp?: string | null
          load_time_ms?: number | null
          scroll_position?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          session_id?: string | null
          page_from?: string | null
          page_to?: string | null
          navigation_type?: string | null
          device_info?: Json | null
          timestamp?: string | null
          load_time_ms?: number | null
          scroll_position?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "navigation_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // API Usage Tracking (New)
      api_usage_logs: {
        Row: {
          id: string
          endpoint: string
          method: string
          user_id: string | null
          ip_address: unknown | null
          user_agent: string | null
          request_body: Json | null
          response_status: number | null
          response_time_ms: number | null
          error_message: string | null
          timestamp: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          endpoint: string
          method: string
          user_id?: string | null
          ip_address?: unknown | null
          user_agent?: string | null
          request_body?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          error_message?: string | null
          timestamp?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          endpoint?: string
          method?: string
          user_id?: string | null
          ip_address?: unknown | null
          user_agent?: string | null
          request_body?: Json | null
          response_status?: number | null
          response_time_ms?: number | null
          error_message?: string | null
          timestamp?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      // Vercel Deployments (New)
      vercel_deployments: {
        Row: {
          id: string
          deployment_id: string
          project_name: string
          url: string
          state: string | null
          type: string | null
          target: string | null
          creator_uid: string | null
          created_at_vercel: string | null
          ready_at: string | null
          build_time_ms: number | null
          regions: string[] | null
          functions_count: number | null
          static_files_count: number | null
          environment_variables: Json | null
          build_logs: string | null
          error_message: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          deployment_id: string
          project_name: string
          url: string
          state?: string | null
          type?: string | null
          target?: string | null
          creator_uid?: string | null
          created_at_vercel?: string | null
          ready_at?: string | null
          build_time_ms?: number | null
          regions?: string[] | null
          functions_count?: number | null
          static_files_count?: number | null
          environment_variables?: Json | null
          build_logs?: string | null
          error_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          deployment_id?: string
          project_name?: string
          url?: string
          state?: string | null
          type?: string | null
          target?: string | null
          creator_uid?: string | null
          created_at_vercel?: string | null
          ready_at?: string | null
          build_time_ms?: number | null
          regions?: string[] | null
          functions_count?: number | null
          static_files_count?: number | null
          environment_variables?: Json | null
          build_logs?: string | null
          error_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      // Enhanced Core Team (Updated)
      core_team: {
        Row: {
          id: string
          user_id: string | null
          position: string
          department: string | null
          branch: string | null
          skills: string[] | null
          bio: string | null
          instagram_url: string | null
          linkedin_url: string | null
          whatsapp_url: string | null
          contact_email: string | null
          github_url: string | null
          portfolio_url: string | null
          is_leadership: boolean | null
          is_active: boolean | null
          display_order: number | null
          full_name: string | null
          avatar_priority: number | null
          achievements: string[] | null
          specializations: string[] | null
          availability_status: string | null
          mentor_available: boolean | null
          featured_member: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          position: string
          department?: string | null
          branch?: string | null
          skills?: string[] | null
          bio?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          whatsapp_url?: string | null
          contact_email?: string | null
          github_url?: string | null
          portfolio_url?: string | null
          is_leadership?: boolean | null
          is_active?: boolean | null
          display_order?: number | null
          full_name?: string | null
          avatar_priority?: number | null
          achievements?: string[] | null
          specializations?: string[] | null
          availability_status?: string | null
          mentor_available?: boolean | null
          featured_member?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          position?: string
          department?: string | null
          branch?: string | null
          skills?: string[] | null
          bio?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          whatsapp_url?: string | null
          contact_email?: string | null
          github_url?: string | null
          portfolio_url?: string | null
          is_leadership?: boolean | null
          is_active?: boolean | null
          display_order?: number | null
          full_name?: string | null
          avatar_priority?: number | null
          achievements?: string[] | null
          specializations?: string[] | null
          availability_status?: string | null
          mentor_available?: boolean | null
          featured_member?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      // Enhanced Profiles (Updated)
      profiles: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          branch: string | null
          year: number | null
          domains: string[] | null
          role: string | null
          avatar_url: string | null
          bio: string | null
          github_url: string | null
          linkedin_url: string | null
          website_url: string | null
          instagram_url: string | null
          is_active: boolean | null
          email_verified: boolean | null
          created_at: string | null
          updated_at: string | null
          username: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null
          ui_preferences: Json | null
          preferred_theme: string | null
          navigation_style: string | null
        }
        Insert: {
          id: string
          email?: string | null
          phone?: string | null
          branch?: string | null
          year?: number | null
          domains?: string[] | null
          role?: string | null
          avatar_url?: string | null
          bio?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          website_url?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          email_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          ui_preferences?: Json | null
          preferred_theme?: string | null
          navigation_style?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          phone?: string | null
          branch?: string | null
          year?: number | null
          domains?: string[] | null
          role?: string | null
          avatar_url?: string | null
          bio?: string | null
          github_url?: string | null
          linkedin_url?: string | null
          website_url?: string | null
          instagram_url?: string | null
          is_active?: boolean | null
          email_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          username?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          ui_preferences?: Json | null
          preferred_theme?: string | null
          navigation_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_core_team_members: {
        Row: {
          id: string | null
          user_id: string | null
          position: string | null
          department: string | null
          branch: string | null
          skills: string[] | null
          bio: string | null
          instagram_url: string | null
          linkedin_url: string | null
          whatsapp_url: string | null
          contact_email: string | null
          github_url: string | null
          portfolio_url: string | null
          is_leadership: boolean | null
          is_active: boolean | null
          display_order: number | null
          full_name: string | null
          avatar_priority: number | null
          achievements: string[] | null
          specializations: string[] | null
          availability_status: string | null
          mentor_available: boolean | null
          featured_member: boolean | null
          created_at: string | null
          updated_at: string | null
          profile_avatar_url: string | null
          profile_email: string | null
          profile_phone: string | null
          display_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "core_team_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      // Navigation and Analytics Functions (New)
      track_navigation_event: {
        Args: {
          p_user_id?: string
          p_session_id?: string
          p_event_type?: string
          p_source_page?: string
          p_target_page?: string
          p_navigation_method?: string
          p_scroll_position_before?: number
          p_scroll_position_after?: number
          p_page_load_time_ms?: number
          p_device_type?: string
          p_viewport_width?: number
          p_viewport_height?: number
          p_user_agent?: string
          p_referrer?: string
        }
        Returns: string
      }
      get_navigation_analytics: {
        Args: {
          p_start_date?: string
          p_end_date?: string
        }
        Returns: Json
      }
      // API and Backend Functions (New)
      log_api_usage: {
        Args: {
          p_endpoint: string
          p_method: string
          p_user_id?: string
          p_ip_address?: unknown
          p_user_agent?: string
          p_request_body?: Json
          p_response_status?: number
          p_response_time_ms?: number
          p_error_message?: string
        }
        Returns: string
      }
      record_health_check: {
        Args: {
          p_service_name: string
          p_status: string
          p_response_time_ms?: number
          p_error_details?: Json
        }
        Returns: string
      }
      log_serverless_execution: {
        Args: {
          p_function_name: string
          p_execution_id?: string
          p_request_id?: string
          p_method?: string
          p_path?: string
          p_status_code?: number
          p_execution_time_ms?: number
          p_memory_used_mb?: number
          p_cold_start?: boolean
          p_user_id?: string
          p_ip_address?: unknown
          p_user_agent?: string
          p_request_body?: Json
          p_response_body?: Json
          p_error_message?: string
          p_stack_trace?: string
        }
        Returns: string
      }
      get_api_performance_metrics: {
        Args: {
          p_start_date?: string
          p_end_date?: string
        }
        Returns: Json
      }
      record_vercel_deployment: {
        Args: {
          p_deployment_id: string
          p_project_name: string
          p_url: string
          p_state?: string
          p_type?: string
          p_target?: string
          p_creator_uid?: string
          p_created_at_vercel?: string
          p_regions?: string[]
          p_functions_count?: number
          p_static_files_count?: number
          p_environment_variables?: Json
        }
        Returns: string
      }
      // Core Team Functions (New)
      get_core_team_stats: {
        Args: {}
        Returns: Json
      }
      update_core_team_member: {
        Args: {
          p_member_id: string
          p_updates: Json
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

// Type helpers for the enhanced database
export type NavigationAnalytics = Database['public']['Tables']['navigation_analytics']['Row']
export type ApiUsageLog = Database['public']['Tables']['api_usage_logs']['Row']
export type VercelDeployment = Database['public']['Tables']['vercel_deployments']['Row']
export type EnhancedCoreTeamMember = Database['public']['Tables']['core_team']['Row']
export type EnhancedProfile = Database['public']['Tables']['profiles']['Row']
export type ActiveCoreTeamMember = Database['public']['Views']['active_core_team_members']['Row']

// Function return types
export type NavigationAnalyticsResult = Database['public']['Functions']['get_navigation_analytics']['Returns']
export type ApiPerformanceMetrics = Database['public']['Functions']['get_api_performance_metrics']['Returns']
export type CoreTeamStats = Database['public']['Functions']['get_core_team_stats']['Returns']
