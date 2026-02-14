import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: "Oraya Platform | Superadmin",
        template: "%s | Oraya Platform",
    },
    description: "Superadmin dashboard for managing the Oraya AI platform",
    keywords: ["oraya", "ai", "platform", "admin", "dashboard"],
    authors: [{ name: "Oraya" }],
    robots: "noindex, nofollow", // Don't index admin panel
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#09090b",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className="antialiased noise-overlay">
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

