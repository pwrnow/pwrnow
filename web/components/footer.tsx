import Link from "next/link";
import { useTranslations } from "next-intl";
import { CONTACT_CONFIG } from "@/lib/config";

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const t = useTranslations("Footer");

    return (
        <footer className="w-full py-6 border-t border-muted bg-background/95 backdrop-blur-md">
            <div className="mx-auto px-3 text-center w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6 text-sm">
                    <Link
                        href="/dla-organizacji"
                        className="text-muted-foreground hover:text-foreground transition-colors duration-200 hover:underline flex items-center gap-1">
                        <span>✨</span> {t("forOrganizations")}
                    </Link>
                    <a
                        href={`mailto:${CONTACT_CONFIG.EMAIL}`}
                        className="text-muted-foreground hover:text-foreground transition-colors duration-200 hover:underline flex items-center gap-1">
                        <span>✉️</span> {t("contact")}
                    </a>
                </div>
                <p className="text-xs text-muted-foreground">
                    {t("copyright", { year: currentYear })}
                </p>
            </div>
        </footer>
    );
}
