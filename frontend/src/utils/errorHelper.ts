/**
 * Utility functions for extracting and handling error messages from API responses
 */

/**
 * Extracts error message from various error response structures
 * @param err - Error object from API call
 * @param defaultMessage - Fallback message if no specific error found
 * @returns User-friendly error message
 */
export const extractErrorMessage = (err: any, defaultMessage: string = 'An error occurred'): string => {
    // Try different common error structures
    if (err.response?.data?.message) {
        return err.response.data.message;
    }

    if (err.response?.data?.error) {
        return typeof err.response.data.error === 'string'
            ? err.response.data.error
            : err.response.data.error.message || defaultMessage;
    }

    if (err.message) {
        return err.message;
    }

    return defaultMessage;
};

/**
 * Checks if error is a network error
 */
export const isNetworkError = (err: any): boolean => {
    return !err.response && err.request;
};

/**
 * Gets user-friendly network error message
 */
export const getNetworkErrorMessage = (): string => {
    return 'Network error. Please check your internet connection and try again.';
};
