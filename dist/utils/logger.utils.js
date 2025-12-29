"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
/**
 * Custom log levels with associated severity
 */
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
/**
 * Color mapping for different log levels
 * @type {Object.<string, string>}
 */
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};
/**
 * Creates a custom log format for consistent logging
 * @type {winston.Logform.Format}
 */
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.printf((_a) => {
    var { timestamp, level, message } = _a, metadata = __rest(_a, ["timestamp", "level", "message"]);
    let msg = `${timestamp} [${level}]: ${message} `;
    const metaString = Object.keys(metadata).length
        ? JSON.stringify(metadata)
        : '';
    return msg + metaString;
}));
/**
 * Console transport for logging
 * @type {winston.transports.ConsoleTransportInstance}
 */
const consoleTransport = new winston_1.default.transports.Console({
    format: winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), logFormat),
    level: 'debug'
});
/**
 * Error log file transport with daily rotation
 * @type {DailyRotateFile}
 */
const errorFileTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(process.cwd(), 'logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d'
});
/**
 * HTTP log file transport with daily rotation
 * @type {DailyRotateFile}
 */
const httpFileTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(process.cwd(), 'logs', 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    maxSize: '20m',
    maxFiles: '14d'
});
/**
 * Combined log file transport with daily rotation
 * @type {DailyRotateFile}
 */
const combinedFileTransport = new winston_daily_rotate_file_1.default({
    filename: path_1.default.join(process.cwd(), 'logs', 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'info',
    maxSize: '20m',
    maxFiles: '30d'
});
/**
 * Create a comprehensive logger with multiple transports
 * @type {winston.Logger}
 */
const logger = winston_1.default.createLogger({
    levels: logLevels,
    format: logFormat,
    transports: [
        consoleTransport,
        errorFileTransport,
        httpFileTransport,
        combinedFileTransport
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'exceptions.log')
        })
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(process.cwd(), 'logs', 'rejections.log')
        })
    ],
    exitOnError: false
});
// Add colors to Winston
winston_1.default.addColors(logColors);
exports.default = logger;
