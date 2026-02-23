"use client";

import { useState } from "react";
import {
    X, Save, Shield, Sparkles, Tag,
    Eye, EyeOff, Crown, Zap, ImageIcon, Loader2,
    Layers, BookOpen, ScrollText, Brain, Database, Users,
} from "lucide-react";
import { PromptsTab } from "./tabs/PromptsTab";
import { TrainingTab } from "./tabs/TrainingTab";
import { RulesTab } from "./tabs/RulesTab";
import { FactoryTab } from "./tabs/FactoryTab";
import { KnowledgeTab } from "./tabs/KnowledgeTab";
import { UsersTab } from "./tabs/UsersTab";
import { AgentImageCropper } from "./AgentImageCropper";

export interface AgentTemplate {
    id: string;
    name: string;
    emoji: string;
    role: string;
    tagline: string | null;
    description: string | null;
    icon_url: string | null;
    core_prompt: string;
    personality_config: {
        personality?: string;
        style?: string;
        tone?: string;
    } | null;
    plan_tier: string;
    is_active: boolean;
    category: string | null;
    tags: string[] | null;
    version: string;
    author: string | null;
    install_count: number;
    created_at: string;
    updated_at: string;
}

interface AgentDetailDrawerProps {
    template: AgentTemplate;
    allCategories: string[];
    onClose: () => void;
    onSave: (templateId: string, updates: Partial<AgentTemplate>) => Promise<void>;
}

type Tab = "overview" | "prompt" | "personality" | "prompts" | "knowledge" | "training" | "rules" | "factory" | "users";

