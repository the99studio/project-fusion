import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Logger, createPluginLogger } from '../src/utils/logger.js';

describe('Logger', () => {
    let logger: Logger;
    
    beforeEach(() => {
        logger = new Logger();
        vi.clearAllMocks();
    });

    describe('console methods', () => {
        beforeEach(() => {
            vi.spyOn(console, 'log').mockImplementation(() => {});
        });

        it('should call consoleInfo with blue color', () => {
            logger.consoleInfo('test message');
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test message'));
        });

        it('should call consoleSuccess with green color', () => {
            logger.consoleSuccess('test message');
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test message'));
        });

        it('should call consoleWarning with yellow color', () => {
            logger.consoleWarning('test message');
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test message'));
        });

        it('should call consoleError with red color', () => {
            logger.consoleError('test message');
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test message'));
        });

        it('should call consoleSecondary with cyan color', () => {
            logger.consoleSecondary('test message');
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test message'));
        });

        it('should call consoleMuted with gray color', () => {
            logger.consoleMuted('test message');
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test message'));
        });
    });

    describe('createPluginLogger', () => {
        it('should create plugin logger with scoped methods', () => {
            const pluginLogger = createPluginLogger('test-plugin');
            
            expect(typeof pluginLogger.debug).toBe('function');
            expect(typeof pluginLogger.info).toBe('function');
            expect(typeof pluginLogger.warn).toBe('function');
            expect(typeof pluginLogger.error).toBe('function');
        });

        it('should use plugin-scoped logging methods', () => {
            vi.spyOn(console, 'info').mockImplementation(() => {});
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            vi.spyOn(console, 'error').mockImplementation(() => {});
            
            const pluginLogger = createPluginLogger('test-plugin');
            
            pluginLogger.info('info message');
            pluginLogger.warn('warn message');
            pluginLogger.error('error message', new Error('test error'));
            
            expect(console.info).toHaveBeenCalled();
            expect(console.warn).toHaveBeenCalled();
            expect(console.error).toHaveBeenCalled();
        });
    });
});