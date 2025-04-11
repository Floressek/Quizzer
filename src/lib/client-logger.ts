/**
 * Enhanced client-side logger for browser environments
 * Provides similar functionality to Winston but works in the browser
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface Logger {
    error: (message: unknown, ...args: unknown[]) => void;
    warn: (message: unknown, ...args: unknown[]) => void;
    info: (message: unknown, ...args: unknown[]) => void;
    debug: (message: unknown, ...args: unknown[]) => void;
    trace: (message: unknown, ...args: unknown[]) => void;
    group: (label?: string) => void;
    groupEnd: () => void;
    // Allow getting/setting the log level
    setLevel: (level: LogLevel) => void;
    getLevel: () => LogLevel;
}

// Log levels priority (higher number = higher priority)
const LOG_LEVELS: Record<LogLevel, number> = {
    error: 5,
    warn: 4,
    info: 3,
    debug: 2,
    trace: 1
};

// Default log level can be overridden
const getInitialLogLevel = (): LogLevel => {
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    return isDev ? 'debug' : 'info';
};

// Format timestamps in a nice, readable way
const getTimestamp = (): string => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
    });
};

// Advanced value formatter with circular reference handling
const formatValue = (val: unknown, depth = 0): string => {
    const MAX_DEPTH = 3; // Prevent infinite recursion

    if (val === undefined) return 'undefined';
    if (val === null) return 'null';

    if (depth > MAX_DEPTH) return '[Object nested too deep]';

    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack || ''}`;
    }

    if (Array.isArray(val)) {
        if (val.length === 0) return '[]';
        try {
            return JSON.stringify(val, null, 2);
        } catch (err) {
            return `[Array(${val.length})]`;
        }
    }

    if (typeof val === 'object') {
        try {
            return JSON.stringify(val, (key, value) => {
                if (key === '' || depth < MAX_DEPTH) {
                    return value;
                }
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    return '[Object]';
                }
                return value;
            }, 2);
        } catch (err) {
            return Object.prototype.toString.call(val);
        }
    }

    return String(val);
};

// Combine message and args into a single formatted string
const formatMessage = (message: unknown, args: unknown[]): string => {
    const formattedMessage = formatValue(message);
    const formattedArgs = args.map(arg => formatValue(arg, 1)).join(' ');
    return args.length > 0 ? `${formattedMessage} ${formattedArgs}` : formattedMessage;
};

// Try to get caller information when possible
const getCallerInfo = (): string => {
    try {
        const err = new Error();
        const stack = err.stack?.split('\n');
        if (!stack || stack.length < 4) return '';

        // Skip the first frames which are this function and the logger methods
        const callerLine = stack[3];

        // Extract function name or method information without file path
        const match = callerLine.match(/at\s+(\w+|\w+\.\w+)\s+/) ||
            callerLine.match(/at\s+(.+?)\s+\(/) ||
            callerLine.match(/at\s+(.+?):/);

        if (match && match[1]) {
            return match[1];
        }

        return '';
    } catch (err) {
        return ''; // Fallback if something goes wrong
    }
};

// Create console styling utilities
const createLoggerWithStyling = () => {
    // Base logger
    let currentLogLevel: LogLevel = getInitialLogLevel();

    // Check if we should log this level
    const shouldLog = (level: LogLevel): boolean => {
        return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
    };

    const logger: Logger = {
        error: (message: unknown, ...args: unknown[]) => {
            if (!shouldLog('error')) return;
            const timestamp = getTimestamp();
            const caller = getCallerInfo();
            const callerInfo = caller ? ` [${caller}]` : '';
            console.error(
                `%c${timestamp}%c [ERROR]${callerInfo}: ${formatMessage(message, args)}`,
                'color: gray', 'color: #ff3333; font-weight: bold'
            );
        },

        warn: (message: unknown, ...args: unknown[]) => {
            if (!shouldLog('warn')) return;
            const timestamp = getTimestamp();
            const caller = getCallerInfo();
            const callerInfo = caller ? ` [${caller}]` : '';
            console.warn(
                `%c${timestamp}%c [WARN]${callerInfo}: ${formatMessage(message, args)}`,
                'color: gray', 'color: #ffcc00; font-weight: bold'
            );
        },

        info: (message: unknown, ...args: unknown[]) => {
            if (!shouldLog('info')) return;
            const timestamp = getTimestamp();
            const caller = getCallerInfo();
            const callerInfo = caller ? ` [${caller}]` : '';
            console.info(
                `%c${timestamp}%c [INFO]${callerInfo}: ${formatMessage(message, args)}`,
                'color: gray', 'color: #00cc99; font-weight: bold'
            );
        },

        debug: (message: unknown, ...args: unknown[]) => {
            if (!shouldLog('debug')) return;
            const timestamp = getTimestamp();
            const caller = getCallerInfo();
            const callerInfo = caller ? ` [${caller}]` : '';
            console.debug(
                `%c${timestamp}%c [DEBUG]${callerInfo}: ${formatMessage(message, args)}`,
                'color: gray', 'color: #66ccff; font-weight: bold'
            );
        },

        trace: (message: unknown, ...args: unknown[]) => {
            if (!shouldLog('trace')) return;
            const timestamp = getTimestamp();
            const caller = getCallerInfo();
            const callerInfo = caller ? ` [${caller}]` : '';
            console.debug(
                `%c${timestamp}%c [TRACE]${callerInfo}: ${formatMessage(message, args)}`,
                'color: gray', 'color: #cc99ff; font-weight: bold'
            );
            console.trace(); // Output stack trace
        },

        group: (label?: string) => {
            console.group(label);
        },

        groupEnd: () => {
            console.groupEnd();
        },

        setLevel: (level: LogLevel) => {
            currentLogLevel = level;
            logger.info(`Log level set to: ${level}`);
        },

        getLevel: () => currentLogLevel
    };

    return logger;
};

// Export the enhanced logger instance
export const logger = createLoggerWithStyling();
