// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Advanced path traversal tests for the new path.relative validation
 */
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { FusionError } from '../src/types.js';
import { validateSecurePath } from '../src/utils.js';
import { isWindows } from './test-helpers.js';

describe('Path Traversal Edge Cases', () => {
    describe('Windows Path Prefix Collision', () => {
        // These tests validate the fix for Windows path prefix collision cases
        it('should prevent C:\\foo vs C:\\foobar confusion', () => {
            if (isWindows()) {
                // Real Windows test
                const mockRoot = 'C:\\foo';
                const maliciousPath = 'C:\\foobar\\evil.txt';
                
                expect(() => validateSecurePath(maliciousPath, mockRoot)).toThrow(FusionError);
            } else {
                // Test Unix-style equivalent paths
                const mockRoot = '/foo';
                const maliciousPath = '/foobar/evil.txt';
                
                expect(() => validateSecurePath(maliciousPath, mockRoot)).toThrow(FusionError);
                
                // Also test with the logic directly
                const rel = path.relative(mockRoot, path.resolve(maliciousPath));
                expect(rel.startsWith('..')).toBe(true);
            }
        });

        it('should handle case-insensitive filesystem confusion', () => {
            // On Windows, paths are case-insensitive so these may not throw
            // On Unix systems, they should throw due to path traversal
            const isWindows = process.platform === 'win32';
            const root = isWindows ? 'C:\\Users\\test' : '/Users/test';
            
            const variations = isWindows ? [
                'C:\\users\\test\\..\\secrets.txt', // Different case
                'C:\\Users\\Test\\..\\secrets.txt', // Different case  
                'C:\\Users\\test\\..\\Test\\secrets.txt' // Case variation in escape
            ] : [
                '/users/test/../secrets.txt', // Different case
                '/Users/Test/../secrets.txt', // Different case
                '/Users/test/../Test/secrets.txt' // Case variation in escape
            ];

            for (const maliciousPath of variations) {
                try {
                    validateSecurePath(maliciousPath, root);
                    // On Windows with case-insensitive fs, some paths may be valid
                    // Check if the resolved path actually escapes the root
                    const resolved = path.resolve(maliciousPath);
                    const relative = path.relative(root, resolved);
                    const isEscaping = relative.startsWith('..') || path.isAbsolute(relative);
                    
                    if (isEscaping) {
                        // Should have thrown but didn't
                        throw new Error(`Expected path to be rejected: ${maliciousPath}`);
                    }
                } catch (error) {
                    // If it throws, verify it's the right error
                    if (error instanceof FusionError) {
                        expect(error.code).toBe('PATH_TRAVERSAL');
                    } else if ((error as Error).message?.includes('Expected path to be rejected')) {
                        throw error; // Re-throw test assertion errors
                    }
                }
            }
        });
    });

    describe('Unicode and Normalization Edge Cases', () => {
        it('should handle Unicode normalization attacks', () => {
            const root = '/safe/directory';
            
            // Unicode characters that could normalize to path separators
            const unicodePaths = [
                '/safe/directory\u002E\u002E/evil.txt', // Unicode dots
                '/safe/directory\uFF0E\uFF0E/evil.txt', // Fullwidth dots
                '/safe/directory\u2024\u2024/evil.txt', // One dot leader
                '/safe/directory\u2025\u2025/evil.txt', // Two dot leader
            ];

            for (const maliciousPath of unicodePaths) {
                try {
                    validateSecurePath(maliciousPath, root);
                    // If it doesn't throw, verify it's actually safe
                    const rel = path.relative(root, path.resolve(maliciousPath));
                    expect(rel.startsWith('..')).toBe(false);
                } catch (error) {
                    expect(error).toBeInstanceOf(FusionError);
                    expect((error as FusionError).code).toBe('PATH_TRAVERSAL');
                }
            }
        });

        it('should handle mixed normalization forms', () => {
            const root = '/safe/directory';
            
            // Test different Unicode normalization forms (NFKC vs NFD)
            const normalizedPaths = [
                '/safe/directory/../sensitive/file.txt', // Standard path traversal
                // Note: Unicode normalization in directory names doesn't create path traversal
                // unless they normalize to actual path separators or dots
                '/evil/directory/file.txt' // Different root entirely
            ];

            for (const maliciousPath of normalizedPaths) {
                expect(() => validateSecurePath(maliciousPath, root)).toThrow(FusionError);
            }
            
            // Verify that Unicode directory names within safe bounds are allowed
            const safePaths = [
                '/safe/directory/\u0065\u0301/file.txt', // é as e + combining acute
                '/safe/directory/\u00E9/file.txt' // é as single character
            ];
            
            for (const safePath of safePaths) {
                expect(() => validateSecurePath(safePath, root)).not.toThrow();
            }
        });
    });

    describe('Path Component Edge Cases', () => {
        it('should handle double dots split across components', () => {
            const root = '/safe/directory';
            
            // Paths where .. is split or disguised
            const tricky = [
                '/safe/directory/./../../evil.txt',
                '/safe/directory/subdir/../../evil.txt',
                '/safe/directory/.//../evil.txt',
                '/safe/directory/.///../evil.txt'
            ];

            for (const maliciousPath of tricky) {
                expect(() => validateSecurePath(maliciousPath, root)).toThrow(FusionError);
            }
        });

        it('should handle long path segments', () => {
            const root = '/safe/directory';
            const longSegment = 'a'.repeat(1000);
            
            const longPaths = [
                `/safe/directory/../${longSegment}/evil.txt`,
                `/safe/directory/${longSegment}/../evil.txt`,
                `/${longSegment}/../safe/directory/evil.txt`
            ];

            for (const maliciousPath of longPaths) {
                try {
                    validateSecurePath(maliciousPath, root);
                    // If it passes, make sure it's actually safe
                    const rel = path.relative(root, path.resolve(maliciousPath));
                    expect(rel.startsWith('..')).toBe(false);
                } catch (error) {
                    expect(error).toBeInstanceOf(FusionError);
                }
            }
        });
    });

    describe('Platform-Specific Edge Cases', () => {
        it('should handle Windows UNC paths', () => {
            if (isWindows()) {
                const root = 'C:\\safe\\directory';
                const uncPaths = [
                    '\\\\server\\share\\evil.txt',
                    '\\\\?\\C:\\evil.txt',
                    '\\\\?\\UNC\\server\\share\\evil.txt'
                ];

                for (const maliciousPath of uncPaths) {
                    expect(() => validateSecurePath(maliciousPath, root)).toThrow(FusionError);
                }
            } else {
                // Skip on non-Windows platforms
                console.log('⏭️  Skipping Windows UNC path test on non-Windows platform');
            }
        });

        it('should handle mixed separators', () => {
            const root = '/safe/directory';
            const mixedPaths = [
                '/safe/directory\\..\\evil.txt',
                '/safe\\directory\\..\\evil.txt',
                '\\safe\\directory\\..\\evil.txt'
            ];

            for (const maliciousPath of mixedPaths) {
                try {
                    validateSecurePath(maliciousPath, root);
                    // If it doesn't throw, verify safety
                    const rel = path.relative(root, path.resolve(maliciousPath));
                    expect(rel.startsWith('..')).toBe(false);
                } catch (error) {
                    expect(error).toBeInstanceOf(FusionError);
                }
            }
        });
    });

    describe('Regression Tests for Old vs New Method', () => {
        it('should catch cases that startsWith missed', () => {
            const testCases = [
                {
                    root: '/app',
                    malicious: '/application/evil.txt', // /app is prefix but not parent
                    description: 'prefix collision'
                },
                {
                    root: '/usr/local',
                    malicious: '/usr/local-backup/evil.txt',
                    description: 'hyphenated confusion'
                },
                {
                    root: isWindows() ? 'C:\\Users\\test' : '/Users/test',
                    malicious: isWindows() ? 'C:\\Users\\test-backup\\evil.txt' : '/Users/test-backup/evil.txt',
                    description: 'Platform-specific prefix with suffix'
                }
            ];

            for (const { root, malicious } of testCases) {
                // The new method should catch these
                expect(() => validateSecurePath(malicious, root)).toThrow(FusionError);
                
                // Verify with direct path.relative check
                const rel = path.relative(root, path.resolve(malicious));
                expect(rel.startsWith('..') || path.isAbsolute(rel)).toBe(true);
            }
        });

        it('should still allow legitimate paths', () => {
            const root = '/safe/directory';
            const legitimatePaths = [
                '/safe/directory/file.txt',
                '/safe/directory/sub/file.txt',
                '/safe/directory/sub/deep/file.txt',
                '/safe/directory/.hidden/file.txt'
            ];

            for (const safePath of legitimatePaths) {
                expect(() => validateSecurePath(safePath, root)).not.toThrow();
                
                const result = validateSecurePath(safePath, root);
                expect(result).toBe(path.resolve(safePath));
                
                // Verify with path.relative
                const rel = path.relative(root, result);
                expect(rel.startsWith('..')).toBe(false);
                expect(path.isAbsolute(rel)).toBe(false);
            }
        });
    });

    describe('Error Context Validation', () => {
        it('should include relativePath in error context', () => {
            const root = '/safe/directory';
            const malicious = '/evil.txt';

            try {
                validateSecurePath(malicious, root);
                expect.fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(FusionError);
                const fusionError = error as FusionError;
                expect(fusionError.context).toHaveProperty('relativePath');
                expect(fusionError.context?.['relativePath']).toBeDefined();
            }
        });
    });
});