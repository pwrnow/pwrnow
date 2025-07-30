import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Space_Grotesk, Righteous } from "next/font/google";
import "./globals.css";

import PlausibleProvider from "next-plausible";
import {
    shouldEnableAnalytics,
    getAnalyticsDomain,
    analyticsConfig,
} from "@/lib/analytics";

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-space-grotesk",
});

const righteous = Righteous({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-righteous",
});

export const metadata: Metadata = {
    title: "PWr Now",
    description:
        "Bądź na bieżąco z najnowszymi wydarzeniami na Politechnice Wrocławskiej",
    metadataBase: new URL("https://pwrnow.pl"),
    applicationName: "PWr Now",
    keywords: [
        "wydarzenia",
        "Politechnika Wrocławska",
        "PWr",
        "studenci",
        "Wrocław",
        "uczelnia",
    ],
    authors: [{ name: "PWr Now Team" }],
    creator: "PWr Now Team",
    publisher: "PWr Now",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    openGraph: {
        type: "website",
        locale: "pl_PL",
        url: "https://pwrnow.pl",
        siteName: "PWr Now",
        title: "PWr Now - Centrum wydarzeń na Politechnice Wrocławskiej",
        description:
            "Bądź na bieżąco z najnowszymi wydarzeniami na Politechnice Wrocławskiej",
    },
    category: "education",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const enableAnalytics = shouldEnableAnalytics();
    const analyticsDomain = getAnalyticsDomain();

    return (
        <html lang="pl" suppressHydrationWarning>
            <body
                suppressHydrationWarning
                className={`${spaceGrotesk.variable} ${righteous.variable}`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange>
                    {enableAnalytics ? (
                        <PlausibleProvider
                            domain={analyticsDomain}
                            customDomain={analyticsConfig.apiHost}
                            trackLocalhost={analyticsConfig.trackLocalhost}
                            enabled={enableAnalytics}>
                            {children}
                        </PlausibleProvider>
                    ) : (
                        children
                    )}
                </ThemeProvider>
            </body>
        </html>
    );
}
