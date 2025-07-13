import { AbstractLogger } from "typeorm";
import { LogType } from "../watchers/TypeORMWatcher";
import { eventEmitter } from "../Telescope";
export default class TypeORMLogger extends AbstractLogger {
    eventEmitter;
    telescopeTable;
    constructor({ options = true, telescopeTable = 'telescopes' } = {
        options: true,
        telescopeTable: 'telescopes'
    }) {
        super(options);
        this.eventEmitter = eventEmitter;
        this.telescopeTable = telescopeTable;
    }
    logQuery(query, parameters, queryRunner) {
        // If the query is from telescope, we don't want to log it
        if (query.includes(this.telescopeTable) || query === "COMMIT" || query === "ROLLBACK" || query === "BEGIN" || query === "START TRANSACTION") {
            return;
        }
        this.eventEmitter.emit('query', LogType.LOG, query, parameters);
    }
    logQuerySlow(time, query, parameters, queryRunner) {
        if (query.includes(this.telescopeTable) || query === "COMMIT" || query === "ROLLBACK" || query === "BEGIN" || query === "START TRANSACTION") {
            return;
        }
        this.eventEmitter.emit('query', LogType.QUERY_SLOW, query, parameters, time);
    }
    logQueryError(error, query, parameters, queryRunner) {
        if (query.includes(this.telescopeTable) || query === "COMMIT" || query === "ROLLBACK" || query === "BEGIN" || query === "START TRANSACTION") {
            return;
        }
        this.eventEmitter.emit('query', LogType.QUERY_ERROR, query, parameters, error);
    }
    /**
     * Write log to specific output.
     */
    writeLog(level, message, queryRunner) {
        // Do nothing since they are saving to the database
    }
}
