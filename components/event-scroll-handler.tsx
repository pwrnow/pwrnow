"use client";

import { useEffect } from "react";

export default function EventScrollHandler() {
    useEffect(() => {
        const handleHashScroll = () => {
            const hash = window.location.hash;
            if (hash.startsWith("#event-")) {
                const eventId = hash.replace("#event-", "");
                const element = document.getElementById(`event-${eventId}`);

                if (element) {
                    // Wait a bit for the page to fully load, then scroll
                    setTimeout(() => {
                        element.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                        });

                        // Add a highlight effect
                        element.classList.add(
                            "ring-2",
                            "ring-primary",
                            "ring-offset-2",
                            "bg-primary/5"
                        );

                        // Remove the highlight after 3 seconds
                        setTimeout(() => {
                            element.classList.remove(
                                "ring-2",
                                "ring-primary",
                                "ring-offset-2",
                                "bg-primary/5"
                            );
                        }, 3000);
                    }, 500);
                }
            }
        };

        // Handle initial page load with hash
        handleHashScroll();

        // Handle hash changes (if someone clicks a share link while already on the page)
        window.addEventListener("hashchange", handleHashScroll);

        return () => {
            window.removeEventListener("hashchange", handleHashScroll);
        };
    }, []);

    return null; // This component doesn't render anything
}
