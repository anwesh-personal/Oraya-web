import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/superadmin/email/test
 * Sends a test email using the configured SMTP settings.
 * Body: { to: "test@example.com" }
 */
export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { to } = await request.json();
    if (!to) {
        return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    try {
        // Fetch SMTP settings
        const { data: settings } = await (supabase
            .from("platform_settings") as any)
            .select("key, value")
            .in("key", ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "smtp_enabled"]);

        const settingsMap: Record<string, any> = {};
        settings?.forEach((s: any) => {
            try { settingsMap[s.key] = JSON.parse(s.value); } catch { settingsMap[s.key] = s.value; }
        });

        if (!settingsMap.smtp_enabled || settingsMap.smtp_enabled !== "true") {
            return NextResponse.json({ error: "Custom SMTP is not enabled. Enable it in Email settings first." }, { status: 400 });
        }

        if (!settingsMap.smtp_host) {
            return NextResponse.json({ error: "SMTP host is not configured" }, { status: 400 });
        }

        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport({
            host: settingsMap.smtp_host,
            port: parseInt(settingsMap.smtp_port) || 587,
            secure: (parseInt(settingsMap.smtp_port) || 587) === 465,
            auth: {
                user: settingsMap.smtp_user,
                pass: settingsMap.smtp_pass,
            },
        });

        await transporter.sendMail({
            from: settingsMap.smtp_from || `"Oraya" <noreply@oraya.ai>`,
            to,
            subject: "✅ Oraya SMTP Test — It Works!",
            html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0b; color: #e4e4e7; padding: 40px 20px;">
                <div style="max-width: 480px; margin: 0 auto; background: #18181b; border-radius: 16px; border: 1px solid #27272a; padding: 32px; text-align: center;">
                    <h2 style="margin: 0 0 16px; font-size: 24px; color: #fafafa;">✅ SMTP Test Successful</h2>
                    <p style="margin: 0 0 24px; color: #a1a1aa; font-size: 14px;">
                        Your custom SMTP configuration is working correctly. Emails from Oraya will be delivered through your configured SMTP server.
                    </p>
                    <div style="background: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; text-align: left;">
                        <p style="margin: 0 0 8px; font-size: 12px; color: #71717a;">SMTP Host</p>
                        <p style="margin: 0 0 16px; font-size: 14px; color: #fafafa; font-family: monospace;">${settingsMap.smtp_host}:${settingsMap.smtp_port || 587}</p>
                        <p style="margin: 0 0 8px; font-size: 12px; color: #71717a;">Sent at</p>
                        <p style="margin: 0; font-size: 14px; color: #fafafa;">${new Date().toISOString()}</p>
                    </div>
                </div>
            </body>
            </html>`,
        });

        return NextResponse.json({ success: true, message: `Test email sent to ${to}` });
    } catch (err: any) {
        console.error("SMTP test error:", err);
        return NextResponse.json({
            error: `SMTP test failed: ${err.message}`,
            details: err.code || err.responseCode || null,
        }, { status: 500 });
    }
}
