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
    baseUrl: `${serverUrl}/api`,
    googleClientId: '129037757547-mvt7e9b254t59dc4s7mu8vnth62lf7lr.apps.googleusercontent.com'
};
