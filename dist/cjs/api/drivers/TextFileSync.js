"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextFileSync = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class TextFileSync {
    #tempFilename;
    #filename;
    constructor(filename) {
        this.#filename = filename;
        this.#tempFilename = path_1.default.join(path_1.default.dirname(filename), `.${path_1.default.basename(filename)}.tmp`);
    }
    read() {
        let data;
        try {
            data = fs_1.default.readFileSync(this.#filename, 'utf-8');
        }
        catch (e) {
            if (e.code === 'ENOENT') {
                return null;
            }
            throw e;
        }
        return data;
    }
    write(str) {
        fs_1.default.writeFileSync(this.#tempFilename, str);
        fs_1.default.renameSync(this.#tempFilename, this.#filename);
    }
}
exports.TextFileSync = TextFileSync;
