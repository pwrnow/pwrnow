// API Configuration
export const API_CONFIG = {
    VERSION: "v1",
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
};

// Contact Configuration
export const CONTACT_CONFIG = {
    EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "not@pwrnow.pl",
};

// Helper to get full API URL
export const getApiUrl = (): string => {
    return `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}`;
};
