import DB from "../DB.js"
import WatcherEntry, {WatcherEntryCollectionType, WatcherEntryDataType} from "../WatcherEntry.js"
import Telescope, {eventEmitter} from "../Telescope.js"
import {AdvancedConsoleLogger} from "typeorm";
import { InspectOptions } from "util";
import {EventEmitter} from "typeorm/browser/platform/BrowserPlatformTools";

export enum LogType {
    LOG = "log",
    SCHEMA_BUILD = "schema-build",
    MIGRATION = "migration",
    INFO = "info",
    QUERY = "query",
    WARN = "warn",
    QUERY_SLOW = "query-slow",
    ERROR = "error",
    QUERY_ERROR = "query-error",
}

export interface TypeORMWatcherData {
    level: LogType,
    data: undefined,
}

export class TypeORMWatcherEntry extends WatcherEntry<TypeORMWatcherData>
{
    constructor(data: TypeORMWatcherData, batchId?: string)
    {
        super(WatcherEntryDataType.queries, data, batchId)
    }
}

export default class TypeORMWatcher
{
    public static entryType = WatcherEntryCollectionType.log

    private data: TypeORMWatcherData
    private batchId?: string

    constructor(data: any, level: LogType, batchId?: string)
    {
        this.batchId = batchId
        this.data = {level, data};
    }

    public static  capture(telescope: Telescope)
    {
        eventEmitter.on('query', async (type: LogType, query: any, parameters: any[], ...args: any[]) => {
            const watcher = new TypeORMWatcher({query, parameters, args}, type, telescope.batchId)
            await watcher.save()
        })
    }

    public async save()
    {
        const entry = new TypeORMWatcherEntry(this.data, this.batchId)
        await DB.logs().save(entry)
    }
}