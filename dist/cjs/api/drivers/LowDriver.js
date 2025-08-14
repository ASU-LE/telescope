"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const JSONFileSyncAdapter_js_1 = __importDefault(require("./JSONFileSyncAdapter.js"));
class LowDriver {
    adapter;
    db = {
        requests: [],
        exceptions: [],
        dumps: [],
        logs: [],
        queries: [],
        "client-requests": [],
    };
    constructor() {
        this.adapter = new JSONFileSyncAdapter_js_1.default('db.json');
        this.adapter.read();
    }
    read() {
        this.db = this.adapter.read() ?? this.db;
    }
    write() {
        this.adapter.write(this.db);
    }
    async get(name, take) {
        this.read();
        return (take ? this.db[name].slice(0, take) : this.db[name]) ?? [];
    }
    async find(name, id) {
        this.read();
        return this.db[name].find((entry) => entry.id === id);
    }
    async batch(batchId) {
        this.read();
        const batch = [];
        Object.keys(this.db).forEach((key) => {
            // @ts-ignore
            batch.push(this.db[key]);
        });
        return batch.flat().filter((entry) => entry.batchId === batchId);
    }
    async save(name, data) {
        this.read();
        this.db[name].unshift(data);
        this.write();
    }
    async update(name, index, toUpdate) {
        this.read();
        this.db[name].splice(index, 1);
        this.db[name].unshift(toUpdate);
        this.write();
    }
    async truncate() {
        const dir = process.cwd() + '/db.json';
        (0, fs_1.unlinkSync)(dir);
    }
}
exports.default = LowDriver;
