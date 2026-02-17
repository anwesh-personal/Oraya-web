/**
 * GET /api/desktop/updates
 *
 * Check for new app versions. No authentication required.
 * The desktop app calls this periodically to check for updates.
 *
 * Query params:
 *   - platform: "macos" | "linux" | "windows"
 *   - arch: "aarch64" | "x86_64"
 *   - current_version: "1.4.0"
 */

import { NextRequest, NextResponse } from "next/server";
import { isVersionTooOld } from "@/lib/desktop-auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * In production, this would come from a database table or CMS.
 * For now, it's driven by environment variables.
 */
function getUpdateInfo() {
    return {
        latest_version: process.env.DESKTOP_API_LATEST_APP_VERSION || "1.0.0",
        min_version: process.env.DESKTOP_API_MIN_APP_VERSION || "1.0.0",
        release_notes: process.env.DESKTOP_API_RELEASE_NOTES || "",
        release_date: process.env.DESKTOP_API_RELEASE_DATE || new Date().toISOString(),
        is_critical: process.env.DESKTOP_API_UPDATE_CRITICAL === "true",
        base_download_url: process.env.DESKTOP_API_UPDATE_URL || "https://oraya.app/download",
    };
}

/**
 * Build a platform-specific download URL.
 */
function buildDownloadUrl(
    baseUrl: string,
    platform: string,
    arch: string,
    version: string
): string {
    // Map platform/arch to download path segments
    const platformMap: Record<string, string> = {
        macos: "macos",
        darwin: "macos",
        linux: "linux",
        windows: "windows",
        win32: "windows",
    };

    const archMap: Record<string, string> = {
        aarch64: "arm64",
        arm64: "arm64",
        x86_64: "x64",
        x64: "x64",
    };

    const p = platformMap[platform.toLowerCase()] || platform;
    const a = archMap[arch.toLowerCase()] || arch;

    return `${baseUrl}/${p}/${a}/${version}`;
}

// =============================================================================
// HANDLER
// =============================================================================

export async function GET(request: NextRequest) {
    try {
        // Rate limit
        const rateLimited = applyRateLimit(request, "updates");
        if (rateLimited) return rateLimited;

        const { searchParams } = new URL(request.url);

        const platform = searchParams.get("platform") || "unknown";
        const arch = searchParams.get("arch") || "unknown";
        const currentVersion = searchParams.get("current_version") || "0.0.0";

        const info = getUpdateInfo();

        const updateAvailable = isVersionTooOld(currentVersion, info.latest_version);
        const updateRequired = isVersionTooOld(currentVersion, info.min_version);

        return NextResponse.json({
            update_available: updateAvailable,
            update_required: updateRequired,
            latest_version: info.latest_version,
            min_version: info.min_version,
            download_url: updateAvailable
                ? buildDownloadUrl(info.base_download_url, platform, arch, info.latest_version)
                : null,
            release_notes: updateAvailable ? info.release_notes : null,
            release_date: updateAvailable ? info.release_date : null,
            is_critical: updateRequired || info.is_critical,
        });
    } catch (error) {
        logger.error("Updates check failed", error, { endpoint: "updates" });
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
