// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Tests for type definitions and branded types
 */
import { describe, expect, it } from 'vitest';
import { createFilePath, FusionError } from '../src/types.js';
import type { FilePath, FusionErrorCode, FusionErrorSeverity } from '../src/types.js';

describe('Branded Types', () => {
    describe('createFilePath', () => {
        it('should create a valid FilePath from a string', () => {
            const path = createFilePath('/valid/path/to/file.txt');
            expect(path).toBe('/valid/path/to/file.txt');
            expect(typeof path).toBe('string');
        });
        
        it('should throw FusionError for invalid inputs', () => {
            expect(() => createFilePath('')).toThrow(FusionError);
            expect(() => createFilePath('')).toThrow('Invalid file path provided');
            
            // @ts-expect-error Testing invalid input
            expect(() => createFilePath(null)).toThrow(FusionError);
            
            // @ts-expect-error Testing invalid input
            expect(() => createFilePath(undefined)).toThrow(FusionError);
            
            // @ts-expect-error Testing invalid input
            expect(() => createFilePath(123)).toThrow(FusionError);
        });
        
        it('should handle paths with special characters', () => {
            const specialPaths = [
                '/path with spaces/file.txt',
                '/path-with-dashes/file.txt',
                '/path_with_underscores/file.txt',
                '/path/with/unicode/文件.txt',
                'C:\\Windows\\System32\\file.txt',
                './relative/path/file.txt',
                '../parent/path/file.txt'
            ];
            
            for (const p of specialPaths) {
                const filePath = createFilePath(p);
                expect(filePath).toBe(p);
            }
        });
        
        it('should maintain type safety', () => {
            const path = createFilePath('/test/path.txt');
            
            // This should satisfy the FilePath type
            const acceptsFilePath = (fp: FilePath): string => fp;
            expect(acceptsFilePath(path)).toBe('/test/path.txt');
        });
    });
});

describe('FusionError', () => {
    describe('constructor', () => {
        it('should create error with required parameters', () => {
            const error = new FusionError('Test error', 'INVALID_PATH');
            
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(FusionError);
            expect(error.message).toBe('Test error');
            expect(error.code).toBe('INVALID_PATH');
            expect(error.severity).toBe('error'); // Default severity
            expect(error.name).toBe('FusionError');
            expect(error.context).toBeUndefined();
        });
        
        it('should accept custom severity', () => {
            const errorSeverity = new FusionError('Error', 'INVALID_PATH', 'error');
            const warningSeverity = new FusionError('Warning', 'UNKNOWN_EXTENSION_GROUP', 'warning');
            const infoSeverity = new FusionError('Info', 'INVALID_PATH', 'info');
            
            expect(errorSeverity.severity).toBe('error');
            expect(warningSeverity.severity).toBe('warning');
            expect(infoSeverity.severity).toBe('info');
        });
        
        it('should accept context object', () => {
            const context = {
                path: '/test/file.txt',
                line: 42,
                details: 'Additional information'
            };
            
            const error = new FusionError(
                'Error with context',
                'INVALID_PATH',
                'error',
                context
            );
            
            expect(error.context).toEqual(context);
        });
        
        it('should have proper stack trace', () => {
            const error = new FusionError('Stack test', 'INVALID_PATH');
            
            expect(error.stack).toBeDefined();
            expect(error.stack).toContain('FusionError: Stack test');
            expect(error.stack).toContain('types.test.ts');
        });
    });
    
    describe('Error Codes', () => {
        it('should only accept valid error codes', () => {
            const validCodes: FusionErrorCode[] = [
                'INVALID_PATH',
                'UNKNOWN_EXTENSION_GROUP'
            ];
            
            for (const code of validCodes) {
                const error = new FusionError('Test', code);
                expect(error.code).toBe(code);
            }
        });
        
        it('should maintain type safety for error codes', () => {
            // This should compile
            const error1 = new FusionError('Test', 'INVALID_PATH');
            const error2 = new FusionError('Test', 'UNKNOWN_EXTENSION_GROUP');
            
            expect(error1.code).toBe('INVALID_PATH');
            expect(error2.code).toBe('UNKNOWN_EXTENSION_GROUP');
            
            // TypeScript should prevent invalid codes at compile time
            // @ts-expect-error Invalid error code
            const invalidError = new FusionError('Test', 'INVALID_CODE');
        });
    });
    
    describe('Error Severity', () => {
        it('should only accept valid severity levels', () => {
            const validSeverities: FusionErrorSeverity[] = [
                'error',
                'warning',
                'info'
            ];
            
            for (const severity of validSeverities) {
                const error = new FusionError('Test', 'INVALID_PATH', severity);
                expect(error.severity).toBe(severity);
            }
        });
        
        it('should maintain type safety for severity', () => {
            // Valid severities
            const error1 = new FusionError('Test', 'INVALID_PATH', 'error');
            const error2 = new FusionError('Test', 'INVALID_PATH', 'warning');
            const error3 = new FusionError('Test', 'INVALID_PATH', 'info');
            
            expect(error1.severity).toBe('error');
            expect(error2.severity).toBe('warning');
            expect(error3.severity).toBe('info');
            
            // TypeScript should prevent invalid severity at compile time
            // @ts-expect-error Invalid severity
            const invalidError = new FusionError('Test', 'INVALID_PATH', 'critical');
        });
    });
    
    describe('Error Usage Patterns', () => {
        it('should be catchable as FusionError', () => {
            try {
                throw new FusionError('Catchable error', 'INVALID_PATH');
            } catch (error) {
                expect(error).toBeInstanceOf(FusionError);
                if (error instanceof FusionError) {
                    expect(error.code).toBe('INVALID_PATH');
                    expect(error.severity).toBe('error');
                }
            }
        });
        
        it('should be catchable as generic Error', () => {
            try {
                throw new FusionError('Generic error', 'UNKNOWN_EXTENSION_GROUP');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                if (error instanceof Error) {
                    expect(error.message).toBe('Generic error');
                }
            }
        });
        
        it('should support error chaining with context', () => {
            const originalError = new Error('Original error');
            
            const fusionError = new FusionError(
                `Wrapped error: ${  originalError.message}`,
                'INVALID_PATH',
                'error',
                { originalError: originalError.message, timestamp: Date.now() }
            );
            
            expect(fusionError.message).toContain('Original error');
            expect(fusionError.context).toHaveProperty('originalError');
            expect(fusionError.context?.originalError).toBe('Original error');
        });
        
        it('should be serializable', () => {
            const error = new FusionError(
                'Serializable error',
                'INVALID_PATH',
                'warning',
                { data: 'test' }
            );
            
            const serialized = JSON.stringify({
                message: error.message,
                code: error.code,
                severity: error.severity,
                context: error.context
            });
            
            const deserialized = JSON.parse(serialized);
            
            expect(deserialized.message).toBe('Serializable error');
            expect(deserialized.code).toBe('INVALID_PATH');
            expect(deserialized.severity).toBe('warning');
            expect(deserialized.context).toEqual({ data: 'test' });
        });
    });
    
    describe('Integration with createFilePath', () => {
        it('should throw FusionError with correct code', () => {
            try {
                createFilePath('');
            } catch (error) {
                expect(error).toBeInstanceOf(FusionError);
                if (error instanceof FusionError) {
                    expect(error.code).toBe('INVALID_PATH');
                    expect(error.severity).toBe('error');
                    expect(error.message).toBe('Invalid file path provided');
                }
            }
        });
    });
});