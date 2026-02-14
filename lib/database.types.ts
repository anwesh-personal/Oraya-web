// Auto-generated Supabase types
// Run: npm run db:generate to regenerate from your Supabase schema

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            // ================================================
            // SUPERADMIN TABLES (from 002_superadmin_tables.sql)
            // ================================================
            platform_admins: {
                Row: {
                    id: string;
                    user_id: string | null;
                    email: string;
                    full_name: string | null;
                    role: "superadmin" | "admin" | "support" | "readonly";
                    permissions: Json;
                    is_active: boolean;
                    last_login_at: string | null;
                    failed_login_attempts: number;
                    locked_until: string | null;
                    created_by: string | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    email: string;
                    full_name?: string | null;
                    role?: "superadmin" | "admin" | "support" | "readonly";
                    permissions?: Json;
                    is_active?: boolean;
                    last_login_at?: string | null;
                    failed_login_attempts?: number;
                    locked_until?: string | null;
                    created_by?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    email?: string;
                    full_name?: string | null;
                    role?: "superadmin" | "admin" | "support" | "readonly";
                    permissions?: Json;
                    is_active?: boolean;
                    last_login_at?: string | null;
                    failed_login_attempts?: number;
                    locked_until?: string | null;
                    created_by?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            platform_settings: {
                Row: {
                    key: string;
                    value: Json;
                    category: string;
                    description: string | null;
                    is_sensitive: boolean;
                    updated_by: string | null;
                    updated_at: string;
                };
                Insert: {
                    key: string;
                    value: Json;
                    category?: string;
                    description?: string | null;
                    is_sensitive?: boolean;
                    updated_by?: string | null;
                    updated_at?: string;
                };
                Update: {
                    key?: string;
                    value?: Json;
                    category?: string;
                    description?: string | null;
                    is_sensitive?: boolean;
                    updated_by?: string | null;
                    updated_at?: string;
                };
            };
            admin_audit_logs: {
                Row: {
                    id: string;
                    admin_id: string | null;
                    admin_email: string | null;
                    action: string;
                    resource_type: string | null;
                    resource_id: string | null;
                    changes: Json | null;
                    metadata: Json;
                    ip_address: string | null;
                    user_agent: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    admin_id?: string | null;
                    admin_email?: string | null;
                    action: string;
                    resource_type?: string | null;
                    resource_id?: string | null;
                    changes?: Json | null;
                    metadata?: Json;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    admin_id?: string | null;
                    admin_email?: string | null;
                    action?: string;
                    resource_type?: string | null;
                    resource_id?: string | null;
                    changes?: Json | null;
                    metadata?: Json;
                    ip_address?: string | null;
                    user_agent?: string | null;
                    created_at?: string;
                };
            };
            feature_flags: {
                Row: {
                    id: string;
                    feature_key: string;
                    feature_name: string;
                    description: string | null;
                    is_enabled: boolean;
                    rollout_percentage: number;
                    enabled_for_plans: string[];
                    enabled_for_users: string[];
                    tags: string[];
                    category: string;
                    updated_by: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    feature_key: string;
                    feature_name: string;
                    description?: string | null;
                    is_enabled?: boolean;
                    rollout_percentage?: number;
                    enabled_for_plans?: string[];
                    enabled_for_users?: string[];
                    tags?: string[];
                    category?: string;
                    updated_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    feature_key?: string;
                    feature_name?: string;
                    description?: string | null;
                    is_enabled?: boolean;
                    rollout_percentage?: number;
                    enabled_for_plans?: string[];
                    enabled_for_users?: string[];
                    tags?: string[];
                    category?: string;
                    updated_by?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            // ================================================
            // PLANS & LICENSING (from 004_plans_and_licensing.sql)
            // ================================================
            plans: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    price_monthly: number;
                    price_yearly: number;
                    currency: string;
                    max_agents: number;
                    max_conversations_per_month: number;
                    max_ai_calls_per_month: number;
                    max_token_usage_per_month: number;
                    max_devices: number;
                    features: Json;
                    is_active: boolean;
                    is_public: boolean;
                    display_order: number;
                    badge: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    name: string;
                    description?: string | null;
                    price_monthly?: number;
                    price_yearly?: number;
                    currency?: string;
                    max_agents?: number;
                    max_conversations_per_month?: number;
                    max_ai_calls_per_month?: number;
                    max_token_usage_per_month?: number;
                    max_devices?: number;
                    features?: Json;
                    is_active?: boolean;
                    is_public?: boolean;
                    display_order?: number;
                    badge?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    description?: string | null;
                    price_monthly?: number;
                    price_yearly?: number;
                    currency?: string;
                    max_agents?: number;
                    max_conversations_per_month?: number;
                    max_ai_calls_per_month?: number;
                    max_token_usage_per_month?: number;
                    max_devices?: number;
                    features?: Json;
                    is_active?: boolean;
                    is_public?: boolean;
                    display_order?: number;
                    badge?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            user_licenses: {
                Row: {
                    id: string;
                    user_id: string;
                    plan_id: string;
                    license_key: string;
                    status: "active" | "expired" | "cancelled" | "suspended" | "payment_failed";
                    billing_cycle: "monthly" | "yearly" | "lifetime" | "trial";
                    next_billing_date: string | null;
                    amount_paid: number | null;
                    payment_method: string | null;
                    stripe_subscription_id: string | null;
                    is_trial: boolean;
                    trial_ends_at: string | null;
                    trial_converted: boolean;
                    current_period_start: string;
                    current_period_end: string | null;
                    ai_calls_used: number;
                    tokens_used: number;
                    conversations_created: number;
                    usage_limit_reached: boolean;
                    limit_reset_at: string | null;
                    created_at: string;
                    updated_at: string;
                    activated_at: string | null;
                    cancelled_at: string | null;
                    expires_at: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    plan_id: string;
                    license_key?: string;
                    status?: "active" | "expired" | "cancelled" | "suspended" | "payment_failed";
                    billing_cycle?: "monthly" | "yearly" | "lifetime" | "trial";
                    next_billing_date?: string | null;
                    amount_paid?: number | null;
                    payment_method?: string | null;
                    stripe_subscription_id?: string | null;
                    is_trial?: boolean;
                    trial_ends_at?: string | null;
                    trial_converted?: boolean;
                    current_period_start?: string;
                    current_period_end?: string | null;
                    ai_calls_used?: number;
                    tokens_used?: number;
                    conversations_created?: number;
                    usage_limit_reached?: boolean;
                    limit_reset_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    activated_at?: string | null;
                    cancelled_at?: string | null;
                    expires_at?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    plan_id?: string;
                    license_key?: string;
                    status?: "active" | "expired" | "cancelled" | "suspended" | "payment_failed";
                    billing_cycle?: "monthly" | "yearly" | "lifetime" | "trial";
                    next_billing_date?: string | null;
                    amount_paid?: number | null;
                    payment_method?: string | null;
                    stripe_subscription_id?: string | null;
                    is_trial?: boolean;
                    trial_ends_at?: string | null;
                    trial_converted?: boolean;
                    current_period_start?: string;
                    current_period_end?: string | null;
                    ai_calls_used?: number;
                    tokens_used?: number;
                    conversations_created?: number;
                    usage_limit_reached?: boolean;
                    limit_reset_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    activated_at?: string | null;
                    cancelled_at?: string | null;
                    expires_at?: string | null;
                };
            };
            // ================================================
            // MANAGED AI SERVICE (from 006_managed_ai_service.sql)
            // ================================================
            managed_ai_keys: {
                Row: {
                    id: string;
                    provider: "openai" | "anthropic" | "google" | "mistral" | "perplexity";
                    key_name: string;
                    api_key: string;
                    encrypted_key: string | null;
                    is_active: boolean;
                    daily_budget_usd: number | null;
                    monthly_budget_usd: number | null;
                    current_daily_spend_usd: number;
                    current_monthly_spend_usd: number;
                    spend_reset_at: string | null;
                    max_requests_per_minute: number;
                    max_concurrent_requests: number;
                    weight: number;
                    priority: number;
                    is_healthy: boolean;
                    last_error: string | null;
                    error_count: number;
                    last_error_at: string | null;
                    notes: string | null;
                    tags: string[];
                    created_at: string;
                    updated_at: string;
                    last_used_at: string | null;
                };
                Insert: {
                    id?: string;
                    provider: "openai" | "anthropic" | "google" | "mistral" | "perplexity";
                    key_name: string;
                    api_key: string;
                    encrypted_key?: string | null;
                    is_active?: boolean;
                    daily_budget_usd?: number | null;
                    monthly_budget_usd?: number | null;
                    current_daily_spend_usd?: number;
                    current_monthly_spend_usd?: number;
                    spend_reset_at?: string | null;
                    max_requests_per_minute?: number;
                    max_concurrent_requests?: number;
                    weight?: number;
                    priority?: number;
                    is_healthy?: boolean;
                    last_error?: string | null;
                    error_count?: number;
                    last_error_at?: string | null;
                    notes?: string | null;
                    tags?: string[];
                    created_at?: string;
                    updated_at?: string;
                    last_used_at?: string | null;
                };
                Update: {
                    id?: string;
                    provider?: "openai" | "anthropic" | "google" | "mistral" | "perplexity";
                    key_name?: string;
                    api_key?: string;
                    encrypted_key?: string | null;
                    is_active?: boolean;
                    daily_budget_usd?: number | null;
                    monthly_budget_usd?: number | null;
                    current_daily_spend_usd?: number;
                    current_monthly_spend_usd?: number;
                    spend_reset_at?: string | null;
                    max_requests_per_minute?: number;
                    max_concurrent_requests?: number;
                    weight?: number;
                    priority?: number;
                    is_healthy?: boolean;
                    last_error?: string | null;
                    error_count?: number;
                    last_error_at?: string | null;
                    notes?: string | null;
                    tags?: string[];
                    created_at?: string;
                    updated_at?: string;
                    last_used_at?: string | null;
                };
            };
            ai_usage_logs: {
                Row: {
                    id: string;
                    user_id: string;
                    license_id: string | null;
                    managed_key_id: string | null;
                    model: string;
                    provider: string;
                    request_type: "chat" | "completion" | "embedding" | "image" | "audio";
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                    cost_usd: number | null;
                    tokens_deducted: number;
                    latency_ms: number | null;
                    response_time_ms: number | null;
                    status: "success" | "error" | "timeout" | "rate_limited";
                    error_message: string | null;
                    error_code: string | null;
                    device_id: string | null;
                    agent_id: string | null;
                    conversation_id: string | null;
                    message_id: string | null;
                    request_id: string | null;
                    ip_address: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    license_id?: string | null;
                    managed_key_id?: string | null;
                    model: string;
                    provider: string;
                    request_type?: "chat" | "completion" | "embedding" | "image" | "audio";
                    prompt_tokens?: number;
                    completion_tokens?: number;
                    total_tokens?: number;
                    cost_usd?: number | null;
                    tokens_deducted?: number;
                    latency_ms?: number | null;
                    response_time_ms?: number | null;
                    status?: "success" | "error" | "timeout" | "rate_limited";
                    error_message?: string | null;
                    error_code?: string | null;
                    device_id?: string | null;
                    agent_id?: string | null;
                    conversation_id?: string | null;
                    message_id?: string | null;
                    request_id?: string | null;
                    ip_address?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    license_id?: string | null;
                    managed_key_id?: string | null;
                    model?: string;
                    provider?: string;
                    request_type?: "chat" | "completion" | "embedding" | "image" | "audio";
                    prompt_tokens?: number;
                    completion_tokens?: number;
                    total_tokens?: number;
                    cost_usd?: number | null;
                    tokens_deducted?: number;
                    latency_ms?: number | null;
                    response_time_ms?: number | null;
                    status?: "success" | "error" | "timeout" | "rate_limited";
                    error_message?: string | null;
                    error_code?: string | null;
                    device_id?: string | null;
                    agent_id?: string | null;
                    conversation_id?: string | null;
                    message_id?: string | null;
                    request_id?: string | null;
                    ip_address?: string | null;
                    created_at?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            is_platform_admin: {
                Args: Record<PropertyKey, never>;
                Returns: boolean;
            };
            has_admin_role: {
                Args: {
                    required_role: string;
                };
                Returns: boolean;
            };
        };
        Enums: {
            [_ in never]: never;
        };
    };
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Row"];
export type Insertable<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Insert"];
export type Updatable<T extends keyof Database["public"]["Tables"]> =
    Database["public"]["Tables"][T]["Update"];

// Convenience aliases
export type PlatformAdmin = Tables<"platform_admins">;
export type PlatformSetting = Tables<"platform_settings">;
export type AuditLog = Tables<"admin_audit_logs">;
export type FeatureFlag = Tables<"feature_flags">;
export type Plan = Tables<"plans">;
export type UserLicense = Tables<"user_licenses">;
export type ManagedAIKey = Tables<"managed_ai_keys">;
export type AIUsageLog = Tables<"ai_usage_logs">;
