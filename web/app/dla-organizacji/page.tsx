import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { CONTACT_CONFIG } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    const t = await getTranslations("ForOrganizationsPage");
    return (
        <section className="w-full max-w-4xl mx-auto px-4 py-16">
            <div className="text-center mb-16">
                <h1 className="text-5xl font-extrabold mb-6 text-foreground">
                    {t("title")}
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    {t("description")}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <span className="text-3xl">🚀</span>
                            {t("benefitVisibilityTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground leading-relaxed">
                            {t("benefitVisibilityDesc")}
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <span className="text-3xl">🤝</span>
                            {t("benefitCommunityTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground leading-relaxed">
                            {t("benefitCommunityDesc")}
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <span className="text-3xl">📣</span>
                            {t("benefitPromotionTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground leading-relaxed">
                            {t("benefitPromotionDesc")}
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <span className="text-3xl">💡</span>
                            {t("benefitEasyTitle")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground leading-relaxed">
                            {t("benefitEasyDesc")}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="text-center mb-16">
                <Button
                    asChild
                    variant={"default"}
                    size="lg"
                    className="px-10 py-5 text-xl font-bold rounded-full shadow-lg hover:scale-105 transition-transform">
                    <a href={`mailto:${CONTACT_CONFIG.EMAIL}`}>
                        {t("ctaButton")}
                    </a>
                </Button>
            </div>
        </section>
    );
}
