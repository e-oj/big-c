import {MongoClient} from 'mongodb'
import { SessionProps, StoreData } from '../../types';


async function getDB(){
    const dbUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    const connection = await MongoClient.connect(dbUri);

    return {db: connection.db(dbName), connection};
}

// Use setUser for storing global user data (persists between installs)
export async function setUser({ user }: SessionProps) {
    if (!user) return null;

    const { email, id: userId, username } = user;
    const userData = { email, userId, username };
    const {db, connection} = await getDB();

    await db.collection('users').replaceOne({userId}, userData, {upsert: true});
    await connection.close();
}

export async function setStore(session: SessionProps) {
    const { access_token: accessToken, context, scope } = session;
    // Only set on app install or update
    if (!accessToken || !scope) return null;

    const storeHash = context?.split('/')[1] || '';
    const storeData: StoreData = { accessToken, scope, storeHash };
    const {db, connection} = await getDB();

    await db.collection('stores').replaceOne({storeHash}, storeData, {upsert: true});
    await connection.close();
}

// Use setStoreUser for storing store specific variables
export async function setStoreUser(session: SessionProps) {
    const { access_token: accessToken, context, owner, sub, user: { id: userId } } = session;
    if (!userId) return null;

    const contextString = context ?? sub;
    const storeHash = contextString?.split('/')[1] || '';
    const {db, connection} = await getDB();
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

    await connection.close();
}

export async function deleteUser({ context, user, sub }: SessionProps) {
    const contextString = context ?? sub;
    const storeHash = contextString?.split('/')[1] || '';
    const userId = String(user?.id);
    const {db, connection} = await getDB();

    await db.collection('storeUsers').deleteOne({userId, storeHash});
    await connection.close();
}

export async function hasStoreUser(storeHash: string, userId: string){
    if (!storeHash || !userId) return false;

    const {db, connection} = await getDB();
    const user = await db.collection('storeUsers').findOne({userId, storeHash});

    await connection.close();
    return !!user;
}

export async function getStoreToken(storeHash: string) {
    if (!storeHash) return null;

    const {db, connection} = await getDB();
    const store = await db.collection('stores').findOne({storeHash});

    await connection.close();
    return store?.accessToken;
}

export async function deleteStore({ store_hash: storeHash }: SessionProps) {
    const {db, connection} = await getDB();

    await db.collection('stores').deleteOne({storeHash});
    await connection.close();
}
