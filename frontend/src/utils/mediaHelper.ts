/**
 * Utility functions for handling media (images, videos, YouTube embeds)
 */

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * @param url - YouTube URL
 * @returns Video ID or null if not a valid YouTube URL
 */
export const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;

    // Handle different YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
};

/**
 * Checks if a URL is a YouTube video link
 */
export const isYouTubeUrl = (url: string): boolean => {
    return getYouTubeVideoId(url) !== null;
};

/**
 * Generates YouTube embed URL from video ID
 */
export const getYouTubeEmbedUrl = (videoId: string): string => {
    return `https://www.youtube.com/embed/${videoId}`;
};

/**
 * Gets YouTube thumbnail URL from video ID
 */
export const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'hq' | 'maxres' = 'hq'): string => {
    const qualityMap = {
        default: 'default.jpg',
        hq: 'hqdefault.jpg',
        maxres: 'maxresdefault.jpg',
    };
    return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}`;
};
