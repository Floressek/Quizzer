import winston from 'winston';
import path from 'path';
import chalk from 'chalk';
import {fileURLToPath} from 'url';
import {dirname} from 'path';

// Constants
const DEFAULT_LOG_LEVEL = 'debug';
const TIME_ZONE = 'Europe/Warsaw';
const DATE_FORMAT = 'en-GB';

// Set chalk level
chalk.level = 3;

// Types
type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';

interface CallerInfo {
    filePath: string;
    line: string;
    column: string;
    webstormFormat: string;
    fullPath: string;
}

interface LogInfo extends winston.Logform.TransformableInfo {
    label?: string;
    filename?: string;
    lineInfo?: CallerInfo | null;
}

/*
Main logger helper function.
It works by creating a new Error object and capturing the stack trace. Then it searches for the first line
that is not from the logger and is not an internal node call. It returns the file path and the caller info.
Is used to get the file path and line number of the caller.
 */
const getCallerInfo = (): { filePath: string, callerInfo: CallerInfo | null } => {
    const error: Error & { stack?: string } = {message: "", name: ""};
    Error.captureStackTrace(error);

    // Szukamy pierwszej linii, która nie pochodzi z loggera i nie jest wewnętrznym wywołaniem node
    const stackLines = error.stack?.split('\n') || [];
    let callerLine = null;
    let callerFile = null;

    for (const line of stackLines) {
        // Pomijamy linie związane z loggerem i wewnętrznymi modułami
        if (!line.includes('logger.ts') &&
            !line.includes('node:internal/') &&
            !line.includes('node_modules/') &&
            line.includes('.ts')) {
            callerLine = line;
            callerFile = line;
            break;
        }
    }

    if (!callerLine || !callerFile) {
        return {filePath: '', callerInfo: null};
    }

    const fileMatch = callerFile.match(/at.*\((.*):[\d]+:[\d]+\)$|at\s+(.*):[\d]+:[\d]+$/);
    const match = callerLine.match(/.*\((.*):(\d+):(\d+)\)$|at\s+(.*):(\d+):(\d+)$/);

    const filePath = fileMatch ? (fileMatch[1] || fileMatch[2]) : '';

    if (match) {
        const path = match[1] || match[4];
        const line = match[2] || match[5];
        const column = match[3] || match[6];

        return {
            filePath,
            callerInfo: {
                filePath: path,
                line,
                column,
                webstormFormat: `${path}:${line}:${column}`,
                fullPath: `${path}:${line}:${column}`
            }
        };
    }
    return {filePath, callerInfo: null};
};

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

const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: () => formatDateInTimeZone(new Date(), TIME_ZONE)
    }),
    winston.format.errors({stack: true}),
    winston.format.splat(),
    winston.format.json()
);

const getLogFilePath = (filename: string): string => {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    return path.join(__dirname, '..', '..', 'logs', filename);
}

const fileTransport = (filename: string, level: LogLevel = 'debug') =>
    new winston.transports.File({
        filename: getLogFilePath(filename),
        level,
        format: logFormat
    });

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
            return value.toString();
        }
    }
    return value.toString();
};

const combineMessageAndArgs = (message: unknown, args: unknown[]): string => {
    if (args.length === 0) {
        return formatValue(message);
    }
    const formattedMessage = formatValue(message);
    const formattedArgs = args.map(formatValue).join(' ');
    return `${formattedMessage} ${formattedArgs}`;
};

const levelColors = new Map([
    ['info', chalk.green],
    ['warn', chalk.yellow],
    ['error', chalk.red],
    ['debug', chalk.blue],
    ['http', chalk.cyan],
    ['verbose', chalk.magenta],
    ['silly', chalk.grey]
]);

const consoleFormat = winston.format.printf(({level, message, timestamp, label, filename, lineInfo}: LogInfo) => {
    const colorize = levelColors.get(level) || chalk.white;
    const colorizedLevel = colorize(level);

    const colorizedTimestamp = chalk.gray(timestamp);
    const colorizedLabel = chalk.hex('#FFA500')(label);
    const colorizedFilename = chalk.hex('#00CED1')(`[${filename}${lineInfo ? ':' + lineInfo.line : ''}]`);

    return `${colorizedTimestamp} [${colorizedLevel}] [${colorizedLabel}] ${colorizedFilename}: ${message}`;
});

const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        consoleFormat
    )
});

const loggerCreate = winston.createLogger({
    level: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
    format: logFormat,
    transports: [
        fileTransport('combined.log'),
        fileTransport('error.log', 'error'),
        consoleTransport
    ]
});

interface Logger {
    error: (message: unknown, ...args: unknown[]) => void;
    warn: (message: unknown, ...args: unknown[]) => void;
    info: (message: unknown, ...args: unknown[]) => void;
    http: (message: unknown, ...args: unknown[]) => void;
    verbose: (message: unknown, ...args: unknown[]) => void;
    debug: (message: unknown, ...args: unknown[]) => void;
    silly: (message: unknown, ...args: unknown[]) => void;
}


const wrapperLogger: Logger = {} as Logger;

(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'] as const).forEach(level => {
    wrapperLogger[level] = (message: unknown, ...args: unknown[]): void => {
        const {filePath, callerInfo} = getCallerInfo();
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const projectRoot = path.resolve(__dirname, '..', '..'); // Get the project root directory
        const relativePath = path.relative(projectRoot, filePath);
        const folderStructure = path.dirname(relativePath).replace(/\\/g, '/');
        const filename = path.basename(filePath); // Get the filename from helper function

        const childLogger = loggerCreate.child({
            label: folderStructure,
            filename: filename
        });

        const formattedMessage = combineMessageAndArgs(message, args);
        childLogger[level](formattedMessage, {lineInfo: callerInfo}); // Pass caller info to the logger
    };
});

export const logger = wrapperLogger;