import { format, parseISO, isPast, isFuture } from 'date-fns';

export const formatEventDate = (dateString: string): string => {
    try {
        const date = parseISO(dateString);
        return format(date, 'MMM dd, yyyy');
    } catch {
        return dateString;
    }
};

export const formatEventDateTime = (dateString: string): string => {
    try {
        const date = parseISO(dateString);
        return format(date, 'MMM dd, yyyy • hh:mm a');
    } catch {
        return dateString;
    }
};

export const formatEventTime = (dateString: string): string => {
    try {
        const date = parseISO(dateString);
        return format(date, 'hh:mm a');
    } catch {
        return dateString;
    }
};

export const formatTimestamp = (dateString: string): string => {
    try {
        const date = parseISO(dateString);
        return format(date, 'MMM dd, yyyy');
    } catch {
        return dateString;
    }
};

export const isEventPast = (endDateTime: string): boolean => {
    try {
        return isPast(parseISO(endDateTime));
    } catch {
        return false;
    }
};

export const isEventUpcoming = (startDateTime: string): boolean => {
    try {
        return isFuture(parseISO(startDateTime));
    } catch {
        return false;
    }
};
