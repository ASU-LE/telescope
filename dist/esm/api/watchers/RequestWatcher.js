import DB from "../DB.js";
import WatcherEntry, { WatcherEntryCollectionType, WatcherEntryDataType } from "../WatcherEntry.js";
import { hostname } from "os";
import JSONFileSyncAdapter from "../drivers/JSONFileSyncAdapter.js";
export var HTTPMethod;
(function (HTTPMethod) {
    HTTPMethod["GET"] = "GET";
    HTTPMethod["HEAD"] = "HEAD";
    HTTPMethod["POST"] = "POST";
    HTTPMethod["PUT"] = "PUT";
    HTTPMethod["PATCH"] = "PATCH";
    HTTPMethod["DELETE"] = "DELETE";
})(HTTPMethod || (HTTPMethod = {}));
export class RequestWatcherEntry extends WatcherEntry {
    constructor(data, batchId) {
        super(WatcherEntryDataType.requests, data, batchId);
    }
}
export default class RequestWatcher {
    static entryType = WatcherEntryCollectionType.request;
    static paramsToHide = ['password', 'token', '_csrf'];
    static ignorePaths = [];
    static responseSizeLimit = 64;
    batchId;
    request;
    response;
    responseBody = '';
    startTime;
    getUser;
    controllerAction;
    constructor(request, response, batchId, getUser) {
        this.batchId = batchId;
        this.request = request;
        this.response = response;
        this.startTime = process.hrtime();
        this.getUser = getUser;
    }
    static capture(request, response, batchId, getUser) {
        const watcher = new RequestWatcher(request, response, batchId, getUser);
        if (watcher.shouldIgnore()) {
            return;
        }
        watcher.interceptResponse((body) => {
            watcher.responseBody = body;
            watcher.save();
        });
    }
    getMemoryUsage() {
        return Math.round(process.memoryUsage().rss / 1024 / 1024);
    }
    ;
    getDurationInMs() {
        const stopTime = process.hrtime(this.startTime);
        return Math.round(stopTime[0] * 1000 + stopTime[1] / 1000000);
    }
    getPayload() {
        return {
            ...this.request.query,
            ...this.getFilteredBody()
        };
    }
    interceptResponse(callback) {
        const oldSend = this.response.send;
        this.response.send = (content) => {
            const parsedContent = this.response.get('Content-Type')?.includes('application/json') ? JSON.parse(content) : content;
            const sent = oldSend.call(this.response, content);
            callback(this.contentWithinLimits(parsedContent));
            return sent;
        };
    }
    getFilteredBody() {
        Object.keys(this.request.body ?? {}).map((key) => this.filter(this.request.body, key));
        return this.request.body;
    }
    filter(params, key) {
        if (Object.hasOwn(params, key) && RequestWatcher.paramsToHide.includes(key)) {
            return Object.assign(params, { [key]: '********' });
        }
        return params;
    }
    contentWithinLimits(content) {
        return JSON.stringify(content, JSONFileSyncAdapter.getRefReplacer()).length > (1000 * RequestWatcher.responseSizeLimit) ? 'Purged By Telescope' : content;
    }
    async save() {
        const entry = new RequestWatcherEntry({
            hostname: hostname(),
            method: this.request.method,
            uri: this.request.path,
            response_status: this.response.statusCode,
            duration: this.getDurationInMs(),
            ip_address: this.request.ip,
            memory: this.getMemoryUsage(),
            payload: this.getPayload(),
            headers: this.request.headers,
            response: this.responseBody,
            user: this.getUser ? (await this.getUser(this.request) ?? undefined) : undefined,
            controllerAction: this.controllerAction
        }, this.batchId);
        await DB.requests().save(entry);
    }
    shouldIgnore() {
        const checks = RequestWatcher.ignorePaths.map((path) => {
            return path.endsWith('*') ? this.request.path.startsWith(path.slice(0, -1)) : this.request.path === path;
        });
        return checks.includes(true);
    }
}
