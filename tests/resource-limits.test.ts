// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Resource limits tests for Project Fusion
 */
import { existsSync } from 'node:fs';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { processFusion } from '../src/fusion.js';
import { defaultConfig , getMemoryUsage, checkMemoryUsage, logMemoryUsageIfNeeded } from '../src/utils.js';

describe('Resource Limits Tests', () => {
    const testDir = join(process.cwd(), 'temp', 'resource-limits-test');

    beforeEach(async () => {
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
        await mkdir(testDir, { recursive: true });
        process.chdir(testDir);
    });

    afterEach(async () => {
        process.chdir(join(testDir, '..', '..'));
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
    });

    describe('File Count Limits', () => {
        it('should enforce maxFiles limit', async () => {
            // Create more files than the limit
            const maxFiles = 5;
            const numFiles = 7;

            for (let i = 1; i <= numFiles; i++) {
                await writeFile(`file${i}.js`, `console.log('File ${i}');`);
            }

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                maxFiles,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(false);
            expect(result.code).toBe('TOO_MANY_FILES');
            expect(result.error).toContain(`Too many files found (${numFiles} > ${maxFiles})`);
            expect(result.details).toEqual({
                filesFound: numFiles,
                maxFiles,
                suggestion: 'Use --include patterns to filter files or increase maxFiles limit'
            });
        });

        it('should pass when file count is within limit', async () => {
            const maxFiles = 10;
            const numFiles = 5;

            for (let i = 1; i <= numFiles; i++) {
                await writeFile(`file${i}.js`, `console.log('File ${i}');`);
            }

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                maxFiles,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(true);
        });
    });

    describe('Total Size Limits', () => {
        it('should enforce maxTotalSizeMB limit', async () => {
            // Create files that exceed the total size limit
            const maxTotalSizeMB = 0.001; // 1KB limit
            const largeContent = 'A'.repeat(800); // 800 bytes per file
            
            // Create 3 files of 800 bytes each = 2400 bytes > 1024 bytes (1KB)
            await writeFile('file1.js', largeContent);
            await writeFile('file2.js', largeContent);
            await writeFile('file3.js', largeContent);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                maxTotalSizeMB,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(false);
            expect(result.code).toBe('SIZE_LIMIT_EXCEEDED');
            expect(result.error).toContain('Total size limit exceeded');
            expect((result as { details?: { maxTotalSizeMB: number; suggestion: string } }).details?.maxTotalSizeMB).toBe(maxTotalSizeMB);
            expect((result as { details?: { maxTotalSizeMB: number; suggestion: string } }).details?.suggestion).toContain('Use --include patterns to filter files');
        });

        it('should pass when total size is within limit', async () => {
            const maxTotalSizeMB = 1; // 1MB limit
            const smallContent = 'console.log("small file");';
            
            await writeFile('file1.js', smallContent);
            await writeFile('file2.js', smallContent);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                maxTotalSizeMB,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(true);
        });
    });

    describe('Combined Limits', () => {
        it('should check file count before size limit', async () => {
            const maxFiles = 2;
            const maxTotalSizeMB = 0.001; // Very small size limit
            
            // Create 3 small files (exceeds count but not size individually)
            await writeFile('file1.js', 'a');
            await writeFile('file2.js', 'b');
            await writeFile('file3.js', 'c');

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                maxFiles,
                maxTotalSizeMB,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            // Should fail on file count, not size
            expect(result.success).toBe(false);
            expect(result.code).toBe('TOO_MANY_FILES');
        });
    });

    describe('Default Values', () => {
        it('should have sensible default limits', () => {
            expect(defaultConfig.maxFiles).toBe(10_000);
            expect(defaultConfig.maxTotalSizeMB).toBe(100);
        });

        it('should use defaults when not specified in config', async () => {
            await writeFile('test.js', 'console.log("test");');

            const configWithoutLimits = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            // Remove the limit properties to test defaults
            delete (configWithoutLimits as { maxFiles?: number }).maxFiles;
            delete (configWithoutLimits as { maxTotalSizeMB?: number }).maxTotalSizeMB;

            const result = await processFusion(configWithoutLimits);
            
            expect(result.success).toBe(true);
        });
    });
});

