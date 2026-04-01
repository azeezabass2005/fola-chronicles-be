import winston from 'winston';
import path from 'path';
import fs from 'fs';
import DailyRotateFile from 'winston-daily-rotate-file';

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

const logColors: { [s: string]: string } = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

const logFormat: winston.Logform.Format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message} `;
        const metaString = Object.keys(metadata).length
            ? JSON.stringify(metadata)
            : '';
        return msg + metaString;
    })
);

const consoleTransport: winston.transports.ConsoleTransportInstance = new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize({ all: true }),
        logFormat
    ),
    level: 'debug'
});

// Only add file transports if the logs directory is writable
const getFileTransports = (): winston.transport[] => {
    const logsDir = path.join(process.cwd(), 'logs');

    try {
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        // Test write access
        fs.accessSync(logsDir, fs.constants.W_OK);
    } catch {
        console.warn('Logger: logs/ directory is not writable, using console-only logging');
        return [];
    }

    return [
        new DailyRotateFile({
            filename: path.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d'
        }),
        new DailyRotateFile({
            filename: path.join(logsDir, 'http-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'http',
            maxSize: '20m',
            maxFiles: '14d'
        }),
        new DailyRotateFile({
            filename: path.join(logsDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'info',
            maxSize: '20m',
            maxFiles: '30d'
        }),
    ];
};

const logger: winston.Logger = winston.createLogger({
    levels: logLevels,
    format: logFormat,
    transports: [consoleTransport, ...getFileTransports()],
    exitOnError: false
});

winston.addColors(logColors);

export default logger;
