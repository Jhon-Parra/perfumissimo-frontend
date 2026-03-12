/**
 * Centralized API configuration for Perfumissimo
 */
const resolveHostname = (): string => {
    try {
        if (typeof window !== 'undefined' && window.location?.hostname) {
            return window.location.hostname;
        }
    } catch {
        // ignore
    }
    return 'localhost';
};

const host = resolveHostname();
const serverUrl = `http://${host}:3000`;

export const API_CONFIG = {
    // Uses current frontend hostname (localhost o IP LAN)
    serverUrl,
    baseUrl: `${serverUrl}/api`
};
