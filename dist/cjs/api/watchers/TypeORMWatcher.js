"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeORMWatcherEntry = exports.LogType = void 0;
const DB_js_1 = __importDefault(require("../DB.js"));
const WatcherEntry_js_1 = __importStar(require("../WatcherEntry.js"));
const Telescope_js_1 = require("../Telescope.js");
var LogType;
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
})(LogType = exports.LogType || (exports.LogType = {}));
class TypeORMWatcherEntry extends WatcherEntry_js_1.default {
    constructor(data, batchId) {
        super(WatcherEntry_js_1.WatcherEntryDataType.queries, data, batchId);
    }
}
exports.TypeORMWatcherEntry = TypeORMWatcherEntry;
class TypeORMWatcher {
    constructor(data, level, batchId) {
        this.batchId = batchId;
        this.data = { level, data };
    }
    static capture(telescope) {
        Telescope_js_1.eventEmitter.on('query', async (type, query, parameters, ...args) => {
            const watcher = new TypeORMWatcher({ query, parameters, args }, type, telescope.batchId);
            await watcher.save();
        });
    }
    async save() {
        const entry = new TypeORMWatcherEntry(this.data, this.batchId);
        await DB_js_1.default.logs().save(entry);
    }
}
exports.default = TypeORMWatcher;
TypeORMWatcher.entryType = WatcherEntry_js_1.WatcherEntryCollectionType.log;
