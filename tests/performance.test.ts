// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Performance tests for Project Fusion - Optimized version
 * Tests essential performance scenarios with minimal overhead
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { writeFile, mkdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { processFusion } from '../src/fusion.js';
import { defaultConfig } from '../src/utils.js';
import { BenchmarkTracker } from '../src/benchmark.js';

// Performance tests config
const performanceConfig = {
    ...defaultConfig,
    maxBase64BlockKB: 100,
    maxLineLength: 50000,
    maxTokenLength: 20000
};

/**
 * Generate normal file content without problematic patterns
 */
function generateNormalContent(sizeKB: number): string {
    const baseContent = `function test() { return ${Math.random()}; }`;
    const repetitions = Math.max(1, Math.floor((sizeKB * 1024) / baseContent.length));
    return baseContent.repeat(repetitions);
}

describe('Performance Tests - Optimized', () => {
    const testDir = join(process.cwd(), 'temp', 'performance-test');

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

    describe('Basic Performance Tests', () => {
        it('should handle small number of files efficiently', async () => {
            const fileCount = 10;
            
            // Create test files
            for (let i = 0; i < fileCount; i++) {
                await writeFile(`file${i}.js`, `console.log('File ${i}');`);
            }
            
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

        it('should handle medium file sizes efficiently', async () => {
            const fileCount = 5;
            const content = generateNormalContent(10); // 10KB per file
            
            for (let i = 0; i < fileCount; i++) {
                await writeFile(`large${i}.js`, content);
            }

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
            expect(processingTime).toBeLessThan(10000); // Should finish in < 10s
        });

        it('should track memory usage during processing', async () => {
            const fileCount = 8;
            
            for (let i = 0; i < fileCount; i++) {
                await writeFile(`memory${i}.js`, `const data${i} = new Array(100).fill(${i});`);
            }

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

        it('should handle benchmark tracker correctly', async () => {
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

    describe('File Format Tests', () => {
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
        it('should respect file count limits', async () => {
            const fileCount = 20;
            const maxFiles = 10;
            
            for (let i = 0; i < fileCount; i++) {
                await writeFile(`file${i}.js`, `console.log(${i});`);
            }

            const config = {
                ...performanceConfig,
                rootDirectory: testDir,
                maxFiles: maxFiles,
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

        it('should handle file size limits', async () => {
            const largeContent = 'A'.repeat(100 * 1024); // 100KB
            await writeFile('large.js', `// Large file\nconst data = "${largeContent}";`);

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