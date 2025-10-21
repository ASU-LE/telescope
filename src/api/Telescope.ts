import {Express, NextFunction, Request, Response} from 'express'
import DB, {Driver} from './DB.js'
import ClientRequestWatcher from "./watchers/ClientRequestWatcher.js"
import LogWatcher from "./watchers/LogWatcher.js"
import RequestWatcher, {GetUserFunction} from "./watchers/RequestWatcher.js"
import {v4 as uuidv4} from "uuid"
import ErrorWatcher from "./watchers/ErrorWatcher.js"
import DumpWatcher from "./watchers/DumpWatcher.js"
import TypeORMWatcher, {TypeORMWatcherEntry} from "./watchers/TypeORMWatcher";
import EventEmitter from 'node:events';

export type Watcher =
    typeof RequestWatcher |
    typeof ErrorWatcher |
    typeof ClientRequestWatcher |
    typeof DumpWatcher |
    typeof LogWatcher |
    typeof TypeORMWatcher

/**
 * Options for the database.
 * @typedef {object} DatabaseOptions
 */
export interface DatabaseOptions {
    /**
     * Store queries that take longer than 100ms.
     * @type {boolean}
     */
    storeSlowQueries?: boolean
    /**
     * Store query errors.
     * @type {boolean}
     */
    storeQueryErrors?: boolean
    /**
     * Store queries that are fast, and not errors.
     * @type {boolean}
     */
    storeNormalQueries?: boolean
}

export interface TelescopeOptions
{
    enabledWatchers?: Watcher[]
    databaseDriver?: Driver
    databaseOptions?: DatabaseOptions
    responseSizeLimit?: number
    paramsToHide?: string[]
    ignorePaths?: string[]
    clientIgnoreUrls?: string[]
    ignoreErrors?: ErrorConstructor[]
    isAuthorized?: (request: Request, response: Response, next: NextFunction) => void
    getUser?: GetUserFunction,
    enableClient?: boolean
}

const telescopeEmitter = new EventEmitter();

export const eventEmitter = telescopeEmitter;

export default class Telescope
{
    private static enabledWatchers: Watcher[] = [
        RequestWatcher,
        ErrorWatcher,
        ClientRequestWatcher,
        DumpWatcher,
        LogWatcher
    ]

    public app: Express
    public batchId?: string

    constructor(app: Express)
    {
        this.app = app
    }

    public static setup(app: Express, options?: TelescopeOptions)
    {
        Telescope.config(options ?? {})

        const telescope = new Telescope(app)

        app.use((request, response, next) => {
            telescope.batchId = uuidv4()

            Telescope.enabledWatchers.includes(RequestWatcher)
            && RequestWatcher.capture(request, response, telescope.batchId, options?.getUser)

            next()
        })

        Telescope.enabledWatchers.includes(ClientRequestWatcher)
        && ClientRequestWatcher.capture(telescope)

        Telescope.enabledWatchers.includes(LogWatcher)
        && LogWatcher.capture(telescope)

        Telescope.enabledWatchers.includes(TypeORMWatcher)
        && TypeORMWatcher.capture(telescope)

        return telescope
    }

    public static config(options: TelescopeOptions)
    {
        if (options.enabledWatchers) {
            Telescope.enabledWatchers = options.enabledWatchers
        }

        if (options.databaseDriver) {
            DB.driver = options.databaseDriver
        }

        if (options.responseSizeLimit) {
            RequestWatcher.responseSizeLimit = options.responseSizeLimit
        }

        if (options.ignorePaths) {
            RequestWatcher.ignorePaths = options.ignorePaths
        }

        if (options.paramsToHide) {
            RequestWatcher.paramsToHide = options.paramsToHide
        }

        if (options.ignoreErrors) {
            ErrorWatcher.ignoreErrors = options.ignoreErrors
        }

        if (options.clientIgnoreUrls) {
            ClientRequestWatcher.ignoreUrls = options.clientIgnoreUrls
        }

        if (options.databaseOptions) {
            TypeORMWatcher.options = options.databaseOptions;
        }
    }

    public static getEnabledWatchers(): string[]
    {
        return Telescope.enabledWatchers.map((watcher) => watcher.entryType)
    }
}