export function AgentDetailDrawer({ template, allCategories, onClose, onSave }: AgentDetailDrawerProps) {
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Editable fields
    const [name, setName] = useState(template.name);
    const [emoji, setEmoji] = useState(template.emoji);
    const [tagline, setTagline] = useState(template.tagline || "");
    const [description, setDescription] = useState(template.description || "");
    const [role, setRole] = useState(template.role);
    const [planTier, setPlanTier] = useState(template.plan_tier);
    const [category, setCategory] = useState(template.category || "");
    const [tags, setTags] = useState((template.tags || []).join(", "));
    const [isActive, setIsActive] = useState(template.is_active);
    const [corePrompt, setCorePrompt] = useState(template.core_prompt);
    const [personality, setPersonality] = useState(template.personality_config?.personality || "");
    const [style, setStyle] = useState(template.personality_config?.style || "");
    const [tone, setTone] = useState(template.personality_config?.tone || "");

    // Image cropper
    const [iconUrl, setIconUrl] = useState<string | null>(template.icon_url ?? null);
    const [showCropper, setShowCropper] = useState(false);

    const markChanged = () => { if (!hasChanges) setHasChanges(true); };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
            await onSave(template.id, {
                name, emoji,
                tagline: tagline || null,
                description: description || null,
                role, plan_tier: planTier,
                category: category || null,
                tags: tags.split(",").map(t => t.trim()).filter(Boolean),
                is_active: isActive,
                core_prompt: corePrompt,
                personality_config: { personality, style, tone },
                icon_url: iconUrl,
            });
            setHasChanges(false);
        } catch (err: any) {
            setSaveError(err.message || "Failed to save.");
        } finally {
            setIsSaving(false);
        }
    };

    const tierColor = (tier: string) => {
        switch (tier) {
            case "standard": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
            case "pro": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
            case "team": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            case "enterprise": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
            default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        }
    };

    const tabClass = (tab: Tab) =>
        `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === tab
            ? "bg-[var(--primary)] text-white shadow-md"
            : "text-[var(--surface-500)] hover:text-[var(--surface-800)] hover:bg-[var(--surface-200)]"
        }`;

    return (
        /* ── Lightbox backdrop ── */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* ── Modal ── */}
            <div className="relative w-full max-w-5xl max-h-[90vh] bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                {/* ── Modal Header ── */}
                <div className="px-6 py-5 border-b border-[var(--surface-300)] flex items-center justify-between shrink-0 bg-[var(--surface-100)]">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                            style={{
                                background: "color-mix(in srgb, var(--primary) 12%, var(--surface-200))",
                                border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
                            }}
                        >
                            {emoji}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--surface-900)]">{name}</h2>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className={`px-2.5 py-0.5 text-xs font-bold border rounded-full uppercase tracking-wide ${tierColor(planTier)}`}>
                                    {planTier}
                                </span>
                                <span className="px-2.5 py-0.5 text-xs font-medium bg-[var(--surface-200)] text-[var(--surface-600)] rounded-full">
                                    {role}
                                </span>
                                {category && (
                                    <span className="px-2.5 py-0.5 text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
                                        {category}
                                    </span>
                                )}
                                {!isActive && (
                                    <span className="px-2.5 py-0.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 rounded-full">
                                        Hidden
                                    </span>
                                )}
                            </div>
                            {tagline && (
                                <p className="text-sm text-[var(--surface-500)] mt-1 italic">&ldquo;{tagline}&rdquo;</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {hasChanges && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--primary)]/90 transition-all disabled:opacity-50 shadow-md"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-[var(--surface-500)] hover:text-[var(--surface-800)] hover:bg-[var(--surface-200)] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ── Tab Bar ── */}
                <div className="px-6 py-3 border-b border-[var(--surface-300)] flex gap-1 shrink-0 overflow-x-auto bg-[var(--surface-50)]">
                    <button className={tabClass("overview")} onClick={() => setActiveTab("overview")}><Sparkles className="w-3.5 h-3.5" /> Overview</button>
                    <button className={tabClass("prompt")} onClick={() => setActiveTab("prompt")}><Zap className="w-3.5 h-3.5" /> Core Prompt</button>
                    <button className={tabClass("personality")} onClick={() => setActiveTab("personality")}><Crown className="w-3.5 h-3.5" /> Personality</button>
                    <button className={tabClass("prompts")} onClick={() => setActiveTab("prompts")}><Layers className="w-3.5 h-3.5" /> Prompt Stack</button>
                    <button className={tabClass("knowledge")} onClick={() => setActiveTab("knowledge")}><Database className="w-3.5 h-3.5" /> Knowledge</button>
                    <button className={tabClass("training")} onClick={() => setActiveTab("training")}><BookOpen className="w-3.5 h-3.5" /> Training</button>
                    <button className={tabClass("rules")} onClick={() => setActiveTab("rules")}><ScrollText className="w-3.5 h-3.5" /> Rules</button>
                    <button className={tabClass("factory")} onClick={() => setActiveTab("factory")}><Brain className="w-3.5 h-3.5" /> Factory Memory</button>
                    <button className={tabClass("users")} onClick={() => setActiveTab("users")}><Users className="w-3.5 h-3.5" /> Assigned Users</button>
                </div>

                {/* ── Scrollable Body ── */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* OVERVIEW */}
                    {activeTab === "overview" && (
                        <>
                            <Section title="Identity" icon={<Sparkles className="w-4 h-4" />}>
                                {/* Agent image */}
                                <div className="flex items-start gap-5 mb-2">
                                    <div
                                        className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-[var(--surface-300)] bg-[var(--surface-100)] relative group cursor-pointer"
                                        onClick={() => setShowCropper(true)}
                                        title="Click to change agent image"
                                    >
                                        {iconUrl ? (
                                            <img src={iconUrl} alt="Agent icon" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-3xl">{emoji || "🤖"}</span>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                                            <ImageIcon className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div>
                                            <p className="text-sm font-medium text-[var(--surface-700)] mb-1">Agent Image</p>
                                            <p className="text-xs text-[var(--surface-500)]">Shown in member dashboard and after install. Crop and zoom to perfect it.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowCropper(true)}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--surface-300)] bg-[var(--surface-100)] hover:bg-[var(--surface-200)] text-xs font-medium text-[var(--surface-700)] transition-all"
                                        >
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            {iconUrl ? "Change Image" : "Upload Image"}
                                        </button>
                                        {iconUrl && (
                                            <button type="button" onClick={() => setIconUrl(null)} className="text-xs text-[var(--surface-500)] hover:text-red-400 transition-colors block">
                                                Remove image
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Name">
                                        <input value={name} onChange={e => { setName(e.target.value); markChanged(); }} className="input-field" />
                                    </Field>
                                    <Field label="Emoji">
                                        <input value={emoji} onChange={e => { setEmoji(e.target.value); markChanged(); }} className="input-field" />
                                    </Field>
                                </div>
                                <Field label="Tagline">
                                    <input value={tagline} onChange={e => { setTagline(e.target.value); markChanged(); }} className="input-field" placeholder="Short memorable tagline..." />
                                </Field>
                                <Field label="Description">
                                    <textarea value={description} onChange={e => { setDescription(e.target.value); markChanged(); }} className="input-field resize-none" rows={3} placeholder="What this agent does..." />
                                </Field>
                            </Section>

                            <div className="grid grid-cols-2 gap-6">
                                <Section title="Access Control" icon={<Shield className="w-4 h-4" />}>
                                    <Field label="Role">
                                        <select value={role} onChange={e => { setRole(e.target.value); markChanged(); }} className="input-field">
                                            <option value="assistant">Assistant</option>
                                            <option value="supervisor">Supervisor</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </Field>
                                    <Field label="Plan Tier">
                                        <select value={planTier} onChange={e => { setPlanTier(e.target.value); markChanged(); }} className="input-field">
                                            <option value="standard">Free</option>
                                            <option value="pro">Pro</option>
                                            <option value="team">Team</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </Field>
                                    <Field label="Visibility">
                                        <button
                                            onClick={() => { setIsActive(!isActive); markChanged(); }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${isActive
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                                : "bg-red-500/10 text-red-400 border-red-500/30"
                                                }`}
                                        >
                                            {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                            {isActive ? "Visible in Gallery" : "Hidden from Gallery"}
                                        </button>
                                    </Field>
                                </Section>

                                <Section title="Classification" icon={<Tag className="w-4 h-4" />}>
                                    <Field label="Category">
                                        <select value={category} onChange={e => { setCategory(e.target.value); markChanged(); }} className="input-field">
                                            <option value="">Uncategorized</option>
                                            {allCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </Field>
                                    <Field label="Tags (comma-separated)">
                                        <input value={tags} onChange={e => { setTags(e.target.value); markChanged(); }} className="input-field" placeholder="engineering, typescript, full-stack" />
                                    </Field>
                                    <div className="grid grid-cols-2 gap-3 text-sm pt-1">
                                        <div><span className="text-[var(--surface-500)] text-xs">Version</span><p className="font-medium text-[var(--surface-800)]">{template.version}</p></div>
                                        <div><span className="text-[var(--surface-500)] text-xs">Installs</span><p className="font-medium text-[var(--surface-800)]">{template.install_count}</p></div>
                                        <div><span className="text-[var(--surface-500)] text-xs">Author</span><p className="font-medium text-[var(--surface-800)]">{template.author || "Oraya"}</p></div>
                                        <div><span className="text-[var(--surface-500)] text-xs">Updated</span><p className="font-medium text-[var(--surface-800)]">{new Date(template.updated_at).toLocaleDateString()}</p></div>
                                    </div>
                                </Section>
                            </div>
                        </>
                    )}

                    {/* CORE PROMPT */}
                    {activeTab === "prompt" && (
                        <Section title="Core Prompt" icon={<Zap className="w-4 h-4" />}>
                            <p className="text-xs text-[var(--surface-500)] mb-2">
                                This prompt defines the agent&apos;s behavior, identity, and capabilities. Changes propagate to all users on next gallery sync.
                            </p>
                            <textarea
                                value={corePrompt}
                                onChange={e => { setCorePrompt(e.target.value); markChanged(); }}
                                className="input-field font-mono text-sm resize-none"
                                rows={28}
                                spellCheck={false}
                            />
                            <div className="flex justify-between text-xs text-[var(--surface-400)] mt-2">
                                <span>{corePrompt.length.toLocaleString()} characters</span>
                                <span title="Rough estimate based on ~4 chars/token.">~{Math.ceil(corePrompt.length / 4).toLocaleString()} tokens (est.)</span>
                            </div>
                        </Section>
                    )}

                    {/* PERSONALITY */}
                    {activeTab === "personality" && (
                        <Section title="Personality Configuration" icon={<Crown className="w-4 h-4" />}>
                            <Field label="Personality">
                                <textarea value={personality} onChange={e => { setPersonality(e.target.value); markChanged(); }} className="input-field resize-none" rows={3} placeholder="Core personality traits..." />
                            </Field>
                            <Field label="Style">
                                <textarea value={style} onChange={e => { setStyle(e.target.value); markChanged(); }} className="input-field resize-none" rows={3} placeholder="Communication and output style..." />
                            </Field>
                            <Field label="Tone">
                                <textarea value={tone} onChange={e => { setTone(e.target.value); markChanged(); }} className="input-field resize-none" rows={3} placeholder="Overall tone of interaction..." />
                            </Field>
                        </Section>
                    )}

                    {activeTab === "prompts" && <PromptsTab templateId={template.id} />}
                    {activeTab === "knowledge" && <KnowledgeTab templateId={template.id} />}
                    {activeTab === "training" && <TrainingTab templateId={template.id} />}
                    {activeTab === "rules" && <RulesTab templateId={template.id} />}
                    {activeTab === "factory" && <FactoryTab templateId={template.id} />}
                    {activeTab === "users" && <UsersTab templateId={template.id} />}
                </div>

                {/* ── Error banner ── */}
                {saveError && (
                    <div className="px-6 py-3 bg-red-500/10 border-t border-red-500/20 text-red-400 text-sm flex items-center justify-between shrink-0">
                        <span>⚠️ {saveError}</span>
                        <button onClick={() => setSaveError(null)} className="text-red-400 hover:text-red-300 ml-2">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Cropper modal */}
            {showCropper && (
                <AgentImageCropper
                    templateId={template.id}
                    currentUrl={iconUrl}
                    onSaved={(url) => { setIconUrl(url); setShowCropper(false); }}
                    onClose={() => setShowCropper(false)}
                />
            )}

            <style jsx>{`
                .input-field {
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    background: var(--surface-100);
                    border: 1px solid var(--surface-300);
                    border-radius: 0.75rem;
                    color: var(--surface-900);
                    outline: none;
                    transition: border-color 0.15s;
                }
                .input-field:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent);
                }
            `}</style>
        </div>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--surface-700)] uppercase tracking-wider">
                {icon} {title}
            </h3>
            <div className="space-y-4 pl-1">{children}</div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--surface-600)]">{label}</label>
            {children}
        </div>
    );
}
