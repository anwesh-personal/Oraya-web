// AI Provider and Model Configuration
// Comprehensive type definitions and model registry

export type ProviderId = 'openai' | 'anthropic' | 'google' | 'mistral' | 'perplexity' | 'groq' | 'cohere' | 'deepseek';

export interface AIModel {
    id: string;
    name: string;
    provider: ProviderId;
    modelId: string; // The actual model identifier for API calls
    description: string;
    category: 'flagship' | 'standard' | 'fast' | 'economy' | 'vision' | 'embedding' | 'reasoning';

    // Capabilities
    capabilities: {
        chat: boolean;
        completion: boolean;
        streaming: boolean;
        functionCalling: boolean;
        vision: boolean;
        codeExecution: boolean;
        reasoning: boolean;
        multimodal: boolean;
    };

    // Context & Limits
    contextWindow: number;
    maxOutputTokens: number;

    // Pricing (per 1M tokens)
    pricing: {
        input: number;
        output: number;
        cached?: number;
    };

    // Performance
    performance: {
        avgLatency: number; // ms
        tokensPerSecond: number;
        reliability: number; // percentage
    };

    // Status
    status: 'active' | 'beta' | 'deprecated' | 'preview';
    releaseDate?: string;
    deprecationDate?: string;

    // UI
    icon?: string;
    color?: string;
}

export interface AIProvider {
    id: ProviderId;
    name: string;
    description: string;
    website: string;
    apiDocsUrl: string;

    // Branding
    logo: string;
    color: string;
    bgColor: string;

    // Status
    status: 'active' | 'maintenance' | 'degraded' | 'outage';
    healthUrl?: string;

    // Capabilities
    features: {
        managedKeys: boolean; // Oraya provides API keys
        userKeys: boolean;    // Users can bring their own
        streaming: boolean;
        rateLimiting: boolean;
        usage: boolean;
    };

    // Models available
    models: AIModel[];

    // Default settings
    defaultModel?: string;
    recommendedModel?: string;
}

// =============================================================================
// PROVIDER CONFIGURATIONS
// =============================================================================

