import { unlinkSync } from "fs";
import JSONFileSyncAdapter from "./JSONFileSyncAdapter.js";
export default class LowDriver {
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
        this.adapter = new JSONFileSyncAdapter('db.json');
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
        unlinkSync(dir);
    }
}
