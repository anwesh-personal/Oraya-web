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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ab_test_assignments: {
        Row: {
          assigned_at: string | null
          conversion_event: string | null
          converted: boolean | null
          converted_at: string | null
          id: string
          test_id: string
          user_id: string
          variant: string
        }
        Insert: {
          assigned_at?: string | null
          conversion_event?: string | null
          converted?: boolean | null
          converted_at?: string | null
          id?: string
          test_id: string
          user_id: string
          variant: string
        }
        Update: {
          assigned_at?: string | null
          conversion_event?: string | null
          converted?: boolean | null
          converted_at?: string | null
          id?: string
          test_id?: string
          user_id?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_assignments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_tests: {
        Row: {
          confidence_level: number | null
          control_variant: string | null
          created_at: string | null
          description: string | null
          ended_at: string | null
          hypothesis: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          started_at: string | null
          success_metric: string | null
          test_name: string
          test_variant: string | null
          traffic_allocation: number | null
          updated_at: string | null
          winner_variant: string | null
        }
        Insert: {
          confidence_level?: number | null
          control_variant?: string | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          hypothesis?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          started_at?: string | null
          success_metric?: string | null
          test_name: string
          test_variant?: string | null
          traffic_allocation?: number | null
          updated_at?: string | null
          winner_variant?: string | null
        }
        Update: {
          confidence_level?: number | null
          control_variant?: string | null
          created_at?: string | null
          description?: string | null
          ended_at?: string | null
          hypothesis?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          started_at?: string | null
          success_metric?: string | null
          test_name?: string
          test_variant?: string | null
          traffic_allocation?: number | null
          updated_at?: string | null
          winner_variant?: string | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_email: string | null
          admin_id: string | null
          changes: Json | null
          created_at: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_email?: string | null
          admin_id?: string | null
          changes?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_email?: string | null
          admin_id?: string | null
          changes?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          action_url: string | null
          admin_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          priority: number | null
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          action_url?: string | null
          admin_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          priority?: number | null
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          action_url?: string | null
          admin_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          priority?: number | null
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_template_examples: {
        Row: {
          created_at: string
          created_by: string | null
          expected_output: string
          explanation: string | null
          id: string
          is_active: boolean
          sort_order: number
          tags: string[] | null
          template_id: string
          updated_at: string
          user_input: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expected_output: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          tags?: string[] | null
          template_id: string
          updated_at?: string
          user_input: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expected_output?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          tags?: string[] | null
          template_id?: string
          updated_at?: string
          user_input?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_template_examples_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_template_knowledge_bases: {
        Row: {
          chunk_overlap: number
          chunk_size: number
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          embedding_model: string
          file_path: string | null
          file_size_bytes: number | null
          id: string
          indexing_error: string | null
          indexing_status: string
          is_active: boolean
          kb_type: string
          last_indexed_at: string | null
          max_chunks_per_query: number
          mime_type: string | null
          name: string
          retrieval_strategy: string
          source_url: string | null
          template_id: string
          total_chunks: number
          updated_at: string
        }
        Insert: {
          chunk_overlap?: number
          chunk_size?: number
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          embedding_model?: string
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          indexing_error?: string | null
          indexing_status?: string
          is_active?: boolean
          kb_type: string
          last_indexed_at?: string | null
          max_chunks_per_query?: number
          mime_type?: string | null
          name: string
          retrieval_strategy?: string
          source_url?: string | null
          template_id: string
          total_chunks?: number
          updated_at?: string
        }
        Update: {
          chunk_overlap?: number
          chunk_size?: number
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          embedding_model?: string
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          indexing_error?: string | null
          indexing_status?: string
          is_active?: boolean
          kb_type?: string
          last_indexed_at?: string | null
          max_chunks_per_query?: number
          mime_type?: string | null
          name?: string
          retrieval_strategy?: string
          source_url?: string | null
          template_id?: string
          total_chunks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_template_knowledge_bases_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_template_memories: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          factory_id: string
          id: string
          importance: number
          is_active: boolean
          sort_order: number
          tags: Json
          template_id: string
          updated_at: string
          version_added: number
          version_removed: number | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by?: string | null
          factory_id?: string
          id?: string
          importance?: number
          is_active?: boolean
          sort_order?: number
          tags?: Json
          template_id: string
          updated_at?: string
          version_added?: number
          version_removed?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          factory_id?: string
          id?: string
          importance?: number
          is_active?: boolean
          sort_order?: number
          tags?: Json
          template_id?: string
          updated_at?: string
          version_added?: number
          version_removed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_template_memories_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_template_prompts: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          label: string
          priority: number
          prompt_type: string
          template_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          label: string
          priority?: number
          prompt_type: string
          template_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          label?: string
          priority?: number
          prompt_type?: string
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_template_prompts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_template_rules: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          rule_type: string
          severity: string
          sort_order: number
          template_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          rule_type: string
          severity?: string
          sort_order?: number
          template_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          rule_type?: string
          severity?: string
          sort_order?: number
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_template_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_templates: {
        Row: {
          author: string | null
          category: string | null
          core_prompt: string
          created_at: string
          default_memory_mode: string
          description: string | null
          emoji: string
          factory_published_at: string | null
          factory_version: number | null
          icon_url: string | null
          id: string
          ide_specializations: string[] | null
          ide_system_prompt: string | null
          install_count: number
          is_active: boolean
          is_ide_specialist: boolean
          name: string
          oraya_file_url: string | null
          personality_config: Json | null
          plan_tier: string
          role: string
          tagline: string | null
          tags: string[] | null
          updated_at: string
          version: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          core_prompt: string
          created_at?: string
          default_memory_mode?: string
          description?: string | null
          emoji?: string
          factory_published_at?: string | null
          factory_version?: number | null
          icon_url?: string | null
          id?: string
          ide_specializations?: string[] | null
          ide_system_prompt?: string | null
          install_count?: number
          is_active?: boolean
          is_ide_specialist?: boolean
          name: string
          oraya_file_url?: string | null
          personality_config?: Json | null
          plan_tier?: string
          role?: string
          tagline?: string | null
          tags?: string[] | null
          updated_at?: string
          version?: string
        }
        Update: {
          author?: string | null
          category?: string | null
          core_prompt?: string
          created_at?: string
          default_memory_mode?: string
          description?: string | null
          emoji?: string
          factory_published_at?: string | null
          factory_version?: number | null
          icon_url?: string | null
          id?: string
          ide_specializations?: string[] | null
          ide_system_prompt?: string | null
          install_count?: number
          is_active?: boolean
          is_ide_specialist?: boolean
          name?: string
          oraya_file_url?: string | null
          personality_config?: Json | null
          plan_tier?: string
          role?: string
          tagline?: string | null
          tags?: string[] | null
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      ai_provider_pricing: {
        Row: {
          created_at: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          image_price_per_1k: number | null
          input_price_per_1m: number
          is_active: boolean | null
          max_context_tokens: number | null
          max_output_tokens: number | null
          model: string
          output_price_per_1m: number
          provider: string
          supports_function_calling: boolean | null
          supports_streaming: boolean | null
          supports_vision: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          image_price_per_1k?: number | null
          input_price_per_1m: number
          is_active?: boolean | null
          max_context_tokens?: number | null
          max_output_tokens?: number | null
          model: string
          output_price_per_1m: number
          provider: string
          supports_function_calling?: boolean | null
          supports_streaming?: boolean | null
          supports_vision?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          image_price_per_1k?: number | null
          input_price_per_1m?: number
          is_active?: boolean | null
          max_context_tokens?: number | null
          max_output_tokens?: number | null
          model?: string
          output_price_per_1m?: number
          provider?: string
          supports_function_calling?: boolean | null
          supports_streaming?: boolean | null
          supports_vision?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_usage_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          current_value: number | null
          email_sent: boolean | null
          id: string
          is_resolved: boolean | null
          message: string
          notification_sent: boolean | null
          resolved_at: string | null
          severity: string | null
          threshold_value: number | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          current_value?: number | null
          email_sent?: boolean | null
          id?: string
          is_resolved?: boolean | null
          message: string
          notification_sent?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          threshold_value?: number | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          current_value?: number | null
          email_sent?: boolean | null
          id?: string
          is_resolved?: boolean | null
          message?: string
          notification_sent?: boolean | null
          resolved_at?: string | null
          severity?: string | null
          threshold_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          agent_id: string | null
          completion_tokens: number | null
          conversation_id: string | null
          cost_usd: number | null
          created_at: string | null
          device_id: string | null
          error_code: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          latency_ms: number | null
          license_id: string | null
          managed_key_id: string | null
          message_id: string | null
          model: string
          prompt_tokens: number | null
          provider: string
          request_id: string | null
          request_type: string | null
          response_time_ms: number | null
          status: string | null
          tokens_deducted: number | null
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          completion_tokens?: number | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          device_id?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          latency_ms?: number | null
          license_id?: string | null
          managed_key_id?: string | null
          message_id?: string | null
          model: string
          prompt_tokens?: number | null
          provider: string
          request_id?: string | null
          request_type?: string | null
          response_time_ms?: number | null
          status?: string | null
          tokens_deducted?: number | null
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          completion_tokens?: number | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          device_id?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          latency_ms?: number | null
          license_id?: string | null
          managed_key_id?: string | null
          message_id?: string | null
          model?: string
          prompt_tokens?: number | null
          provider?: string
          request_id?: string | null
          request_type?: string | null
          response_time_ms?: number | null
          status?: string | null
          tokens_deducted?: number | null
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "user_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_managed_key_id_fkey"
            columns: ["managed_key_id"]
            isOneToOne: false
            referencedRelation: "managed_ai_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymization_log: {
        Row: {
          anonymization_method: string | null
          anonymization_type: string
          anonymized_at: string | null
          id: string
          is_reversible: boolean | null
          original_email: string | null
          original_user_id: string | null
          records_affected: number | null
          reversal_key: string | null
          status: string | null
          tables_affected: string[]
          triggered_by: string
          triggered_by_admin: string | null
        }
        Insert: {
          anonymization_method?: string | null
          anonymization_type: string
          anonymized_at?: string | null
          id?: string
          is_reversible?: boolean | null
          original_email?: string | null
          original_user_id?: string | null
          records_affected?: number | null
          reversal_key?: string | null
          status?: string | null
          tables_affected: string[]
          triggered_by: string
          triggered_by_admin?: string | null
        }
        Update: {
          anonymization_method?: string | null
          anonymization_type?: string
          anonymized_at?: string | null
          id?: string
          is_reversible?: boolean | null
          original_email?: string | null
          original_user_id?: string | null
          records_affected?: number | null
          reversal_key?: string | null
          status?: string | null
          tables_affected?: string[]
          triggered_by?: string
          triggered_by_admin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anonymization_log_triggered_by_admin_fkey"
            columns: ["triggered_by_admin"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      api_endpoints: {
        Row: {
          created_at: string | null
          default_rate_limit_per_minute: number | null
          deprecated_at: string | null
          description: string | null
          docs_url: string | null
          id: string
          is_active: boolean | null
          is_deprecated: boolean | null
          method: string
          path: string
          required_scopes: string[] | null
          requires_auth: boolean | null
          sunset_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_rate_limit_per_minute?: number | null
          deprecated_at?: string | null
          description?: string | null
          docs_url?: string | null
          id?: string
          is_active?: boolean | null
          is_deprecated?: boolean | null
          method: string
          path: string
          required_scopes?: string[] | null
          requires_auth?: boolean | null
          sunset_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_rate_limit_per_minute?: number | null
          deprecated_at?: string | null
          description?: string | null
          docs_url?: string | null
          id?: string
          is_active?: boolean | null
          is_deprecated?: boolean | null
          method?: string
          path?: string
          required_scopes?: string[] | null
          requires_auth?: boolean | null
          sunset_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          allowed_ips: unknown[] | null
          allowed_origins: string[] | null
          api_key: string
          api_key_prefix: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_name: string
          last_used_at: string | null
          last_used_ip: unknown
          rate_limit_per_day: number | null
          rate_limit_per_hour: number | null
          rate_limit_per_minute: number | null
          scopes: string[] | null
          total_requests: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allowed_ips?: unknown[] | null
          allowed_origins?: string[] | null
          api_key: string
          api_key_prefix: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_name: string
          last_used_at?: string | null
          last_used_ip?: unknown
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          scopes?: string[] | null
          total_requests?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allowed_ips?: unknown[] | null
          allowed_origins?: string[] | null
          api_key?: string
          api_key_prefix?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_name?: string
          last_used_at?: string | null
          last_used_ip?: unknown
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          scopes?: string[] | null
          total_requests?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          api_key_id: string
          created_at: string | null
          id: string
          limit_exceeded: boolean | null
          request_count: number | null
          window_end: string
          window_start: string
          window_type: string
        }
        Insert: {
          api_key_id: string
          created_at?: string | null
          id?: string
          limit_exceeded?: boolean | null
          request_count?: number | null
          window_end: string
          window_start: string
          window_type: string
        }
        Update: {
          api_key_id?: string
          created_at?: string | null
          id?: string
          limit_exceeded?: boolean | null
          request_count?: number | null
          window_end?: string
          window_start?: string
          window_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_logs: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          endpoint: string
          error_code: string | null
          error_message: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          method: string
          origin: string | null
          path: string
          query_params: Json | null
          request_id: string | null
          response_time_ms: number | null
          status_code: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          method: string
          origin?: string | null
          path: string
          query_params?: Json | null
          request_id?: string | null
          response_time_ms?: number | null
          status_code: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          endpoint?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          method?: string
          origin?: string | null
          path?: string
          query_params?: Json | null
          request_id?: string | null
          response_time_ms?: number | null
          status_code?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_versions: {
        Row: {
          changelog_url: string | null
          created_at: string | null
          deprecated_at: string | null
          docs_url: string | null
          id: string
          is_default: boolean | null
          released_at: string | null
          status: string | null
          sunset_at: string | null
          updated_at: string | null
          version: string
        }
        Insert: {
          changelog_url?: string | null
          created_at?: string | null
          deprecated_at?: string | null
          docs_url?: string | null
          id?: string
          is_default?: boolean | null
          released_at?: string | null
          status?: string | null
          sunset_at?: string | null
          updated_at?: string | null
          version: string
        }
        Update: {
          changelog_url?: string | null
          created_at?: string | null
          deprecated_at?: string | null
          docs_url?: string | null
          id?: string
          is_default?: boolean | null
          released_at?: string | null
          status?: string | null
          sunset_at?: string | null
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      api_webhooks: {
        Row: {
          consecutive_failures: number | null
          created_at: string | null
          custom_headers: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          last_failure_at: string | null
          last_success_at: string | null
          last_triggered_at: string | null
          secret: string
          subscribed_events: string[]
          updated_at: string | null
          url: string
          user_id: string
        }
        Insert: {
          consecutive_failures?: number | null
          created_at?: string | null
          custom_headers?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          secret: string
          subscribed_events: string[]
          updated_at?: string | null
          url: string
          user_id: string
        }
        Update: {
          consecutive_failures?: number | null
          created_at?: string | null
          custom_headers?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          secret?: string
          subscribed_events?: string[]
          updated_at?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      app_telemetry: {
        Row: {
          app_version: string | null
          consent_given: boolean | null
          country_code: string | null
          created_at: string | null
          device_id: string | null
          event_action: string | null
          event_category: string | null
          event_data: Json | null
          event_label: string | null
          event_type: string
          event_value: number | null
          id: string
          is_anonymous: boolean | null
          memory_usage_mb: number | null
          page_load_time_ms: number | null
          platform: string | null
          platform_version: string | null
          region_code: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          consent_given?: boolean | null
          country_code?: string | null
          created_at?: string | null
          device_id?: string | null
          event_action?: string | null
          event_category?: string | null
          event_data?: Json | null
          event_label?: string | null
          event_type: string
          event_value?: number | null
          id?: string
          is_anonymous?: boolean | null
          memory_usage_mb?: number | null
          page_load_time_ms?: number | null
          platform?: string | null
          platform_version?: string | null
          region_code?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          consent_given?: boolean | null
          country_code?: string | null
          created_at?: string | null
          device_id?: string | null
          event_action?: string | null
          event_category?: string | null
          event_data?: Json | null
          event_label?: string | null
          event_type?: string
          event_value?: number | null
          id?: string
          is_anonymous?: boolean | null
          memory_usage_mb?: number | null
          page_load_time_ms?: number | null
          platform?: string | null
          platform_version?: string | null
          region_code?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      article_feedback: {
        Row: {
          article_id: string
          created_at: string | null
          feedback_text: string | null
          id: string
          is_helpful: boolean
          user_id: string | null
        }
        Insert: {
          article_id: string
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          is_helpful: boolean
          user_id?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          is_helpful?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "mv_popular_kb_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          created_at: string | null
          event_data: Json
          event_source: string | null
          event_type: string
          id: string
          is_processed: boolean | null
          processed_at: string | null
          processing_error: string | null
          retry_count: number | null
          stripe_event_id: string | null
          stripe_event_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data: Json
          event_source?: string | null
          event_type: string
          id?: string
          is_processed?: boolean | null
          processed_at?: string | null
          processing_error?: string | null
          retry_count?: number | null
          stripe_event_id?: string | null
          stripe_event_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json
          event_source?: string | null
          event_type?: string
          id?: string
          is_processed?: boolean | null
          processed_at?: string | null
          processing_error?: string | null
          retry_count?: number | null
          stripe_event_id?: string | null
          stripe_event_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      canned_responses: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          shortcut: string | null
          title: string
          updated_at: string | null
          use_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          shortcut?: string | null
          title: string
          updated_at?: string | null
          use_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          shortcut?: string | null
          title?: string
          updated_at?: string | null
          use_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "canned_responses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_local_models: {
        Row: {
          category: string | null
          context_length: number
          created_at: string | null
          description: string
          family: string
          file_size_gb: number
          hf_filename: string
          hf_repo_id: string
          id: string
          is_active: boolean | null
          name: string
          parameters_billions: number
          quantization: string
          ram_required_gb: number
          sort_order: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          context_length?: number
          created_at?: string | null
          description: string
          family: string
          file_size_gb: number
          hf_filename: string
          hf_repo_id: string
          id?: string
          is_active?: boolean | null
          name: string
          parameters_billions: number
          quantization: string
          ram_required_gb: number
          sort_order?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          context_length?: number
          created_at?: string | null
          description?: string
          family?: string
          file_size_gb?: number
          hf_filename?: string
          hf_repo_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
          parameters_billions?: number
          quantization?: string
          ram_required_gb?: number
          sort_order?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          consent_type: string
          consent_version: string
          expires_at: string | null
          granted_at: string | null
          id: string
          ip_address: unknown
          is_granted: boolean
          metadata: Json | null
          revoked_at: string | null
          source: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          consent_version: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          ip_address?: unknown
          is_granted: boolean
          metadata?: Json | null
          revoked_at?: string | null
          source?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          consent_version?: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          ip_address?: unknown
          is_granted?: boolean
          metadata?: Json | null
          revoked_at?: string | null
          source?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversion_funnels: {
        Row: {
          abandoned_at: string | null
          completed_at: string | null
          funnel_name: string
          id: string
          metadata: Json | null
          session_id: string | null
          started_at: string | null
          status: string | null
          step_name: string
          step_order: number
          user_id: string | null
        }
        Insert: {
          abandoned_at?: string | null
          completed_at?: string | null
          funnel_name: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          started_at?: string | null
          status?: string | null
          step_name: string
          step_order: number
          user_id?: string | null
        }
        Update: {
          abandoned_at?: string | null
          completed_at?: string | null
          funnel_name?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          started_at?: string | null
          status?: string | null
          step_name?: string
          step_order?: number
          user_id?: string | null
        }
        Relationships: []
      }
      data_breach_incidents: {
        Row: {
          affected_user_count: number | null
          affected_user_ids: string[] | null
          attack_vector: string | null
          authority_notified: boolean | null
          authority_notified_at: string | null
          breach_source: string | null
          breach_type: string | null
          containment_measures: string | null
          created_at: string | null
          data_types_affected: string[]
          description: string
          discovered_at: string
          discovered_by: string | null
          id: string
          incident_title: string
          notification_deadline: string | null
          post_incident_report: string | null
          preventive_measures: string | null
          remediation_steps: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string | null
          updated_at: string | null
          users_notified: boolean | null
          users_notified_at: string | null
        }
        Insert: {
          affected_user_count?: number | null
          affected_user_ids?: string[] | null
          attack_vector?: string | null
          authority_notified?: boolean | null
          authority_notified_at?: string | null
          breach_source?: string | null
          breach_type?: string | null
          containment_measures?: string | null
          created_at?: string | null
          data_types_affected: string[]
          description: string
          discovered_at: string
          discovered_by?: string | null
          id?: string
          incident_title: string
          notification_deadline?: string | null
          post_incident_report?: string | null
          preventive_measures?: string | null
          remediation_steps?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity: string
          status?: string | null
          updated_at?: string | null
          users_notified?: boolean | null
          users_notified_at?: string | null
        }
        Update: {
          affected_user_count?: number | null
          affected_user_ids?: string[] | null
          attack_vector?: string | null
          authority_notified?: boolean | null
          authority_notified_at?: string | null
          breach_source?: string | null
          breach_type?: string | null
          containment_measures?: string | null
          created_at?: string | null
          data_types_affected?: string[]
          description?: string
          discovered_at?: string
          discovered_by?: string | null
          id?: string
          incident_title?: string
          notification_deadline?: string | null
          post_incident_report?: string | null
          preventive_measures?: string | null
          remediation_steps?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string | null
          updated_at?: string | null
          users_notified?: boolean | null
          users_notified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_breach_incidents_discovered_by_fkey"
            columns: ["discovered_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      data_deletion_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          data_to_delete: string[] | null
          deletion_log: Json | null
          deletion_type: string | null
          error_message: string | null
          id: string
          permanent_deletion_at: string | null
          processed_by: string | null
          reason: string | null
          retention_period_days: number | null
          scheduled_for: string | null
          soft_deleted: boolean | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          verification_code: string | null
          verification_ip: unknown
          verification_sent_at: string | null
          verified_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          data_to_delete?: string[] | null
          deletion_log?: Json | null
          deletion_type?: string | null
          error_message?: string | null
          id?: string
          permanent_deletion_at?: string | null
          processed_by?: string | null
          reason?: string | null
          retention_period_days?: number | null
          scheduled_for?: string | null
          soft_deleted?: boolean | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          verification_code?: string | null
          verification_ip?: unknown
          verification_sent_at?: string | null
          verified_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          data_to_delete?: string[] | null
          deletion_log?: Json | null
          deletion_type?: string | null
          error_message?: string | null
          id?: string
          permanent_deletion_at?: string | null
          processed_by?: string | null
          reason?: string | null
          retention_period_days?: number | null
          scheduled_for?: string | null
          soft_deleted?: boolean | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verification_code?: string | null
          verification_ip?: unknown
          verification_sent_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_deletion_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      data_export_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          download_count: number | null
          download_expires_at: string | null
          downloaded_at: string | null
          error_message: string | null
          export_file_size_bytes: number | null
          export_file_url: string | null
          export_format: string | null
          id: string
          ip_address: unknown
          processed_by: string | null
          request_type: string | null
          requested_data_types: string[] | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          verification_code: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          download_count?: number | null
          download_expires_at?: string | null
          downloaded_at?: string | null
          error_message?: string | null
          export_file_size_bytes?: number | null
          export_file_url?: string | null
          export_format?: string | null
          id?: string
          ip_address?: unknown
          processed_by?: string | null
          request_type?: string | null
          requested_data_types?: string[] | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          verification_code?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          download_count?: number | null
          download_expires_at?: string | null
          downloaded_at?: string | null
          error_message?: string | null
          export_file_size_bytes?: number | null
          export_file_url?: string | null
          export_format?: string | null
          id?: string
          ip_address?: unknown
          processed_by?: string | null
          request_type?: string | null
          requested_data_types?: string[] | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_export_requests_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      data_processing_activities: {
        Row: {
          activity_name: string
          created_at: string | null
          data_categories: string[]
          data_controller: string | null
          data_processor: string | null
          data_recipients: string[] | null
          data_subjects: string[]
          dpo_contact: string | null
          id: string
          international_transfers: boolean | null
          is_active: boolean | null
          last_reviewed_at: string | null
          legal_basis: string
          next_review_date: string | null
          processing_operations: string[]
          purpose: string
          retention_period: string | null
          security_measures: string[] | null
          transfer_safeguards: string | null
          updated_at: string | null
        }
        Insert: {
          activity_name: string
          created_at?: string | null
          data_categories: string[]
          data_controller?: string | null
          data_processor?: string | null
          data_recipients?: string[] | null
          data_subjects: string[]
          dpo_contact?: string | null
          id?: string
          international_transfers?: boolean | null
          is_active?: boolean | null
          last_reviewed_at?: string | null
          legal_basis: string
          next_review_date?: string | null
          processing_operations: string[]
          purpose: string
          retention_period?: string | null
          security_measures?: string[] | null
          transfer_safeguards?: string | null
          updated_at?: string | null
        }
        Update: {
          activity_name?: string
          created_at?: string | null
          data_categories?: string[]
          data_controller?: string | null
          data_processor?: string | null
          data_recipients?: string[] | null
          data_subjects?: string[]
          dpo_contact?: string | null
          id?: string
          international_transfers?: boolean | null
          is_active?: boolean | null
          last_reviewed_at?: string | null
          legal_basis?: string
          next_review_date?: string | null
          processing_operations?: string[]
          purpose?: string
          retention_period?: string | null
          security_measures?: string[] | null
          transfer_safeguards?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      data_retention_policies: {
        Row: {
          applicable_regulation: string | null
          auto_delete: boolean | null
          created_at: string | null
          data_type: string
          deletion_method: string | null
          description: string | null
          id: string
          is_active: boolean | null
          legal_basis: string | null
          retention_period_days: number
          retention_reason: string
          updated_at: string | null
        }
        Insert: {
          applicable_regulation?: string | null
          auto_delete?: boolean | null
          created_at?: string | null
          data_type: string
          deletion_method?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          legal_basis?: string | null
          retention_period_days: number
          retention_reason: string
          updated_at?: string | null
        }
        Update: {
          applicable_regulation?: string | null
          auto_delete?: boolean | null
          created_at?: string | null
          data_type?: string
          deletion_method?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          legal_basis?: string | null
          retention_period_days?: number
          retention_reason?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      desktop_license_tokens: {
        Row: {
          activation_id: string | null
          created_at: string | null
          device_id: string
          expires_at: string
          id: string
          ip_address: string | null
          is_revoked: boolean | null
          issued_at: string
          license_id: string
          revoked_at: string | null
          revoked_reason: string | null
          token_jti: string
          user_agent: string | null
        }
        Insert: {
          activation_id?: string | null
          created_at?: string | null
          device_id: string
          expires_at: string
          id?: string
          ip_address?: string | null
          is_revoked?: boolean | null
          issued_at: string
          license_id: string
          revoked_at?: string | null
          revoked_reason?: string | null
          token_jti: string
          user_agent?: string | null
        }
        Update: {
          activation_id?: string | null
          created_at?: string | null
          device_id?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_revoked?: boolean | null
          issued_at?: string
          license_id?: string
          revoked_at?: string | null
          revoked_reason?: string | null
          token_jti?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "desktop_license_tokens_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: false
            referencedRelation: "license_activations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "desktop_license_tokens_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "user_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      device_activations: {
        Row: {
          activated_at: string | null
          app_version: string | null
          deactivated_at: string | null
          deactivated_reason: string | null
          device_id: string
          device_name: string | null
          device_platform: string | null
          device_platform_version: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_seen_at: string | null
          ora_key: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          app_version?: string | null
          deactivated_at?: string | null
          deactivated_reason?: string | null
          device_id: string
          device_name?: string | null
          device_platform?: string | null
          device_platform_version?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_seen_at?: string | null
          ora_key: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          app_version?: string | null
          deactivated_at?: string | null
          deactivated_reason?: string | null
          device_id?: string
          device_name?: string | null
          device_platform?: string | null
          device_platform_version?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_seen_at?: string | null
          ora_key?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          applicable_packages: string[] | null
          code: string
          created_at: string | null
          created_by: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_purchase_amount: number | null
          notes: string | null
          times_used: number | null
          updated_at: string | null
          uses_per_user: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_packages?: string[] | null
          code: string
          created_at?: string | null
          created_by?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          notes?: string | null
          times_used?: number | null
          updated_at?: string | null
          uses_per_user?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_packages?: string[] | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          notes?: string | null
          times_used?: number | null
          updated_at?: string | null
          uses_per_user?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_usage: {
        Row: {
          discount_amount: number
          discount_id: string
          id: string
          purchase_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          discount_amount: number
          discount_id: string
          id?: string
          purchase_id: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          discount_amount?: number
          discount_id?: string
          id?: string
          purchase_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_usage_discount_id_fkey"
            columns: ["discount_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_usage_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "token_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      email_bounces: {
        Row: {
          bounce_subtype: string | null
          bounce_type: string
          bounced_at: string | null
          diagnostic_code: string | null
          email_address: string
          email_queue_id: string | null
          id: string
          is_permanent: boolean | null
          user_id: string | null
        }
        Insert: {
          bounce_subtype?: string | null
          bounce_type: string
          bounced_at?: string | null
          diagnostic_code?: string | null
          email_address: string
          email_queue_id?: string | null
          id?: string
          is_permanent?: boolean | null
          user_id?: string | null
        }
        Update: {
          bounce_subtype?: string | null
          bounce_type?: string
          bounced_at?: string | null
          diagnostic_code?: string | null
          email_address?: string
          email_queue_id?: string | null
          id?: string
          is_permanent?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_bounces_email_queue_id_fkey"
            columns: ["email_queue_id"]
            isOneToOne: false
            referencedRelation: "email_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          email_provider: string | null
          error_message: string | null
          expires_at: string | null
          from_email: string | null
          from_name: string | null
          html_body: string
          id: string
          max_retries: number | null
          metadata: Json | null
          opened_at: string | null
          priority: number | null
          provider_message_id: string | null
          retry_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_data: Json | null
          template_id: string | null
          text_body: string | null
          to_email: string
          to_name: string | null
          user_id: string | null
        }
        Insert: {
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_provider?: string | null
          error_message?: string | null
          expires_at?: string | null
          from_email?: string | null
          from_name?: string | null
          html_body: string
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          opened_at?: string | null
          priority?: number | null
          provider_message_id?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_data?: Json | null
          template_id?: string | null
          text_body?: string | null
          to_email: string
          to_name?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          email_provider?: string | null
          error_message?: string | null
          expires_at?: string | null
          from_email?: string | null
          from_name?: string | null
          html_body?: string
          id?: string
          max_retries?: number | null
          metadata?: Json | null
          opened_at?: string | null
          priority?: number | null
          provider_message_id?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_data?: Json | null
          template_id?: string | null
          text_body?: string | null
          to_email?: string
          to_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_suppressions: {
        Row: {
          email_address: string
          id: string
          is_active: boolean | null
          reason: string
          reason_details: string | null
          removed_at: string | null
          suppressed_at: string | null
          user_id: string | null
        }
        Insert: {
          email_address: string
          id?: string
          is_active?: boolean | null
          reason: string
          reason_details?: string | null
          removed_at?: string | null
          suppressed_at?: string | null
          user_id?: string | null
        }
        Update: {
          email_address?: string
          id?: string
          is_active?: boolean | null
          reason?: string
          reason_details?: string | null
          removed_at?: string | null
          suppressed_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          app_state: Json | null
          app_version: string | null
          component: string | null
          count: number | null
          device_id: string | null
          error_code: string | null
          error_message: string
          error_stack: string | null
          error_type: string
          file_path: string | null
          first_seen_at: string | null
          function_name: string | null
          id: string
          is_resolved: boolean | null
          last_seen_at: string | null
          line_number: number | null
          platform: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          session_id: string | null
          user_action: string | null
          user_id: string | null
        }
        Insert: {
          app_state?: Json | null
          app_version?: string | null
          component?: string | null
          count?: number | null
          device_id?: string | null
          error_code?: string | null
          error_message: string
          error_stack?: string | null
          error_type: string
          file_path?: string | null
          first_seen_at?: string | null
          function_name?: string | null
          id?: string
          is_resolved?: boolean | null
          last_seen_at?: string | null
          line_number?: number | null
          platform?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          user_action?: string | null
          user_id?: string | null
        }
        Update: {
          app_state?: Json | null
          app_version?: string | null
          component?: string | null
          count?: number | null
          device_id?: string | null
          error_code?: string | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          file_path?: string | null
          first_seen_at?: string | null
          function_name?: string | null
          id?: string
          is_resolved?: boolean | null
          last_seen_at?: string | null
          line_number?: number | null
          platform?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          user_action?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          enabled_for_plans: string[] | null
          enabled_for_users: string[] | null
          feature_key: string
          feature_name: string
          id: string
          is_enabled: boolean | null
          rollout_percentage: number | null
          tags: string[] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          enabled_for_plans?: string[] | null
          enabled_for_users?: string[] | null
          feature_key: string
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          rollout_percentage?: number | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          enabled_for_plans?: string[] | null
          enabled_for_users?: string[] | null
          feature_key?: string
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          rollout_percentage?: number | null
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage: {
        Row: {
          app_version: string | null
          device_id: string | null
          feature_category: string | null
          feature_key: string
          first_used_at: string | null
          id: string
          last_used_at: string | null
          period_end: string | null
          period_start: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          device_id?: string | null
          feature_category?: string | null
          feature_key: string
          first_used_at?: string | null
          id?: string
          last_used_at?: string | null
          period_end?: string | null
          period_start?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          device_id?: string | null
          feature_category?: string | null
          feature_key?: string
          first_used_at?: string | null
          id?: string
          last_used_at?: string | null
          period_end?: string | null
          period_start?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      gdpr_compliance_checklist: {
        Row: {
          article: string
          compliance_notes: string | null
          created_at: string | null
          description: string | null
          evidence_location: string | null
          id: string
          is_compliant: boolean | null
          last_reviewed_at: string | null
          next_review_date: string | null
          priority: number | null
          requirement: string
          reviewed_by: string | null
          updated_at: string | null
        }
        Insert: {
          article: string
          compliance_notes?: string | null
          created_at?: string | null
          description?: string | null
          evidence_location?: string | null
          id?: string
          is_compliant?: boolean | null
          last_reviewed_at?: string | null
          next_review_date?: string | null
          priority?: number | null
          requirement: string
          reviewed_by?: string | null
          updated_at?: string | null
        }
        Update: {
          article?: string
          compliance_notes?: string | null
          created_at?: string | null
          description?: string | null
          evidence_location?: string | null
          id?: string
          is_compliant?: boolean | null
          last_reviewed_at?: string | null
          next_review_date?: string | null
          priority?: number | null
          requirement?: string
          reviewed_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gdpr_compliance_checklist_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      headless_agent_prompt_assignments: {
        Row: {
          agent_key: string
          assigned_by: string | null
          content_override: string | null
          created_at: string
          id: string
          is_enabled: boolean
          priority: number
          section_id: string
          updated_at: string
        }
        Insert: {
          agent_key: string
          assigned_by?: string | null
          content_override?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          priority?: number
          section_id: string
          updated_at?: string
        }
        Update: {
          agent_key?: string
          assigned_by?: string | null
          content_override?: string | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          priority?: number
          section_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "headless_agent_prompt_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "headless_agent_prompt_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "headless_prompt_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      headless_prompt_sections: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "headless_prompt_sections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "headless_prompt_sections_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      ide_clients: {
        Row: {
          created_at: string
          created_by: string | null
          default_agent_template_id: string | null
          default_memory_mode: string
          default_protocols: string[]
          description: string | null
          display_name: string
          docs_url: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          mcp_config_hint: Json | null
          name: string
          sync_checksum: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_agent_template_id?: string | null
          default_memory_mode?: string
          default_protocols?: string[]
          description?: string | null
          display_name: string
          docs_url?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          mcp_config_hint?: Json | null
          name: string
          sync_checksum?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_agent_template_id?: string | null
          default_memory_mode?: string
          default_protocols?: string[]
          description?: string | null
          display_name?: string
          docs_url?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          mcp_config_hint?: Json | null
          name?: string
          sync_checksum?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ide_clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ide_clients_default_agent_template_id_fkey"
            columns: ["default_agent_template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ide_clients_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      ide_specialist_registry: {
        Row: {
          agent_template_id: string
          created_at: string
          id: string
          ide_client_name: string
          is_recommended: boolean
          is_system: boolean
          min_plan_tier: string
          priority: number
          specialization_notes: string | null
          updated_at: string
        }
        Insert: {
          agent_template_id: string
          created_at?: string
          id?: string
          ide_client_name: string
          is_recommended?: boolean
          is_system?: boolean
          min_plan_tier?: string
          priority?: number
          specialization_notes?: string | null
          updated_at?: string
        }
        Update: {
          agent_template_id?: string
          created_at?: string
          id?: string
          ide_client_name?: string
          is_recommended?: boolean
          is_system?: boolean
          min_plan_tier?: string
          priority?: number
          specialization_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ide_specialist_registry_agent_template_id_fkey"
            columns: ["agent_template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          item_type: string | null
          license_id: string | null
          metadata: Json | null
          quantity: number | null
          unit_price: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          item_type?: string | null
          license_id?: string | null
          metadata?: Json | null
          quantity?: number | null
          unit_price: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          item_type?: string | null
          license_id?: string | null
          metadata?: Json | null
          quantity?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "user_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string | null
          currency: string | null
          discount: number | null
          due_date: string | null
          hosted_invoice_url: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          line_items: Json | null
          paid_at: string | null
          payment_method_id: string | null
          pdf_url: string | null
          period_end: string
          period_start: string
          status: string | null
          stripe_invoice_id: string | null
          subtotal: number
          tax: number | null
          total: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          discount?: number | null
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          line_items?: Json | null
          paid_at?: string | null
          payment_method_id?: string | null
          pdf_url?: string | null
          period_end: string
          period_start: string
          status?: string | null
          stripe_invoice_id?: string | null
          subtotal: number
          tax?: number | null
          total: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          discount?: number | null
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          line_items?: Json | null
          paid_at?: string | null
          payment_method_id?: string | null
          pdf_url?: string | null
          period_end?: string
          period_start?: string
          status?: string | null
          stripe_invoice_id?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_articles: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          helpful_count: number | null
          id: string
          is_featured: boolean | null
          meta_description: string | null
          meta_title: string | null
          not_helpful_count: number | null
          published_at: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string | null
          version: number | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          not_helpful_count?: number | null
          published_at?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          not_helpful_count?: number | null
          published_at?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_published: boolean | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      license_activations: {
        Row: {
          activated_at: string | null
          app_version: string | null
          deactivated_at: string | null
          deactivated_reason: string | null
          device_id: string
          device_name: string | null
          device_type: string | null
          heartbeat_interval: number | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_seen_at: string | null
          license_id: string
          platform: string | null
          platform_version: string | null
          user_agent: string | null
        }
        Insert: {
          activated_at?: string | null
          app_version?: string | null
          deactivated_at?: string | null
          deactivated_reason?: string | null
          device_id: string
          device_name?: string | null
          device_type?: string | null
          heartbeat_interval?: number | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_seen_at?: string | null
          license_id: string
          platform?: string | null
          platform_version?: string | null
          user_agent?: string | null
        }
        Update: {
          activated_at?: string | null
          app_version?: string | null
          deactivated_at?: string | null
          deactivated_reason?: string | null
          device_id?: string
          device_name?: string | null
          device_type?: string | null
          heartbeat_interval?: number | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_seen_at?: string | null
          license_id?: string
          platform?: string | null
          platform_version?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "license_activations_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "user_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      license_usage_events: {
        Row: {
          created_at: string | null
          device_id: string | null
          event_type: string
          id: string
          license_id: string
          metadata: Json | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          event_type: string
          id?: string
          license_id: string
          metadata?: Json | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          event_type?: string
          id?: string
          license_id?: string
          metadata?: Json | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "license_usage_events_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "user_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      managed_ai_keys: {
        Row: {
          api_key: string
          created_at: string | null
          current_daily_spend_usd: number | null
          current_monthly_spend_usd: number | null
          daily_budget_usd: number | null
          encrypted_key: string | null
          error_count: number | null
          id: string
          is_active: boolean | null
          is_healthy: boolean | null
          key_name: string
          last_error: string | null
          last_error_at: string | null
          last_used_at: string | null
          max_concurrent_requests: number | null
          max_requests_per_minute: number | null
          monthly_budget_usd: number | null
          notes: string | null
          priority: number | null
          provider: string
          spend_reset_at: string | null
          tags: string[] | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          api_key: string
          created_at?: string | null
          current_daily_spend_usd?: number | null
          current_monthly_spend_usd?: number | null
          daily_budget_usd?: number | null
          encrypted_key?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          is_healthy?: boolean | null
          key_name: string
          last_error?: string | null
          last_error_at?: string | null
          last_used_at?: string | null
          max_concurrent_requests?: number | null
          max_requests_per_minute?: number | null
          monthly_budget_usd?: number | null
          notes?: string | null
          priority?: number | null
          provider: string
          spend_reset_at?: string | null
          tags?: string[] | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          current_daily_spend_usd?: number | null
          current_monthly_spend_usd?: number | null
          daily_budget_usd?: number | null
          encrypted_key?: string | null
          error_count?: number | null
          id?: string
          is_active?: boolean | null
          is_healthy?: boolean | null
          key_name?: string
          last_error?: string | null
          last_error_at?: string | null
          last_used_at?: string | null
          max_concurrent_requests?: number | null
          max_requests_per_minute?: number | null
          monthly_budget_usd?: number | null
          notes?: string | null
          priority?: number | null
          provider?: string
          spend_reset_at?: string | null
          tags?: string[] | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      notification_delivery_log: {
        Row: {
          channel: string
          delivered_at: string | null
          email_queue_id: string | null
          id: string
          interacted_at: string | null
          notification_type: string
          sent_at: string | null
          status: string | null
          template_key: string | null
          user_id: string | null
          user_notification_id: string | null
        }
        Insert: {
          channel: string
          delivered_at?: string | null
          email_queue_id?: string | null
          id?: string
          interacted_at?: string | null
          notification_type: string
          sent_at?: string | null
          status?: string | null
          template_key?: string | null
          user_id?: string | null
          user_notification_id?: string | null
        }
        Update: {
          channel?: string
          delivered_at?: string | null
          email_queue_id?: string | null
          id?: string
          interacted_at?: string | null
          notification_type?: string
          sent_at?: string | null
          status?: string | null
          template_key?: string | null
          user_id?: string | null
          user_notification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_log_email_queue_id_fkey"
            columns: ["email_queue_id"]
            isOneToOne: false
            referencedRelation: "email_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_delivery_log_user_notification_id_fkey"
            columns: ["user_notification_id"]
            isOneToOne: false
            referencedRelation: "user_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          digest_frequency: string | null
          email_notifications_enabled: boolean | null
          id: string
          in_app_notifications_enabled: boolean | null
          marketing_emails_enabled: boolean | null
          notify_license_changes: boolean | null
          notify_low_balance: boolean | null
          notify_payment_updates: boolean | null
          notify_support_replies: boolean | null
          notify_team_invites: boolean | null
          notify_usage_alerts: boolean | null
          product_updates_enabled: boolean | null
          push_notifications_enabled: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          quiet_hours_timezone: string | null
          show_notification_badge: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          digest_frequency?: string | null
          email_notifications_enabled?: boolean | null
          id?: string
          in_app_notifications_enabled?: boolean | null
          marketing_emails_enabled?: boolean | null
          notify_license_changes?: boolean | null
          notify_low_balance?: boolean | null
          notify_payment_updates?: boolean | null
          notify_support_replies?: boolean | null
          notify_team_invites?: boolean | null
          notify_usage_alerts?: boolean | null
          product_updates_enabled?: boolean | null
          push_notifications_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quiet_hours_timezone?: string | null
          show_notification_badge?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          digest_frequency?: string | null
          email_notifications_enabled?: boolean | null
          id?: string
          in_app_notifications_enabled?: boolean | null
          marketing_emails_enabled?: boolean | null
          notify_license_changes?: boolean | null
          notify_low_balance?: boolean | null
          notify_payment_updates?: boolean | null
          notify_support_replies?: boolean | null
          notify_team_invites?: boolean | null
          notify_usage_alerts?: boolean | null
          product_updates_enabled?: boolean | null
          push_notifications_enabled?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          quiet_hours_timezone?: string | null
          show_notification_badge?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          action_url_template: string | null
          category: string | null
          created_at: string | null
          default_variables: Json | null
          description: string | null
          html_template: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          message_template: string | null
          name: string
          notification_type: string
          required_variables: string[] | null
          subject_template: string | null
          template_key: string
          text_template: string | null
          title_template: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          action_url_template?: string | null
          category?: string | null
          created_at?: string | null
          default_variables?: Json | null
          description?: string | null
          html_template?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          message_template?: string | null
          name: string
          notification_type: string
          required_variables?: string[] | null
          subject_template?: string | null
          template_key: string
          text_template?: string | null
          title_template?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          action_url_template?: string | null
          category?: string | null
          created_at?: string | null
          default_variables?: Json | null
          description?: string | null
          html_template?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          message_template?: string | null
          name?: string
          notification_type?: string
          required_variables?: string[] | null
          subject_template?: string | null
          template_key?: string
          text_template?: string | null
          title_template?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      oauth_clients: {
        Row: {
          allowed_scopes: string[] | null
          client_id: string
          client_name: string
          client_secret: string
          client_type: string | null
          created_at: string | null
          description: string | null
          homepage_url: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          redirect_uris: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allowed_scopes?: string[] | null
          client_id: string
          client_name: string
          client_secret: string
          client_type?: string | null
          created_at?: string | null
          description?: string | null
          homepage_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          redirect_uris: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allowed_scopes?: string[] | null
          client_id?: string
          client_name?: string
          client_secret?: string
          client_type?: string | null
          created_at?: string | null
          description?: string | null
          homepage_url?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          redirect_uris?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      oauth_tokens: {
        Row: {
          access_token: string
          client_id: string
          created_at: string | null
          expires_at: string
          id: string
          is_revoked: boolean | null
          refresh_token: string | null
          revoked_at: string | null
          scopes: string[]
          user_id: string
        }
        Insert: {
          access_token: string
          client_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          is_revoked?: boolean | null
          refresh_token?: string | null
          revoked_at?: string | null
          scopes: string[]
          user_id: string
        }
        Update: {
          access_token?: string
          client_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_revoked?: boolean | null
          refresh_token?: string | null
          revoked_at?: string | null
          scopes?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["client_id"]
          },
        ]
      }
      payment_disputes: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          evidence_details: string | null
          evidence_submitted_at: string | null
          id: string
          reason: string
          responded_by: string | null
          response_by_date: string | null
          status: string | null
          stripe_dispute_id: string
          transaction_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          evidence_details?: string | null
          evidence_submitted_at?: string | null
          id?: string
          reason: string
          responded_by?: string | null
          response_by_date?: string | null
          status?: string | null
          stripe_dispute_id: string
          transaction_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          evidence_details?: string | null
          evidence_submitted_at?: string | null
          id?: string
          reason?: string
          responded_by?: string | null
          response_by_date?: string | null
          status?: string | null
          stripe_dispute_id?: string
          transaction_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_disputes_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_disputes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          bank_last4: string | null
          bank_name: string | null
          billing_address: Json | null
          billing_email: string | null
          billing_name: string | null
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          is_verified: boolean | null
          stripe_customer_id: string | null
          stripe_payment_method_id: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bank_last4?: string | null
          bank_name?: string | null
          billing_address?: Json | null
          billing_email?: string | null
          billing_name?: string | null
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          stripe_customer_id?: string | null
          stripe_payment_method_id: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bank_last4?: string | null
          bank_name?: string | null
          billing_address?: Json | null
          billing_email?: string | null
          billing_name?: string | null
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_stripe_customer_id_fkey"
            columns: ["stripe_customer_id"]
            isOneToOne: false
            referencedRelation: "stripe_customers"
            referencedColumns: ["stripe_customer_id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          failed_at: string | null
          failure_code: string | null
          failure_message: string | null
          id: string
          license_id: string | null
          metadata: Json | null
          payment_method_id: string | null
          payment_provider: string | null
          status: string | null
          stripe_charge_id: string | null
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          succeeded_at: string | null
          token_purchase_id: string | null
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          failed_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          license_id?: string | null
          metadata?: Json | null
          payment_method_id?: string | null
          payment_provider?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          succeeded_at?: string | null
          token_purchase_id?: string | null
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          failed_at?: string | null
          failure_code?: string | null
          failure_message?: string | null
          id?: string
          license_id?: string | null
          metadata?: Json | null
          payment_method_id?: string | null
          payment_provider?: string | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          succeeded_at?: string | null
          token_purchase_id?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "user_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_token_purchase_id_fkey"
            columns: ["token_purchase_id"]
            isOneToOne: false
            referencedRelation: "token_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          app_version: string | null
          component: string | null
          device_id: string | null
          id: string
          measured_at: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number
          operation: string | null
          p50: number | null
          p90: number | null
          p95: number | null
          p99: number | null
          platform: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          component?: string | null
          device_id?: string | null
          id?: string
          measured_at?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          operation?: string | null
          p50?: number | null
          p90?: number | null
          p95?: number | null
          p99?: number | null
          platform?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          component?: string | null
          device_id?: string | null
          id?: string
          measured_at?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          operation?: string | null
          p50?: number | null
          p90?: number | null
          p95?: number | null
          p99?: number | null
          platform?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          allowed_specialist_ids: string[] | null
          allowed_template_ids: string[] | null
          badge: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          max_agents: number | null
          max_ai_calls_per_month: number | null
          max_conversations_per_month: number | null
          max_devices: number | null
          max_members_default: number | null
          max_token_usage_per_month: number | null
          name: string
          price_monthly: number | null
          price_monthly_byok: number | null
          price_yearly: number | null
          price_yearly_byok: number | null
          requires_organization: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_specialist_ids?: string[] | null
          allowed_template_ids?: string[] | null
          badge?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_agents?: number | null
          max_ai_calls_per_month?: number | null
          max_conversations_per_month?: number | null
          max_devices?: number | null
          max_members_default?: number | null
          max_token_usage_per_month?: number | null
          name: string
          price_monthly?: number | null
          price_monthly_byok?: number | null
          price_yearly?: number | null
          price_yearly_byok?: number | null
          requires_organization?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_specialist_ids?: string[] | null
          allowed_template_ids?: string[] | null
          badge?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          max_agents?: number | null
          max_ai_calls_per_month?: number | null
          max_conversations_per_month?: number | null
          max_devices?: number | null
          max_members_default?: number | null
          max_token_usage_per_month?: number | null
          name?: string
          price_monthly?: number | null
          price_monthly_byok?: number | null
          price_yearly?: number | null
          price_yearly_byok?: number | null
          requires_organization?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          failed_login_attempts: number | null
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          locked_until: string | null
          notes: string | null
          password_hash: string | null
          permissions: Json | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          failed_login_attempts?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          locked_until?: string | null
          notes?: string | null
          password_hash?: string | null
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          failed_login_attempts?: number | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          locked_until?: string | null
          notes?: string | null
          password_hash?: string | null
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_admins_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_metrics: {
        Row: {
          dimensions: Json | null
          granularity: string | null
          id: string
          metric_name: string
          metric_unit: string | null
          metric_value: number
          period_end: string
          period_start: string
          recorded_at: string | null
        }
        Insert: {
          dimensions?: Json | null
          granularity?: string | null
          id?: string
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          period_end: string
          period_start: string
          recorded_at?: string | null
        }
        Update: {
          dimensions?: Json | null
          granularity?: string | null
          id?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          period_end?: string
          period_start?: string
          recorded_at?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          category: string | null
          description: string | null
          is_sensitive: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string | null
          description?: string | null
          is_sensitive?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string | null
          description?: string | null
          is_sensitive?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_id: string
          referred_reward_tokens: number | null
          referrer_id: string
          referrer_reward_tokens: number | null
          reward_given_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_id: string
          referred_reward_tokens?: number | null
          referrer_id: string
          referrer_reward_tokens?: number | null
          reward_given_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_id?: string
          referred_reward_tokens?: number | null
          referrer_id?: string
          referrer_reward_tokens?: number | null
          reward_given_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          created_at: string | null
          currency: string | null
          failure_reason: string | null
          id: string
          license_id: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string
          reason_details: string | null
          refund_amount: number
          status: string | null
          stripe_refund_id: string | null
          token_purchase_id: string | null
          transaction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          license_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          reason_details?: string | null
          refund_amount: number
          status?: string | null
          stripe_refund_id?: string | null
          token_purchase_id?: string | null
          transaction_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          license_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          reason_details?: string | null
          refund_amount?: number
          status?: string | null
          stripe_refund_id?: string | null
          token_purchase_id?: string | null
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "user_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_token_purchase_id_fkey"
            columns: ["token_purchase_id"]
            isOneToOne: false
            referencedRelation: "token_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_policies: {
        Row: {
          applies_to_category: string[] | null
          applies_to_plan: string[] | null
          applies_to_priority: string[] | null
          business_days: string[] | null
          business_hours_end: string | null
          business_hours_only: boolean | null
          business_hours_start: string | null
          created_at: string | null
          description: string | null
          first_response_time: number
          id: string
          is_active: boolean | null
          name: string
          resolution_time: number
          updated_at: string | null
        }
        Insert: {
          applies_to_category?: string[] | null
          applies_to_plan?: string[] | null
          applies_to_priority?: string[] | null
          business_days?: string[] | null
          business_hours_end?: string | null
          business_hours_only?: boolean | null
          business_hours_start?: string | null
          created_at?: string | null
          description?: string | null
          first_response_time: number
          id?: string
          is_active?: boolean | null
          name: string
          resolution_time: number
          updated_at?: string | null
        }
        Update: {
          applies_to_category?: string[] | null
          applies_to_plan?: string[] | null
          applies_to_priority?: string[] | null
          business_days?: string[] | null
          business_hours_end?: string | null
          business_hours_only?: boolean | null
          business_hours_start?: string | null
          created_at?: string | null
          description?: string | null
          first_response_time?: number
          id?: string
          is_active?: boolean | null
          name?: string
          resolution_time?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          currency: string | null
          default_payment_method_id: string | null
          delinquent_since: string | null
          email: string | null
          id: string
          is_delinquent: boolean | null
          name: string | null
          payment_methods: Json | null
          stripe_customer_id: string
          stripe_metadata: Json | null
          tax_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          default_payment_method_id?: string | null
          delinquent_since?: string | null
          email?: string | null
          id?: string
          is_delinquent?: boolean | null
          name?: string | null
          payment_methods?: Json | null
          stripe_customer_id: string
          stripe_metadata?: Json | null
          tax_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          default_payment_method_id?: string | null
          delinquent_since?: string | null
          email?: string | null
          id?: string
          is_delinquent?: boolean | null
          name?: string | null
          payment_methods?: Json | null
          stripe_customer_id?: string
          stripe_metadata?: Json | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          category: string | null
          closed_at: string | null
          created_at: string | null
          description: string
          id: string
          last_agent_reply_at: string | null
          last_customer_reply_at: string | null
          license_id: string | null
          metadata: Json | null
          priority: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          satisfaction_feedback: string | null
          satisfaction_rating: number | null
          status: string | null
          subject: string
          tags: string[] | null
          ticket_number: string
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string | null
          description: string
          id?: string
          last_agent_reply_at?: string | null
          last_customer_reply_at?: string | null
          license_id?: string | null
          metadata?: Json | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          satisfaction_feedback?: string | null
          satisfaction_rating?: number | null
          status?: string | null
          subject: string
          tags?: string[] | null
          ticket_number: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string | null
          description?: string
          id?: string
          last_agent_reply_at?: string | null
          last_customer_reply_at?: string | null
          license_id?: string | null
          metadata?: Json | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          satisfaction_feedback?: string | null
          satisfaction_rating?: number | null
          status?: string | null
          subject?: string
          tags?: string[] | null
          ticket_number?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "user_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "platform_admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health_checks: {
        Row: {
          checked_at: string | null
          details: Json | null
          error_rate: number | null
          id: string
          response_time_ms: number | null
          service_name: string
          status: string
        }
        Insert: {
          checked_at?: string | null
          details?: Json | null
          error_rate?: number | null
          id?: string
          response_time_ms?: number | null
          service_name: string
          status: string
        }
        Update: {
          checked_at?: string | null
          details?: Json | null
          error_rate?: number | null
          id?: string
          response_time_ms?: number | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      tax_rates: {
        Row: {
          country_code: string
          created_at: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          is_active: boolean | null
          percentage: number
          state_code: string | null
          stripe_tax_rate_id: string | null
          tax_type: string
          updated_at: string | null
        }
        Insert: {
          country_code: string
          created_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          percentage: number
          state_code?: string | null
          stripe_tax_rate_id?: string | null
          tax_type: string
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          percentage?: number
          state_code?: string | null
          stripe_tax_rate_id?: string | null
          tax_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      team_activity_log: {
        Row: {
          activity_description: string | null
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          team_id: string
          user_id: string | null
        }
        Insert: {
          activity_description?: string | null
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          team_id: string
          user_id?: string | null
        }
        Update: {
          activity_description?: string | null
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          team_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitation_log: {
        Row: {
          expires_at: string | null
          id: string
          invited_by: string
          invited_email: string
          message: string | null
          responded_at: string | null
          role: string
          sent_at: string | null
          status: string | null
          team_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          invited_by: string
          invited_email: string
          message?: string | null
          responded_at?: string | null
          role: string
          sent_at?: string | null
          status?: string | null
          team_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          invited_by?: string
          invited_email?: string
          message?: string | null
          responded_at?: string | null
          role?: string
          sent_at?: string | null
          status?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitation_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_token_usage: {
        Row: {
          id: string
          service: string
          team_id: string
          tokens_used: number
          usage_date: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          service: string
          team_id: string
          tokens_used: number
          usage_date?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          service?: string
          team_id?: string
          tokens_used?: number
          usage_date?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_token_usage_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          can_create_agents: boolean | null
          can_manage_billing: boolean | null
          can_manage_members: boolean | null
          can_share_conversations: boolean | null
          can_use_team_tokens: boolean | null
          created_at: string | null
          custom_permissions: Json | null
          id: string
          invitation_accepted_at: string | null
          invitation_expires_at: string | null
          invitation_sent_at: string | null
          invitation_token: string | null
          invited_by: string | null
          joined_at: string | null
          last_active_at: string | null
          left_at: string | null
          role: string | null
          status: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          can_create_agents?: boolean | null
          can_manage_billing?: boolean | null
          can_manage_members?: boolean | null
          can_share_conversations?: boolean | null
          can_use_team_tokens?: boolean | null
          created_at?: string | null
          custom_permissions?: Json | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_expires_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_active_at?: string | null
          left_at?: string | null
          role?: string | null
          status?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          can_create_agents?: boolean | null
          can_manage_billing?: boolean | null
          can_manage_members?: boolean | null
          can_share_conversations?: boolean | null
          can_use_team_tokens?: boolean | null
          created_at?: string | null
          custom_permissions?: Json | null
          id?: string
          invitation_accepted_at?: string | null
          invitation_expires_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          invited_by?: string | null
          joined_at?: string | null
          last_active_at?: string | null
          left_at?: string | null
          role?: string | null
          status?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_shared_agents: {
        Row: {
          access_level: string | null
          agent_id: string
          agent_name: string
          allowed_members: string[] | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          shared_at: string | null
          shared_by: string
          team_id: string
        }
        Insert: {
          access_level?: string | null
          agent_id: string
          agent_name: string
          allowed_members?: string[] | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          shared_at?: string | null
          shared_by: string
          team_id: string
        }
        Update: {
          access_level?: string | null
          agent_id?: string
          agent_name?: string
          allowed_members?: string[] | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          shared_at?: string | null
          shared_by?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_shared_agents_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_token_pools: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_purchase_at: string | null
          last_usage_at: string | null
          per_member_daily_limit: number | null
          per_member_monthly_limit: number | null
          team_id: string
          token_balance: number | null
          total_purchased: number | null
          total_used: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_purchase_at?: string | null
          last_usage_at?: string | null
          per_member_daily_limit?: number | null
          per_member_monthly_limit?: number | null
          team_id: string
          token_balance?: number | null
          total_purchased?: number | null
          total_used?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_purchase_at?: string | null
          last_usage_at?: string | null
          per_member_daily_limit?: number | null
          per_member_monthly_limit?: number | null
          team_id?: string
          token_balance?: number | null
          total_purchased?: number | null
          total_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_token_pools_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          avatar_url: string | null
          billing_email: string | null
          billing_user_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_agents: number | null
          max_members: number | null
          max_shared_conversations: number | null
          member_can_invite: boolean | null
          name: string
          owner_id: string
          plan_id: string | null
          settings: Json | null
          shared_ai_keys: boolean | null
          shared_token_pool: boolean | null
          slug: string
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          billing_email?: string | null
          billing_user_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_agents?: number | null
          max_members?: number | null
          max_shared_conversations?: number | null
          member_can_invite?: boolean | null
          name: string
          owner_id: string
          plan_id?: string | null
          settings?: Json | null
          shared_ai_keys?: boolean | null
          shared_token_pool?: boolean | null
          slug: string
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          billing_email?: string | null
          billing_user_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_agents?: number | null
          max_members?: number | null
          max_shared_conversations?: number | null
          member_can_invite?: boolean | null
          name?: string
          owner_id?: string
          plan_id?: string | null
          settings?: Json | null
          shared_ai_keys?: boolean | null
          shared_token_pool?: boolean | null
          slug?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          attachments: Json | null
          author_id: string | null
          author_name: string | null
          author_type: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          message: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          author_id?: string | null
          author_name?: string | null
          author_type: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          author_id?: string | null
          author_name?: string | null
          author_type?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_sla_tracking: {
        Row: {
          first_response_at: string | null
          first_response_breached: boolean | null
          first_response_due_at: string | null
          id: string
          resolution_breached: boolean | null
          resolution_due_at: string | null
          resolved_at: string | null
          sla_policy_id: string
          started_at: string | null
          ticket_id: string
        }
        Insert: {
          first_response_at?: string | null
          first_response_breached?: boolean | null
          first_response_due_at?: string | null
          id?: string
          resolution_breached?: boolean | null
          resolution_due_at?: string | null
          resolved_at?: string | null
          sla_policy_id: string
          started_at?: string | null
          ticket_id: string
        }
        Update: {
          first_response_at?: string | null
          first_response_breached?: boolean | null
          first_response_due_at?: string | null
          id?: string
          resolution_breached?: boolean | null
          resolution_due_at?: string | null
          resolved_at?: string | null
          sla_policy_id?: string
          started_at?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_sla_tracking_sla_policy_id_fkey"
            columns: ["sla_policy_id"]
            isOneToOne: false
            referencedRelation: "sla_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_sla_tracking_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          use_count: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          use_count?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          use_count?: number | null
        }
        Relationships: []
      }
      token_packages: {
        Row: {
          badge: string | null
          bonus_percentage: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_best_value: boolean | null
          is_popular: boolean | null
          name: string
          price: number
          price_per_1k_tokens: number | null
          token_amount: number
          total_tokens: number | null
          updated_at: string | null
        }
        Insert: {
          badge?: string | null
          bonus_percentage?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          id: string
          is_active?: boolean | null
          is_best_value?: boolean | null
          is_popular?: boolean | null
          name: string
          price: number
          price_per_1k_tokens?: number | null
          token_amount: number
          total_tokens?: number | null
          updated_at?: string | null
        }
        Update: {
          badge?: string | null
          bonus_percentage?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_best_value?: boolean | null
          is_popular?: boolean | null
          name?: string
          price?: number
          price_per_1k_tokens?: number | null
          token_amount?: number
          total_tokens?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      token_purchases: {
        Row: {
          amount_paid: number
          bonus_tokens: number | null
          completed_at: string | null
          currency: string | null
          discount_amount: number | null
          discount_code: string | null
          id: string
          ip_address: unknown
          payment_id: string | null
          payment_method: string | null
          payment_provider: string
          payment_status: string | null
          price_per_1k_tokens: number | null
          purchased_at: string | null
          refund_amount: number | null
          refund_id: string | null
          refund_reason: string | null
          refunded_at: string | null
          tokens_purchased: number
          total_tokens: number | null
          user_agent: string | null
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount_paid: number
          bonus_tokens?: number | null
          completed_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          id?: string
          ip_address?: unknown
          payment_id?: string | null
          payment_method?: string | null
          payment_provider: string
          payment_status?: string | null
          price_per_1k_tokens?: number | null
          purchased_at?: string | null
          refund_amount?: number | null
          refund_id?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          tokens_purchased: number
          total_tokens?: number | null
          user_agent?: string | null
          user_id: string
          wallet_id: string
        }
        Update: {
          amount_paid?: number
          bonus_tokens?: number | null
          completed_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          discount_code?: string | null
          id?: string
          ip_address?: unknown
          payment_id?: string | null
          payment_method?: string | null
          payment_provider?: string
          payment_status?: string | null
          price_per_1k_tokens?: number | null
          purchased_at?: string | null
          refund_amount?: number | null
          refund_id?: string | null
          refund_reason?: string | null
          refunded_at?: string | null
          tokens_purchased?: number
          total_tokens?: number | null
          user_agent?: string | null
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_purchases_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "token_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      token_usage_logs: {
        Row: {
          agent_id: string | null
          balance_after: number
          balance_before: number
          conversation_id: string | null
          device_id: string | null
          id: string
          operation: string | null
          service: string
          tokens_used: number
          used_at: string | null
          user_id: string
          wallet_id: string
        }
        Insert: {
          agent_id?: string | null
          balance_after: number
          balance_before: number
          conversation_id?: string | null
          device_id?: string | null
          id?: string
          operation?: string | null
          service: string
          tokens_used: number
          used_at?: string | null
          user_id: string
          wallet_id: string
        }
        Update: {
          agent_id?: string | null
          balance_after?: number
          balance_before?: number
          conversation_id?: string | null
          device_id?: string | null
          id?: string
          operation?: string | null
          service?: string
          tokens_used?: number
          used_at?: string | null
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_usage_logs_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "token_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      token_wallets: {
        Row: {
          auto_refill_enabled: boolean | null
          auto_refill_threshold: number | null
          created_at: string | null
          frozen_at: string | null
          frozen_reason: string | null
          id: string
          is_frozen: boolean | null
          last_purchase_at: string | null
          last_usage_at: string | null
          low_balance_alert_sent: boolean | null
          low_balance_threshold: number | null
          refill_amount: number | null
          refill_payment_method_id: string | null
          token_balance: number | null
          total_purchased: number | null
          total_refunded: number | null
          total_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_refill_enabled?: boolean | null
          auto_refill_threshold?: number | null
          created_at?: string | null
          frozen_at?: string | null
          frozen_reason?: string | null
          id?: string
          is_frozen?: boolean | null
          last_purchase_at?: string | null
          last_usage_at?: string | null
          low_balance_alert_sent?: boolean | null
          low_balance_threshold?: number | null
          refill_amount?: number | null
          refill_payment_method_id?: string | null
          token_balance?: number | null
          total_purchased?: number | null
          total_refunded?: number | null
          total_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_refill_enabled?: boolean | null
          auto_refill_threshold?: number | null
          created_at?: string | null
          frozen_at?: string | null
          frozen_reason?: string | null
          id?: string
          is_frozen?: boolean | null
          last_purchase_at?: string | null
          last_usage_at?: string | null
          low_balance_alert_sent?: boolean | null
          low_balance_threshold?: number | null
          refill_amount?: number | null
          refill_payment_method_id?: string | null
          token_balance?: number | null
          total_purchased?: number | null
          total_refunded?: number | null
          total_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_agent_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assignment_type: string
          config_overrides: Json
          custom_core_prompt: string | null
          id: string
          is_active: boolean
          revoked_at: string | null
          revoked_by: string | null
          template_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_type?: string
          config_overrides?: Json
          custom_core_prompt?: string | null
          id?: string
          is_active?: boolean
          revoked_at?: string | null
          revoked_by?: string | null
          template_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_type?: string
          config_overrides?: Json
          custom_core_prompt?: string | null
          id?: string
          is_active?: boolean
          revoked_at?: string | null
          revoked_by?: string | null
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_agent_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_agent_events: {
        Row: {
          agent_name: string
          app_version: string | null
          created_at: string
          device_id: string | null
          device_name: string | null
          event_type: string
          from_factory_version: number | null
          id: string
          memories_added: number | null
          memories_removed: number | null
          memories_updated: number | null
          metadata: Json
          os_type: string | null
          source: string
          template_id: string | null
          to_factory_version: number | null
          user_id: string
        }
        Insert: {
          agent_name: string
          app_version?: string | null
          created_at?: string
          device_id?: string | null
          device_name?: string | null
          event_type: string
          from_factory_version?: number | null
          id?: string
          memories_added?: number | null
          memories_removed?: number | null
          memories_updated?: number | null
          metadata?: Json
          os_type?: string | null
          source?: string
          template_id?: string | null
          to_factory_version?: number | null
          user_id: string
        }
        Update: {
          agent_name?: string
          app_version?: string | null
          created_at?: string
          device_id?: string | null
          device_name?: string | null
          event_type?: string
          from_factory_version?: number | null
          id?: string
          memories_added?: number | null
          memories_removed?: number | null
          memories_updated?: number | null
          metadata?: Json
          os_type?: string | null
          source?: string
          template_id?: string | null
          to_factory_version?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_agent_events_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ai_preferences: {
        Row: {
          alert_email: string | null
          alert_threshold_percentage: number | null
          created_at: string | null
          daily_spending_limit_usd: number | null
          default_model: string | null
          default_provider: string | null
          fallback_model: string | null
          fallback_provider: string | null
          high_spend_alerts_enabled: boolean | null
          id: string
          image_generation_enabled: boolean | null
          low_balance_alerts_enabled: boolean | null
          max_requests_per_day: number | null
          max_requests_per_hour: number | null
          max_tokens: number | null
          monthly_spending_limit_usd: number | null
          per_request_limit_usd: number | null
          streaming_enabled: boolean | null
          temperature: number | null
          updated_at: string | null
          usage_alerts_enabled: boolean | null
          user_id: string
        }
        Insert: {
          alert_email?: string | null
          alert_threshold_percentage?: number | null
          created_at?: string | null
          daily_spending_limit_usd?: number | null
          default_model?: string | null
          default_provider?: string | null
          fallback_model?: string | null
          fallback_provider?: string | null
          high_spend_alerts_enabled?: boolean | null
          id?: string
          image_generation_enabled?: boolean | null
          low_balance_alerts_enabled?: boolean | null
          max_requests_per_day?: number | null
          max_requests_per_hour?: number | null
          max_tokens?: number | null
          monthly_spending_limit_usd?: number | null
          per_request_limit_usd?: number | null
          streaming_enabled?: boolean | null
          temperature?: number | null
          updated_at?: string | null
          usage_alerts_enabled?: boolean | null
          user_id: string
        }
        Update: {
          alert_email?: string | null
          alert_threshold_percentage?: number | null
          created_at?: string | null
          daily_spending_limit_usd?: number | null
          default_model?: string | null
          default_provider?: string | null
          fallback_model?: string | null
          fallback_provider?: string | null
          high_spend_alerts_enabled?: boolean | null
          id?: string
          image_generation_enabled?: boolean | null
          low_balance_alerts_enabled?: boolean | null
          max_requests_per_day?: number | null
          max_requests_per_hour?: number | null
          max_tokens?: number | null
          monthly_spending_limit_usd?: number | null
          per_request_limit_usd?: number | null
          streaming_enabled?: boolean | null
          temperature?: number | null
          updated_at?: string | null
          usage_alerts_enabled?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_engagement_metrics: {
        Row: {
          ai_calls_made: number | null
          avg_session_duration_seconds: number | null
          calculated_at: string | null
          days_active: number | null
          days_since_signup: number | null
          features_used: string[] | null
          id: string
          is_active: boolean | null
          is_retained: boolean | null
          messages_sent: number | null
          period_end: string
          period_start: string
          period_type: string | null
          sessions_count: number | null
          total_session_duration_seconds: number | null
          user_id: string
        }
        Insert: {
          ai_calls_made?: number | null
          avg_session_duration_seconds?: number | null
          calculated_at?: string | null
          days_active?: number | null
          days_since_signup?: number | null
          features_used?: string[] | null
          id?: string
          is_active?: boolean | null
          is_retained?: boolean | null
          messages_sent?: number | null
          period_end: string
          period_start: string
          period_type?: string | null
          sessions_count?: number | null
          total_session_duration_seconds?: number | null
          user_id: string
        }
        Update: {
          ai_calls_made?: number | null
          avg_session_duration_seconds?: number | null
          calculated_at?: string | null
          days_active?: number | null
          days_since_signup?: number | null
          features_used?: string[] | null
          id?: string
          is_active?: boolean | null
          is_retained?: boolean | null
          messages_sent?: number | null
          period_end?: string
          period_start?: string
          period_type?: string | null
          sessions_count?: number | null
          total_session_duration_seconds?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_licenses: {
        Row: {
          activated_at: string | null
          ai_calls_used: number | null
          amount_paid: number | null
          billing_cycle: string | null
          cancelled_at: string | null
          conversations_created: number | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          expires_at: string | null
          id: string
          is_byok: boolean | null
          is_trial: boolean | null
          license_key: string
          limit_reset_at: string | null
          next_billing_date: string | null
          payment_method: string | null
          plan_id: string
          status: string | null
          stripe_subscription_id: string | null
          tokens_used: number | null
          trial_converted: boolean | null
          trial_ends_at: string | null
          updated_at: string | null
          usage_limit_reached: boolean | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          ai_calls_used?: number | null
          amount_paid?: number | null
          billing_cycle?: string | null
          cancelled_at?: string | null
          conversations_created?: number | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          expires_at?: string | null
          id?: string
          is_byok?: boolean | null
          is_trial?: boolean | null
          license_key: string
          limit_reset_at?: string | null
          next_billing_date?: string | null
          payment_method?: string | null
          plan_id: string
          status?: string | null
          stripe_subscription_id?: string | null
          tokens_used?: number | null
          trial_converted?: boolean | null
          trial_ends_at?: string | null
          updated_at?: string | null
          usage_limit_reached?: boolean | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          ai_calls_used?: number | null
          amount_paid?: number | null
          billing_cycle?: string | null
          cancelled_at?: string | null
          conversations_created?: number | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          expires_at?: string | null
          id?: string
          is_byok?: boolean | null
          is_trial?: boolean | null
          license_key?: string
          limit_reset_at?: string | null
          next_billing_date?: string | null
          payment_method?: string | null
          plan_id?: string
          status?: string | null
          stripe_subscription_id?: string | null
          tokens_used?: number | null
          trial_converted?: boolean | null
          trial_ends_at?: string | null
          updated_at?: string | null
          usage_limit_reached?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_licenses_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          color: string | null
          created_at: string | null
          dismissed_at: string | null
          expires_at: string | null
          icon: string | null
          id: string
          is_dismissible: boolean | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: number | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          color?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_dismissible?: boolean | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: number | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          color?: string | null
          created_at?: string | null
          dismissed_at?: string | null
          expires_at?: string | null
          icon?: string | null
          id?: string
          is_dismissible?: boolean | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: number | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          ai_personality: string | null
          auto_save_enabled: boolean | null
          beta_features_enabled: boolean | null
          compact_mode: boolean | null
          created_at: string | null
          custom_settings: Json | null
          default_model: string | null
          default_voice: string | null
          desktop_notifications: boolean | null
          developer_mode: boolean | null
          share_usage_data: boolean | null
          show_tips: boolean | null
          sound_enabled: boolean | null
          telemetry_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_personality?: string | null
          auto_save_enabled?: boolean | null
          beta_features_enabled?: boolean | null
          compact_mode?: boolean | null
          created_at?: string | null
          custom_settings?: Json | null
          default_model?: string | null
          default_voice?: string | null
          desktop_notifications?: boolean | null
          developer_mode?: boolean | null
          share_usage_data?: boolean | null
          show_tips?: boolean | null
          sound_enabled?: boolean | null
          telemetry_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_personality?: string | null
          auto_save_enabled?: boolean | null
          beta_features_enabled?: boolean | null
          compact_mode?: boolean | null
          created_at?: string | null
          custom_settings?: Json | null
          default_model?: string | null
          default_voice?: string | null
          desktop_notifications?: boolean | null
          developer_mode?: boolean | null
          share_usage_data?: boolean | null
          show_tips?: boolean | null
          sound_enabled?: boolean | null
          telemetry_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          account_status: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          desktop_app_version: string | null
          display_name: string | null
          email_notifications_enabled: boolean | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          language: string | null
          last_seen_at: string | null
          marketing_emails_enabled: boolean | null
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          onboarding_step: number | null
          ora_key: string
          organization: string | null
          phone_verified: boolean | null
          referral_code: string | null
          referred_by: string | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          account_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          desktop_app_version?: string | null
          display_name?: string | null
          email_notifications_enabled?: boolean | null
          email_verified?: boolean | null
          full_name?: string | null
          id: string
          language?: string | null
          last_seen_at?: string | null
          marketing_emails_enabled?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          onboarding_step?: number | null
          ora_key: string
          organization?: string | null
          phone_verified?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          account_status?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          desktop_app_version?: string | null
          display_name?: string | null
          email_notifications_enabled?: boolean | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          language?: string | null
          last_seen_at?: string | null
          marketing_emails_enabled?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          onboarding_step?: number | null
          ora_key?: string
          organization?: string | null
          phone_verified?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          app_version: string | null
          device_id: string | null
          duration_seconds: number | null
          ended_at: string | null
          events_count: number | null
          features_used: string[] | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          platform: string | null
          session_id: string
          started_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          device_id?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          events_count?: number | null
          features_used?: string[] | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          platform?: string | null
          session_id: string
          started_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          device_id?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          events_count?: number | null
          features_used?: string[] | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          platform?: string | null
          session_id?: string
          started_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_data: Json
          event_type: string
          http_status_code: number | null
          id: string
          max_retries: number | null
          next_retry_at: string | null
          responded_at: string | null
          response_body: string | null
          response_time_ms: number | null
          retry_count: number | null
          sent_at: string | null
          status: string | null
          webhook_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_data: Json
          event_type: string
          http_status_code?: number | null
          id?: string
          max_retries?: number | null
          next_retry_at?: string | null
          responded_at?: string | null
          response_body?: string | null
          response_time_ms?: number | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          webhook_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_data?: Json
          event_type?: string
          http_status_code?: number | null
          id?: string
          max_retries?: number | null
          next_retry_at?: string | null
          responded_at?: string | null
          response_body?: string | null
          response_time_ms?: number | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "api_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_active_subscriptions: {
        Row: {
          active_count: number | null
          mrr: number | null
          paid_count: number | null
          plan_id: string | null
          trial_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_licenses_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_daily_user_engagement: {
        Row: {
          date: string | null
          events_count: number | null
          first_event_at: string | null
          last_event_at: string | null
          sessions_count: number | null
          unique_events: number | null
          user_id: string | null
        }
        Relationships: []
      }
      mv_monthly_revenue: {
        Row: {
          avg_transaction_value: number | null
          month: string | null
          subscription_revenue: number | null
          token_revenue: number | null
          total_revenue: number | null
          transaction_count: number | null
          unique_customers: number | null
        }
        Relationships: []
      }
      mv_popular_kb_articles: {
        Row: {
          category_id: string | null
          helpful_count: number | null
          helpfulness_percentage: number | null
          id: string | null
          not_helpful_count: number | null
          slug: string | null
          title: string | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_installed_agents: {
        Row: {
          agent_name: string | null
          app_version: string | null
          device_id: string | null
          device_name: string | null
          event_type: string | null
          last_event_at: string | null
          os_type: string | null
          source: string | null
          template_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_agent_events_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      v_table_sizes: {
        Row: {
          schemaname: unknown
          size: string | null
          size_bytes: number | null
          tablename: unknown
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_user_mrr: { Args: { p_user_id: string }; Returns: number }
      cleanup_expired_desktop_tokens: { Args: never; Returns: number }
      cleanup_old_telemetry: { Args: never; Returns: number }
      count_active_devices: { Args: { p_license_id: string }; Returns: number }
      deactivate_failing_webhooks: { Args: never; Returns: number }
      expire_old_export_files: { Args: never; Returns: number }
      get_current_period_usage: {
        Args: { p_user_id: string }
        Returns: {
          ai_calls: number
          conversations: number
          tokens_used: number
        }[]
      }
      get_database_stats: {
        Args: never
        Returns: {
          active_subscriptions: number
          open_support_tickets: number
          pending_deletions: number
          pending_exports: number
          total_ai_calls: number
          total_revenue: number
          total_tokens_sold: number
          total_users: number
        }[]
      }
      get_headless_agent_prompt: {
        Args: { p_agent_key: string }
        Returns: {
          category: string
          content: string
          is_override: boolean
          priority: number
          section_id: string
          section_name: string
          section_slug: string
        }[]
      }
      get_ide_clients_for_sync: {
        Args: never
        Returns: {
          default_protocols: string[]
          description: string
          display_name: string
          docs_url: string
          id: string
          is_active: boolean
          logo_url: string
          mcp_config_hint: Json
          name: string
          updated_at: string
        }[]
      }
      get_specialist_for_ide: {
        Args: { p_ide_client_name: string; p_user_id: string }
        Returns: {
          agent_template_id: string
          default_memory_mode: string
          min_plan_tier: string
          priority: number
          registry_id: string
          specialization_notes: string
          template_emoji: string
          template_name: string
        }[]
      }
      get_token_balance_for_update: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_user_accessible_agents: {
        Args: { p_user_id: string }
        Returns: {
          assigned_at: string
          assignment_id: string
          assignment_type: string
          config_overrides: Json
          factory_published_at: string
          factory_version: number
          is_active: boolean
          is_ide_specialist: boolean
          template_category: string
          template_core_prompt: string
          template_description: string
          template_emoji: string
          template_icon_url: string
          template_id: string
          template_name: string
          template_personality: Json
          template_plan_tier: string
          template_tagline: string
          template_tags: string[]
          template_version: string
        }[]
      }
      get_user_by_ora_key: {
        Args: { p_ora_key: string }
        Returns: {
          account_status: string
          email: string
          full_name: string
          license_status: string
          plan_id: string
          user_id: string
        }[]
      }
      get_user_plan_id: { Args: { user_uuid: string }; Returns: string }
      get_user_specialists: {
        Args: { p_user_id: string }
        Returns: {
          agent_template_id: string
          core_prompt: string
          default_memory_mode: string
          ide_client_name: string
          ide_system_prompt: string
          is_recommended: boolean
          min_plan_tier: string
          personality_config: Json
          priority: number
          registry_id: string
          specialization_notes: string
          template_emoji: string
          template_name: string
        }[]
      }
      has_admin_role: { Args: { required_role: string }; Returns: boolean }
      is_license_valid: { Args: { p_license_key: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      is_team_admin: { Args: { team_uuid: string }; Returns: boolean }
      is_team_member: { Args: { team_uuid: string }; Returns: boolean }
      plan_tier_rank: { Args: { p_tier: string }; Returns: number }
      refresh_analytics_views: { Args: never; Returns: undefined }
      reset_daily_ai_spend: { Args: never; Returns: number }
      user_has_organization: { Args: { user_uuid: string }; Returns: boolean }
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

// ─── Convenience type aliases (manually maintained) ──────────────────────────
export type AuditLog = Tables<"admin_audit_logs">;
export type Updatable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Insertable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
