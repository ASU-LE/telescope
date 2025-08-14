import DB from "../DB.js";
import WatcherEntry, { WatcherEntryCollectionType, WatcherEntryDataType } from "../WatcherEntry.js";
import { eventEmitter } from "../Telescope.js";
export var LogType;
(function (LogType) {
    LogType["LOG"] = "log";
    LogType["SCHEMA_BUILD"] = "schema-build";
    LogType["MIGRATION"] = "migration";
    LogType["INFO"] = "info";
    LogType["QUERY"] = "query";
    LogType["WARN"] = "warn";
    LogType["QUERY_SLOW"] = "query-slow";
    LogType["ERROR"] = "error";
    LogType["QUERY_ERROR"] = "query-error";
})(LogType || (LogType = {}));
export class TypeORMWatcherEntry extends WatcherEntry {
    constructor(data, batchId) {
        super(WatcherEntryDataType.queries, data, batchId);
    }
}
export default class TypeORMWatcher {
    static entryType = WatcherEntryCollectionType.log;
    data;
    batchId;
    constructor(data, level, batchId) {
        this.batchId = batchId;
        this.data = { level, data };
    }
    static capture(telescope) {
        eventEmitter.on('query', async (type, query, parameters, ...args) => {
            const watcher = new TypeORMWatcher({ query, parameters, args }, type, telescope.batchId);
            await watcher.save();
        });
    }
    async save() {
        const entry = new TypeORMWatcherEntry(this.data, this.batchId);
        await DB.logs().save(entry);
    }
}
