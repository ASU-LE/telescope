import {AbstractLogger, LogLevel, LogMessage, QueryRunner} from "typeorm"
import {LogType} from "../watchers/TypeORMWatcher.js";
import {eventEmitter} from "../Telescope.js";
import EventEmitter from "node:events";
import {LoggerOptions} from "typeorm/logger/LoggerOptions";

type TypeORMLoggerOptions = {
    options?: LoggerOptions,
    telescopeTable?: string
}

export default class TypeORMLogger extends AbstractLogger {

    private eventEmitter: EventEmitter;
    private telescopeTable: string;

    constructor({
                    options = true,
                    telescopeTable = 'telescopes'
                }: TypeORMLoggerOptions = {
        options: true,
        telescopeTable: 'telescopes'
    }) {
        super(options);
        this.eventEmitter = eventEmitter
        this.telescopeTable = telescopeTable;
    }

    public logQuery(query: string, parameters?: any[], queryRunner?: any): void {
        // If the query is from telescope, we don't want to log it
        if (query.includes(this.telescopeTable) || query === "COMMIT" || query === "ROLLBACK" || query === "BEGIN" || query === "START TRANSACTION") {
            return;
        }
        this.eventEmitter.emit('query', LogType.LOG, query, parameters);
    }

    public logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: any): void {
        if (query.includes(this.telescopeTable) || query === "COMMIT" || query === "ROLLBACK" || query === "BEGIN" || query === "START TRANSACTION") {
            return;
        }
        this.eventEmitter.emit('query', LogType.QUERY_SLOW, query, parameters, time);
    }

    public logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if (query.includes(this.telescopeTable) || query === "COMMIT" || query === "ROLLBACK" || query === "BEGIN" || query === "START TRANSACTION") {
            return;
        }
        this.eventEmitter.emit('query', LogType.QUERY_ERROR, query, parameters, error);
    }

    /**
     * Write log to specific output.
     */
    public writeLog(level: LogLevel, message: LogMessage | string | number | (LogMessage | string | number)[], queryRunner?: QueryRunner) {
        // Do nothing since they are saving to the database
    }
}