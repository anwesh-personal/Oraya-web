"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Trash2,
    Edit,
    HardDrive,
    Save,
    X,
    AlertCircle,
    Loader2,
    CheckCircle2,
    Search,
    ChevronRight,
    Tag,
    Cpu,
    ExternalLink,
    Box
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type CloudLocalModel = Database['public']['Tables']['cloud_local_models']['Row'];
type ModelInsert = Database['public']['Tables']['cloud_local_models']['Insert'];

export function LocalModelsTab() {
    const supabase = getSupabaseClient();
    const [models, setModels] = useState<CloudLocalModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<CloudLocalModel | null>(null);
    const [formData, setFormData] = useState<ModelInsert>({
        name: "",
        description: "",
        family: "llama3",
        hf_repo_id: "",
        hf_filename: "",
        file_size_gb: 0,
        quantization: "Q4_K_M",
        ram_required_gb: 8,
        context_length: 8192,
        parameters_billions: 8.0,
        category: "general",
        tags: [],
        sort_order: 10,
        is_active: true
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchModels();
    }, []);

    async function fetchModels() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('cloud_local_models')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setModels(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this model? This will affect all desktop app users.")) return;

        try {
            const { error } = await supabase
                .from('cloud_local_models')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setModels(models.filter(m => m.id !== id));
        } catch (err: any) {
            alert("Delete failed: " + err.message);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingModel) {
                const { error } = await supabase
                    .from('cloud_local_models')
                    .update(formData)
                    .eq('id', editingModel.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('cloud_local_models')
                    .insert([formData]);
                if (error) throw error;
            }

            setIsFormOpen(false);
            setEditingModel(null);
            fetchModels();
        } catch (err: any) {
            alert("Save failed: " + err.message);
        } finally {
            setIsSaving(false);
        }
    }

    const openEditForm = (model: CloudLocalModel) => {
        setEditingModel(model);
        setFormData({
            name: model.name,
            description: model.description,
            family: model.family,
            hf_repo_id: model.hf_repo_id,
            hf_filename: model.hf_filename,
            file_size_gb: Number(model.file_size_gb),
            quantization: model.quantization,
            ram_required_gb: Number(model.ram_required_gb),
            context_length: model.context_length,
            parameters_billions: Number(model.parameters_billions),
            category: model.category,
            tags: model.tags,
            sort_order: model.sort_order,
            is_active: model.is_active
        });
        setIsFormOpen(true);
    };

    const openAddForm = () => {
        setEditingModel(null);
        setFormData({
            name: "",
            description: "",
            family: "llama3",
            hf_repo_id: "",
            hf_filename: "",
            file_size_gb: 0,
            quantization: "Q4_K_M",
            ram_required_gb: 8,
            context_length: 8192,
            parameters_billions: 8.0,
            category: "general",
            tags: [],
            sort_order: (models.length > 0 ? (Math.max(...models.map(m => m.sort_order || 0)) + 10) : 10),
            is_active: true
        });
        setIsFormOpen(true);
    };

    const filteredModels = models.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.family.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && models.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search local models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                </div>
                <button
                    onClick={openAddForm}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add GGUF Model
                </button>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <p>{error}</p>
                </div>
            )}

            {/* Model Grid */}
            <div className="grid grid-cols-1 gap-4">
                {filteredModels.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
                        <HardDrive className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white">No local models found</h3>
                        <p className="text-gray-400 mt-1">Add your first GGUF model to dynamic recommendations</p>
                    </div>
                ) : (
                    filteredModels.map(model => (
                        <div key={model.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-violet-500/30 transition-all flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-white">{model.name}</h3>
                                    {model.is_active ? (
                                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">Active</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 text-xs rounded-full border border-gray-500/20">Inactive</span>
                                    )}
                                    <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-xs rounded-full border border-violet-500/20 uppercase font-mono">{model.family}</span>
                                </div>
                                <p className="text-gray-400 text-sm line-clamp-2 whitespace-pre-wrap">{model.description}</p>

                                <div className="flex flex-wrap gap-4 text-xs">
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <Cpu className="w-3.5 h-3.5" />
                                        <span>Req: {model.ram_required_gb}GB RAM</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <Box className="w-3.5 h-3.5" />
                                        <span>{model.file_size_gb}GB File</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <Tag className="w-3.5 h-3.5" />
                                        <span>{model.parameters_billions}B Params</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <ChevronRight className="w-3.5 h-3.5" />
                                        <span>Order: {model.sort_order}</span>
                                    </div>
                                </div>

                                <div className="pt-2 flex items-center gap-2 overflow-x-auto">
                                    {model.tags?.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-white/5 text-[10px] text-gray-400 rounded-md border border-white/5 whitespace-nowrap">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 shrink-0 md:border-l md:border-white/10 md:pl-6">
                                <button
                                    onClick={() => openEditForm(model)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 transition-all text-sm"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(model.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all text-sm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {editingModel ? "Edit Local Model" : "Add New GGUF Model"}
                                </h2>
                                <p className="text-sm text-gray-500">Configuring hardware-aware recommendation for desktop clients</p>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh] grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Model Name</label>
                                <input
                                    required
                                    value={formData.name || ""}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                    placeholder="Meta Llama 3.1 (8B)"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Family (Internal ID)</label>
                                <input
                                    required
                                    value={formData.family || ""}
                                    onChange={e => setFormData({ ...formData, family: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-mono"
                                    placeholder="llama3"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Category</label>
                                <select
                                    value={formData.category || "general"}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                >
                                    <option value="general">General Purpose</option>
                                    <option value="coding">Coding Specialist</option>
                                    <option value="reasoning">Advanced Reasoning</option>
                                    <option value="multimodal">Multimodal / Vision</option>
                                </select>
                            </div>

                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Professional Description & TL;DR</label>
                                <textarea
                                    required
                                    value={formData.description || ""}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[100px] transition-all"
                                    placeholder="Describe the model's strengths...&#10;&#10;TL;DR: The reliable workhorse..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">HuggingFace Repo ID</label>
                                <input
                                    required
                                    value={formData.hf_repo_id || ""}
                                    onChange={e => setFormData({ ...formData, hf_repo_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                    placeholder="bartowski/Meta-Llama-3.1-8B-Instruct-GGUF"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">GGUF Filename</label>
                                <input
                                    required
                                    value={formData.hf_filename || ""}
                                    onChange={e => setFormData({ ...formData, hf_filename: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                    placeholder="Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">RAM Requirement (GB)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={formData.ram_required_gb || 0}
                                    onChange={e => setFormData({ ...formData, ram_required_gb: parseFloat(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Parameters (Billions)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={formData.parameters_billions || 0}
                                    onChange={e => setFormData({ ...formData, parameters_billions: parseFloat(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">File Size (GB)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    required
                                    value={formData.file_size_gb || 0}
                                    onChange={e => setFormData({ ...formData, file_size_gb: parseFloat(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Sort Order</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.sort_order || 0}
                                    onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-6 md:col-span-2 pt-4">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={cn(
                                        "w-12 h-7 rounded-full relative transition-all bg-white/10 group-hover:bg-white/20",
                                        formData.is_active && "bg-emerald-600"
                                    )}>
                                        <div className={cn(
                                            "absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all shadow-md",
                                            formData.is_active && "left-6"
                                        )} />
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.is_active || false}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    <div>
                                        <span className="text-sm text-gray-200 font-bold block leading-none">Enable Model</span>
                                        <span className="text-[10px] text-gray-500 font-medium">Model will be visible in Oraya Desktop and recommended to users.</span>
                                    </div>
                                </label>
                            </div>

                            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-8 border-t border-white/10 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black tracking-tight transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    {editingModel ? "UPDATE LIVE COMPONENT" : "SAVE TO MODEL REGISTRY"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
