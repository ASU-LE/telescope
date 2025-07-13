"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const TypeORMWatcher_1 = require("../watchers/TypeORMWatcher");
const Telescope_1 = require("../Telescope");
class TypeORMLogger extends typeorm_1.AbstractLogger {
    eventEmitter;
    telescopeTable;
    constructor({ options = true, telescopeTable = 'telescopes' } = {
        options: true,
        telescopeTable: 'telescopes'
    }) {
        super(options);
        this.eventEmitter = Telescope_1.eventEmitter;
        this.telescopeTable = telescopeTable;
    }
    logQuery(query, parameters, queryRunner) {
        // If the query is from telescope, we don't want to log it
        if (query.includes(this.telescopeTable) || query === "COMMIT" || query === "ROLLBACK" || query === "BEGIN" || query === "START TRANSACTION") {
            return;
        }
        this.eventEmitter.emit('query', TypeORMWatcher_1.LogType.LOG, query, parameters);
    }
    logQuerySlow(time, query, parameters, queryRunner) {
        if (query.includes(this.telescopeTable) || query === "COMMIT" || query === "ROLLBACK" || query === "BEGIN" || query === "START TRANSACTION") {
            return;
        }
        this.eventEmitter.emit('query', TypeORMWatcher_1.LogType.QUERY_SLOW, query, parameters, time);
    }
    logQueryError(error, query, parameters, queryRunner) {
        if (query.includes(this.telescopeTable) || query === "COMMIT" || query === "ROLLBACK" || query === "BEGIN" || query === "START TRANSACTION") {
            return;
        }
        this.eventEmitter.emit('query', TypeORMWatcher_1.LogType.QUERY_ERROR, query, parameters, error);
    }
    /**
     * Write log to specific output.
     */
    writeLog(level, message, queryRunner) {
        // Do nothing since they are saving to the database
    }
}
exports.default = TypeORMLogger;
