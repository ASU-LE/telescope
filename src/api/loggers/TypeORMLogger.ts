import {AbstractLogger, LogLevel, LogMessage, QueryRunner} from "typeorm"
import {LogType} from "../watchers/TypeORMWatcher";
import {eventEmitter} from "../Telescope";
import EventEmitter from "node:events";
import {LoggerOptions} from "typeorm/logger/LoggerOptions";

type TypeORMLoggerOptions = {
    options?: LoggerOptions,
    telescopeTables?: string|string[]
}

export default class TypeORMLogger extends AbstractLogger {

    private eventEmitter: EventEmitter;
    private telescopeTables: string|string[];

    constructor({
                    options = true,
                    telescopeTables = 'telescopes'
                }: TypeORMLoggerOptions = {
        options: true,
        telescopeTables: 'telescopes'
    }) {
        super(options);
        this.eventEmitter = eventEmitter
        this.telescopeTables = telescopeTables;
    }

    public logQuery(query: string, parameters?: any[], queryRunner?: any): void {
        if(this.shouldLog(query)) {
            this.eventEmitter.emit('query', LogType.LOG, query, parameters);
        }
    }

    public logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: any): void {
        if(this.shouldLog(query)) {
            this.eventEmitter.emit('query', LogType.QUERY_SLOW, query, parameters, time);
        }
    }

    public logQueryError(error: string, query: string, parameters?: any[], queryRunner?: QueryRunner) {
        if(this.shouldLog(query)) {
            this.eventEmitter.emit('query', LogType.QUERY_ERROR, query, parameters, error);
        }
    }

    /**
     * Write log to specific output.
     */
    public writeLog(level: LogLevel, message: LogMessage | string | number | (LogMessage | string | number)[], queryRunner?: QueryRunner) {
        // Do nothing since they are saving to the database
    }

    private shouldLog(query: string): boolean {
        if(Array.isArray(this.telescopeTables)) {
            for(const table of this.telescopeTables) {
                if (query.includes(table)) {
                    return false;
                }
            }
        }
        if(typeof this.telescopeTables === 'string' && this.telescopeTables.indexOf(',') !== -1) {
            const tables = this.telescopeTables.split(',').map(t => t.trim());
            for(const table of tables) {
                if (query.includes(table)) {
                    return false;
                }
            }
            return !(query.includes(this.telescopeTables) || query === "COMMIT" || query === "ROLLBACK" || query === "BEGIN" || query === "START TRANSACTION");
        }
        return !(query.includes(this.telescopeTables as string) || query === "COMMIT" || query === "ROLLBACK" || query === "BEGIN" || query === "START TRANSACTION");
    }
}