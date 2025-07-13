import { TextFileSync } from "./TextFileSync.js";
export default class JSONFileSyncAdapter {
    #adapter;
    constructor(filename) {
        this.#adapter = new TextFileSync(filename);
    }
    static getRefReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return '[Circular]';
                }
                seen.add(value);
            }
            return value;
        };
    };
    read() {
        const data = this.#adapter.read();
        if (data === null) {
            return null;
        }
        else {
            return JSON.parse(data);
        }
    }
    write(obj) {
        this.#adapter.write(JSON.stringify(obj, JSONFileSyncAdapter.getRefReplacer(), 2));
    }
}
