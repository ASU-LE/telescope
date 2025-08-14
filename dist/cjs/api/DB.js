"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LowDriver_js_1 = __importDefault(require("./drivers/LowDriver.js"));
const WatcherEntry_js_1 = require("./WatcherEntry.js");
class DB {
    static driver = LowDriver_js_1.default;
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
        return this.entry(WatcherEntry_js_1.WatcherEntryCollectionType.request);
    }
    static errors() {
        return this.entry(WatcherEntry_js_1.WatcherEntryCollectionType.exception);
    }
    static dumps() {
        return this.entry(WatcherEntry_js_1.WatcherEntryCollectionType.dump);
    }
    static logs() {
        return this.entry(WatcherEntry_js_1.WatcherEntryCollectionType.log);
    }
    static clientRequests() {
        return this.entry(WatcherEntry_js_1.WatcherEntryCollectionType.clientRequest);
    }
    static async get() {
        if (!DB.db) {
            new DB();
        }
        return DB.db;
    }
}
exports.default = DB;
