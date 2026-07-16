// ============================================================================
// Oraya Embeddable Chat Widget — v1.0.0
// Zero-dependency, Shadow DOM isolated, enterprise-grade chat widget.
// Drop-in <script> tag deploys a fully functional AI agent on any page.
//
// Usage:
//   <script src="https://oraya.dev/embed/oraya-widget.js"
//           data-widget-id="wgt_xxxxx" async></script>
// ============================================================================

(function () {
    "use strict";

    // ─── Prevent double-init ────────────────────────────────────────────────
    if (window.__ORAYA_WIDGET_LOADED__) return;
    window.__ORAYA_WIDGET_LOADED__ = true;

    // ─── Resolve script tag + config ────────────────────────────────────────
    const scriptTag =
        document.currentScript ||
        document.querySelector('script[data-widget-id]');

    if (!scriptTag) {
        console.error("[Oraya Widget] No script tag with data-widget-id found.");
        return;
    }

    const WIDGET_KEY = scriptTag.getAttribute("data-widget-id");
    if (!WIDGET_KEY || !WIDGET_KEY.startsWith("wgt_")) {
        console.error("[Oraya Widget] Invalid widget key:", WIDGET_KEY);
        return;
    }

    const API_BASE =
        scriptTag.getAttribute("data-api-base") ||
        scriptTag.src.replace(/\/embed\/oraya-widget\.js.*$/, "") ||
        "https://oraya.dev";

    // ─── Utility: Generate visitor ID ───────────────────────────────────────
    function getVisitorId() {
        const KEY = "oraya_vid_" + WIDGET_KEY;
        let vid = localStorage.getItem(KEY);
        if (!vid) {
            vid = "v_" + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
            try { localStorage.setItem(KEY, vid); } catch (e) { /* private mode */ }
        }
        return vid;
    }

    // ─── Utility: Session ID persistence ────────────────────────────────────
    function getSessionId() {
        const KEY = "oraya_sid_" + WIDGET_KEY;
        try { return sessionStorage.getItem(KEY); } catch (e) { return null; }
    }

    function setSessionId(sid) {
        const KEY = "oraya_sid_" + WIDGET_KEY;
        try { sessionStorage.setItem(KEY, sid); } catch (e) { /* noop */ }
    }

    // ─── Utility: Timestamp formatter ───────────────────────────────────────
    function formatTime(ts) {
        const d = new Date(ts);
        const h = d.getHours();
        const m = d.getMinutes().toString().padStart(2, "0");
        const ampm = h >= 12 ? "PM" : "AM";
        return (h % 12 || 12) + ":" + m + " " + ampm;
    }

    // ─── Utility: Escape HTML ───────────────────────────────────────────────
    function esc(str) {
        const d = document.createElement("div");
        d.appendChild(document.createTextNode(str));
        return d.innerHTML;
    }

    // ─── Utility: Simple markdown → HTML ────────────────────────────────────
    function mdToHtml(text) {
        return esc(text)
            .replace(/```([\s\S]*?)```/g, '<pre class="ow-code-block"><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code class="ow-inline-code">$1</code>')
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(/\n/g, "<br>");
    }

    // ─── CSS Generation ─────────────────────────────────────────────────────
    function buildStyles(cfg) {
        const p = cfg.primaryColor || "#7c3aed";
        const a = cfg.accentColor || "#6d28d9";
        const bg = cfg.darkMode ? "#1a1a2e" : (cfg.bgColor || "#ffffff");
        const text = cfg.darkMode ? "#e2e8f0" : (cfg.textColor || "#1a1a2e");
        const subtle = cfg.darkMode ? "#2d2d44" : "#f1f5f9";
        const border = cfg.darkMode ? "#3d3d5c" : "#e2e8f0";
        const inputBg = cfg.darkMode ? "#2d2d44" : "#f8fafc";
        const r = cfg.borderRadius || 16;
        const font = cfg.fontFamily || "Inter, system-ui, -apple-system, sans-serif";
        const w = cfg.chatWidth || 400;
        const h = cfg.chatHeight || 620;
        const bs = cfg.bubbleSize || 60;

        return `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

            :host {
                --ow-primary: ${p};
                --ow-accent: ${a};
                --ow-bg: ${bg};
                --ow-text: ${text};
                --ow-subtle: ${subtle};
                --ow-border: ${border};
                --ow-input-bg: ${inputBg};
                --ow-radius: ${r}px;
                --ow-font: ${font};
                --ow-width: ${w}px;
                --ow-height: ${h}px;
                --ow-bubble: ${bs}px;
                font-family: var(--ow-font);
                font-size: 14px;
                line-height: 1.5;
                color: var(--ow-text);
            }

            /* ── Bubble Trigger ─────────────────────────────────── */

            .ow-bubble {
                position: fixed;
                z-index: 2147483646;
                width: var(--ow-bubble);
                height: var(--ow-bubble);
                border-radius: 50%;
                background: linear-gradient(135deg, var(--ow-primary), var(--ow-accent));
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 24px rgba(0,0,0,0.18), 0 0 0 0 rgba(124,58,237,0.4);
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                            box-shadow 0.3s ease;
                animation: ow-pulse 3s ease-in-out infinite;
            }
            .ow-bubble:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 32px rgba(0,0,0,0.24), 0 0 0 6px rgba(124,58,237,0.15);
            }
            .ow-bubble:active { transform: scale(0.95); }

            .ow-bubble.bottom-right { bottom: 24px; right: 24px; }
            .ow-bubble.bottom-left { bottom: 24px; left: 24px; }
            .ow-bubble.top-right { top: 24px; right: 24px; }
            .ow-bubble.top-left { top: 24px; left: 24px; }

            .ow-bubble svg { width: 28px; height: 28px; fill: white; transition: transform 0.3s ease; }
            .ow-bubble.ow-open svg { transform: rotate(90deg); }

            @keyframes ow-pulse {
                0%, 100% { box-shadow: 0 4px 24px rgba(0,0,0,0.18), 0 0 0 0 rgba(124,58,237,0.4); }
                50% { box-shadow: 0 4px 24px rgba(0,0,0,0.18), 0 0 0 8px rgba(124,58,237,0); }
            }

            /* ── Unread Badge ───────────────────────────────────── */

            .ow-badge {
                position: absolute;
                top: -4px;
                right: -4px;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #ef4444;
                color: white;
                font-size: 11px;
                font-weight: 700;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid white;
                animation: ow-badge-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            @keyframes ow-badge-in {
                from { transform: scale(0); } to { transform: scale(1); }
            }

            /* ── Chat Window ────────────────────────────────────── */

            .ow-window {
                position: fixed;
                z-index: 2147483647;
                width: var(--ow-width);
                height: var(--ow-height);
                max-height: calc(100vh - 120px);
                max-width: calc(100vw - 32px);
                border-radius: var(--ow-radius);
                background: var(--ow-bg);
                border: 1px solid var(--ow-border);
                box-shadow: 0 20px 60px rgba(0,0,0,0.15),
                            0 0 0 1px rgba(0,0,0,0.05);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                opacity: 0;
                transform: translateY(20px) scale(0.95);
                pointer-events: none;
                transition: opacity 0.3s ease,
                            transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .ow-window.ow-visible {
                opacity: 1;
                transform: translateY(0) scale(1);
                pointer-events: auto;
            }

            .ow-window.bottom-right { bottom: 96px; right: 24px; }
            .ow-window.bottom-left { bottom: 96px; left: 24px; }
            .ow-window.top-right { top: 96px; right: 24px; }
            .ow-window.top-left { top: 96px; left: 24px; }

            /* ── Header ─────────────────────────────────────────── */

            .ow-header {
                background: linear-gradient(135deg, var(--ow-primary), var(--ow-accent));
                color: white;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                flex-shrink: 0;
            }
            .ow-header-avatar {
                width: 40px;
                height: 40px;
                border-radius: 12px;
                background: rgba(255,255,255,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                flex-shrink: 0;
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255,255,255,0.15);
            }
            .ow-header-avatar img {
                width: 100%;
                height: 100%;
                border-radius: 12px;
                object-fit: cover;
            }
            .ow-header-info { flex: 1; min-width: 0; }
            .ow-header-name {
                font-size: 15px;
                font-weight: 700;
                letter-spacing: -0.01em;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .ow-header-status {
                font-size: 12px;
                opacity: 0.85;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .ow-header-status::before {
                content: '';
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: #4ade80;
                display: inline-block;
                animation: ow-online 2s ease-in-out infinite;
            }
            @keyframes ow-online {
                0%, 100% { opacity: 1; } 50% { opacity: 0.5; }
            }
            .ow-header-close {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                background: rgba(255,255,255,0.15);
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
                flex-shrink: 0;
            }
            .ow-header-close:hover { background: rgba(255,255,255,0.25); }
            .ow-header-close svg { width: 16px; height: 16px; fill: white; }

            /* ── Messages ───────────────────────────────────────── */

            .ow-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                scroll-behavior: smooth;
            }
            .ow-messages::-webkit-scrollbar { width: 5px; }
            .ow-messages::-webkit-scrollbar-track { background: transparent; }
            .ow-messages::-webkit-scrollbar-thumb {
                background: var(--ow-border);
                border-radius: 10px;
            }

            .ow-msg {
                max-width: 82%;
                padding: 10px 14px;
                border-radius: 14px;
                font-size: 13.5px;
                line-height: 1.55;
                word-wrap: break-word;
                animation: ow-msg-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            @keyframes ow-msg-in {
                from { opacity: 0; transform: translateY(8px) scale(0.97); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }

            .ow-msg-user {
                align-self: flex-end;
                background: linear-gradient(135deg, var(--ow-primary), var(--ow-accent));
                color: white;
                border-bottom-right-radius: 4px;
            }
            .ow-msg-ai {
                align-self: flex-start;
                background: var(--ow-subtle);
                color: var(--ow-text);
                border-bottom-left-radius: 4px;
            }
            .ow-msg-time {
                font-size: 10px;
                opacity: 0.5;
                margin-top: 4px;
                display: block;
            }
            .ow-msg-user .ow-msg-time { text-align: right; }

            .ow-code-block {
                background: ${cfg.darkMode ? "#1e1e2e" : "#1e293b"};
                color: #e2e8f0;
                padding: 10px 12px;
                border-radius: 8px;
                margin: 6px 0;
                font-family: 'SF Mono', 'Fira Code', monospace;
                font-size: 12px;
                overflow-x: auto;
                white-space: pre-wrap;
            }
            .ow-inline-code {
                background: ${cfg.darkMode ? "#3d3d5c" : "#e2e8f0"};
                padding: 1px 5px;
                border-radius: 4px;
                font-family: 'SF Mono', 'Fira Code', monospace;
                font-size: 12px;
            }

            /* ── Welcome Message ────────────────────────────────── */

            .ow-welcome {
                text-align: center;
                padding: 24px 16px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
            }
            .ow-welcome-emoji {
                font-size: 36px;
                margin-bottom: 4px;
            }
            .ow-welcome-text {
                font-size: 14px;
                color: var(--ow-text);
                opacity: 0.7;
                max-width: 280px;
            }

            /* ── Typing Indicator ───────────────────────────────── */

            .ow-typing {
                align-self: flex-start;
                background: var(--ow-subtle);
                border-radius: 14px;
                border-bottom-left-radius: 4px;
                padding: 12px 16px;
                display: flex;
                gap: 5px;
                align-items: center;
            }
            .ow-typing-dot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: var(--ow-text);
                opacity: 0.35;
                animation: ow-bounce 1.4s ease-in-out infinite;
            }
            .ow-typing-dot:nth-child(2) { animation-delay: 0.15s; }
            .ow-typing-dot:nth-child(3) { animation-delay: 0.3s; }
            @keyframes ow-bounce {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-5px); }
            }

            /* ── Input Area ─────────────────────────────────────── */

            .ow-input-area {
                padding: 12px 16px;
                border-top: 1px solid var(--ow-border);
                display: flex;
                gap: 8px;
                align-items: flex-end;
                flex-shrink: 0;
                background: var(--ow-bg);
            }
            .ow-input {
                flex: 1;
                border: 1.5px solid var(--ow-border);
                border-radius: 12px;
                padding: 10px 14px;
                font-size: 13.5px;
                font-family: var(--ow-font);
                background: var(--ow-input-bg);
                color: var(--ow-text);
                outline: none;
                resize: none;
                min-height: 42px;
                max-height: 120px;
                line-height: 1.4;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }
            .ow-input:focus {
                border-color: var(--ow-primary);
                box-shadow: 0 0 0 3px ${p}22;
            }
            .ow-input::placeholder {
                color: var(--ow-text);
                opacity: 0.4;
            }
            .ow-send {
                width: 42px;
                height: 42px;
                border-radius: 12px;
                background: linear-gradient(135deg, var(--ow-primary), var(--ow-accent));
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                transition: transform 0.15s ease, opacity 0.2s ease;
            }
            .ow-send:hover { transform: scale(1.05); }
            .ow-send:active { transform: scale(0.95); }
            .ow-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
            .ow-send svg { width: 18px; height: 18px; fill: white; }

            /* ── Branding Footer ────────────────────────────────── */

            .ow-branding {
                text-align: center;
                padding: 6px;
                font-size: 10px;
                opacity: 0.4;
                flex-shrink: 0;
                border-top: 1px solid var(--ow-border);
            }
            .ow-branding a {
                color: var(--ow-text);
                text-decoration: none;
            }
            .ow-branding a:hover { opacity: 0.8; }

            /* ── Gate Form ──────────────────────────────────────── */

            .ow-gate {
                flex: 1;
                padding: 24px 20px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 14px;
            }
            .ow-gate-title {
                font-size: 16px;
                font-weight: 700;
                text-align: center;
                margin-bottom: 4px;
            }
            .ow-gate-subtitle {
                font-size: 13px;
                opacity: 0.6;
                text-align: center;
                margin-bottom: 8px;
            }
            .ow-gate-field {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .ow-gate-label {
                font-size: 12px;
                font-weight: 600;
                opacity: 0.7;
            }
            .ow-gate-input {
                border: 1.5px solid var(--ow-border);
                border-radius: 10px;
                padding: 10px 12px;
                font-size: 13.5px;
                font-family: var(--ow-font);
                background: var(--ow-input-bg);
                color: var(--ow-text);
                outline: none;
                transition: border-color 0.2s ease;
            }
            .ow-gate-input:focus {
                border-color: var(--ow-primary);
                box-shadow: 0 0 0 3px ${p}22;
            }
            .ow-gate-consent {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                font-size: 12px;
                opacity: 0.7;
            }
            .ow-gate-consent input { margin-top: 2px; accent-color: var(--ow-primary); }
            .ow-gate-submit {
                padding: 12px;
                border-radius: 12px;
                background: linear-gradient(135deg, var(--ow-primary), var(--ow-accent));
                color: white;
                border: none;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                font-family: var(--ow-font);
                transition: transform 0.15s ease;
                margin-top: 4px;
            }
            .ow-gate-submit:hover { transform: scale(1.02); }
            .ow-gate-submit:active { transform: scale(0.98); }
            .ow-gate-error {
                color: #ef4444;
                font-size: 12px;
                text-align: center;
            }

            /* ── Inline Widget ──────────────────────────────────── */

            .ow-inline {
                width: 100%;
                height: 100%;
                border-radius: var(--ow-radius);
                background: var(--ow-bg);
                border: 1px solid var(--ow-border);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            /* ── Responsive ─────────────────────────────────────── */

            @media (max-width: 480px) {
                .ow-window {
                    width: 100vw;
                    height: 100vh;
                    max-height: 100vh;
                    max-width: 100vw;
                    border-radius: 0;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                }
            }
        `;
    }

    // ─── SVG Icons ──────────────────────────────────────────────────────────
    var ICON = {
        chat: '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h10v2H7zm0-3h10v2H7zm0 6h7v2H7z"/></svg>',
        close: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
        send: '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
        minimize: '<svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>',
    };

    // ─── HTML Builders ──────────────────────────────────────────────────────

    function buildBubbleHTML(cfg) {
        return '<button class="ow-bubble ' + (cfg.position || "bottom-right") + '" id="ow-trigger">'
            + ICON.chat
            + '</button>';
    }

    function buildHeaderHTML(cfg) {
        var avatarContent = cfg.agentIcon
            ? '<img src="' + esc(cfg.agentIcon) + '" alt="' + esc(cfg.agentName) + '">'
            : esc(cfg.agentEmoji || "🤖");

        return '<div class="ow-header">'
            + '<div class="ow-header-avatar">' + avatarContent + '</div>'
            + '<div class="ow-header-info">'
            +   '<div class="ow-header-name">' + esc(cfg.name || cfg.agentName || "AI Assistant") + '</div>'
            +   '<div class="ow-header-status">Online</div>'
            + '</div>'
            + '<button class="ow-header-close" id="ow-close">' + ICON.close + '</button>'
            + '</div>';
    }

    function buildGateHTML(cfg) {
        var gc = cfg.gateConfig || {};
        var html = '<div class="ow-gate" id="ow-gate">'
            + '<div class="ow-gate-title">Welcome! 👋</div>'
            + '<div class="ow-gate-subtitle">Please introduce yourself to start chatting.</div>';

        if (gc.require_name !== false) {
            html += '<div class="ow-gate-field">'
                + '<label class="ow-gate-label">Name</label>'
                + '<input class="ow-gate-input" id="ow-gate-name" type="text" placeholder="Your name" required>'
                + '</div>';
        }
        if (gc.require_email !== false) {
            html += '<div class="ow-gate-field">'
                + '<label class="ow-gate-label">Email</label>'
                + '<input class="ow-gate-input" id="ow-gate-email" type="email" placeholder="you@example.com" required>'
                + '</div>';
        }
        if (gc.require_phone) {
            html += '<div class="ow-gate-field">'
                + '<label class="ow-gate-label">Phone</label>'
                + '<input class="ow-gate-input" id="ow-gate-phone" type="tel" placeholder="+1 (555) 000-0000">'
                + '</div>';
        }

        // Custom fields
        if (gc.custom_fields && gc.custom_fields.length > 0) {
            for (var i = 0; i < gc.custom_fields.length; i++) {
                var cf = gc.custom_fields[i];
                html += '<div class="ow-gate-field">'
                    + '<label class="ow-gate-label">' + esc(cf.label || cf.name) + '</label>'
                    + '<input class="ow-gate-input" data-custom="' + esc(cf.name) + '" type="text" placeholder="' + esc(cf.placeholder || "") + '">'
                    + '</div>';
            }
        }

        if (gc.require_consent) {
            html += '<label class="ow-gate-consent">'
                + '<input type="checkbox" id="ow-gate-consent">'
                + '<span>' + esc(gc.consent_text || "I agree to the terms of service") + '</span>'
                + '</label>';
        }

        html += '<div class="ow-gate-error" id="ow-gate-error" style="display:none"></div>'
            + '<button class="ow-gate-submit" id="ow-gate-submit">Start Chat</button>'
            + '</div>';

        return html;
    }

    function buildMessagesHTML(cfg) {
        return '<div class="ow-messages" id="ow-messages">'
            + '<div class="ow-welcome">'
            +   '<div class="ow-welcome-emoji">' + esc(cfg.agentEmoji || "🤖") + '</div>'
            +   '<div class="ow-welcome-text">' + esc(cfg.welcomeMessage || "Hi! How can I help you today?") + '</div>'
            + '</div>'
            + '</div>';
    }

    function buildInputHTML(cfg) {
        return '<div class="ow-input-area">'
            + '<textarea class="ow-input" id="ow-input" placeholder="' + esc(cfg.placeholder || "Type a message...") + '" rows="1"></textarea>'
            + '<button class="ow-send" id="ow-send">' + ICON.send + '</button>'
            + '</div>';
    }

    function buildBrandingHTML(cfg) {
        if (cfg.showBranding === false) return "";
        return '<div class="ow-branding">Powered by <a href="https://oraya.dev" target="_blank" rel="noopener">Oraya</a></div>';
    }

    function buildWindowHTML(cfg) {
        var pos = cfg.position || "bottom-right";
        var inner = buildHeaderHTML(cfg);

        if (cfg.persistenceMode === "gated" && !getSessionId()) {
            inner += buildGateHTML(cfg);
        } else {
            inner += buildMessagesHTML(cfg);
            inner += buildInputHTML(cfg);
        }

        inner += buildBrandingHTML(cfg);

        return '<div class="ow-window ' + pos + '" id="ow-window">'
            + inner
            + '</div>';
    }

    // ─── Main Widget Controller ─────────────────────────────────────────────

    function OrayaWidget(cfg) {
        this.cfg = cfg;
        this.isOpen = false;
        this.isLoading = false;
        this.gateData = null;
        this.shadow = null;
        this.messages = [];
    }

    OrayaWidget.prototype.init = function () {
        var self = this;
        var cfg = this.cfg;

        // Create Shadow DOM host
        var host = document.createElement("div");
        host.id = "oraya-widget-host";
        this.shadow = host.attachShadow({ mode: "closed" });

        // Inject styles
        var style = document.createElement("style");
        style.textContent = buildStyles(cfg);
        this.shadow.appendChild(style);

        // Inject custom CSS if provided
        if (cfg.customCss) {
            var customStyle = document.createElement("style");
            customStyle.textContent = cfg.customCss;
            this.shadow.appendChild(customStyle);
        }

        // Build DOM based on widget type
        if (cfg.widgetType === "inline") {
            var container = scriptTag.parentElement;
            var wrapper = document.createElement("div");
            wrapper.innerHTML = '<div class="ow-inline">'
                + buildHeaderHTML(cfg)
                + buildMessagesHTML(cfg)
                + buildInputHTML(cfg)
                + buildBrandingHTML(cfg)
                + '</div>';
            this.shadow.appendChild(wrapper.firstChild);
        } else {
            // Bubble + Window
            var bubbleDiv = document.createElement("div");
            bubbleDiv.innerHTML = buildBubbleHTML(cfg);
            this.shadow.appendChild(bubbleDiv.firstChild);

            var windowDiv = document.createElement("div");
            windowDiv.innerHTML = buildWindowHTML(cfg);
            this.shadow.appendChild(windowDiv.firstChild);
        }

        document.body.appendChild(host);

        // Bind events
        this.bindEvents();

        // Auto-open
        if (cfg.autoOpen) {
            setTimeout(function () { self.toggle(true); }, cfg.autoOpenDelay || 3000);
        }

        // Load existing session messages
        this.loadSession();
    };

    OrayaWidget.prototype.bindEvents = function () {
        var self = this;
        var root = this.shadow;

        // Bubble toggle
        var trigger = root.getElementById("ow-trigger");
        if (trigger) {
            trigger.addEventListener("click", function () { self.toggle(); });
        }

        // Close button
        var close = root.getElementById("ow-close");
        if (close) {
            close.addEventListener("click", function () { self.toggle(false); });
        }

        // Send button
        var send = root.getElementById("ow-send");
        if (send) {
            send.addEventListener("click", function () { self.sendMessage(); });
        }

        // Input: Enter to send, Shift+Enter for newline
        var input = root.getElementById("ow-input");
        if (input) {
            input.addEventListener("keydown", function (e) {
                if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    self.sendMessage();
                }
            });
            // Auto-resize
            input.addEventListener("input", function () {
                this.style.height = "auto";
                this.style.height = Math.min(this.scrollHeight, 120) + "px";
            });
        }

        // Gate submit
        var gateSubmit = root.getElementById("ow-gate-submit");
        if (gateSubmit) {
            gateSubmit.addEventListener("click", function () { self.handleGateSubmit(); });
        }
    };

    OrayaWidget.prototype.toggle = function (forceState) {
        this.isOpen = typeof forceState === "boolean" ? forceState : !this.isOpen;

        var win = this.shadow.getElementById("ow-window");
        var trigger = this.shadow.getElementById("ow-trigger");

        if (win) {
            if (this.isOpen) {
                win.classList.add("ow-visible");
                var input = this.shadow.getElementById("ow-input");
                if (input) setTimeout(function () { input.focus(); }, 300);
            } else {
                win.classList.remove("ow-visible");
            }
        }
        if (trigger) {
            trigger.classList.toggle("ow-open", this.isOpen);
        }
    };

    OrayaWidget.prototype.handleGateSubmit = function () {
        var self = this;
        var root = this.shadow;
        var gc = this.cfg.gateConfig || {};
        var errorEl = root.getElementById("ow-gate-error");

        var data = {};

        // Collect fields
        var nameInput = root.getElementById("ow-gate-name");
        if (nameInput) data.name = nameInput.value.trim();

        var emailInput = root.getElementById("ow-gate-email");
        if (emailInput) data.email = emailInput.value.trim();

        var phoneInput = root.getElementById("ow-gate-phone");
        if (phoneInput) data.phone = phoneInput.value.trim();

        // Custom fields
        data.custom = {};
        var customInputs = root.querySelectorAll("[data-custom]");
        for (var i = 0; i < customInputs.length; i++) {
            data.custom[customInputs[i].getAttribute("data-custom")] = customInputs[i].value.trim();
        }

        // Validate
        if (gc.require_name !== false && !data.name) {
            errorEl.textContent = "Please enter your name.";
            errorEl.style.display = "block";
            return;
        }
        if (gc.require_email !== false && !data.email) {
            errorEl.textContent = "Please enter your email.";
            errorEl.style.display = "block";
            return;
        }
        if (gc.require_email !== false && data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            errorEl.textContent = "Please enter a valid email address.";
            errorEl.style.display = "block";
            return;
        }

        var consentBox = root.getElementById("ow-gate-consent");
        if (gc.require_consent && consentBox && !consentBox.checked) {
            errorEl.textContent = "Please accept the terms to continue.";
            errorEl.style.display = "block";
            return;
        }

        this.gateData = data;

        // Replace gate form with chat UI
        var gate = root.getElementById("ow-gate");
        var win = root.getElementById("ow-window");
        if (gate && win) {
            gate.remove();
            // Insert messages and input before branding
            var branding = win.querySelector(".ow-branding");
            var msgDiv = document.createElement("div");
            msgDiv.innerHTML = buildMessagesHTML(this.cfg) + buildInputHTML(this.cfg);

            while (msgDiv.firstChild) {
                if (branding) {
                    win.insertBefore(msgDiv.firstChild, branding);
                } else {
                    win.appendChild(msgDiv.firstChild);
                }
            }

            // Re-bind input events
            this.bindEvents();
        }
    };

    OrayaWidget.prototype.addMessage = function (role, content) {
        var container = this.shadow.getElementById("ow-messages");
        if (!container) return;

        var now = Date.now();
        this.messages.push({ role: role, content: content, ts: now });

        var msgDiv = document.createElement("div");
        msgDiv.className = "ow-msg " + (role === "user" ? "ow-msg-user" : "ow-msg-ai");
        msgDiv.innerHTML = mdToHtml(content)
            + '<span class="ow-msg-time">' + formatTime(now) + '</span>';

        container.appendChild(msgDiv);
        this.scrollToBottom();
    };

    OrayaWidget.prototype.showTyping = function (show) {
        var container = this.shadow.getElementById("ow-messages");
        if (!container) return;

        var existing = container.querySelector(".ow-typing");
        if (show && !existing) {
            var div = document.createElement("div");
            div.className = "ow-typing";
            div.innerHTML = '<div class="ow-typing-dot"></div>'
                + '<div class="ow-typing-dot"></div>'
                + '<div class="ow-typing-dot"></div>';
            container.appendChild(div);
            this.scrollToBottom();
        } else if (!show && existing) {
            existing.remove();
        }
    };

    OrayaWidget.prototype.scrollToBottom = function () {
        var container = this.shadow.getElementById("ow-messages");
        if (container) {
            requestAnimationFrame(function () {
                container.scrollTop = container.scrollHeight;
            });
        }
    };

    OrayaWidget.prototype.sendMessage = function () {
        var self = this;
        var input = this.shadow.getElementById("ow-input");
        var sendBtn = this.shadow.getElementById("ow-send");
        if (!input || this.isLoading) return;

        var text = input.value.trim();
        if (!text) return;

        // Clear input
        input.value = "";
        input.style.height = "auto";

        // Remove welcome message on first send
        var welcome = this.shadow.querySelector(".ow-welcome");
        if (welcome) welcome.remove();

        // Add user message
        this.addMessage("user", text);

        // Disable send
        this.isLoading = true;
        if (sendBtn) sendBtn.disabled = true;
        this.showTyping(true);

        // API call
        var payload = {
            message: text,
            visitor_id: getVisitorId(),
            session_id: getSessionId(),
            visitor_meta: {
                url: window.location.href,
                referrer: document.referrer,
                ua: navigator.userAgent,
            },
        };

        if (this.gateData) {
            payload.gate_data = this.gateData;
        }

        fetch(API_BASE + "/api/embed/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Widget-Key": WIDGET_KEY,
            },
            body: JSON.stringify(payload),
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            self.showTyping(false);
            self.isLoading = false;
            if (sendBtn) sendBtn.disabled = false;

            if (data.error) {
                self.addMessage("assistant", "Sorry, something went wrong. Please try again.");
                console.error("[Oraya Widget] API Error:", data.error);
                return;
            }

            if (data.session_id) {
                setSessionId(data.session_id);
            }

            self.addMessage("assistant", data.response || "No response received.");
        })
        .catch(function (err) {
            self.showTyping(false);
            self.isLoading = false;
            if (sendBtn) sendBtn.disabled = false;
            self.addMessage("assistant", "Connection error. Please check your internet and try again.");
            console.error("[Oraya Widget] Fetch error:", err);
        });
    };

    OrayaWidget.prototype.loadSession = function () {
        var self = this;
        var sid = getSessionId();
        if (!sid || this.cfg.persistenceMode === "ephemeral") return;

        // We don't pre-load messages from server in this version.
        // Session continuity is handled server-side — the API will
        // find the existing session by visitor_id and resume context.
    };

    // ─── Boot ───────────────────────────────────────────────────────────────

    function boot() {
        fetch(API_BASE + "/api/embed/config?key=" + encodeURIComponent(WIDGET_KEY))
            .then(function (res) {
                if (!res.ok) throw new Error("Config fetch failed: " + res.status);
                return res.json();
            })
            .then(function (data) {
                if (!data.config) throw new Error("No config in response");
                var widget = new OrayaWidget(data.config);
                widget.init();
            })
            .catch(function (err) {
                console.error("[Oraya Widget] Failed to initialize:", err);
            });
    }

    // Wait for DOM ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }

})();
