import express from 'express';
import DB from './DB.js';
import ClientRequestWatcher from "./watchers/ClientRequestWatcher.js";
import LogWatcher from "./watchers/LogWatcher.js";
import RequestWatcher from "./watchers/RequestWatcher.js";
import { v4 as uuidv4 } from "uuid";
import ErrorWatcher from "./watchers/ErrorWatcher.js";
import DumpWatcher from "./watchers/DumpWatcher.js";
import { existsSync } from "fs";
import path from "path";
import TypeORMWatcher from "./watchers/TypeORMWatcher";
import EventEmitter from 'node:events';
const telescopeEmitter = new EventEmitter();
export const eventEmitter = telescopeEmitter;
export default class Telescope {
    constructor(app) {
        this.app = app;
    }
    static setup(app, options) {
        Telescope.config(options ?? {});
        const telescope = new Telescope(app);
        if (Telescope.enableClient) {
            app.use('/telescope', Telescope.isAuthorized);
            telescope.setUpApi();
            telescope.setUpStaticFiles();
        }
        app.use((request, response, next) => {
            telescope.batchId = uuidv4();
            Telescope.enabledWatchers.includes(RequestWatcher)
                && RequestWatcher.capture(request, response, telescope.batchId, options?.getUser);
            next();
        });
        Telescope.enabledWatchers.includes(ClientRequestWatcher)
            && ClientRequestWatcher.capture(telescope);
        Telescope.enabledWatchers.includes(LogWatcher)
            && LogWatcher.capture(telescope);
        Telescope.enabledWatchers.includes(TypeORMWatcher)
            && TypeORMWatcher.capture(telescope);
        return telescope;
    }
    static config(options) {
        if (options.enabledWatchers) {
            Telescope.enabledWatchers = options.enabledWatchers;
        }
        if (options.enableClient) {
            Telescope.enableClient = options.enableClient;
        }
        if (options.isAuthorized) {
            Telescope.isAuthorized = options.isAuthorized;
        }
        if (options.databaseDriver) {
            DB.driver = options.databaseDriver;
        }
        if (options.responseSizeLimit) {
            RequestWatcher.responseSizeLimit = options.responseSizeLimit;
        }
        if (options.ignorePaths) {
            RequestWatcher.ignorePaths = options.ignorePaths;
        }
        if (options.paramsToHide) {
            RequestWatcher.paramsToHide = options.paramsToHide;
        }
        if (options.ignoreErrors) {
            ErrorWatcher.ignoreErrors = options.ignoreErrors;
        }
        if (options.clientIgnoreUrls) {
            ClientRequestWatcher.ignoreUrls = options.clientIgnoreUrls;
        }
    }
    static isAuthorized(request, response, next) {
        if (process.env.NODE_ENV === "production") {
            response.status(403).send('Forbidden');
            return;
        }
        next();
    }
    static getEnabledWatchers() {
        return Telescope.enabledWatchers.map((watcher) => watcher.entryType);
    }
    setUpApi() {
        this.app.post('/telescope/telescope-api/:entry', async (request, response) => {
            const entries = await DB.entry(request.params.entry).get(Number(request.query.take ?? 50));
            response.json({
                entries,
                status: "enabled"
            });
        });
        this.app.get('/telescope/telescope-api/:entry/:id', async (request, response) => {
            const entry = await DB.entry(request.params.entry).find(request.params.id);
            response.json({
                entry,
                batch: await DB.batch(entry?.batchId ?? '')
            });
        });
        this.app.delete("/telescope/telescope-api/entries", async (request, response) => {
            await DB.truncate();
            response.send("OK");
        });
        this.app.get("/telescope/telescope-api/entries", async (request, response) => {
            response.json({
                enabled: Telescope.getEnabledWatchers()
            });
        });
    }
    resolveDir() {
        let dir = process.cwd() + '/node_modules/@asule/node-telescope/dist/';
        if (!existsSync(dir + 'index.html')) {
            dir = path.join(process.cwd(), '/dist/');
        }
        return dir;
    }
    setUpStaticFiles() {
        const dir = this.resolveDir();
        this.app.use('/telescope/app.js', express.static(dir + "app.js"));
        this.app.use('/telescope/app.css', express.static(dir + "app.css"));
        this.app.use('/telescope/app-dark.css', express.static(dir + "app-dark.css"));
        this.app.use('/telescope/favicon.ico', express.static(dir + "favicon.ico"));
        Telescope.getEnabledWatchers().forEach((watcher) => {
            this.app.use(`/telescope/${watcher}`, express.static(dir + 'index.html'));
            this.app.use(`/telescope/${watcher}/:id`, express.static(dir + 'index.html'));
        });
        this.app.get('/telescope/', (request, response) => response.redirect('/telescope/requests'));
    }
}
Telescope.enabledWatchers = [
    RequestWatcher,
    ErrorWatcher,
    ClientRequestWatcher,
    DumpWatcher,
    LogWatcher
];
Telescope.enableClient = true;
