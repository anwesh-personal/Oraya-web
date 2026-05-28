import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ResponsiveProvider } from "@/components/sales/responsive/ResponsiveProvider";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-primary",
    display: "swap",
});

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-display",
    display: "swap",
});

const jetbrains = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: {
        template: "%s | Orakhos",
        default: "Orakhos — The Sovereign Operating System",
    },
    description: "The private intelligence kernel for the 1%. Unify high-intensity logic with absolute hardware privacy. Engineered for the architect, not the masses.",
    metadataBase: new URL("https://oraya.dev"),
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://oraya.dev",
        siteName: "Orakhos",
        title: "Orakhos — The Sovereign Operating System",
        description: "The sovereign intelligence layer. Local-first. Self-healing. Zero cloud dependencies.",
    },
    twitter: {
        card: "summary_large_image",
        title: "Orakhos — The Sovereign Operating System",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" type="image/png" href="/favicon.png" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content="#000000" />
            </head>
            <body className={`${inter.variable} ${outfit.variable} ${jetbrains.variable} font-sans antialiased`}>
                <ThemeProvider>
                    <ResponsiveProvider>
                        {children}
                    </ResponsiveProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
