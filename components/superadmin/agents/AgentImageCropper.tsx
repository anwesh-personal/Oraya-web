"use client";

import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { X, ZoomIn, ZoomOut, RotateCw, Upload, Check, Loader2 } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CropArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface AgentImageCropperProps {
    templateId: string;
    currentUrl: string | null;
    onSaved: (url: string) => void;
    onClose: () => void;
}

// ─── Canvas crop helper ───────────────────────────────────────────────────────

async function getCroppedBlob(
    imageSrc: string,
    pixelCrop: CropArea,
    rotation = 0
): Promise<Blob> {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.addEventListener("load", () => resolve(img));
        img.addEventListener("error", reject);
        img.setAttribute("crossOrigin", "anonymous");
        img.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);
    ctx.drawImage(image, safeArea / 2 - image.width / 2, safeArea / 2 - image.height / 2);

    const bitmapData = ctx.getImageData(0, 0, safeArea, safeArea);

    const outputSize = Math.min(pixelCrop.width, pixelCrop.height);
    canvas.width = outputSize;
    canvas.height = outputSize;

    ctx.putImageData(
        bitmapData,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")), "image/webp", 0.92);
    });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AgentImageCropper({ templateId, currentUrl, onSaved, onClose }: AgentImageCropperProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [src, setSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedArea, setCroppedArea] = useState<CropArea | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Load file ──────────────────────────────────────────────────────────

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { setError("File too large. Max 10MB."); return; }
        const reader = new FileReader();
        reader.onload = ev => setSrc(ev.target?.result as string);
        reader.readAsDataURL(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const onCropComplete = useCallback((_: any, croppedAreaPixels: CropArea) => {
        setCroppedArea(croppedAreaPixels);
    }, []);

    // ── Upload cropped blob ────────────────────────────────────────────────

    const handleSave = async () => {
        if (!src || !croppedArea) return;
        setIsUploading(true);
        setError(null);
        try {
            const blob = await getCroppedBlob(src, croppedArea, rotation);
            const fd = new FormData();
            fd.append("file", new File([blob], "icon.webp", { type: "image/webp" }));

            const res = await fetch(`/api/superadmin/agent-templates/${templateId}/icon`, {
                method: "POST",
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");
            onSaved(data.icon_url);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[var(--surface-50)] border border-[var(--surface-300)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--surface-300)] bg-[var(--surface-100)]">
                    <div>
                        <h3 className="font-bold text-[var(--surface-900)]">Agent Image</h3>
                        <p className="text-xs text-[var(--surface-500)] mt-0.5">Upload, crop and zoom to perfect it.</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-200)] transition-colors text-[var(--surface-500)]">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Crop area */}
                {src ? (
                    <>
                        {/* Cropper canvas */}
                        <div className="relative w-full" style={{ height: 300 }}>
                            <Cropper
                                image={src}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                                style={{
                                    containerStyle: { background: "#0a0a0a" },
                                    cropAreaStyle: { border: "2px solid var(--primary)" },
                                }}
                            />
                        </div>

                        {/* Controls */}
                        <div className="px-5 py-4 space-y-4 border-t border-[var(--surface-300)]">
                            {/* Zoom */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setZoom(z => Math.max(1, z - 0.1))}
                                    className="p-1.5 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-600)] transition-colors"
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </button>
                                <input
                                    type="range"
                                    min={1}
                                    max={3}
                                    step={0.05}
                                    value={zoom}
                                    onChange={e => setZoom(Number(e.target.value))}
                                    className="flex-1 accent-[var(--primary)] h-1.5 rounded-full cursor-pointer"
                                />
                                <button
                                    onClick={() => setZoom(z => Math.min(3, z + 0.1))}
                                    className="p-1.5 rounded-lg hover:bg-[var(--surface-200)] text-[var(--surface-600)] transition-colors"
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </button>
                                <span className="text-xs text-[var(--surface-500)] w-10 text-right font-mono">{zoom.toFixed(1)}×</span>
                            </div>

                            {/* Rotate */}
                            <div className="flex items-center gap-3">
                                <RotateCw className="w-4 h-4 text-[var(--surface-500)]" />
                                <input
                                    type="range"
                                    min={-180}
                                    max={180}
                                    step={1}
                                    value={rotation}
                                    onChange={e => setRotation(Number(e.target.value))}
                                    className="flex-1 accent-[var(--primary)] h-1.5 rounded-full cursor-pointer"
                                />
                                <span className="text-xs text-[var(--surface-500)] w-10 text-right font-mono">{rotation}°</span>
                                <button
                                    onClick={() => setRotation(0)}
                                    className="text-xs text-[var(--surface-500)] hover:text-[var(--primary)] transition-colors px-1"
                                >
                                    Reset
                                </button>
                            </div>

                            {error && <p className="text-xs text-red-400">{error}</p>}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-1">
                                <button
                                    onClick={() => { setSrc(null); setZoom(1); setRotation(0); }}
                                    className="text-sm text-[var(--surface-500)] hover:text-[var(--surface-700)] transition-colors"
                                >
                                    Change image
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isUploading}
                                    className="flex items-center gap-2 px-5 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-[var(--primary)]/90 transition-all"
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    {isUploading ? "Saving..." : "Save Image"}
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Drop zone / pick */
                    <div
                        className="flex flex-col items-center justify-center gap-4 p-10 cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                            e.preventDefault();
                            const f = e.dataTransfer.files[0];
                            if (f) {
                                const fakeEvt = { target: { files: [f], value: "" } } as any;
                                handleFile(fakeEvt);
                            }
                        }}
                    >
                        {currentUrl ? (
                            <img src={currentUrl} alt="Current" className="w-24 h-24 rounded-full object-cover border-2 border-[var(--primary)]/40 mb-2" />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-[var(--surface-200)] flex items-center justify-center mb-2 group-hover:bg-[var(--surface-300)] transition-colors">
                                <Upload className="w-8 h-8 text-[var(--surface-400)]" />
                            </div>
                        )}
                        <div className="text-center">
                            <p className="text-sm font-semibold text-[var(--surface-800)] group-hover:text-[var(--primary)] transition-colors">
                                {currentUrl ? "Change image" : "Upload image"}
                            </p>
                            <p className="text-xs text-[var(--surface-500)] mt-1">
                                Drag & drop or click · PNG, JPG, WEBP, GIF · Max 10MB
                            </p>
                        </div>
                        {error && <p className="text-xs text-red-400">{error}</p>}
                    </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
        </div>
    );
}
