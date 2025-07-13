import LowDriver from "./drivers/LowDriver.js";
import { WatcherEntryCollectionType } from "./WatcherEntry.js";
class DB {
    static driver = LowDriver;
    static db;
    constructor() {
        DB.db = new DB.driver();
    }
    static entry(name) {
        return {
            get: async (take) => (await DB.get()).get(name, take),
            find: async (id) => (await DB.get()).find(name, id),
            save: async (data) => (await DB.get()).save(name, data),
            update: async (index, toUpdate) => (await DB.get()).update(name, index, toUpdate),
        };
    }
    static async batch(batchId) {
        return (await DB.get()).batch(batchId);
    }
    static async truncate() {
        return (await DB.get()).truncate();
    }
    static requests() {
        return this.entry(WatcherEntryCollectionType.request);
    }
    static errors() {
        return this.entry(WatcherEntryCollectionType.exception);
    }
    static dumps() {
        return this.entry(WatcherEntryCollectionType.dump);
    }
    static logs() {
        return this.entry(WatcherEntryCollectionType.log);
    }
    static clientRequests() {
        return this.entry(WatcherEntryCollectionType.clientRequest);
    }
    static async get() {
        if (!DB.db) {
            new DB();
        }
        return DB.db;
    }
}
export default DB;
