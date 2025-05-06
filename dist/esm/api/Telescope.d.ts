import { Express, NextFunction, Request, Response } from 'express';
import { Driver } from './DB.js';
import ClientRequestWatcher from "./watchers/ClientRequestWatcher.js";
import LogWatcher from "./watchers/LogWatcher.js";
import RequestWatcher, { GetUserFunction } from "./watchers/RequestWatcher.js";
import ErrorWatcher from "./watchers/ErrorWatcher.js";
import DumpWatcher from "./watchers/DumpWatcher.js";
export type Watcher = typeof RequestWatcher | typeof ErrorWatcher | typeof ClientRequestWatcher | typeof DumpWatcher | typeof LogWatcher;
export interface TelescopeOptions {
    enabledWatchers?: Watcher[];
    databaseDriver?: Driver;
    responseSizeLimit?: number;
    paramsToHide?: string[];
    ignorePaths?: string[];
    clientIgnoreUrls?: string[];
    ignoreErrors?: ErrorConstructor[];
    isAuthorized?: (request: Request, response: Response, next: NextFunction) => void;
    getUser?: GetUserFunction;
    enableClient?: boolean;
}
export default class Telescope {
    private static enabledWatchers;
    app: Express;
    batchId?: string;
    private static enableClient;
    constructor(app: Express);
    static setup(app: Express, options?: TelescopeOptions): Telescope;
    static config(options: TelescopeOptions): void;
    private static isAuthorized;
    static getEnabledWatchers(): string[];
    private setUpApi;
    private resolveDir;
    private setUpStaticFiles;
}
