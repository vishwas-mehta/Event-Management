export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 6) {
        return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    return { valid: true, message: '' };
};

export const validateDateRange = (
    startDate: string,
    endDate: string
): { valid: boolean; message: string } => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
        return { valid: false, message: 'End date must be after start date' };
    }
    return { valid: true, message: '' };
};

export const validatePhoneNumber = (phone: string): boolean => {
    // Basic phone validation - can be enhanced
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
};
