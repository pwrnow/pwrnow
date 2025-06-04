"use client";

import {
    Check,
    MoreHorizontal,
    Search,
    Calendar,
    MapPin,
    Clock,
    ExternalLink,
    ShieldCheck,
    Clock3,
    Navigation,
    Trash2,
} from "lucide-react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { adminDeleteEvent, updateEventStatus } from "@/app/actions/events";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import React from "react";

interface Category {
    id: string;
    name: string;
    slug: string;
    order_index: number | null;
}

interface Organization {
    id: string;
    name: string;
    image_url: string | null;
    code: string | null;
}

interface Event {
    id: string;
    starts_at: string;
    ends_at: string;
    title: string;
    description: string | null;
    image_url: string | null;
    location: string | null;
    verified: boolean;
    url: string | null;
    category_id: string | null;
    organization_id: string | null;
    category: Category | null;
    organization: Organization | null;
}

type VerificationFilter = "all" | "verified" | "unverified";

interface DeleteEventDialogProps {
    event: Event;
    onSuccess: () => void;
}

function DeleteEventDialog({ event, onSuccess }: DeleteEventDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [state, formAction] = useActionState(deleteEvent, null);
    const { pending } = useFormStatus();
    const { toast } = useToast();

    React.useEffect(() => {
        if (state?.error) {
            toast({
                title: "Błąd",
                description: state.error,
                variant: "destructive",
            });
        } else if (state?.success) {
            toast({
                title: "Sukces",
                description: "Wydarzenie zostało usunięte",
            });
            setIsOpen(false);
            onSuccess();
        }
    }, [state, toast, onSuccess]);

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Czy na pewno chcesz usunąć to wydarzenie?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Zamierzasz usunąć wydarzenie{" "}
                        <span className="font-medium">"{event.title}"</span>. Ta
                        akcja jest nieodwracalna i spowoduje trwałe usunięcie
                        wydarzenia.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>
                        Anuluj
                    </AlertDialogCancel>
                    <form action={formAction}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <AlertDialogAction
                            type="submit"
                            disabled={pending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {pending ? "Usuwanie..." : "Usuń wydarzenie"}
                        </AlertDialogAction>
                    </form>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

interface EventsTableProps {
    events: Event[];
    categories: Category[];
}

async function verifyEvent(prevState: any, formData: FormData) {
    try {
        await updateEventStatus(formData);
        return { success: true };
    } catch (error) {
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "Wystąpił nieoczekiwany błąd",
        };
    }
}

function VerificationButton({
    event,
    pending,
}: {
    event: Event;
    pending: boolean;
}) {
    return (
        <Button
            type="submit"
            size="icon"
            variant="ghost"
            className={cn(
                "h-6 w-6",
                event.verified ? "text-amber-600" : "text-green-600"
            )}
            disabled={pending}>
            {pending ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
                <Check className="h-3 w-3" />
            )}
        </Button>
    );
}

function VerificationForm({ event }: { event: Event }) {
    const [state, formAction] = useActionState(verifyEvent, null);
    const { pending } = useFormStatus();
    const { toast } = useToast();

    React.useEffect(() => {
        if (state?.error) {
            toast({
                title: "Błąd",
                description: state.error,
                variant: "destructive",
            });
        } else if (state?.success) {
            toast({
                title: "Sukces",
                description: event.verified
                    ? "Status weryfikacji został cofnięty"
                    : "Wydarzenie zostało zweryfikowane",
            });
        }
    }, [state, event.verified, toast]);

    return (
        <form action={formAction}>
            <input type="hidden" name="eventId" value={event.id} />
            <input
                type="hidden"
                name="verified"
                value={(!event.verified).toString()}
            />
            <VerificationButton event={event} pending={pending} />
        </form>
    );
}

async function deleteEvent(prevState: any, formData: FormData) {
    try {
        const eventId = formData.get("eventId")?.toString();
        if (!eventId) throw new Error("Brak ID wydarzenia");

        await adminDeleteEvent(eventId);
        return { success: true };
    } catch (error) {
        return {
            error:
                error instanceof Error
                    ? error.message
                    : "Wystąpił nieoczekiwany błąd",
        };
    }
}

