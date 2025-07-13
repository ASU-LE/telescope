"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MemoryDriver {
    db;
    constructor() {
        this.db = {
            requests: [],
            exceptions: [],
            dumps: [],
            logs: [],
            queries: [],
            "client-requests": [],
        };
    }
    async get(name) {
        return this.db[name] ?? [];
    }
    async find(name, id) {
        return this.db[name]?.find((entry) => entry.id === id);
    }
    async batch(batchId) {
        const batch = [];
        Object.keys(this.db).forEach((key) => {
            // @ts-ignore
            batch.push(this.db[key]);
        });
        return batch.flat().filter((entry) => entry.batchId === batchId);
    }
    async save(name, data) {
        this.db[name]?.unshift(data);
    }
    async update(name, index, toUpdate) {
        this.db[name].splice(index, 1);
        this.db[name]?.unshift(toUpdate);
    }
    async truncate() {
        this.db = {
            requests: [],
            exceptions: [],
            dumps: [],
            logs: [],
            queries: [],
            "client-requests": [],
        };
    }
}
exports.default = MemoryDriver;