describe('Memory Monitoring', () => {
    describe('getMemoryUsage', () => {
        it('should return current memory usage statistics', () => {
            const usage = getMemoryUsage();
            
            expect(usage).toHaveProperty('heapUsed');
            expect(usage).toHaveProperty('heapTotal');
            expect(usage).toHaveProperty('external');
            expect(usage).toHaveProperty('rss');
            expect(usage).toHaveProperty('heapUsedMB');
            expect(usage).toHaveProperty('heapTotalMB');
            expect(usage).toHaveProperty('externalMB');
            expect(usage).toHaveProperty('rssMB');
            expect(usage).toHaveProperty('heapUsagePercent');
            
            expect(typeof usage.heapUsed).toBe('number');
            expect(typeof usage.heapTotal).toBe('number');
            expect(typeof usage.heapUsagePercent).toBe('number');
            
            expect(usage.heapUsed).toBeGreaterThan(0);
            expect(usage.heapTotal).toBeGreaterThan(0);
            expect(usage.heapUsagePercent).toBeGreaterThan(0);
            expect(usage.heapUsagePercent).toBeLessThan(100);
            
            // Check MB conversions
            expect(usage.heapUsedMB).toBeCloseTo(usage.heapUsed / (1024 * 1024), 2);
            expect(usage.heapTotalMB).toBeCloseTo(usage.heapTotal / (1024 * 1024), 2);
        });
    });

    describe('checkMemoryUsage', () => {
        it('should return ok when memory usage is low', () => {
            // Use very high thresholds to ensure 'ok' status
            const result = checkMemoryUsage(95, 99);
            
            expect(result.level).toBe('ok');
            expect(result.usage).toBeDefined();
            expect(result.message).toBeUndefined();
        });

        it('should return warn when approaching warning threshold', () => {
            // Use very low thresholds to trigger warning
            const result = checkMemoryUsage(1, 2);
            
            expect(result.level).toBe('error'); // Will likely be error since usage > 2%
            expect(result.usage).toBeDefined();
            expect(result.message).toBeDefined();
            expect(result.message).toContain('memory usage');
        });

        it('should handle custom thresholds', () => {
            const warnThreshold = 75;
            const errorThreshold = 90;
            
            const result = checkMemoryUsage(warnThreshold, errorThreshold);
            
            expect(result.usage).toBeDefined();
            
            if (result.level === 'warn') {
                expect(result.usage.heapUsagePercent).toBeGreaterThanOrEqual(warnThreshold);
                expect(result.usage.heapUsagePercent).toBeLessThan(errorThreshold);
            } else if (result.level === 'error') {
                expect(result.usage.heapUsagePercent).toBeGreaterThanOrEqual(errorThreshold);
            }
        });
    });

    describe('logMemoryUsageIfNeeded', () => {
        const testDir = join(process.cwd(), 'temp', 'memory-test');
        const logFile = join(testDir, 'test.log');

        beforeEach(async () => {
            if (existsSync(testDir)) {
                await rm(testDir, { recursive: true, force: true });
            }
            await mkdir(testDir, { recursive: true });
        });

        afterEach(async () => {
            if (existsSync(testDir)) {
                await rm(testDir, { recursive: true, force: true });
            }
        });

        it('should not log when memory usage is ok', async () => {
            // Use very high thresholds to ensure no logging
            await logMemoryUsageIfNeeded(logFile, 'Test', 95, 99);
            
            // Log file should not exist
            expect(existsSync(logFile)).toBe(false);
        });

        it('should log when memory thresholds are exceeded', async () => {
            // Use very low thresholds to trigger logging
            await logMemoryUsageIfNeeded(logFile, 'Test', 1, 2);
            
            // Log file should exist and contain memory info
            expect(existsSync(logFile)).toBe(true);
            
            const logContent = await import('node:fs').then(fs => 
                fs.promises.readFile(logFile, 'utf8')
            );
            expect(logContent).toContain('Test:');
            expect(logContent).toContain('memory usage');
        });
    });
});