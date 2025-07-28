"use client";

import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Event } from "@/lib/types";

interface EventCardProps {
    event: Event;
}

export default function EventCard({ event }: EventCardProps) {
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9">("16:9");
    const [isImageLoading, setIsImageLoading] = useState(true);

    const startsAt = parseISO(event.starts_at);
    const endsAt = parseISO(event.ends_at);
    const dateString = format(startsAt, "d MMMM yyyy", { locale: pl });
    const startTimeString = format(startsAt, "HH:mm");
    const endTimeString = format(endsAt, "HH:mm");
    const timeString = `${startTimeString} - ${endTimeString}`;

    const organizationName = event.organization?.name || "Wydarzenie";
    const organizationImageUrl = event.organization?.image_url;

    // Handle category - it might be a string or an object with name/slug
    const categoryName =
        typeof event.category === "string"
            ? event.category
            : (event.category as { name?: string })?.name || "Wydarzenie";

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };
    const orgInitials = getInitials(organizationName);
    const detectAspectRatio = (width: number, height: number) => {
        const ratio = width / height;
        if (Math.abs(ratio - 1) <= 0.1) return "1:1";
        if (Math.abs(ratio - 16 / 9) <= 0.1) return "16:9";
        return "16:9";
    };
    const handleMapLinkClick = () => {
        if (!event.location) return;
        const isIOS =
            typeof navigator !== "undefined" &&
            /iPad|iPhone|iPod/.test(navigator.userAgent);
        const encodedLocation = encodeURIComponent(event.location);
        const mapsUrl = isIOS
            ? `maps://?q=${encodedLocation}`
            : `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
        window.open(mapsUrl, "_blank");
    };
    const truncateDescription = (text: string, maxLength: number) => {
        if (!text || text.length <= maxLength) return text;
        return text.slice(0, maxLength).trim() + "...";
    };

    return (
        <div className="mb-8 border-0 sm:border sm:rounded-lg sm:shadow-sm hover:sm:shadow-md transition-all duration-300 overflow-hidden group">
            {/* Header with organization info */}
            <div className="px-3 py-2 sm:px-4 sm:py-3 flex items-center space-x-2 sm:space-x-3">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 border border-primary/20 ring-offset-background transition-all duration-300 group-hover:shadow-sm">
                    {organizationImageUrl ? (
                        <Image
                            src={organizationImageUrl}
                            alt={organizationName}
                            fill
                            className="object-cover rounded-full"
                            sizes="(max-width: 640px) 32px, 40px"
                        />
                    ) : (
                        <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-medium">
                            {orgInitials}
                        </AvatarFallback>
                    )}
                </Avatar>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-sm sm:text-base leading-tight break-words max-w-[60%]">
                            {organizationName}
                        </span>
                        <div className="flex items-center gap-2">
                            {event.category && (
                                <Badge
                                    variant="outline"
                                    className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/50 text-xs sm:text-sm">
                                    {categoryName}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Event image */}
            {event.image_url && (
                <div className="relative">
                    <div
                        className={cn(
                            "relative overflow-hidden bg-muted transition-all duration-300",
                            aspectRatio === "1:1"
                                ? "aspect-square"
                                : "aspect-video"
                        )}>
                        <Image
                            src={event.image_url}
                            alt={event.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            onLoad={(e) => {
                                const img = e.target as HTMLImageElement;
                                setAspectRatio(
                                    detectAspectRatio(
                                        img.naturalWidth,
                                        img.naturalHeight
                                    )
                                );
                                setIsImageLoading(false);
                            }}
                            priority={false}
                        />
                        {isImageLoading && (
                            <div className="absolute inset-0 bg-muted animate-pulse" />
                        )}
                    </div>
                </div>
            )}

            {/* Event content */}
            <div className="px-3 py-3 sm:px-4 sm:py-4">
                <h3 className="font-semibold text-base sm:text-lg leading-tight mb-2 break-words">
                    {event.title}
                </h3>

                {/* Date and time */}
                <div className="flex items-center gap-4 text-muted-foreground text-xs sm:text-sm mb-2">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{dateString}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{timeString}</span>
                    </div>
                </div>

                {/* Location */}
                {event.location && (
                    <div className="flex items-center gap-1 text-muted-foreground text-xs sm:text-sm mb-3">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                        <button
                            onClick={handleMapLinkClick}
                            className="font-medium hover:underline flex items-center gap-1 cursor-pointer"
                            title="Otwórz w aplikacji map">
                            {event.location}
                            <ExternalLink className="h-3 w-3" />
                        </button>
                    </div>
                )}

                {/* Description */}
                {event.description && (
                    <div className="text-muted-foreground leading-relaxed text-xs sm:text-sm mb-3 sm:mb-4">
                        <div
                            className={cn(
                                "relative",
                                !isDescriptionExpanded &&
                                    "after:absolute after:bottom-0 after:left-0 after:h-8 after:w-full after:bg-gradient-to-b after:from-transparent after:to-background"
                            )}>
                            <p className="whitespace-pre-wrap break-words">
                                {isDescriptionExpanded
                                    ? event.description
                                    : truncateDescription(
                                          event.description,
                                          200
                                      )}
                            </p>
                        </div>
                        {event.description.length > 200 && (
                            <Button
                                variant="link"
                                size="sm"
                                className="mt-1 h-auto p-0 text-primary cursor-pointer"
                                onClick={() =>
                                    setIsDescriptionExpanded(
                                        !isDescriptionExpanded
                                    )
                                }>
                                {isDescriptionExpanded
                                    ? "Pokaż mniej"
                                    : "Pokaż więcej"}
                            </Button>
                        )}
                    </div>
                )}

                {/* Event URL */}
                {event.url && (
                    <div className="mt-3">
                        <Link
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer">
                            <Button
                                variant="default"
                                size="sm"
                                className="w-full flex items-center gap-2 transition-all duration-300 cursor-pointer">
                                <ExternalLink className="h-4 w-4" />
                                Odwiedź stronę wydarzenia
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