export const providers: Record<ProviderId, AIProvider> = {
    openai: {
        id: 'openai',
        name: 'OpenAI',
        description: 'Industry-leading GPT models with advanced reasoning and multimodal capabilities',
        website: 'https://openai.com',
        apiDocsUrl: 'https://platform.openai.com/docs',
        logo: '🤖',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        status: 'active',
        healthUrl: 'https://status.openai.com',
        features: {
            managedKeys: true,
            userKeys: true,
            streaming: true,
            rateLimiting: true,
            usage: true,
        },
        defaultModel: 'gpt-4o',
        recommendedModel: 'gpt-4o',
        models: [
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                provider: 'openai',
                modelId: 'gpt-4o',
                description: 'Our most advanced flagship model with vision and audio capabilities',
                category: 'flagship',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: true,
                    codeExecution: false,
                    reasoning: true,
                    multimodal: true,
                },
                contextWindow: 128000,
                maxOutputTokens: 16384,
                pricing: { input: 2.50, output: 10.00, cached: 1.25 },
                performance: { avgLatency: 1200, tokensPerSecond: 85, reliability: 99.9 },
                status: 'active',
            },
            {
                id: 'gpt-4o-mini',
                name: 'GPT-4o mini',
                provider: 'openai',
                modelId: 'gpt-4o-mini',
                description: 'Affordable and intelligent small model for fast, lightweight tasks',
                category: 'fast',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: true,
                    codeExecution: false,
                    reasoning: false,
                    multimodal: true,
                },
                contextWindow: 128000,
                maxOutputTokens: 16384,
                pricing: { input: 0.15, output: 0.60, cached: 0.075 },
                performance: { avgLatency: 600, tokensPerSecond: 120, reliability: 99.9 },
                status: 'active',
            },
            {
                id: 'o1',
                name: 'o1',
                provider: 'openai',
                modelId: 'o1',
                description: 'Advanced reasoning model for complex multi-step problems',
                category: 'reasoning',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: true,
                    codeExecution: false,
                    reasoning: true,
                    multimodal: true,
                },
                contextWindow: 200000,
                maxOutputTokens: 100000,
                pricing: { input: 15.00, output: 60.00, cached: 7.50 },
                performance: { avgLatency: 8000, tokensPerSecond: 40, reliability: 99.5 },
                status: 'active',
            },
            {
                id: 'o3-mini',
                name: 'o3-mini',
                provider: 'openai',
                modelId: 'o3-mini',
                description: 'Cost-effective reasoning model with configurable effort levels',
                category: 'reasoning',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: false,
                    codeExecution: false,
                    reasoning: true,
                    multimodal: false,
                },
                contextWindow: 200000,
                maxOutputTokens: 100000,
                pricing: { input: 1.10, output: 4.40, cached: 0.55 },
                performance: { avgLatency: 4000, tokensPerSecond: 60, reliability: 99.5 },
                status: 'active',
            },
            {
                id: 'gpt-4-turbo',
                name: 'GPT-4 Turbo',
                provider: 'openai',
                modelId: 'gpt-4-turbo',
                description: 'Previous generation GPT-4 with vision capabilities',
                category: 'standard',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: true,
                    codeExecution: false,
                    reasoning: false,
                    multimodal: true,
                },
                contextWindow: 128000,
                maxOutputTokens: 4096,
                pricing: { input: 10.00, output: 30.00 },
                performance: { avgLatency: 1500, tokensPerSecond: 60, reliability: 99.8 },
                status: 'active',
            },
        ],
    },

    anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Claude models with exceptional writing, analysis, and coding abilities',
        website: 'https://anthropic.com',
        apiDocsUrl: 'https://docs.anthropic.com',
        logo: '🧠',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        status: 'active',
        healthUrl: 'https://status.anthropic.com',
        features: {
            managedKeys: true,
            userKeys: true,
            streaming: true,
            rateLimiting: true,
            usage: true,
        },
        defaultModel: 'claude-3-5-sonnet-latest',
        recommendedModel: 'claude-3-5-sonnet-latest',
        models: [
            {
                id: 'claude-3-5-sonnet',
                name: 'Claude 3.5 Sonnet',
                provider: 'anthropic',
                modelId: 'claude-3-5-sonnet-latest',
                description: 'Best combination of performance and speed for most tasks',
                category: 'flagship',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: true,
                    codeExecution: true,
                    reasoning: true,
                    multimodal: true,
                },
                contextWindow: 200000,
                maxOutputTokens: 8192,
                pricing: { input: 3.00, output: 15.00, cached: 0.30 },
                performance: { avgLatency: 1100, tokensPerSecond: 90, reliability: 99.9 },
                status: 'active',
            },
            {
                id: 'claude-3-5-haiku',
                name: 'Claude 3.5 Haiku',
                provider: 'anthropic',
                modelId: 'claude-3-5-haiku-latest',
                description: 'Fastest and most cost-effective model for simple tasks',
                category: 'fast',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: true,
                    codeExecution: false,
                    reasoning: false,
                    multimodal: true,
                },
                contextWindow: 200000,
                maxOutputTokens: 8192,
                pricing: { input: 0.80, output: 4.00, cached: 0.08 },
                performance: { avgLatency: 500, tokensPerSecond: 150, reliability: 99.9 },
                status: 'active',
            },
            {
                id: 'claude-3-opus',
                name: 'Claude 3 Opus',
                provider: 'anthropic',
                modelId: 'claude-3-opus-latest',
                description: 'Most powerful model for highly complex tasks',
                category: 'flagship',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: true,
                    codeExecution: true,
                    reasoning: true,
                    multimodal: true,
                },
                contextWindow: 200000,
                maxOutputTokens: 4096,
                pricing: { input: 15.00, output: 75.00, cached: 1.50 },
                performance: { avgLatency: 2500, tokensPerSecond: 45, reliability: 99.8 },
                status: 'active',
            },
        ],
    },

    google: {
        id: 'google',
        name: 'Google',
        description: 'Gemini models with industry-leading context windows and multimodal abilities',
        website: 'https://ai.google.dev',
        apiDocsUrl: 'https://ai.google.dev/docs',
        logo: '✨',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        status: 'active',
        healthUrl: 'https://status.cloud.google.com',
        features: {
            managedKeys: true,
            userKeys: true,
            streaming: true,
            rateLimiting: true,
            usage: true,
        },
        defaultModel: 'gemini-2.0-flash',
        recommendedModel: 'gemini-2.0-flash',
        models: [
            {
                id: 'gemini-2.0-flash',
                name: 'Gemini 2.0 Flash',
                provider: 'google',
                modelId: 'gemini-2.0-flash',
                description: 'Next-generation fast multimodal model with enhanced performance',
                category: 'fast',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: true,
                    codeExecution: true,
                    reasoning: true,
                    multimodal: true,
                },
                contextWindow: 1000000,
                maxOutputTokens: 8192,
                pricing: { input: 0.10, output: 0.40 },
                performance: { avgLatency: 400, tokensPerSecond: 180, reliability: 99.8 },
                status: 'active',
            },
            {
                id: 'gemini-1.5-pro',
                name: 'Gemini 1.5 Pro',
                provider: 'google',
                modelId: 'gemini-1.5-pro',
                description: 'Best for complex reasoning tasks with massive context',
                category: 'flagship',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: true,
                    codeExecution: true,
                    reasoning: true,
                    multimodal: true,
                },
                contextWindow: 2000000,
                maxOutputTokens: 8192,
                pricing: { input: 1.25, output: 5.00, cached: 0.3125 },
                performance: { avgLatency: 1500, tokensPerSecond: 75, reliability: 99.7 },
                status: 'active',
            },
            {
                id: 'gemini-1.5-flash',
                name: 'Gemini 1.5 Flash',
                provider: 'google',
                modelId: 'gemini-1.5-flash',
                description: 'Fast and versatile for everyday tasks',
                category: 'fast',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: true,
                    codeExecution: false,
                    reasoning: false,
                    multimodal: true,
                },
                contextWindow: 1000000,
                maxOutputTokens: 8192,
                pricing: { input: 0.075, output: 0.30, cached: 0.01875 },
                performance: { avgLatency: 450, tokensPerSecond: 160, reliability: 99.8 },
                status: 'active',
            },
        ],
    },

    mistral: {
        id: 'mistral',
        name: 'Mistral AI',
        description: 'European AI models with excellent multilingual and code capabilities',
        website: 'https://mistral.ai',
        apiDocsUrl: 'https://docs.mistral.ai',
        logo: '🌀',
        color: 'text-violet-400',
        bgColor: 'bg-violet-500/10',
        status: 'active',
        features: {
            managedKeys: true,
            userKeys: true,
            streaming: true,
            rateLimiting: true,
            usage: true,
        },
        defaultModel: 'mistral-large-latest',
        recommendedModel: 'mistral-large-latest',
        models: [
            {
                id: 'mistral-large',
                name: 'Mistral Large',
                provider: 'mistral',
                modelId: 'mistral-large-latest',
                description: 'Top-tier reasoning with strong multilingual capabilities',
                category: 'flagship',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: true,
                    codeExecution: false,
                    reasoning: true,
                    multimodal: true,
                },
                contextWindow: 128000,
                maxOutputTokens: 4096,
                pricing: { input: 2.00, output: 6.00 },
                performance: { avgLatency: 1300, tokensPerSecond: 70, reliability: 99.5 },
                status: 'active',
            },
            {
                id: 'mistral-small',
                name: 'Mistral Small',
                provider: 'mistral',
                modelId: 'mistral-small-latest',
                description: 'Cost-effective for low-latency workloads',
                category: 'fast',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: false,
                    codeExecution: false,
                    reasoning: false,
                    multimodal: false,
                },
                contextWindow: 32000,
                maxOutputTokens: 4096,
                pricing: { input: 0.20, output: 0.60 },
                performance: { avgLatency: 500, tokensPerSecond: 140, reliability: 99.7 },
                status: 'active',
            },
            {
                id: 'codestral',
                name: 'Codestral',
                provider: 'mistral',
                modelId: 'codestral-latest',
                description: 'Optimized for code generation and analysis',
                category: 'standard',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: false,
                    codeExecution: false,
                    reasoning: true,
                    multimodal: false,
                },
                contextWindow: 32000,
                maxOutputTokens: 4096,
                pricing: { input: 0.30, output: 0.90 },
                performance: { avgLatency: 600, tokensPerSecond: 130, reliability: 99.6 },
                status: 'active',
            },
        ],
    },

    perplexity: {
        id: 'perplexity',
        name: 'Perplexity',
        description: 'AI with real-time web search and citation capabilities',
        website: 'https://perplexity.ai',
        apiDocsUrl: 'https://docs.perplexity.ai',
        logo: '🔍',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        status: 'active',
        features: {
            managedKeys: true,
            userKeys: true,
            streaming: true,
            rateLimiting: true,
            usage: true,
        },
        defaultModel: 'sonar',
        recommendedModel: 'sonar-pro',
        models: [
            {
                id: 'sonar-pro',
                name: 'Sonar Pro',
                provider: 'perplexity',
                modelId: 'sonar-pro',
                description: 'Premier search model with advanced search and follow-ups',
                category: 'flagship',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: false,
                    vision: false,
                    codeExecution: false,
                    reasoning: true,
                    multimodal: false,
                },
                contextWindow: 200000,
                maxOutputTokens: 8192,
                pricing: { input: 3.00, output: 15.00 },
                performance: { avgLatency: 2000, tokensPerSecond: 50, reliability: 99.5 },
                status: 'active',
            },
            {
                id: 'sonar',
                name: 'Sonar',
                provider: 'perplexity',
                modelId: 'sonar',
                description: 'Lightweight search model for quick answers',
                category: 'fast',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: false,
                    vision: false,
                    codeExecution: false,
                    reasoning: false,
                    multimodal: false,
                },
                contextWindow: 127072,
                maxOutputTokens: 4096,
                pricing: { input: 1.00, output: 1.00 },
                performance: { avgLatency: 1200, tokensPerSecond: 80, reliability: 99.6 },
                status: 'active',
            },
        ],
    },

    groq: {
        id: 'groq',
        name: 'Groq',
        description: 'Ultra-fast inference on custom LPU hardware',
        website: 'https://groq.com',
        apiDocsUrl: 'https://console.groq.com/docs',
        logo: '⚡',
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10',
        status: 'active',
        features: {
            managedKeys: true,
            userKeys: true,
            streaming: true,
            rateLimiting: true,
            usage: true,
        },
        defaultModel: 'llama-3.3-70b-versatile',
        recommendedModel: 'llama-3.3-70b-versatile',
        models: [
            {
                id: 'llama-3.3-70b',
                name: 'Llama 3.3 70B',
                provider: 'groq',
                modelId: 'llama-3.3-70b-versatile',
                description: 'Meta\'s latest powerful open-weights model on Groq',
                category: 'flagship',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: false,
                    codeExecution: false,
                    reasoning: true,
                    multimodal: false,
                },
                contextWindow: 131072,
                maxOutputTokens: 32768,
                pricing: { input: 0.59, output: 0.79 },
                performance: { avgLatency: 200, tokensPerSecond: 300, reliability: 99.5 },
                status: 'active',
            },
            {
                id: 'llama-3.1-8b',
                name: 'Llama 3.1 8B',
                provider: 'groq',
                modelId: 'llama-3.1-8b-instant',
                description: 'Fastest inference for lightweight tasks',
                category: 'economy',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: false,
                    codeExecution: false,
                    reasoning: false,
                    multimodal: false,
                },
                contextWindow: 131072,
                maxOutputTokens: 8192,
                pricing: { input: 0.05, output: 0.08 },
                performance: { avgLatency: 100, tokensPerSecond: 750, reliability: 99.7 },
                status: 'active',
            },
            {
                id: 'mixtral-8x7b',
                name: 'Mixtral 8x7B',
                provider: 'groq',
                modelId: 'mixtral-8x7b-32768',
                description: 'Efficient mixture-of-experts architecture',
                category: 'standard',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: false,
                    codeExecution: false,
                    reasoning: false,
                    multimodal: false,
                },
                contextWindow: 32768,
                maxOutputTokens: 4096,
                pricing: { input: 0.24, output: 0.24 },
                performance: { avgLatency: 150, tokensPerSecond: 500, reliability: 99.6 },
                status: 'active',
            },
        ],
    },

    cohere: {
        id: 'cohere',
        name: 'Cohere',
        description: 'Enterprise-focused models with RAG and embedding specialization',
        website: 'https://cohere.com',
        apiDocsUrl: 'https://docs.cohere.com',
        logo: '🔷',
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/10',
        status: 'active',
        features: {
            managedKeys: true,
            userKeys: true,
            streaming: true,
            rateLimiting: true,
            usage: true,
        },
        defaultModel: 'command-r-plus',
        recommendedModel: 'command-r-plus',
        models: [
            {
                id: 'command-r-plus',
                name: 'Command R+',
                provider: 'cohere',
                modelId: 'command-r-plus',
                description: 'Top-tier enterprise model with RAG capabilities',
                category: 'flagship',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: false,
                    codeExecution: false,
                    reasoning: true,
                    multimodal: false,
                },
                contextWindow: 128000,
                maxOutputTokens: 4096,
                pricing: { input: 2.50, output: 10.00 },
                performance: { avgLatency: 1400, tokensPerSecond: 65, reliability: 99.5 },
                status: 'active',
            },
            {
                id: 'command-r',
                name: 'Command R',
                provider: 'cohere',
                modelId: 'command-r',
                description: 'Balanced model for enterprise workloads',
                category: 'standard',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: false,
                    codeExecution: false,
                    reasoning: false,
                    multimodal: false,
                },
                contextWindow: 128000,
                maxOutputTokens: 4096,
                pricing: { input: 0.15, output: 0.60 },
                performance: { avgLatency: 800, tokensPerSecond: 100, reliability: 99.6 },
                status: 'active',
            },
        ],
    },

    deepseek: {
        id: 'deepseek',
        name: 'DeepSeek',
        description: 'Chinese AI company with competitive reasoning and coding models',
        website: 'https://deepseek.com',
        apiDocsUrl: 'https://platform.deepseek.com/api-docs',
        logo: '🐋',
        color: 'text-sky-400',
        bgColor: 'bg-sky-500/10',
        status: 'active',
        features: {
            managedKeys: true,
            userKeys: true,
            streaming: true,
            rateLimiting: true,
            usage: true,
        },
        defaultModel: 'deepseek-chat',
        recommendedModel: 'deepseek-reasoner',
        models: [
            {
                id: 'deepseek-reasoner',
                name: 'DeepSeek R1',
                provider: 'deepseek',
                modelId: 'deepseek-reasoner',
                description: 'Advanced reasoning model with chain-of-thought',
                category: 'reasoning',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: false,
                    vision: false,
                    codeExecution: false,
                    reasoning: true,
                    multimodal: false,
                },
                contextWindow: 64000,
                maxOutputTokens: 8192,
                pricing: { input: 0.55, output: 2.19, cached: 0.14 },
                performance: { avgLatency: 3000, tokensPerSecond: 35, reliability: 99.0 },
                status: 'active',
            },
            {
                id: 'deepseek-chat',
                name: 'DeepSeek V3',
                provider: 'deepseek',
                modelId: 'deepseek-chat',
                description: 'General-purpose chat model with strong coding abilities',
                category: 'standard',
                capabilities: {
                    chat: true,
                    completion: true,
                    streaming: true,
                    functionCalling: true,
                    vision: false,
                    codeExecution: false,
                    reasoning: false,
                    multimodal: false,
                },
                contextWindow: 64000,
                maxOutputTokens: 8192,
                pricing: { input: 0.14, output: 0.28, cached: 0.014 },
                performance: { avgLatency: 800, tokensPerSecond: 110, reliability: 99.2 },
                status: 'active',
            },
        ],
    },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const providerList = Object.values(providers);

