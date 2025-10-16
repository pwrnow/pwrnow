import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import HeroSection from "@/components/sections/hero-section";
import HowItWorksSection from "@/components/sections/how-it-works-section";
import FaqSection from "@/components/sections/faq-section";
import ContactSection from "@/components/sections/contact-section";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("ForOrganizationsPage");
    return {
        title: t("title"),
        description: t("description"),
        openGraph: {
            title: t("title"),
            description: t("description"),
            type: "website",
            siteName: "PWrNow",
            images: [
                {
                    url: "/og-image.svg",
                    width: 1200,
                    height: 630,
                    alt: t("ogImageAlt"),
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: t("title"),
            description: t("description"),
            images: ["/og-image.svg"],
        },
        alternates: {
            canonical: "/dla-organizacji",
        },
    };
}

export default async function ForOrganizationsPage() {
    await getTranslations("ForOrganizationsPage");
    return (
        <section className="container mx-auto px-4 max-w-6xl space-y-32 py-12">
            <HeroSection />
            <HowItWorksSection />
            <FaqSection />
            <ContactSection />
        </section>
    );
}
