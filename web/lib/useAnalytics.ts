import { usePlausible } from "next-plausible";
import { useCallback } from "react";
import { shouldEnableAnalytics } from "./analytics";

export interface EventProps {
    [key: string]: string | number | boolean;
}

/**
 * Custom hook for tracking events with Plausible
 */
export const useAnalytics = () => {
    const plausible = usePlausible();
    const isEnabled = shouldEnableAnalytics();

    const trackEvent = useCallback(
        (eventName: string, props?: EventProps) => {
            if (!isEnabled) {
                if (process.env.NODE_ENV === "development") {
                    console.log(
                        `[Analytics] Event would be tracked: ${eventName}`,
                        props
                    );
                }
                return;
            }

            if (props) {
                plausible(eventName, { props });
            } else {
                plausible(eventName);
            }
        },
        [plausible, isEnabled]
    );

    const trackPageView = useCallback(
        (url?: string, props?: EventProps) => {
            if (!isEnabled) {
                if (process.env.NODE_ENV === "development") {
                    console.log(
                        `[Analytics] Pageview would be tracked: ${url}`,
                        props
                    );
                }
                return;
            }

            plausible("pageview", { u: url, props });
        },
        [plausible, isEnabled]
    );

    // Predefined event tracking functions
    const trackEventClick = useCallback(
        (eventId: string, eventTitle: string) => {
            trackEvent("Event Click", {
                "Event ID": eventId,
                "Event Title": eventTitle,
            });
        },
        [trackEvent]
    );

    const trackCategoryFilter = useCallback(
        (category: string) => {
            trackEvent("Category Filter", {
                Category: category,
            });
        },
        [trackEvent]
    );

    const trackSearch = useCallback(
        (query: string, resultsCount: number) => {
            trackEvent("Search", {
                Query: query,
                "Results Count": resultsCount,
            });
        },
        [trackEvent]
    );

    const trackEventSubmission = useCallback(
        (organizationId: string) => {
            trackEvent("Event Submission", {
                "Organization ID": organizationId,
            });
        },
        [trackEvent]
    );

    return {
        trackEvent,
        trackPageView,
        trackEventClick,
        trackCategoryFilter,
        trackSearch,
        trackEventSubmission,
        isEnabled,
    };
};

export default useAnalytics;
