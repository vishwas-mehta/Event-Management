export const formatPrice = (price: number | undefined | null): string => {
    if (price === undefined || price === null || isNaN(price)) {
        return 'TBA';
    }
    if (price === 0) {
        return 'Free';
    }
    return `$${Number(price).toFixed(2)}`;
};

export const formatPriceRange = (minPrice: number | undefined | null, maxPrice: number | undefined | null): string => {
    if (minPrice === undefined || minPrice === null || maxPrice === undefined || maxPrice === null) {
        return 'TBA';
    }
    if (minPrice === 0 && maxPrice === 0) {
        return 'Free';
    }
    if (minPrice === maxPrice) {
        return formatPrice(minPrice);
    }
    if (minPrice === 0) {
        return `Free - ${formatPrice(maxPrice)}`;
    }
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
};
