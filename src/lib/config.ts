export function getApiUrl(path: string = ''): string {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    return `${baseUrl}${path}`;
} 