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
            user_profiles: {
                Row: {
                    id: string;
                    email: string | null;
                    full_name: string | null;
                    display_name: string | null;
                    avatar_url: string | null;
                    organization: string | null;
                    role: string | null;
                    bio: string | null;
                    timezone: string | null;
                    locale: string | null;
                    referral_code: string | null;
                    referred_by: string | null;
                    is_active: boolean;
                    last_login_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email?: string | null;
                    full_name?: string | null;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    organization?: string | null;
                    role?: string | null;
                    bio?: string | null;
                    timezone?: string | null;
                    locale?: string | null;
                    referral_code?: string | null;
                    referred_by?: string | null;
                    is_active?: boolean;
                    last_login_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string | null;
                    full_name?: string | null;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    organization?: string | null;
                    role?: string | null;
                    bio?: string | null;
                    timezone?: string | null;
                    locale?: string | null;
                    referral_code?: string | null;
                    referred_by?: string | null;
                    is_active?: boolean;
                    last_login_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            token_wallets: {
                Row: {
                    id: string;
                    user_id: string;
                    token_balance: number;
                    total_purchased: number;
                    total_used: number;
                    total_refunded: number;
                    auto_refill_enabled: boolean;
                    auto_refill_threshold: number;
                    refill_amount: number;
                    refill_payment_method_id: string | null;
                    low_balance_alert_sent: boolean;
                    low_balance_threshold: number;
                    is_frozen: boolean;
                    frozen_reason: string | null;
                    frozen_at: string | null;
                    created_at: string;
                    updated_at: string;
                    last_purchase_at: string | null;
                    last_usage_at: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    token_balance?: number;
                    total_purchased?: number;
                    total_used?: number;
                    total_refunded?: number;
                    auto_refill_enabled?: boolean;
                    auto_refill_threshold?: number;
                    refill_amount?: number;
                    refill_payment_method_id?: string | null;
                    low_balance_alert_sent?: boolean;
                    low_balance_threshold?: number;
                    is_frozen?: boolean;
                    frozen_reason?: string | null;
                    frozen_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    last_purchase_at?: string | null;
                    last_usage_at?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    token_balance?: number;
                    total_purchased?: number;
                    total_used?: number;
                    total_refunded?: number;
                    auto_refill_enabled?: boolean;
                    auto_refill_threshold?: number;
                    refill_amount?: number;
                    refill_payment_method_id?: string | null;
                    low_balance_alert_sent?: boolean;
                    low_balance_threshold?: number;
                    is_frozen?: boolean;
                    frozen_reason?: string | null;
                    frozen_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                    last_purchase_at?: string | null;
                    last_usage_at?: string | null;
                };
            };
            token_purchases: {
                Row: {
                    id: string;
                    user_id: string;
                    wallet_id: string;
                    tokens_purchased: number;
                    bonus_tokens: number;
                    total_tokens: number;
                    amount_paid: number;
                    currency: string;
                    price_per_1k_tokens: number | null;
                    discount_code: string | null;
                    discount_amount: number;
                    payment_provider: string;
                    payment_id: string | null;
                    payment_method: string | null;
                    payment_status: "pending" | "completed" | "failed" | "refunded" | "disputed";
                    refund_id: string | null;
                    refund_amount: number | null;
                    refund_reason: string | null;
                    refunded_at: string | null;
                    purchased_at: string;
                    completed_at: string | null;
                    ip_address: string | null;
                    user_agent: string | null;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    wallet_id: string;
                    tokens_purchased: number;
                    bonus_tokens?: number;
                    amount_paid: number;
                    currency?: string;
                    price_per_1k_tokens?: number | null;
                    discount_code?: string | null;
                    discount_amount?: number;
                    payment_provider: string;
                    payment_id?: string | null;
                    payment_method?: string | null;
                    payment_status?: "pending" | "completed" | "failed" | "refunded" | "disputed";
                    refund_id?: string | null;
                    refund_amount?: number | null;
                    refund_reason?: string | null;
                    refunded_at?: string | null;
                    purchased_at?: string;
                    completed_at?: string | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    wallet_id?: string;
                    tokens_purchased?: number;
                    bonus_tokens?: number;
                    amount_paid?: number;
                    currency?: string;
                    price_per_1k_tokens?: number | null;
                    discount_code?: string | null;
                    discount_amount?: number;
                    payment_provider?: string;
                    payment_id?: string | null;
                    payment_method?: string | null;
                    payment_status?: "pending" | "completed" | "failed" | "refunded" | "disputed";
                    refund_id?: string | null;
                    refund_amount?: number | null;
                    refund_reason?: string | null;
                    refunded_at?: string | null;
                    purchased_at?: string;
                    completed_at?: string | null;
                    ip_address?: string | null;
                    user_agent?: string | null;
                };
            };
            token_usage_logs: {
                Row: {
                    id: string;
                    user_id: string;
                    wallet_id: string;
                    tokens_used: number;
                    service: string;
                    operation: string | null;
                    balance_before: number;
                    balance_after: number;
                    device_id: string | null;
                    agent_id: string | null;
                    conversation_id: string | null;
                    used_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    wallet_id: string;
                    tokens_used: number;
                    service: string;
                    operation?: string | null;
                    balance_before: number;
                    balance_after: number;
                    device_id?: string | null;
                    agent_id?: string | null;
                    conversation_id?: string | null;
                    used_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    wallet_id?: string;
                    tokens_used?: number;
                    service?: string;
                    operation?: string | null;
                    balance_before?: number;
                    balance_after?: number;
                    device_id?: string | null;
                    agent_id?: string | null;
                    conversation_id?: string | null;
                    used_at?: string;
                };
            };
            token_packages: {
                Row: {
                    id: string;
                    name: string;
                    description: string | null;
                    token_amount: number;
                    bonus_percentage: number;
                    total_tokens: number;
                    price: number;
                    currency: string;
                    price_per_1k_tokens: number;
                    is_popular: boolean;
                    is_best_value: boolean;
                    display_order: number;
                    badge: string | null;
                    is_active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    name: string;
                    description?: string | null;
                    token_amount: number;
                    bonus_percentage?: number;
                    price: number;
                    currency?: string;
                    is_popular?: boolean;
                    is_best_value?: boolean;
                    display_order?: number;
                    badge?: string | null;
                    is_active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    description?: string | null;
                    token_amount?: number;
                    bonus_percentage?: number;
                    price?: number;
                    currency?: string;
                    is_popular?: boolean;
                    is_best_value?: boolean;
                    display_order?: number;
                    badge?: string | null;
                    is_active?: boolean;
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
export type UserProfile = Tables<"user_profiles">;
export type TokenWallet = Tables<"token_wallets">;
export type TokenPurchase = Tables<"token_purchases">;
export type TokenUsageLog = Tables<"token_usage_logs">;
export type TokenPackage = Tables<"token_packages">;
export type ManagedAIKey = Tables<"managed_ai_keys">;
export type AIUsageLog = Tables<"ai_usage_logs">;
