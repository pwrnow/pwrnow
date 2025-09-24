/**
 * Analytics insights and data fetching utilities
 * This helps you analyze the collected analytics data
 */

export interface AnalyticsInsight {
  name: string;
  value: number;
  percentage?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface OrganizationAnalytics {
  organizationId: string;
  organizationName: string;
  totalEventClicks: number;
  totalEvents: number;
  totalViews: number;
  engagementRate: number;
}

/**
 * Standardized event names for analytics
 */
export const analyticsGoals = {
  // Event engagement goals
  EVENT_CLICK: 'Event Click',
  EVENT_SUBMISSION: 'Event Submission',
  ORGANIZATION_VIEW: 'Organization View',
  CATEGORY_FILTER: 'Category Filter',
  SEARCH: 'Search',

  // Interaction goals
  MAP_LINK_CLICK: 'Event Interaction', // with props: {"Interaction Type": "map_click"}
  DESCRIPTION_EXPAND: 'Event Interaction', // with props: {"Interaction Type": "description_expand"}
  EXTERNAL_LINK: 'Event Interaction', // with props: {"Interaction Type": "external_link"}
} as const;

/**
 * Custom properties for better analytics insights
 */
export const analyticsProperties = {
  // Organization tracking
  ORGANIZATION_ID: 'Organization ID',
  ORGANIZATION_NAME: 'Organization Name',
  ORGANIZATION_SLUG: 'Organization Slug',

  // Event tracking
  EVENT_ID: 'Event ID',
  EVENT_TITLE: 'Event Title',
  EVENT_COUNT: 'Event Count',

  // Category tracking
  CATEGORY: 'Category',
  CATEGORY_SLUG: 'Category Slug',
  CATEGORY_NAME: 'Category Name',

  // Search tracking
  QUERY: 'Query',
  RESULTS_COUNT: 'Results Count',

  // Interaction tracking
  INTERACTION_TYPE: 'Interaction Type',
  LOCATION: 'Location',
} as const;

/**
 * Example analytics query descriptors (consumer can map to their platform)
 */
export const analyticsQueries = {
  // Most popular organizations by event clicks
  topOrganizationsByClicks: {
    goal: analyticsGoals.EVENT_CLICK,
    property: analyticsProperties.ORGANIZATION_NAME,
    period: '30d', // last 30 days
  },

  // Most popular organizations by views
  topOrganizationsByViews: {
    goal: analyticsGoals.ORGANIZATION_VIEW,
    property: analyticsProperties.ORGANIZATION_NAME,
    period: '30d',
  },

  // Most popular categories
  topCategories: {
    goal: analyticsGoals.CATEGORY_FILTER,
    property: analyticsProperties.CATEGORY,
    period: '30d',
  },

  // Search insights
  topSearchQueries: {
    goal: analyticsGoals.SEARCH,
    property: analyticsProperties.QUERY,
    period: '30d',
  },

  // Event interaction types
  interactionTypes: {
    goal: analyticsGoals.MAP_LINK_CLICK,
    property: analyticsProperties.INTERACTION_TYPE,
    period: '7d',
  },
} as const;

/**
 * Helper function to create standardized analytics events
 */
export const createAnalyticsEvent = (
  eventName: string,
  properties: Record<string, string | number | boolean>
) => {
  return {
    name: eventName,
    props: properties,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Utility to format analytics data for display
 */
export const formatAnalyticsNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

/**
 * Calculate engagement rate
 */
export const calculateEngagementRate = (
  interactions: number,
  views: number
): number => {
  if (views === 0) return 0;
  return Math.round((interactions / views) * 100);
};

// Removed Plausible dashboard URL helpers

/**
 * Development helper to log analytics events
 */
export const logAnalyticsEvent = (
  eventName: string,
  properties?: Record<string, unknown>
) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`📊 Analytics Event: ${eventName}`);
    console.log('Properties:', properties);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
};
