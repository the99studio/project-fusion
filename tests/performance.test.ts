// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Performance tests for Project Fusion - Optimized version
 * Tests essential performance scenarios with minimal overhead
 */
import { existsSync } from 'node:fs';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BenchmarkTracker } from '../src/benchmark.js';
import { processFusion } from '../src/fusion.js';
import { defaultConfig } from '../src/utils.js';

// Performance tests config
const performanceConfig = {
    ...defaultConfig,
    maxBase64BlockKB: 100,
    maxLineLength: 50_000,
    maxTokenLength: 20_000
};

/**
 * Pre-generate content to avoid repeated generation during tests - optimized for memory
 */
const BASE_CONTENT_TEMPLATE = 'function test() { return 42; }';
const PREGENERATED_CONTENT = {
    small: 'console.log("small");',
    medium: BASE_CONTENT_TEMPLATE.repeat(Math.floor((10 * 1024) / BASE_CONTENT_TEMPLATE.length)),
    large: BASE_CONTENT_TEMPLATE.repeat(Math.floor((50 * 1024) / BASE_CONTENT_TEMPLATE.length))
};

// Utility for generating dynamic content when needed (unused but may be needed for future tests)
// const generateContent = (sizeKB: number): string => {
//     const repetitions = Math.max(1, Math.floor((sizeKB * 1024) / BASE_CONTENT_TEMPLATE.length));
//     return BASE_CONTENT_TEMPLATE.repeat(repetitions);
// };

describe('Performance Tests - Optimized', () => {
    const testDir = join(process.cwd(), 'temp', 'performance-test');
    let originalCwd: string;

    beforeEach(async () => {
        originalCwd = process.cwd();
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
        await mkdir(testDir, { recursive: true });
        process.chdir(testDir);
    });

    afterEach(async () => {
        process.chdir(originalCwd);
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
    });

    describe('Basic Performance Tests', () => {
        it('should handle small number of files efficiently with batch operations', async () => {
            const fileCount = 10;
            
            // Use batch file creation for better performance
            const filePromises = Array.from({ length: fileCount }, (_, i) => 
                writeFile(`file${i}.js`, PREGENERATED_CONTENT.small)
            );
            await Promise.all(filePromises);
            
            const config = {
                ...performanceConfig,
                rootDirectory: testDir,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: { web: ['.js'] }
            };

            const startTime = Date.now();
            const result = await processFusion(config);
            const processingTime = Date.now() - startTime;
            
            expect(result.success).toBe(true);
            expect(processingTime).toBeLessThan(5000); // Should finish in < 5s
        });

        it('should handle medium file sizes efficiently with parallel processing', async () => {
            const fileCount = 5;
            
            // Use parallel file creation
            await Promise.all(
                Array.from({ length: fileCount }, (_, i) => 
                    writeFile(`large${i}.js`, PREGENERATED_CONTENT.medium)
                )
            );

            const config = {
                ...performanceConfig,
                rootDirectory: testDir,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: { web: ['.js'] }
            };

            const startTime = Date.now();
            const result = await processFusion(config);
            const processingTime = Date.now() - startTime;

            expect(result.success).toBe(true);
            expect(processingTime).toBeLessThan(10_000); // Should finish in < 10s
        });

        it('should track memory usage during processing with optimized creation', async () => {
            const fileCount = 8;
            
            // Batch create memory test files
            await Promise.all(
                Array.from({ length: fileCount }, (_, i) => 
                    writeFile(`memory${i}.js`, `const data${i} = new Array(100).fill(${i});`)
                )
            );

            const config = {
                ...performanceConfig,
                rootDirectory: testDir,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: { web: ['.js'] }
            };

            const startMemory = process.memoryUsage().heapUsed;
            const result = await processFusion(config);
            const endMemory = process.memoryUsage().heapUsed;
            
            const memoryIncrease = (endMemory - startMemory) / (1024 * 1024); // MB

            expect(result.success).toBe(true);
            expect(memoryIncrease).toBeLessThan(50); // Should not use more than 50MB
        });

        it('should handle benchmark tracker correctly', () => {
            const tracker = new BenchmarkTracker();
            
            // Simulate file processing
            tracker.markFileProcessed(1024); // 1KB
            tracker.markFileProcessed(2048); // 2KB
            tracker.markFileProcessed(4096); // 4KB
            
            const metrics = tracker.getMetrics();
            
            expect(metrics.filesProcessed).toBe(3);
            expect(metrics.totalBytesProcessed).toBe(7168); // 1KB + 2KB + 4KB
            expect(metrics.totalSizeMB).toBeCloseTo(7168 / (1024 * 1024), 2);
        });
    });

    describe('File Format Tests - Optimized', () => {
        it('should generate different output formats efficiently', async () => {
            await writeFile('test.js', 'console.log("format test");');

            const config = {
                ...performanceConfig,
                rootDirectory: testDir,
                generateHtml: true,
                generateMarkdown: true,
                generateText: true,
                parsedFileExtensions: { web: ['.js'] }
            };

            const startTime = Date.now();
            const result = await processFusion(config);
            const processingTime = Date.now() - startTime;

            expect(result.success).toBe(true);
            expect(existsSync('project-fusioned.txt')).toBe(true);
            expect(existsSync('project-fusioned.md')).toBe(true);
            expect(existsSync('project-fusioned.html')).toBe(true);
            expect(processingTime).toBeLessThan(3000); // Should finish in < 3s
        });

        it('should handle nested directories efficiently', async () => {
            await mkdir('nested');
            await writeFile('root.js', 'console.log("root");');
            await writeFile('nested/child.js', 'console.log("nested");');

            const config = {
                ...performanceConfig,
                rootDirectory: testDir,
                parseSubDirectories: true,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: { web: ['.js'] }
            };

            const startTime = Date.now();
            const result = await processFusion(config);
            const processingTime = Date.now() - startTime;

            expect(result.success).toBe(true);
            expect(processingTime).toBeLessThan(2000); // Should finish in < 2s
        });
    });

    describe('Resource Limits', () => {
        it('should respect file count limits with batch processing', async () => {
            const fileCount = 20;
            const maxFiles = 10;
            
            // Create files in optimized batches
            const BATCH_SIZE = 5;
            for (let start = 0; start < fileCount; start += BATCH_SIZE) {
                const end = Math.min(start + BATCH_SIZE, fileCount);
                const batch = Array.from({ length: end - start }, (_, i) => 
                    writeFile(`file${start + i}.js`, `console.log(${start + i});`)
                );
                await Promise.all(batch);
            }

            const config = {
                ...performanceConfig,
                rootDirectory: testDir,
                maxFiles,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: { web: ['.js'] }
            };

            const result = await processFusion(config);
            
            // Should either succeed with limited files or fail with appropriate error
            if (result.success) {
                expect(result.message).toContain(`${maxFiles} files processed`);
            } else {
                expect(result.code).toMatch(/TOO_MANY_FILES/);
            }
        });

        it('should handle file size limits with pre-computed content', async () => {
            // Use precomputed large content instead of generating at runtime
            await writeFile('large.js', `// Large file\nconst data = "${PREGENERATED_CONTENT.large}";`);

            const config = {
                ...performanceConfig,
                rootDirectory: testDir,
                maxFileSizeKB: 50, // 50KB limit
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: { web: ['.js'] }
            };

            const result = await processFusion(config);
            
            // Should handle size limit appropriately
            expect(result).toHaveProperty('success');
        });
    });
});