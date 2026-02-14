import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: "Oraya - Member Portal",
        template: "%s | Oraya",
    },
    description: "Manage your Oraya account, view usage, and access resources",
    keywords: ["oraya", "ai", "agents", "member", "portal"],
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#05050a",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className="antialiased">
                <ThemeProvider>
                    {children}
                </ThemeProvider>
                <Toaster
                    position="bottom-right"
                    theme="dark"
                    toastOptions={{
                        style: {
                            background: "var(--surface-100)",
                            border: "1px solid var(--surface-300)",
                            color: "var(--surface-800)",
                        },
                    }}
                />
            </body>
        </html>
    );
}

