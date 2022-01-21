import { SessionProps } from './auth';

export interface StoreData {
    accessToken?: string;
    scope?: string;
    storeHash: string;
}

export interface UserData {
    email: string;
    username?: string;
}

export interface DbClient {
    hasStoreUser(storeHash: string, userId: string): Promise<boolean>;
    setUser(session: SessionProps): Promise<void>;
    setStore(session: SessionProps): Promise<void>;
    setStoreUser(session: SessionProps): Promise<void>;
    getStore(storeHash: string): Promise<StoreData | null>;
    getStoreToken(storeHash: string): Promise<string | null>;
    deleteStore(session: SessionProps): Promise<void>;
    deleteUser(session: SessionProps): Promise<void>;
}
