// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Centralized logger for Project Fusion
 * Provides structured logging with severity levels to replace scattered console.error calls
 */
import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: Date;
    context?: Record<string, unknown>;
    pluginName?: string;
}

export interface LoggerOptions {
    minLevel?: LogLevel;
    enableConsole?: boolean;
    enableTimestamp?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

const LOG_COLORS: Record<LogLevel, string> = {
    debug: '\u001B[36m', // Cyan
    info: '\u001B[32m',  // Green
    warn: '\u001B[33m',  // Yellow
    error: '\u001B[31m'  // Red
};

const RESET_COLOR = '\u001B[0m';

export class Logger {
    private readonly options: Required<LoggerOptions>;
    private readonly logs: LogEntry[] = [];

    constructor(options: LoggerOptions = {}) {
        this.options = {
            minLevel: options.minLevel ?? 'info',
            enableConsole: options.enableConsole ?? true,
            enableTimestamp: options.enableTimestamp ?? true
        };
    }

    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.options.minLevel];
    }

    private formatMessage(entry: LogEntry): string {
        const parts: string[] = [];
        
        if (this.options.enableTimestamp) {
            parts.push(`[${entry.timestamp.toISOString()}]`);
        }
        
        const levelStr = `[${entry.level.toUpperCase()}]`;
        parts.push(this.options.enableConsole ? 
            `${LOG_COLORS[entry.level]}${levelStr}${RESET_COLOR}` : 
            levelStr
        );
        
        if (entry.pluginName) {
            parts.push(`[${entry.pluginName}]`);
        }
        
        parts.push(entry.message);
        
        if (entry.context && Object.keys(entry.context).length > 0) {
            parts.push(JSON.stringify(entry.context));
        }
        
        return parts.join(' ');
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>, pluginName?: string): void {
        if (!this.shouldLog(level)) {
            return;
        }

        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date(),
            ...(context && { context }),
            ...(pluginName && { pluginName })
        };

        this.logs.push(entry);

        if (this.options.enableConsole) {
            const formattedMessage = this.formatMessage(entry);
            
            switch (level) {
                case 'debug':
                    console.debug(formattedMessage);
                    break;
                case 'info':
                    console.info(formattedMessage);
                    break;
                case 'warn':
                    console.warn(formattedMessage);
                    break;
                case 'error':
                    console.error(formattedMessage);
                    break;
            }
        }
    }

    debug(message: string, context?: Record<string, unknown>, pluginName?: string): void {
        this.log('debug', message, context, pluginName);
    }

    info(message: string, context?: Record<string, unknown>, pluginName?: string): void {
        this.log('info', message, context, pluginName);
    }

    warn(message: string, context?: Record<string, unknown>, pluginName?: string): void {
        this.log('warn', message, context, pluginName);
    }

    error(message: string, context?: Record<string, unknown>, pluginName?: string): void {
        this.log('error', message, context, pluginName);
    }

    // Plugin-specific logging methods
    pluginError(pluginName: string, message: string, error?: unknown, context?: Record<string, unknown>): void {
        const errorContext = {
            ...context,
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : error
        };
        
        this.error(message, errorContext, pluginName);
    }

    pluginWarn(pluginName: string, message: string, context?: Record<string, unknown>): void {
        this.warn(message, context, pluginName);
    }

    pluginInfo(pluginName: string, message: string, context?: Record<string, unknown>): void {
        this.info(message, context, pluginName);
    }

    // Get logs for analysis or export
    getLogs(level?: LogLevel): LogEntry[] {
        if (!level) {
            return [...this.logs];
        }
        
        return this.logs.filter(entry => entry.level === level);
    }

    // Clear logs
    clearLogs(): void {
        this.logs.length = 0;
    }

    // Get log count by level
    getLogCounts(): Record<LogLevel, number> {
        return this.logs.reduce((counts, entry) => {
            counts[entry.level]++;
            return counts;
        }, {
            debug: 0,
            info: 0,
            warn: 0,
            error: 0
        });
    }

    // Simple console methods with colors
    consoleInfo(message: string): void {
        console.log(chalk.blue(message));
    }

    consoleSuccess(message: string): void {
        console.log(chalk.green(message));
    }

    consoleWarning(message: string): void {
        console.log(chalk.yellow(message));
    }

    consoleError(message: string): void {
        console.log(chalk.red(message));
    }

    consoleSecondary(message: string): void {
        console.log(chalk.cyan(message));
    }

    consoleMuted(message: string): void {
        console.log(chalk.gray(message));
    }
}

// Global logger instance
export const logger = new Logger();

// Convenience function to create plugin-scoped loggers
export function createPluginLogger(pluginName: string): {
    debug: (message: string, context?: Record<string, unknown>) => void;
    info: (message: string, context?: Record<string, unknown>) => void;
    warn: (message: string, context?: Record<string, unknown>) => void;
    error: (message: string, error?: unknown, context?: Record<string, unknown>) => void;
} {
    return {
        debug: (message: string, context?: Record<string, unknown>): void => 
            logger.debug(message, context, pluginName),
        info: (message: string, context?: Record<string, unknown>): void => 
            logger.pluginInfo(pluginName, message, context),
        warn: (message: string, context?: Record<string, unknown>): void => 
            logger.pluginWarn(pluginName, message, context),
        error: (message: string, error?: unknown, context?: Record<string, unknown>): void => 
            logger.pluginError(pluginName, message, error, context)
    };
}