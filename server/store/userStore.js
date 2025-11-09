"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userStore = void 0;
class InMemoryUserStore {
    constructor() {
        this.users = new Map();
    }
    getUserByPhone(phoneNumber) {
        return this.users.get(phoneNumber);
    }
    createUser(user) {
        if (this.users.has(user.phoneNumber)) {
            throw new Error(`User with phone number ${user.phoneNumber} already exists.`);
        }
        const record = {
            phoneNumber: user.phoneNumber,
            fullName: user.fullName,
            sessions: user.sessions ?? [],
        };
        this.users.set(record.phoneNumber, record);
        return record;
    }
    updateUser(phoneNumber, updates) {
        const existing = this.users.get(phoneNumber);
        if (!existing) {
            throw new Error(`Cannot update missing user with phone number ${phoneNumber}.`);
        }
        const updated = {
            ...existing,
            ...updates,
            sessions: updates.sessions ?? existing.sessions,
        };
        this.users.set(phoneNumber, updated);
        return updated;
    }
}
exports.userStore = new InMemoryUserStore();
