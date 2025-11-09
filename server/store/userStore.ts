export type SessionRecord = {
    id: string;
    startedAt: string;
    status: 'active' | 'ended';
    metadata?: Record<string, unknown>;
};

export type UserRecord = {
    phoneNumber: string;
    fullName: string;
    sessions: SessionRecord[];
};

export interface UserStore {
    getUserByPhone(phoneNumber: string): Promise<UserRecord | undefined> | UserRecord | undefined;
    createUser(user: { phoneNumber: string; fullName: string; sessions?: SessionRecord[] }): Promise<UserRecord> | UserRecord;
    updateUser(
        phoneNumber: string,
        updates: Partial<Omit<UserRecord, 'phoneNumber'>>
    ): Promise<UserRecord> | UserRecord;
}

class InMemoryUserStore implements UserStore {
    private users = new Map<string, UserRecord>();

    getUserByPhone(phoneNumber: string): UserRecord | undefined {
        return this.users.get(phoneNumber);
    }

    createUser(user: { phoneNumber: string; fullName: string; sessions?: SessionRecord[] }): UserRecord {
        if (this.users.has(user.phoneNumber)) {
            throw new Error(`User with phone number ${user.phoneNumber} already exists.`);
        }

        const record: UserRecord = {
            phoneNumber: user.phoneNumber,
            fullName: user.fullName,
            sessions: user.sessions ?? [],
        };
        this.users.set(record.phoneNumber, record);
        return record;
    }

    updateUser(
        phoneNumber: string,
        updates: Partial<Omit<UserRecord, 'phoneNumber'>>
    ): UserRecord {
        const existing = this.users.get(phoneNumber);
        if (!existing) {
            throw new Error(`Cannot update missing user with phone number ${phoneNumber}.`);
        }

        const updated: UserRecord = {
            ...existing,
            ...updates,
            sessions: updates.sessions ?? existing.sessions,
        };

        this.users.set(phoneNumber, updated);
        return updated;
    }
}

export const userStore: UserStore = new InMemoryUserStore();
