"use client";

import { Globe, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { SocialIcon } from "react-social-icons";
import Image from "next/image";

// Types
type SocialLinks = {
    github?: string;
    linkedin?: string;
    website?: string;
    email?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
};

type TeamMember = {
    id: string;
    name: string;
    description: string;
    image: string | null;
    social: SocialLinks;
};

// Team member data - showcasing professional expertise and individual achievements
const teamMembers: TeamMember[] = [
    {
        id: "michal-mendzelewski",
        name: "Michał Mendzelewski",
        description: "working on the idea and handling the tech side :)",
        image: "team/michal.png",
        social: {
            github: "https://github.com/michallm",
            linkedin: "https://www.linkedin.com/in/michalmendzelewskim/",
            website: "https://michallm.com",
        },
    },
    {
        id: "igor-lis",
        name: "Igor Lis",
        description: "Focusing on both the concept and the code",
        image: "/team/igor.jpeg",
        social: {
            linkedin: "https://www.linkedin.com/in/igor-lis/",
            github: "https://github.com/foxjustfox",
            website: "https://igor.lis.rocks/about",
            email: "iglis.com20@gmail.com",
        },
    },
    {
        id: "adrian-szefer",
        name: "Adrian Szefer",
        description:
            "I make everything connected to the visual side of the project, from stickers to posts on our social media profiles.",
        image: "team/adrian.JPG",
        social: {
            tiktok: "https://www.tiktok.com/@adrianszeferart?_t=ZN-90My8XKHRbS&_r=1",
            instagram:
                "https://www.instagram.com/adrianszeferart?igsh=MW9vNTdoOWwxeXZzbA%3D%3D&utm_source=qr",
        },
    },
    {
        id: "daria-jurewicz",
        name: "Daria Jurewicz",
        description: "just having fun a w wolnym czasie robię sociale",
        image: "team/daria.jpeg",
        social: {
            instagram: "https://www.instagram.com/daria_jurewicz_/",
        },
    },
    {
        id: "zosia-kukula",
        name: "Zosia Kukuła",
        description:
            "An optimist who loves trying new things, turning inspiration from people and nature into posts",
        image: "team/zosia.JPG",
        social: {},
    },
    {
        id: "kuba-krolak",
        name: "Kuba Królak",
        description:
            "Taking care of marketing, communication and all the behind-the-scenes stuff",
        image: null,
        social: {},
    },
];

export default function TeamPageContent() {
    const t = useTranslations("TeamPage");

    return (
        <div className="min-h-screen bg-background">
            {/* Simple Hero Section */}
            <section className="pt-32 pb-24 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl lg:text-6xl font-bold gradient-text animate-slide-up leading-tight">
                        {t("hero.title")}
                    </h1>
                </div>
            </section>

            {/* Team Members */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="space-y-24">
                        {teamMembers.map((member, index) => (
                            <div
                                key={member.id}
                                className="animate-slide-up"
                                style={{
                                    animationDelay: `${index * 0.2}s`,
                                    animationFillMode: "both",
                                }}>
                                <TeamMemberCard member={member} index={index} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div
                        className="relative bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-sm border border-border/50 rounded-3xl p-12 lg:p-16 text-center animate-slide-up"
                        style={{
                            animationDelay: "0.8s",
                            animationFillMode: "both",
                        }}>
                        <div className="mb-8">
                            <h3 className="text-3xl lg:text-4xl font-bold mb-6 text-foreground">
                                {t("cta.title")}
                            </h3>
                            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                                {t("cta.subtitle")}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <a
                                href="/kontakt"
                                className="group relative inline-flex items-center px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-colors duration-200">
                                <Mail className="w-5 h-5 mr-3" />
                                <span>{t("cta.button")}</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

// Individual team member component with clean, elegant styling
function TeamMemberCard({
    member,
    index,
}: {
    member: TeamMember;
    index: number;
}) {
    const isEven = index % 2 === 0;
    const imageSrc =
        member.image &&
        (member.image.startsWith("/") ? member.image : `/${member.image}`);

    return (
        <div className="group relative" id={member.id}>
            <div
                className={`relative flex flex-col ${
                    !isEven ? "lg:flex-row" : "lg:flex-row-reverse"
                } gap-12 lg:gap-20 items-center`}>
                {/* Image Section - only show if image exists */}
                {imageSrc && (
                    <div
                        className="relative flex-shrink-0 animate-float-gentle"
                        style={{ animationDelay: `${index * 0.5}s` }}>
                        <div className="relative w-80 h-96 lg:w-80 lg:h-96">
                            {/* Simple border */}
                            <div className="absolute inset-0 rounded-3xl border-2 border-border/20" />

                            {/* Image container */}
                            <div className="absolute inset-2 bg-background rounded-3xl overflow-hidden shadow-lg">
                                <Image
                                    src={imageSrc}
                                    alt={member.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 20rem, 20rem"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Section */}
                <div className="flex-1 space-y-8 relative">
                    {/* Simple accent line */}
                    <div className="absolute -left-6 top-0 w-1 h-full bg-gradient-to-b from-primary/60 via-accent/40 to-secondary/60 rounded-full" />

                    <div>
                        {/* Name */}
                        <div className="relative mb-6">
                            <h3 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                                {member.name}
                            </h3>
                            <div className="h-1 w-20 bg-gradient-to-r from-primary via-accent to-secondary rounded-full" />
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground leading-relaxed text-lg lg:text-xl mb-8">
                            {member.description}
                        </p>
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-4">
                        {member.social.instagram && (
                            <div className="w-14 h-14 rounded-2xl bg-muted/30 hover:bg-muted flex items-center justify-center border border-border/50 transition-colors duration-200">
                                <SocialIcon
                                    network="instagram"
                                    url={member.social.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:scale-110 transition-transform duration-200"
                                    aria-label="Instagram"
                                    style={{ width: 40, height: 40 }}
                                    fgColor="currentColor"
                                    bgColor="transparent"
                                />
                            </div>
                        )}
                        {member.social.tiktok && (
                            <div className="w-14 h-14 rounded-2xl bg-muted/30 hover:bg-muted flex items-center justify-center border border-border/50 transition-colors duration-200">
                                <SocialIcon
                                    network="tiktok"
                                    url={member.social.tiktok}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:scale-110 transition-transform duration-200"
                                    aria-label="TikTok"
                                    style={{ width: 40, height: 40 }}
                                    fgColor="currentColor"
                                    bgColor="transparent"
                                />
                            </div>
                        )}
                        {member.social.facebook && (
                            <div className="w-14 h-14 rounded-2xl bg-muted/30 hover:bg-muted flex items-center justify-center border border-border/50 transition-colors duration-200">
                                <SocialIcon
                                    network="facebook"
                                    url={member.social.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:scale-110 transition-transform duration-200"
                                    aria-label="Facebook"
                                    style={{ width: 40, height: 40 }}
                                    fgColor="currentColor"
                                    bgColor="transparent"
                                />
                            </div>
                        )}
                        {member.social.website && (
                            <a
                                href={member.social.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-14 h-14 rounded-2xl bg-muted/30 hover:bg-muted flex items-center justify-center border border-border/50 transition-colors duration-200">
                                <Globe
                                    size={28}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                />
                            </a>
                        )}
                        {member.social.github && (
                            <div className="w-14 h-14 rounded-2xl bg-muted/30 hover:bg-muted flex items-center justify-center border border-border/50 transition-colors duration-200">
                                <SocialIcon
                                    network="github"
                                    url={member.social.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:scale-110 transition-transform duration-200"
                                    aria-label="GitHub"
                                    style={{ width: 40, height: 40 }}
                                    fgColor="currentColor"
                                    bgColor="transparent"
                                />
                            </div>
                        )}
                        {member.social.linkedin && (
                            <div className="w-14 h-14 rounded-2xl bg-muted/30 hover:bg-muted flex items-center justify-center border border-border/50 transition-colors duration-200">
                                <SocialIcon
                                    network="linkedin"
                                    url={member.social.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:scale-110 transition-transform duration-200"
                                    aria-label="LinkedIn"
                                    style={{ width: 40, height: 40 }}
                                    fgColor="currentColor"
                                    bgColor="transparent"
                                />
                            </div>
                        )}
                        {member.social.email && (
                            <div className="w-14 h-14 rounded-2xl bg-muted/30 hover:bg-muted flex items-center justify-center border border-border/50 transition-colors duration-200">
                                <SocialIcon
                                    network="email"
                                    url={`mailto:${member.social.email}`}
                                    className="hover:scale-110 transition-transform duration-200"
                                    aria-label="Email"
                                    style={{ width: 40, height: 40 }}
                                    fgColor="currentColor"
                                    bgColor="transparent"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
