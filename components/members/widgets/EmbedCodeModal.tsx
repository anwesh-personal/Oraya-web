"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Copy, Check, Code2, Globe, FileCode2, Braces } from "lucide-react";
import type { WidgetDeployment } from "@/app/dashboard/widgets/page";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface EmbedCodeModalProps {
    widget: WidgetDeployment;
    onClose: () => void;
}

type EmbedTab = "html" | "react" | "nextjs" | "wordpress";

// ─────────────────────────────────────────────────────────────
// Code generators
// ─────────────────────────────────────────────────────────────

function getHtmlCode(apiKey: string, baseUrl: string): string {
    return `<!-- Oraya Chat Widget -->
<script
  src="${baseUrl}/embed/oraya-widget.js"
  data-widget-id="${apiKey}"
  async>
</script>`;
}

function getReactCode(apiKey: string, baseUrl: string): string {
    return `// Add to your component or layout
import { useEffect } from 'react';

function OrayaChatWidget() {
  useEffect(() => {
    if (window.__ORAYA_WIDGET_LOADED__) return;

    const script = document.createElement('script');
    script.src = '${baseUrl}/embed/oraya-widget.js';
    script.setAttribute('data-widget-id', '${apiKey}');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const host = document.getElementById('oraya-widget-host');
      if (host) host.remove();
      window.__ORAYA_WIDGET_LOADED__ = false;
    };
  }, []);

  return null;
}

export default OrayaChatWidget;`;
}

function getNextjsCode(apiKey: string, baseUrl: string): string {
    return `// app/layout.tsx or any layout file
import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="${baseUrl}/embed/oraya-widget.js"
          data-widget-id="${apiKey}"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`;
}

function getWordPressCode(apiKey: string, baseUrl: string): string {
    return `<?php
// Add to your theme's functions.php
// or use a "Custom Scripts" plugin

function oraya_chat_widget() {
    ?>
    <script
      src="${baseUrl}/embed/oraya-widget.js"
      data-widget-id="<?php echo esc_attr('${apiKey}'); ?>"
      async>
    </script>
    <?php
}
add_action('wp_footer', 'oraya_chat_widget');`;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function EmbedCodeModal({ widget, onClose }: EmbedCodeModalProps) {
    const [tab, setTab] = useState<EmbedTab>("html");
    const [copied, setCopied] = useState(false);
    const [keyCopied, setKeyCopied] = useState(false);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://oraya.dev";

    const codeMap: Record<EmbedTab, string> = {
        html: getHtmlCode(widget.api_key, baseUrl),
        react: getReactCode(widget.api_key, baseUrl),
        nextjs: getNextjsCode(widget.api_key, baseUrl),
        wordpress: getWordPressCode(widget.api_key, baseUrl),
    };

    const tabs: { key: EmbedTab; label: string; icon: React.ReactNode }[] = [
        { key: "html", label: "HTML", icon: <Globe className="w-3.5 h-3.5" /> },
        { key: "react", label: "React", icon: <Braces className="w-3.5 h-3.5" /> },
        { key: "nextjs", label: "Next.js", icon: <FileCode2 className="w-3.5 h-3.5" /> },
        { key: "wordpress", label: "WordPress", icon: <Code2 className="w-3.5 h-3.5" /> },
    ];

    const copyCode = useCallback(async () => {
        await navigator.clipboard.writeText(codeMap[tab]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [tab, codeMap]);

    const copyKey = useCallback(async () => {
        await navigator.clipboard.writeText(widget.api_key);
        setKeyCopied(true);
        setTimeout(() => setKeyCopied(false), 2000);
    }, [widget.api_key]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
                style={{
                    background: "var(--surface-50)",
                    border: "1px solid var(--surface-200)",
                }}
            >
                {/* Header */}
                <div
                    className="px-6 py-4 flex items-center justify-between"
                    style={{ background: "var(--gradient-primary)" }}
                >
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Code2 className="w-5 h-5" />
                            Embed Code
                        </h2>
                        <p className="text-xs text-white/70 mt-0.5">
                            {widget.name} • {widget.agent_templates?.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Widget Key */}
                    <div
                        className="flex items-center gap-3 p-3 rounded-xl border"
                        style={{
                            background: "var(--surface-100)",
                            borderColor: "var(--surface-200)",
                        }}
                    >
                        <div className="flex-1">
                            <p className="text-[10px] font-semibold text-[var(--surface-500)] uppercase tracking-wider mb-0.5">
                                Widget Key
                            </p>
                            <p className="text-sm font-mono text-[var(--surface-900)]">
                                {widget.api_key}
                            </p>
                        </div>
                        <button
                            onClick={copyKey}
                            className="p-2 rounded-lg transition-colors hover:bg-[var(--surface-200)]"
                        >
                            {keyCopied
                                ? <Check className="w-4 h-4 text-green-500" />
                                : <Copy className="w-4 h-4 text-[var(--surface-500)]" />
                            }
                        </button>
                    </div>

                    {/* Tab Bar */}
                    <div
                        className="flex gap-1 p-1 rounded-xl"
                        style={{ background: "var(--surface-100)" }}
                    >
                        {tabs.map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                                style={{
                                    background: tab === t.key
                                        ? "var(--surface-50)"
                                        : "transparent",
                                    color: tab === t.key
                                        ? "var(--surface-900)"
                                        : "var(--surface-500)",
                                    boxShadow: tab === t.key
                                        ? "0 1px 3px rgba(0,0,0,0.08)"
                                        : "none",
                                }}
                            >
                                {t.icon}
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Code Block */}
                    <div className="relative">
                        <pre
                            className="p-4 rounded-xl overflow-x-auto text-xs leading-relaxed"
                            style={{
                                background: "#1e293b",
                                color: "#e2e8f0",
                                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                            }}
                        >
                            <code>{codeMap[tab]}</code>
                        </pre>
                        <button
                            onClick={copyCode}
                            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                                background: copied
                                    ? "rgba(34, 197, 94, 0.2)"
                                    : "rgba(255, 255, 255, 0.1)",
                                color: copied ? "#4ade80" : "#e2e8f0",
                                border: "1px solid rgba(255,255,255,0.1)",
                            }}
                        >
                            {copied
                                ? <><Check className="w-3 h-3" /> Copied!</>
                                : <><Copy className="w-3 h-3" /> Copy</>
                            }
                        </button>
                    </div>

                    {/* Instructions */}
                    <div
                        className="p-4 rounded-xl text-xs space-y-2"
                        style={{
                            background: "color-mix(in srgb, var(--primary) 5%, var(--surface-50))",
                            border: "1px solid color-mix(in srgb, var(--primary) 15%, transparent)",
                            color: "var(--surface-600)",
                        }}
                    >
                        <p className="font-bold text-[var(--surface-800)]">📋 Quick Setup</p>
                        <ol className="list-decimal list-inside space-y-1.5 ml-1">
                            <li>Copy the code above</li>
                            <li>
                                {tab === "html"
                                    ? "Paste it just before the closing </body> tag on your page"
                                    : tab === "react"
                                    ? "Import and add <OrayaChatWidget /> to your app's root component"
                                    : tab === "nextjs"
                                    ? "Add the Script component to your root layout.tsx"
                                    : "Add the code to your theme's functions.php file"
                                }
                            </li>
                            <li>That&apos;s it! The chat widget will appear on your site.</li>
                        </ol>
                        {widget.allowed_domains?.length > 0 && (
                            <p className="mt-3 text-[var(--surface-500)]">
                                ⚠️ This widget is restricted to:{" "}
                                <span className="font-mono font-semibold">
                                    {widget.allowed_domains.join(", ")}
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
