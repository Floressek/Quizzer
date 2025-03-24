import winston from 'winston';
import path from 'path';
import chalk from 'chalk';
import {fileURLToPath} from 'url';
import {dirname} from 'path';
import 'server-only';

// Constants
const DEFAULT_LOG_LEVEL = 'debug';
const TIME_ZONE = 'Europe/Warsaw';
const DATE_FORMAT = 'en-GB';

// Set chalk level
chalk.level = 3;

// Types
type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

// Format date/time with timezone
const formatDateInTimeZone = (date: Date, timeZone: string): string => {
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
        timeZone: timeZone,
        hour12: false
    };
    return new Intl.DateTimeFormat(DATE_FORMAT, options).format(date);
};

// Format for file logging
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: () => formatDateInTimeZone(new Date(), TIME_ZONE)
    }),
    winston.format.errors({stack: true}),
    winston.format.splat(),
    winston.format.json()
);

// Get log file path
const getLogFilePath = (filename: string): string => {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    return path.join(__dirname, '..', '..', 'logs', filename);
};

// Create file transport
const fileTransport = (filename: string, level: LogLevel = 'debug') =>
    new winston.transports.File({
        filename: getLogFilePath(filename),
        level,
        format: logFormat
    });

// Format values for logging
const formatValue = (value: unknown): string => {
    if (value === undefined) {
        return 'undefined';
    }
    if (value === null) {
        return 'null';
    }
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value, null, 2);
        } catch (error) {
            return String(value);
        }
    }
    return String(value);
};

// Combine message and args
const combineMessageAndArgs = (message: unknown, args: unknown[]): string => {
    if (args.length === 0) {
        return formatValue(message);
    }
    const formattedMessage = formatValue(message);
    const formattedArgs = args.map(formatValue).join(' ');
    return `${formattedMessage} ${formattedArgs}`;
};

// Colors for different log levels
const levelColors = {
    info: chalk.hex('#00cc0a'),    // Bright teal
    warn: chalk.hex('#ffcc00'),    // Bright yellow
    error: chalk.hex('#ff3333'),   // Bright red
    debug: chalk.hex('#66ccff'),   // Bright blue
    http: chalk.hex('#33cc33'),    // Bright green
    verbose: chalk.hex('#cc99ff'), // Bright purple
    silly: chalk.hex('#999999')    // Gray
};

// Console format function
const consoleFormat = winston.format.printf(({level, message, timestamp}) => {
    // Get the appropriate color function
    const colorize = levelColors[level as keyof typeof levelColors] || chalk.white;

    // Format parts with colors
    const colorizedLevelText = colorize(level);
    const formattedLevel = `[${colorizedLevelText}]`;
    const colorizedTimestamp = chalk.gray(timestamp || '');

    // Format exactly as requested - timestamp, level, and message
    return `${colorizedTimestamp} ${formattedLevel} : ${message}`;
});

// Create console transport
const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
        consoleFormat
    )
});

// Create the base logger
const loggerCreate = winston.createLogger({
    level: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
    format: logFormat,
    transports: [
        fileTransport('combined.log'),
        fileTransport('error.log', 'error'),
        consoleTransport
    ]
});

// Logger interface
interface ServerLogger {
    error: (message: unknown, ...args: unknown[]) => void;
    warn: (message: unknown, ...args: unknown[]) => void;
    info: (message: unknown, ...args: unknown[]) => void;
    http: (message: unknown, ...args: unknown[]) => void;
    verbose: (message: unknown, ...args: unknown[]) => void;
    debug: (message: unknown, ...args: unknown[]) => void;
    silly: (message: unknown, ...args: unknown[]) => void;
}

// Create the wrapper logger
const wrapperLogger: ServerLogger = {} as ServerLogger;

(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'] as const).forEach(level => {
    wrapperLogger[level] = (message: unknown, ...args: unknown[]): void => {
        // Format the message with args
        const formattedMessage = combineMessageAndArgs(message, args);

        // Log directly without file or folder information
        loggerCreate[level](formattedMessage);
    };
});

export const logger = wrapperLogger;