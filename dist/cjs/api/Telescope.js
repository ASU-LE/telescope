"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventEmitter = void 0;
const express_1 = __importDefault(require("express"));
const DB_js_1 = __importDefault(require("./DB.js"));
const ClientRequestWatcher_js_1 = __importDefault(require("./watchers/ClientRequestWatcher.js"));
const LogWatcher_js_1 = __importDefault(require("./watchers/LogWatcher.js"));
const RequestWatcher_js_1 = __importDefault(require("./watchers/RequestWatcher.js"));
const uuid_1 = require("uuid");
const ErrorWatcher_js_1 = __importDefault(require("./watchers/ErrorWatcher.js"));
const DumpWatcher_js_1 = __importDefault(require("./watchers/DumpWatcher.js"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const TypeORMWatcher_js_1 = __importDefault(require("./watchers/TypeORMWatcher.js"));
const node_events_1 = __importDefault(require("node:events"));
const telescopeEmitter = new node_events_1.default();
exports.eventEmitter = telescopeEmitter;
class Telescope {
    static enabledWatchers = [
        RequestWatcher_js_1.default,
        ErrorWatcher_js_1.default,
        ClientRequestWatcher_js_1.default,
        DumpWatcher_js_1.default,
        LogWatcher_js_1.default
    ];
    app;
    batchId;
    static enableClient = true;
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
            telescope.batchId = (0, uuid_1.v4)();
            Telescope.enabledWatchers.includes(RequestWatcher_js_1.default)
                && RequestWatcher_js_1.default.capture(request, response, telescope.batchId, options?.getUser);
            next();
        });
        Telescope.enabledWatchers.includes(ClientRequestWatcher_js_1.default)
            && ClientRequestWatcher_js_1.default.capture(telescope);
        Telescope.enabledWatchers.includes(LogWatcher_js_1.default)
            && LogWatcher_js_1.default.capture(telescope);
        Telescope.enabledWatchers.includes(TypeORMWatcher_js_1.default)
            && TypeORMWatcher_js_1.default.capture(telescope);
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
            DB_js_1.default.driver = options.databaseDriver;
        }
        if (options.responseSizeLimit) {
            RequestWatcher_js_1.default.responseSizeLimit = options.responseSizeLimit;
        }
        if (options.ignorePaths) {
            RequestWatcher_js_1.default.ignorePaths = options.ignorePaths;
        }
        if (options.paramsToHide) {
            RequestWatcher_js_1.default.paramsToHide = options.paramsToHide;
        }
        if (options.ignoreErrors) {
            ErrorWatcher_js_1.default.ignoreErrors = options.ignoreErrors;
        }
        if (options.clientIgnoreUrls) {
            ClientRequestWatcher_js_1.default.ignoreUrls = options.clientIgnoreUrls;
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
            const entries = await DB_js_1.default.entry(request.params.entry).get(Number(request.query.take ?? 50));
            response.json({
                entries,
                status: "enabled"
            });
        });
        this.app.get('/telescope/telescope-api/:entry/:id', async (request, response) => {
            const entry = await DB_js_1.default.entry(request.params.entry).find(request.params.id);
            response.json({
                entry,
                batch: await DB_js_1.default.batch(entry?.batchId ?? '')
            });
        });
        this.app.delete("/telescope/telescope-api/entries", async (request, response) => {
            await DB_js_1.default.truncate();
            response.send("OK");
        });
        this.app.get("/telescope/telescope-api/entries", async (request, response) => {
            response.json({
                enabled: Telescope.getEnabledWatchers()
            });
        });
    }
    resolveDir() {
        let dir = process.cwd() + '/node_modules/@mrsafalpiya/node-telescope/dist/';
        if (!(0, fs_1.existsSync)(dir + 'index.html')) {
            dir = path_1.default.join(process.cwd(), '/dist/');
        }
        return dir;
    }
    setUpStaticFiles() {
        const dir = this.resolveDir();
        this.app.use('/telescope/app.js', express_1.default.static(dir + "app.js"));
        this.app.use('/telescope/app.css', express_1.default.static(dir + "app.css"));
        this.app.use('/telescope/app-dark.css', express_1.default.static(dir + "app-dark.css"));
        this.app.use('/telescope/favicon.ico', express_1.default.static(dir + "favicon.ico"));
        Telescope.getEnabledWatchers().forEach((watcher) => {
            this.app.use(`/telescope/${watcher}`, express_1.default.static(dir + 'index.html'));
            this.app.use(`/telescope/${watcher}/:id`, express_1.default.static(dir + 'index.html'));
        });
        this.app.get('/telescope/', (request, response) => response.redirect('/telescope/requests'));
    }
}
exports.default = Telescope;