export function getProvider(id: ProviderId): AIProvider | undefined {
    return providers[id];
}

export function getModel(providerId: ProviderId, modelId: string): AIModel | undefined {
    const provider = providers[providerId];
    return provider?.models.find(m => m.id === modelId || m.modelId === modelId);
}

export function getAllModels(): AIModel[] {
    return providerList.flatMap(p => p.models);
}

export function getModelsByCategory(category: AIModel['category']): AIModel[] {
    return getAllModels().filter(m => m.category === category);
}

export function getActiveModels(): AIModel[] {
    return getAllModels().filter(m => m.status === 'active');
}

export function formatContextWindow(tokens: number): string {
    if (tokens >= 1000000) {
        return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
        return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
}

export function formatPrice(price: number): string {
    if (price < 1) {
        return `$${price.toFixed(3)}`;
    }
    return `$${price.toFixed(2)}`;
}

export function calculateCost(
    inputTokens: number,
    outputTokens: number,
    model: AIModel
): number {
    const inputCost = (inputTokens / 1_000_000) * model.pricing.input;
    const outputCost = (outputTokens / 1_000_000) * model.pricing.output;
    return inputCost + outputCost;
}

export function getModelCategoryColor(category: AIModel['category']): string {
    const colors: Record<AIModel['category'], string> = {
        flagship: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
        standard: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        fast: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        economy: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        vision: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
        embedding: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        reasoning: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    };
    return colors[category];
}
