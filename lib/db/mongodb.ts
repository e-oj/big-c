import {Db, MongoClient} from 'mongodb'
import {DbClient, SessionProps, StoreData} from '@types';

export class MongoDbClient implements DbClient {
    db: Db;

    async getDb(): Promise<Db>{
        if (!this.db) {
            const dbUri = process.env.MONGODB_URI;
            const dbName = process.env.MONGODB_DB;
            const mongoClient = await MongoClient.connect(dbUri);
            this.db = mongoClient.db(dbName);
        }

        return this.db;
    }

// Use setUser for storing global user data (persists between installs)
    async setUser({ user }: SessionProps) {
        if (!user) return null;

        const { email, id: userId, username } = user;
        const userData = { email, userId, username };
        const db = await this.getDb();

        await db.collection('users').replaceOne({userId}, userData, {upsert: true});
    }

    async setStore(session: SessionProps) {
        const { access_token: accessToken, context, scope } = session;
        // Only set on app install or update
        if (!accessToken || !scope) return null;

        const storeHash = context?.split('/')[1] || '';
        const storeData: StoreData = { accessToken, scope, storeHash };
        const db = await this.getDb();

        await db.collection('stores').replaceOne({storeHash}, storeData, {upsert: true});
    }

// Use setStoreUser for storing store specific variables
    async setStoreUser(session: SessionProps) {
        const { access_token: accessToken, context, owner, sub, user: { id: userId } } = session;
        if (!userId) return null;

        const contextString = context ?? sub;
        const storeHash = contextString?.split('/')[1] || '';
        const db = await this.getDb();
        const storeUsers = db.collection('storeUsers');
        const storeUser = await storeUsers.findOne({storeHash, userId });

        // Set admin (store owner) if installing/ updating the app
        // https://developer.bigcommerce.com/api-docs/apps/guide/users
        if (accessToken) {
            const adminData = { isAdmin: true, storeHash, userId };

            if (!storeUser) {
                await storeUsers.insertOne(adminData);
            } else if (!storeUser.isAdmin) {
                await storeUsers.updateOne({storeHash, userId}, adminData);
            }
        } else {
            // Create a new user if it doesn't exist (non-store owners added here for multi-user apps)
            if (!storeUser) {
                const data = { isAdmin: owner.id === userId, storeHash, userId }
                await storeUsers.insertOne(data);
            }
        }
    }

    async deleteUser({ context, user, sub }: SessionProps) {
        const contextString = context ?? sub;
        const storeHash = contextString?.split('/')[1] || '';
        const userId = String(user?.id);
        const db = await this.getDb();

        await db.collection('storeUsers').deleteOne({userId, storeHash});
    }

    async hasStoreUser(storeHash: string, userId: string){
        if (!storeHash || !userId) return false;

        const db = await this.getDb();
        const user = await db.collection('storeUsers').findOne({userId, storeHash});

        return !!user;
    }

    async getStore(storeHash: string) {
        if (!storeHash) return null;

        const db = await this.getDb();
        const {accessToken, scope} = await db.collection('stores').findOne({storeHash});

        return {accessToken, scope, storeHash};
    }

    async getStoreToken(storeHash: string) {
        if (!storeHash) return null;

        const db = await this.getDb();
        const store = await db.collection('stores').findOne({storeHash});

        return store?.accessToken;
    }

    async deleteStore({ store_hash: storeHash }: SessionProps) {
        const db = await this.getDb();
        await db.collection('stores').deleteOne({storeHash});
    }
}