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
exports.ClientRequestWatcherEntry = void 0;
const axios_1 = __importDefault(require("axios"));
const DB_js_1 = __importDefault(require("../DB.js"));
const WatcherEntry_js_1 = __importStar(require("../WatcherEntry.js"));
const os_1 = require("os");
class ClientRequestWatcherEntry extends WatcherEntry_js_1.default {
    constructor(data, batchId) {
        super(WatcherEntry_js_1.WatcherEntryDataType.clientRequests, data, batchId);
    }
}
exports.ClientRequestWatcherEntry = ClientRequestWatcherEntry;
class ClientRequestWatcher {
    static entryType = WatcherEntry_js_1.WatcherEntryCollectionType.clientRequest;
    static ignoreUrls = [];
    batchId;
    request;
    response;
    constructor(request, response, batchId) {
        this.batchId = batchId;
        this.request = request;
        this.response = response;
    }
    static capture(telescope) {
        let request = null;
        axios_1.default.interceptors.request.use((config) => {
            request = config;
            return config;
        });
        axios_1.default.interceptors.response.use(async (response) => {
            if (request) {
                const watcher = new ClientRequestWatcher(request, response, telescope.batchId);
                !watcher.shouldIgnore() && await watcher.save();
                request = null;
            }
            return response;
        }, async (error) => {
            if (request) {
                const watcher = new ClientRequestWatcher(request, error.response, telescope.batchId);
                !watcher.shouldIgnore() && await watcher.save();
                request = null;
            }
            return Promise.reject(error);
        });
    }
    async save() {
        const entry = new ClientRequestWatcherEntry({
            hostname: (0, os_1.hostname)(),
            method: this.request.method?.toUpperCase() ?? '',
            uri: this.request.url ?? '',
            headers: this.request.headers ?? {},
            payload: this.request.data ?? {},
            response_status: this.response.status,
            response_headers: this.response.headers,
            response: this.isHtmlResponse() ? this.escapeHTML(this.response.data) : this.response.data
        }, this.batchId);
        await DB_js_1.default.clientRequests().save(entry);
    }
    escapeHTML(html) {
        return html.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag));
    }
    isHtmlResponse() {
        return (this.response?.headers ?? [])['content-type']?.startsWith('text/html') ?? false;
    }
    shouldIgnore() {
        const checks = ClientRequestWatcher.ignoreUrls.map((url) => {
            return url.endsWith('*') ? this.request.url?.startsWith(url.slice(0, -1)) : this.request.url === url;
        });
        return checks.includes(true);
    }
}
exports.default = ClientRequestWatcher;
