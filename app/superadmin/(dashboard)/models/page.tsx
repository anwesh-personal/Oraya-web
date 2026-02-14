"use client";

import { useState, useMemo } from "react";
import {
    Search,
    Filter,
    Sparkles,
    Zap,
    Brain,
    Image,
    MessageSquare,
    DollarSign,
    Clock,
    Check,
    ExternalLink,
    ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    providers,
    providerList,
    getAllModels,
    formatContextWindow,
    formatPrice,
    getModelCategoryColor,
    type AIModel,
    type ProviderId,
} from "@/lib/ai-providers";

const categoryIcons: Record<AIModel['category'], React.ReactNode> = {
    flagship: <Sparkles className="w-4 h-4" />,
    standard: <MessageSquare className="w-4 h-4" />,
    fast: <Zap className="w-4 h-4" />,
    economy: <DollarSign className="w-4 h-4" />,
    reasoning: <Brain className="w-4 h-4" />,
    vision: <Image className="w-4 h-4" />,
    embedding: <MessageSquare className="w-4 h-4" />,
};

export default function ModelsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProvider, setSelectedProvider] = useState<ProviderId | "all">("all");
    const [selectedCategory, setSelectedCategory] = useState<AIModel['category'] | "all">("all");
    const [expandedModel, setExpandedModel] = useState<string | null>(null);

    const allModels = useMemo(() => getAllModels(), []);

    const filteredModels = useMemo(() => {
        return allModels.filter(model => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matches =
                    model.name.toLowerCase().includes(query) ||
                    model.description.toLowerCase().includes(query) ||
                    model.provider.toLowerCase().includes(query) ||
                    model.modelId.toLowerCase().includes(query);
                if (!matches) return false;
            }

            // Provider filter
            if (selectedProvider !== "all" && model.provider !== selectedProvider) {
                return false;
            }

            // Category filter
            if (selectedCategory !== "all" && model.category !== selectedCategory) {
                return false;
            }

            return true;
        });
    }, [allModels, searchQuery, selectedProvider, selectedCategory]);

    // Group by provider
    const groupedModels = useMemo(() => {
        return filteredModels.reduce((acc, model) => {
            if (!acc[model.provider]) {
                acc[model.provider] = [];
            }
            acc[model.provider].push(model);
            return acc;
        }, {} as Record<string, AIModel[]>);
    }, [filteredModels]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[var(--surface-900)]">Model Registry</h1>
                <p className="text-[var(--surface-600)] mt-1">
                    Explore {allModels.length} AI models across {providerList.length} providers
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[280px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-500)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search models..."
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-800)] placeholder:text-[var(--surface-500)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                    />
                </div>

                {/* Provider Filter */}
                <div className="relative">
                    <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value as ProviderId | "all")}
                        className="appearance-none pl-4 pr-10 py-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-800)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 cursor-pointer"
                    >
                        <option value="all">All Providers</option>
                        {providerList.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-500)] pointer-events-none" />
                </div>

                {/* Category Filter */}
                <div className="relative">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value as AIModel['category'] | "all")}
                        className="appearance-none pl-4 pr-10 py-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)] text-[var(--surface-800)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 cursor-pointer"
                    >
                        <option value="all">All Categories</option>
                        <option value="flagship">Flagship</option>
                        <option value="standard">Standard</option>
                        <option value="fast">Fast</option>
                        <option value="economy">Economy</option>
                        <option value="reasoning">Reasoning</option>
                        <option value="vision">Vision</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--surface-500)] pointer-events-none" />
                </div>
            </div>

            {/* Stats Bar */}
            <div className="flex items-center gap-6 px-4 py-3 rounded-xl bg-[var(--surface-100)] border border-[var(--surface-300)]">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[var(--surface-500)]" />
                    <span className="text-sm text-[var(--surface-600)]">
                        Showing <span className="font-semibold text-[var(--surface-800)]">{filteredModels.length}</span> models
                    </span>
                </div>
                {(searchQuery || selectedProvider !== "all" || selectedCategory !== "all") && (
                    <button
                        onClick={() => {
                            setSearchQuery("");
                            setSelectedProvider("all");
                            setSelectedCategory("all");
                        }}
                        className="text-sm text-[var(--primary)] hover:underline"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Models Grid */}
            {Object.keys(groupedModels).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="p-4 rounded-2xl bg-[var(--surface-100)] mb-4">
                        <Search className="w-10 h-10 text-[var(--surface-500)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--surface-800)]">No models found</h3>
                    <p className="text-[var(--surface-600)] mt-1">
                        Try adjusting your search or filters
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedModels).map(([providerId, models]) => {
                        const provider = providers[providerId as ProviderId];
                        if (!provider) return null;

                        return (
                            <div key={providerId} className="space-y-4">
                                {/* Provider Header */}
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{provider.logo}</span>
                                    <h2 className={cn("text-xl font-bold", provider.color)}>
                                        {provider.name}
                                    </h2>
                                    <span className="text-sm text-[var(--surface-500)]">
                                        {models.length} model{models.length !== 1 ? 's' : ''}
                                    </span>
                                    <a
                                        href={provider.apiDocsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-auto flex items-center gap-1 text-sm text-[var(--surface-500)] hover:text-[var(--primary)] transition-colors"
                                    >
                                        API Docs <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>

                                {/* Models Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {models.map((model) => (
                                        <div
                                            key={model.id}
                                            className={cn(
                                                "rounded-2xl bg-[var(--surface-50)] border border-[var(--surface-300)] overflow-hidden transition-all cursor-pointer",
                                                expandedModel === model.id && "ring-2 ring-[var(--primary)]/30"
                                            )}
                                            onClick={() => setExpandedModel(expandedModel === model.id ? null : model.id)}
                                        >
                                            <div className="p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className="font-semibold text-[var(--surface-900)]">
                                                                {model.name}
                                                            </h3>
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                                                                getModelCategoryColor(model.category)
                                                            )}>
                                                                {categoryIcons[model.category]}
                                                                {model.category}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-[var(--surface-600)] line-clamp-2">
                                                            {model.description}
                                                        </p>
                                                    </div>

                                                    {/* Pricing */}
                                                    <div className="text-right shrink-0">
                                                        <p className="text-xs text-[var(--surface-500)]">Per 1M tokens</p>
                                                        <p className="text-sm font-semibold text-[var(--surface-800)]">
                                                            {formatPrice(model.pricing.input)} / {formatPrice(model.pricing.output)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Quick Stats */}
                                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[var(--surface-300)]">
                                                    <div className="flex items-center gap-1.5 text-sm text-[var(--surface-600)]">
                                                        <MessageSquare className="w-4 h-4" />
                                                        <span>{formatContextWindow(model.contextWindow)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-sm text-[var(--surface-600)]">
                                                        <Clock className="w-4 h-4" />
                                                        <span>~{model.performance.avgLatency}ms</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-sm text-[var(--surface-600)]">
                                                        <Zap className="w-4 h-4" />
                                                        <span>{model.performance.tokensPerSecond} tok/s</span>
                                                    </div>
                                                </div>

                                                {/* Expanded Content */}
                                                {expandedModel === model.id && (
                                                    <div className="mt-4 pt-4 border-t border-[var(--surface-300)] space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                        {/* Capabilities */}
                                                        <div>
                                                            <p className="text-xs font-medium text-[var(--surface-500)] mb-2">Capabilities</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {Object.entries(model.capabilities).map(([cap, enabled]) => (
                                                                    <span
                                                                        key={cap}
                                                                        className={cn(
                                                                            "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs",
                                                                            enabled
                                                                                ? "bg-[var(--success)]/10 text-[var(--success)]"
                                                                                : "bg-[var(--surface-200)] text-[var(--surface-500)]"
                                                                        )}
                                                                    >
                                                                        {enabled && <Check className="w-3 h-3" />}
                                                                        {cap.charAt(0).toUpperCase() + cap.slice(1).replace(/([A-Z])/g, ' $1')}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Model ID */}
                                                        <div>
                                                            <p className="text-xs font-medium text-[var(--surface-500)] mb-1">Model ID</p>
                                                            <code className="text-sm font-mono text-[var(--surface-700)] bg-[var(--surface-200)] px-2 py-1 rounded">
                                                                {model.modelId}
                                                            </code>
                                                        </div>

                                                        {/* Limits */}
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-xs font-medium text-[var(--surface-500)] mb-1">Context Window</p>
                                                                <p className="text-sm font-semibold text-[var(--surface-800)]">
                                                                    {model.contextWindow.toLocaleString()} tokens
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-medium text-[var(--surface-500)] mb-1">Max Output</p>
                                                                <p className="text-sm font-semibold text-[var(--surface-800)]">
                                                                    {model.maxOutputTokens.toLocaleString()} tokens
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
