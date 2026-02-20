"use client";

import { useState, useEffect } from "react";
import { Plus, Bot, Edit2, Trash2, Power, Eye, EyeOff } from "lucide-react";

interface AgentTemplate {
    id: string;
    name: string;
    description: string;
    system_prompt: string;
    provider_config: any;
    voice_config: any;
    capabilities: any;
    avatar_url: string;
    tags: string[];
    is_active: boolean;
    version: number;
    created_at: string;
}

export default function AgentTemplatesPage() {
    const [templates, setTemplates] = useState<AgentTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<AgentTemplate | null>(null);

    const fetchTemplates = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/superadmin/agent-templates');
            const data = await response.json();
            if (data.templates) {
                setTemplates(data.templates);
            }
        } catch (error) {
            console.error("Failed to fetch templates:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const toggleActive = async (template: AgentTemplate) => {
        try {
            await fetch(`/api/superadmin/agent-templates/${template.id}`, {
                method: 'PUT',
                body: JSON.stringify({ is_active: !template.is_active }),
            });
            fetchTemplates();
        } catch (error) {
            console.error("Failed to toggle template:", error);
        }
    };

    const deleteTemplate = async (template: AgentTemplate) => {
        if (!confirm(`Are you sure you want to delete template "${template.name}"?`)) return;

        try {
            await fetch(`/api/superadmin/agent-templates/${template.id}`, {
                method: 'DELETE',
            });
            fetchTemplates();
        } catch (error) {
            console.error("Failed to delete template:", error);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--surface-900)]">Agent Templates</h1>
                    <p className="text-[var(--surface-500)] mt-1">Manage global templates available to all organizations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setEditingTemplate(null);
                            setIsEditorOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[var(--primary)]/90 transition-all font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        Create Template
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--surface-300)] flex justify-between items-center bg-[var(--surface-200)]/30">
                    <h2 className="font-semibold text-[var(--surface-900)] flex items-center gap-2">
                        <Bot className="w-5 h-5 text-[var(--primary)]" />
                        Global Templates
                    </h2>
                    <span className="px-2.5 py-1 text-xs font-medium bg-[var(--surface-200)] text-[var(--surface-600)] rounded-full">
                        {templates.length} Total
                    </span>
                </div>

                <div className="divide-y divide-[var(--surface-300)]">
                    {templates.map(template => (
                        <div key={template.id} className="p-6 transition-colors hover:bg-[var(--surface-100)] flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[var(--surface-200)] border border-[var(--surface-300)] flex items-center justify-center shrink-0">
                                {template.avatar_url ? (
                                    <img src={template.avatar_url} alt={template.name} className="w-full h-full rounded-xl object-cover" />
                                ) : (
                                    <span className="text-2xl">🤖</span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-[var(--surface-900)] truncate">
                                        {template.name}
                                    </h3>
                                    {!template.is_active && (
                                        <span className="px-2 py-0.5 text-xs font-medium bg-[var(--surface-200)] text-[var(--surface-500)] rounded-full flex items-center gap-1">
                                            <EyeOff className="w-3 h-3" /> Hidden
                                        </span>
                                    )}
                                    <span className="text-xs text-[var(--surface-400)]">
                                        v{template.version}
                                    </span>
                                </div>
                                <p className="text-sm text-[var(--surface-500)] mt-1 line-clamp-2">
                                    {template.description || "No description provided."}
                                </p>

                                {template.tags && template.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {template.tags.map(tag => (
                                            <span key={tag} className="px-2 py-1 text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 rounded-md">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => toggleActive(template)}
                                    className="p-2 text-[var(--surface-500)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                                    title={template.is_active ? "Hide from users" : "Show to users"}
                                >
                                    {template.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingTemplate(template);
                                        setIsEditorOpen(true);
                                    }}
                                    className="p-2 text-[var(--surface-500)] hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                    title="Edit Template"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => deleteTemplate(template)}
                                    className="p-2 text-[var(--surface-500)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Delete Template"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {templates.length === 0 && !isLoading && (
                        <div className="p-12 text-center text-[var(--surface-500)]">
                            No templates found. Create your first one to populate the local app wizard.
                        </div>
                    )}
                </div>
            </div>

            {isEditorOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--surface-50)] rounded-2xl border border-[var(--surface-300)] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-[var(--surface-300)] flex justify-between items-center bg-[var(--surface-100)]">
                            <h2 className="text-xl font-semibold text-[var(--surface-900)]">
                                {editingTemplate ? 'Edit Template' : 'Create New Template'}
                            </h2>
                            <button onClick={() => setIsEditorOpen(false)} className="text-[var(--surface-500)] hover:text-[var(--surface-800)] text-xl transition-colors">✕</button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-[var(--surface-700)]">Template Name</label>
                                    <input
                                        type="text"
                                        defaultValue={editingTemplate?.name || ''}
                                        id="templateName"
                                        className="w-full px-4 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl outline-none focus:border-[var(--primary)] text-[var(--surface-900)] transition-colors"
                                        placeholder="e.g. Senior Backend Engineer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-[var(--surface-700)]">Avatar URL (Optional)</label>
                                    <input
                                        type="text"
                                        defaultValue={editingTemplate?.avatar_url || ''}
                                        id="templateAvatar"
                                        className="w-full px-4 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl outline-none focus:border-[var(--primary)] text-[var(--surface-900)] transition-colors"
                                        placeholder="https://example.com/avatar.png"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[var(--surface-700)]">Short Description</label>
                                <textarea
                                    defaultValue={editingTemplate?.description || ''}
                                    id="templateDescription"
                                    rows={2}
                                    className="w-full px-4 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl outline-none focus:border-[var(--primary)] text-[var(--surface-900)] transition-colors resize-none"
                                    placeholder="Brief summary of what this agent excels at..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[var(--surface-700)]">System Prompt</label>
                                <textarea
                                    defaultValue={editingTemplate?.system_prompt || ''}
                                    id="templatePrompt"
                                    rows={8}
                                    className="w-full px-4 py-3 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl outline-none focus:border-[var(--primary)] text-[var(--surface-900)] font-mono text-sm transition-colors"
                                    placeholder="You are an expert at X. Your goal is to Y. Always follow Z protocols..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[var(--surface-700)] flex justify-between">
                                    <span>Tags (Comma Separated)</span>
                                </label>
                                <input
                                    type="text"
                                    defaultValue={editingTemplate?.tags?.join(', ') || ''}
                                    id="templateTags"
                                    className="w-full px-4 py-2 bg-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl outline-none focus:border-[var(--primary)] text-[var(--surface-900)] transition-colors"
                                    placeholder="coding, web-development, python"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6 pb-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-[var(--surface-700)]">Provider Config (JSON)</label>
                                    <textarea
                                        defaultValue={JSON.stringify(editingTemplate?.provider_config || {}, null, 2)}
                                        id="templateProviderConfig"
                                        rows={4}
                                        className="w-full p-3 bg-[var(--surface-900)] text-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl outline-none focus:border-[var(--primary)] font-mono text-xs transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-[var(--surface-700)]">Voice Config (JSON)</label>
                                    <textarea
                                        defaultValue={JSON.stringify(editingTemplate?.voice_config || {}, null, 2)}
                                        id="templateVoiceConfig"
                                        rows={4}
                                        className="w-full p-3 bg-[var(--surface-900)] text-[var(--surface-100)] border border-[var(--surface-300)] rounded-xl outline-none focus:border-[var(--primary)] font-mono text-xs transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-[var(--surface-300)] bg-[var(--surface-100)] flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsEditorOpen(false)} className="px-5 py-2.5 text-sm font-semibold text-[var(--surface-700)] hover:bg-[var(--surface-200)] border border-[var(--surface-300)] rounded-xl transition-all shadow-sm bg-white">
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const name = (document.getElementById('templateName') as HTMLInputElement).value;
                                    const description = (document.getElementById('templateDescription') as HTMLTextAreaElement).value;
                                    const system_prompt = (document.getElementById('templatePrompt') as HTMLTextAreaElement).value;
                                    const tagsInput = (document.getElementById('templateTags') as HTMLInputElement).value;
                                    const avatar_url = (document.getElementById('templateAvatar') as HTMLInputElement).value;

                                    let provider_config = {};
                                    let voice_config = {};
                                    try {
                                        provider_config = JSON.parse((document.getElementById('templateProviderConfig') as HTMLTextAreaElement).value || '{}');
                                        voice_config = JSON.parse((document.getElementById('templateVoiceConfig') as HTMLTextAreaElement).value || '{}');
                                    } catch (e) {
                                        alert('Invalid JSON in config fields');
                                        return;
                                    }

                                    const payload = {
                                        name,
                                        description,
                                        system_prompt,
                                        tags: tagsInput.split(',').map(tag => tag.trim()).filter(t => t),
                                        avatar_url: avatar_url || null,
                                        provider_config,
                                        voice_config,
                                        capabilities: [] // Default for now
                                    };

                                    try {
                                        if (editingTemplate) {
                                            await fetch(`/api/superadmin/agent-templates/${editingTemplate.id}`, {
                                                method: 'PUT',
                                                body: JSON.stringify(payload),
                                            });
                                        } else {
                                            await fetch(`/api/superadmin/agent-templates`, {
                                                method: 'POST',
                                                body: JSON.stringify(payload),
                                            });
                                        }
                                        setIsEditorOpen(false);
                                        fetchTemplates();
                                    } catch (error) {
                                        console.error("Failed to save template", error);
                                        alert("Failed to save template");
                                    }
                                }}
                                className="px-5 py-2.5 text-sm font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 rounded-xl transition-all shadow-md"
                            >
                                {editingTemplate ? 'Update Template' : 'Create Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
