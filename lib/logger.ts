/**
 * STRUCTURED LOGGER FOR DESKTOP API
 *
 * Lightweight structured logging for server-side desktop auth endpoints.
 * Outputs JSON to stdout/stderr for Vercel log drain compatibility.
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("License activated", { userId, deviceId, plan: "pro" });
 *   logger.error("Activation failed", error, { userId });
 *
 * In production, Vercel captures stdout/stderr and makes it searchable.
 * The JSON format enables structured queries in log aggregators.
 *
 * @module lib/logger
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    service: string;
    [key: string]: unknown;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

/** Minimum log level (configurable via LOG_LEVEL env var) */
const MIN_LEVEL: LogLevel =
    (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "production" ? "info" : "debug");

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LEVEL];
}

function formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        service: "desktop-api",
        ...meta,
    };
    return JSON.stringify(entry);
}

function sanitize(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!meta) return undefined;

    // Strip sensitive fields from log output
    const sanitized = { ...meta };
    const sensitiveKeys = [
        "password", "token", "secret", "api_key", "apiKey",
        "authorization", "cookie", "session",
    ];
    for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
            sanitized[key] = "[REDACTED]";
        }
    }
    return sanitized;
}

export const logger = {
    debug(message: string, meta?: Record<string, unknown>) {
        if (shouldLog("debug")) {
            console.debug(formatEntry("debug", message, sanitize(meta)));
        }
    },

    info(message: string, meta?: Record<string, unknown>) {
        if (shouldLog("info")) {
            console.info(formatEntry("info", message, sanitize(meta)));
        }
    },

    warn(message: string, meta?: Record<string, unknown>) {
        if (shouldLog("warn")) {
            console.warn(formatEntry("warn", message, sanitize(meta)));
        }
    },

    error(message: string, error?: unknown, meta?: Record<string, unknown>) {
        if (shouldLog("error")) {
            const errorMeta: Record<string, unknown> = { ...sanitize(meta) };
            if (error instanceof Error) {
                errorMeta.error_name = error.name;
                errorMeta.error_message = error.message;
                errorMeta.error_stack = error.stack?.split("\n").slice(0, 5).join("\n");
            } else if (error) {
                errorMeta.error_raw = String(error);
            }
            console.error(formatEntry("error", message, errorMeta));
        }
    },
};