export function EventsTable({ events, categories }: EventsTableProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [verificationFilter, setVerificationFilter] =
        useState<VerificationFilter>("all");
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const router = useRouter();

    const filteredEvents = events.filter((event) => {
        const matchesSearch =
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.category?.name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            event.organization?.name
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase());

        const matchesVerification =
            verificationFilter === "all" ||
            (verificationFilter === "verified" && event.verified) ||
            (verificationFilter === "unverified" && !event.verified);

        return matchesSearch && matchesVerification;
    });

    // Separate events into active/future and past
    const now = new Date();
    const activeEvents = filteredEvents.filter((event) => {
        const eventDate = parseISO(event.ends_at);
        return eventDate >= now;
    });

    const pastEvents = filteredEvents.filter((event) => {
        const eventDate = parseISO(event.ends_at);
        return eventDate < now;
    });

    activeEvents.sort((a, b) => {
        return (
            parseISO(a.starts_at).getTime() - parseISO(b.starts_at).getTime()
        );
    });

    pastEvents.sort((a, b) => {
        return (
            parseISO(b.starts_at).getTime() - parseISO(a.starts_at).getTime()
        );
    });

    const handleUrlClick = (url: string) => {
        window.open(url, "_blank", "noopener,noreferrer");
        setSelectedUrl(null);
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    const renderEventsGrid = (eventsList: Event[], title: string) => {
        if (eventsList.length === 0) {
            return (
                <div className="mb-8">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-xl font-semibold mb-4">{title}</h2>
                    </div>
                    <div className="text-center py-8 text-muted-foreground">
                        Brak wydarzeń w tej kategorii
                    </div>
                </div>
            );
        }

        return (
            <div className="mb-8">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        {title}
                        <Badge
                            variant="outline"
                            className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/50 text-primary font-medium">
                            {eventsList.length}
                        </Badge>
                    </h2>
                </div>
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {eventsList.map((event) => {
                            const startsAt = parseISO(event.starts_at);
                            const endsAt = parseISO(event.ends_at);
                            const dateString = format(startsAt, "d MMMM yyyy", {
                                locale: pl,
                            });
                            const startTimeString = format(startsAt, "HH:mm");
                            const endTimeString = format(endsAt, "HH:mm");
                            const timeString = `${startTimeString} - ${endTimeString}`;
                            const organizationName =
                                event.organization?.name || "Wydarzenie";
                            const organizationImageUrl =
                                event.organization?.image_url;
                            const categoryName =
                                event.category?.name || "Wydarzenie";
                            const orgInitials = getInitials(organizationName);

                            return (
                                <div
                                    key={event.id}
                                    className="border rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group box-border flex flex-col min-h-[600px]">
                                    <div
                                        className={cn(
                                            "w-full py-1 px-3 text-xs font-medium flex items-center justify-between flex-shrink-0",
                                            event.verified
                                                ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                        )}>
                                        <div className="flex items-center gap-1">
                                            {event.verified ? (
                                                <>
                                                    <ShieldCheck className="h-3 w-3" />
                                                    Zatwierdzony
                                                </>
                                            ) : (
                                                <>
                                                    <Clock3 className="h-3 w-3" />
                                                    Oczekuje na weryfikację
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <VerificationForm
                                                            event={event}
                                                        />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>
                                                            {event.verified
                                                                ? "Cofnij weryfikację"
                                                                : "Weryfikuj"}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>

                                    <div className="px-3 py-2 flex items-center space-x-3 flex-shrink-0">
                                        <Avatar className="h-10 w-10 border border-primary/20 ring-offset-background transition-all duration-300 group-hover:shadow-sm">
                                            <AvatarImage
                                                src={
                                                    organizationImageUrl ||
                                                    undefined
                                                }
                                                alt={organizationName}
                                            />
                                            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-medium">
                                                {orgInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-base truncate">
                                                    {organizationName}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {event.category && (
                                                        <Badge
                                                            variant="outline"
                                                            className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/50">
                                                            {categoryName}
                                                        </Badge>
                                                    )}
                                                    <DeleteEventDialog
                                                        event={event}
                                                        onSuccess={() =>
                                                            router.refresh()
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-900 flex-shrink-0">
                                        <Image
                                            src={
                                                event.image_url ||
                                                "/placeholder.svg"
                                            }
                                            alt={event.title}
                                            fill
                                            className="object-contain transition-transform duration-500"
                                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 540px, (max-width: 1024px) 680px, 768px"
                                            priority
                                        />
                                    </div>

                                    <div className="flex flex-col flex-1 px-3 pt-3 pb-4 min-h-0">
                                        <div className="flex-shrink-0 mb-3">
                                            <h2 className="text-xl font-bold display-font break-words hyphens-auto">
                                                {event.url ? (
                                                    <Button
                                                        variant="link"
                                                        className="h-auto p-0 text-xl font-bold text-left whitespace-normal break-words"
                                                        onClick={() =>
                                                            event.url &&
                                                            setSelectedUrl(
                                                                event.url
                                                            )
                                                        }>
                                                        {event.title}
                                                    </Button>
                                                ) : (
                                                    event.title
                                                )}
                                            </h2>
                                        </div>

                                        <div className="flex-1"></div>

                                        <div className="flex flex-col space-y-2 text-sm flex-shrink-0 mt-auto">
                                            <div className="flex items-center">
                                                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950 mr-2 flex-shrink-0">
                                                    <Calendar className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                                                </div>
                                                <span>{dateString}</span>
                                            </div>

                                            <div className="flex items-center">
                                                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950 mr-2 flex-shrink-0">
                                                    <Clock className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                                                </div>
                                                <span>{timeString}</span>
                                            </div>

                                            {event.location && (
                                                <div className="flex items-center">
                                                    <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950 mr-2 flex-shrink-0">
                                                        <MapPin className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                                                    </div>
                                                    <span className="flex-1 truncate">
                                                        {event.location}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="ml-2 h-7 w-7 flex-shrink-0"
                                                        onClick={() => {
                                                            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                                event.location ||
                                                                    ""
                                                            )}`;
                                                            window.open(
                                                                url,
                                                                "_blank",
                                                                "noopener,noreferrer"
                                                            );
                                                        }}>
                                                        <Navigation className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}

                                            {event.url && (
                                                <div className="flex items-center">
                                                    <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-950 mr-2 flex-shrink-0">
                                                        <ExternalLink className="h-4 w-4 text-blue-700 dark:text-blue-300" />
                                                    </div>
                                                    <Button
                                                        variant="link"
                                                        className="h-auto p-0 text-sm font-normal flex-1 text-left justify-start"
                                                        onClick={() =>
                                                            setSelectedUrl(
                                                                event.url
                                                            )
                                                        }>
                                                        <span className="truncate">
                                                            {event.url}
                                                        </span>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="w-full max-w-7xl mx-auto mb-6">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Szukaj wydarzeń..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Filtry
                                {verificationFilter !== "all" && (
                                    <Badge variant="secondary" className="ml-2">
                                        {verificationFilter === "verified"
                                            ? "Zweryfikowane"
                                            : "Niezweryfikowane"}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuLabel>
                                Status weryfikacji
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() => setVerificationFilter("all")}>
                                Wszystkie
                                {verificationFilter === "all" && (
                                    <Check className="ml-auto h-4 w-4" />
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    setVerificationFilter("verified")
                                }>
                                Zweryfikowane
                                {verificationFilter === "verified" && (
                                    <Check className="ml-auto h-4 w-4" />
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    setVerificationFilter("unverified")
                                }>
                                Niezweryfikowane
                                {verificationFilter === "unverified" && (
                                    <Check className="ml-auto h-4 w-4" />
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {renderEventsGrid(activeEvents, "Nadchodzące wydarzenia")}
            {renderEventsGrid(pastEvents, "Zakończone wydarzenia")}
        </>
    );
}
