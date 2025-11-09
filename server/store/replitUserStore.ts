import Database from '@replit/database';
import type { UserStore, UserRecord, SessionRecord } from './userStore';

export type { SessionRecord, UserRecord };

class ReplitUserStore implements UserStore {
    private db: Database;
    private readonly DB_PREFIX = 'user:';

    constructor() {
        this.db = new Database();
    }

    private getUserKey(phoneNumber: string): string {
        return `${this.DB_PREFIX}${phoneNumber}`;
    }

    async getUserByPhone(phoneNumber: string): Promise<UserRecord | undefined> {
        try {
            const key = this.getUserKey(phoneNumber);
            const userData = await this.db.get(key);
            if (!userData) {
                return undefined;
            }
            return userData as unknown as UserRecord;
        } catch (error) {
            console.error('[ReplitDB] Error fetching user from database:', error);
            console.error('[ReplitDB] Phone number:', phoneNumber);
            return undefined;
        }
    }

    async createUser(user: { phoneNumber: string; fullName: string; sessions?: SessionRecord[] }): Promise<UserRecord> {
        try {
            const key = this.getUserKey(user.phoneNumber);
            
            const existing = await this.db.get(key);
            if (existing) {
                throw new Error(`User with phone number ${user.phoneNumber} already exists.`);
            }

            const record: UserRecord = {
                phoneNumber: user.phoneNumber,
                fullName: user.fullName,
                sessions: user.sessions ?? [],
            };

            await this.db.set(key, record);
            console.log('[ReplitDB] Created user:', user.phoneNumber);
            return record;
        } catch (error) {
            console.error('[ReplitDB] Error creating user:', error);
            console.error('[ReplitDB] User data:', user);
            throw error;
        }
    }

    async updateUser(
        phoneNumber: string,
        updates: Partial<Omit<UserRecord, 'phoneNumber'>>
    ): Promise<UserRecord> {
        try {
            const key = this.getUserKey(phoneNumber);
            const existingData = await this.db.get(key);
            const existing = existingData as unknown as UserRecord | undefined;
            
            if (!existing) {
                throw new Error(`Cannot update missing user with phone number ${phoneNumber}.`);
            }

            const updated: UserRecord = {
                ...existing,
                ...updates,
                sessions: updates.sessions ?? existing.sessions,
            };

            await this.db.set(key, updated);
            console.log('[ReplitDB] Updated user:', phoneNumber);
            return updated;
        } catch (error) {
            console.error('[ReplitDB] Error updating user:', error);
            console.error('[ReplitDB] Phone number:', phoneNumber);
            console.error('[ReplitDB] Updates:', updates);
            throw error;
        }
    }
}

export const userStore: UserStore = new ReplitUserStore();
