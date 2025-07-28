"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import EventCard from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Calendar,
    Search,
    ShieldCheck,
    Clock,
    AlertCircle,
    RefreshCw,
} from "lucide-react";
import { getEvents } from "@/lib/api";
import { Event } from "@/lib/types";

type FilterType = "all" | "upcoming" | "verified";

export default function Home() {
    const [events, setEvents] = useState<Event[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            setError(null);
            const eventsData = await getEvents();
            setEvents(eventsData);
        } catch (err) {
            console.error("Failed to load events:", err);
            setError("Nie udało się załadować wydarzeń. Spróbuj ponownie.");
        } finally {
            setLoading(false);
        }
    };

    const filterEvents = useCallback(() => {
        let filtered = [...events];

        // Apply search filter
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (event) =>
                    event.title.toLowerCase().includes(searchLower) ||
                    event.description?.toLowerCase().includes(searchLower) ||
                    event.organization.name
                        .toLowerCase()
                        .includes(searchLower) ||
                    event.location?.toLowerCase().includes(searchLower) ||
                    (typeof event.category === "string"
                        ? event.category
                        : event.category?.name
                    )
                        ?.toLowerCase()
                        .includes(searchLower)
            );
        }

        // Apply type filter
        if (filter === "upcoming") {
            const now = new Date();
            filtered = filtered.filter(
                (event) => new Date(event.starts_at) > now
            );
        } else if (filter === "verified") {
            filtered = filtered.filter((event) => event.verified);
        }

        // Sort by start date (upcoming events first)
        filtered.sort(
            (a, b) =>
                new Date(a.starts_at).getTime() -
                new Date(b.starts_at).getTime()
        );

        setFilteredEvents(filtered);
    }, [events, searchTerm, filter]);

    useEffect(() => {
        filterEvents();
    }, [filterEvents]);

    const getFilterCount = (filterType: FilterType) => {
        if (filterType === "all") return events.length;
        if (filterType === "upcoming") {
            const now = new Date();
            return events.filter((event) => new Date(event.starts_at) > now)
                .length;
        }
        if (filterType === "verified") {
            return events.filter((event) => event.verified).length;
        }
        return 0;
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="flex-1">
                <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
                    {/* Page Header */}
                    <div className="py-6 sm:py-8">
                        <div className="text-center mb-6 sm:mb-8">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold display-font mb-3 sm:mb-4">
                                Wydarzenia na PWr
                            </h1>
                            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                                Odkryj najciekawsze wydarzenia organizowane na
                                Politechnice Wrocławskiej. Konferencje,
                                warsztaty, meetupy i wiele więcej!
                            </p>
                        </div>

                        {/* Search and Filters */}
                        <div className="space-y-4 mb-6 sm:mb-8">
                            {/* Search Bar */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Szukaj wydarzeń, organizacji, lokalizacji..."
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    className="pl-10 h-12 text-sm sm:text-base"
                                />
                            </div>

                            {/* Filter Buttons */}
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant={
                                        filter === "all" ? "default" : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setFilter("all")}
                                    className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Wszystkie</span>
                                    <Badge
                                        variant="secondary"
                                        className="ml-1 text-xs">
                                        {getFilterCount("all")}
                                    </Badge>
                                </Button>
                                <Button
                                    variant={
                                        filter === "upcoming"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setFilter("upcoming")}
                                    className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    <span>Nadchodzące</span>
                                    <Badge
                                        variant="secondary"
                                        className="ml-1 text-xs">
                                        {getFilterCount("upcoming")}
                                    </Badge>
                                </Button>
                                <Button
                                    variant={
                                        filter === "verified"
                                            ? "default"
                                            : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setFilter("verified")}
                                    className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span>Zweryfikowane</span>
                                    <Badge
                                        variant="secondary"
                                        className="ml-1 text-xs">
                                        {getFilterCount("verified")}
                                    </Badge>
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="space-y-6">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="border rounded-lg p-4 space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-16" />
                                        </div>
                                    </div>
                                    <Skeleton className="w-full h-48 rounded-md" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                Błąd ładowania
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {error}
                            </p>
                            <Button
                                onClick={loadEvents}
                                variant="outline"
                                className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Spróbuj ponownie
                            </Button>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                {searchTerm || filter !== "all"
                                    ? "Brak wyników"
                                    : "Brak wydarzeń"}
                            </h3>
                            <p className="text-muted-foreground">
                                {searchTerm || filter !== "all"
                                    ? "Spróbuj zmienić kryteria wyszukiwania lub filtr."
                                    : "Obecnie nie ma żadnych wydarzeń do wyświetlenia."}
                            </p>
                            {(searchTerm || filter !== "all") && (
                                <Button
                                    onClick={() => {
                                        setSearchTerm("");
                                        setFilter("all");
                                    }}
                                    variant="outline"
                                    className="mt-4">
                                    Wyczyść filtry
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 pb-8">
                            {/* Results Info */}
                            {(searchTerm || filter !== "all") && (
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>
                                        Znaleziono {filteredEvents.length} z{" "}
                                        {events.length} wydarzeń
                                    </span>
                                    {(searchTerm || filter !== "all") && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSearchTerm("");
                                                setFilter("all");
                                            }}>
                                            Wyczyść filtry
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Events List */}
                            <div className="space-y-6">
                                {filteredEvents.map((event) => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
