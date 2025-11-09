const E164_REGEX = /^\+?[1-9]\d{9,14}$/;

export const normalizePhoneNumber = (raw: string): string => {
    if (!raw) return '';
    const trimmed = raw.trim();
    const hasPlusPrefix = trimmed.startsWith('+');
    const digitsOnly = trimmed.replace(/\D+/g, '');
    if (!digitsOnly) {
        return '';
    }
    return hasPlusPrefix ? `+${digitsOnly}` : digitsOnly;
};

export const isPhoneNumberFormatValid = (phoneNumber: string): boolean => {
    if (!phoneNumber) return false;
    const normalized = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    return E164_REGEX.test(normalized);
};

export const isPhoneNumberUnique = (
    normalizedPhoneNumber: string,
    exists: (normalized: string) => boolean
): boolean => {
    return !exists(normalizedPhoneNumber);
};
