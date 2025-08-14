import axios from 'axios';
import DB from "../DB.js";
import WatcherEntry, { WatcherEntryCollectionType, WatcherEntryDataType } from "../WatcherEntry.js";
import { hostname } from "os";
export class ClientRequestWatcherEntry extends WatcherEntry {
    constructor(data, batchId) {
        super(WatcherEntryDataType.clientRequests, data, batchId);
    }
}
export default class ClientRequestWatcher {
    static entryType = WatcherEntryCollectionType.clientRequest;
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
        axios.interceptors.request.use((config) => {
            request = config;
            return config;
        });
        axios.interceptors.response.use(async (response) => {
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
            hostname: hostname(),
            method: this.request.method?.toUpperCase() ?? '',
            uri: this.request.url ?? '',
            headers: this.request.headers ?? {},
            payload: this.request.data ?? {},
            response_status: this.response.status,
            response_headers: this.response.headers,
            response: this.isHtmlResponse() ? this.escapeHTML(this.response.data) : this.response.data
        }, this.batchId);
        await DB.clientRequests().save(entry);
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
