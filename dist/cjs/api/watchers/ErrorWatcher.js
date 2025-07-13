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
exports.ErrorWatcherEntry = void 0;
const DB_js_1 = __importDefault(require("../DB.js"));
const fs_1 = require("fs");
const WatcherEntry_js_1 = __importStar(require("../WatcherEntry.js"));
const os_1 = require("os");
const stack_utils_1 = __importDefault(require("stack-utils"));
class ErrorWatcherEntry extends WatcherEntry_js_1.default {
    constructor(data, batchId) {
        super(WatcherEntry_js_1.WatcherEntryDataType.exceptions, data, batchId);
    }
}
exports.ErrorWatcherEntry = ErrorWatcherEntry;
class ErrorWatcher {
    static entryType = WatcherEntry_js_1.WatcherEntryCollectionType.exception;
    static ignoreErrors = [];
    error;
    batchId;
    constructor(error, batchId) {
        this.error = error;
        this.batchId = batchId;
    }
    static setup(telescope) {
        telescope.app.use(async (error, request, response, next) => {
            try {
                const watcher = new ErrorWatcher(error, telescope.batchId);
                if (watcher.shouldIgnore()) {
                    next(error);
                    return;
                }
                await watcher.saveOrUpdate();
                next(error);
            }
            catch (e) {
                next(e);
            }
        });
        // catch async errors
        process
            .on('uncaughtException', async (error) => {
            const watcher = new ErrorWatcher(error, telescope.batchId);
            if (watcher.shouldIgnore()) {
                return;
            }
            await watcher.saveOrUpdate();
            console.error(error);
            process.exit(1);
        });
    }
    async getSameError() {
        const errors = (await DB_js_1.default.errors().get());
        const index = errors.findIndex(error => this.isSameError(error));
        const error = errors.find(error => this.isSameError(error));
        return { error, index };
    }
    async saveOrUpdate() {
        const { error, index } = await this.getSameError();
        const entry = new ErrorWatcherEntry({
            hostname: (0, os_1.hostname)(),
            class: this.error.name,
            file: this.getFileInfo().file,
            message: this.error.message,
            trace: this.getStackTrace(),
            line: this.getFileInfo().line,
            line_preview: this.getLinePreview(),
            occurrences: (error?.content.occurrences ?? 0) + 1,
        }, this.batchId);
        error ? await DB_js_1.default.errors().update(index, entry) : await DB_js_1.default.errors().save(entry);
    }
    isSameError(error) {
        return error.content.class === this.error.name &&
            error.content.message === this.error.message &&
            error.content.file === this.getFileInfo().file;
    }
    shouldIgnore() {
        return ErrorWatcher.ignoreErrors.includes(this.error.constructor);
    }
    getFileInfo() {
        const utils = new stack_utils_1.default({ cwd: process.cwd(), internals: stack_utils_1.default.nodeInternals() });
        const fileInfo = utils.parseLine(this.error.stack ? this.error.stack.split('\n')[1] : '');
        return {
            file: fileInfo?.file?.replace('file://', '') ?? '',
            line: fileInfo?.line ?? 0,
            column: fileInfo?.column ?? 0,
        };
    }
    getLinePreview() {
        const fileInfo = this.getFileInfo();
        const preview = {};
        fileInfo.file && (0, fs_1.existsSync)(fileInfo.file) && (0, fs_1.readFileSync)(fileInfo.file).toString().split('\n').forEach((line, index) => {
            if (index > fileInfo.line - 10 && index < fileInfo.line + 10) {
                preview[index + 1] = line;
            }
        });
        return preview;
    }
    getStackTrace() {
        const lines = this.error.stack?.split("\n") ?? [];
        lines.shift();
        return lines.map((line) => {
            const counters = line.split(':');
            return {
                file: line.trim(),
                line: Number(counters[counters.length - 2] ?? null)
            };
        });
    }
}
exports.default = ErrorWatcher;
