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
const fs_1 = __importDefault(require("fs"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.printf((_a) => {
    var { timestamp, level, message } = _a, metadata = __rest(_a, ["timestamp", "level", "message"]);
    let msg = `${timestamp} [${level}]: ${message} `;
    const metaString = Object.keys(metadata).length
        ? JSON.stringify(metadata)
        : '';
    return msg + metaString;
}));
const consoleTransport = new winston_1.default.transports.Console({
    format: winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), logFormat),
    level: 'debug'
});
// Only add file transports if the logs directory is writable
const getFileTransports = () => {
    const logsDir = path_1.default.join(process.cwd(), 'logs');
    try {
        if (!fs_1.default.existsSync(logsDir)) {
            fs_1.default.mkdirSync(logsDir, { recursive: true });
        }
        // Test write access
        fs_1.default.accessSync(logsDir, fs_1.default.constants.W_OK);
    }
    catch (_a) {
        console.warn('Logger: logs/ directory is not writable, using console-only logging');
        return [];
    }
    return [
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d'
        }),
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, 'http-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'http',
            maxSize: '20m',
            maxFiles: '14d'
        }),
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'info',
            maxSize: '20m',
            maxFiles: '30d'
        }),
    ];
};
const logger = winston_1.default.createLogger({
    levels: logLevels,
    format: logFormat,
    transports: [consoleTransport, ...getFileTransports()],
    exitOnError: false
});
winston_1.default.addColors(logColors);
exports.default = logger;
