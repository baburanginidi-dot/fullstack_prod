"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPhoneNumberUnique = exports.isPhoneNumberFormatValid = exports.normalizePhoneNumber = void 0;
const E164_REGEX = /^\+?[1-9]\d{9,14}$/;
const normalizePhoneNumber = (raw) => {
    if (!raw)
        return '';
    const trimmed = raw.trim();
    const hasPlusPrefix = trimmed.startsWith('+');
    const digitsOnly = trimmed.replace(/\D+/g, '');
    if (!digitsOnly) {
        return '';
    }
    return hasPlusPrefix ? `+${digitsOnly}` : digitsOnly;
};
exports.normalizePhoneNumber = normalizePhoneNumber;
const isPhoneNumberFormatValid = (phoneNumber) => {
    if (!phoneNumber)
        return false;
    const normalized = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    return E164_REGEX.test(normalized);
};
exports.isPhoneNumberFormatValid = isPhoneNumberFormatValid;
const isPhoneNumberUnique = (normalizedPhoneNumber, exists) => {
    return !exists(normalizedPhoneNumber);
};
exports.isPhoneNumberUnique = isPhoneNumberUnique;
