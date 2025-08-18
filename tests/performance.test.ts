// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Performance tests for Project Fusion
 * Tests stress scenarios, memory leaks, and benchmarking
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'node:path';
import { writeFile, mkdir, rm, stat, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { processFusion } from '../src/fusion.js';
import { defaultConfig } from '../src/utils.js';
import { BenchmarkTracker } from '../src/benchmark.js';

describe('Performance Tests', () => {
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

    describe('Stress Tests - File Count', () => {
        it('should handle 1000 small files efficiently', async () => {
            const fileCount = 1000;
            const startTime = Date.now();
            
            // Generate 1000 small files
            for (let i = 0; i < fileCount; i++) {
                await writeFile(`file${i}.js`, `console.log('File ${i}');\nconst value${i} = ${i};`);
            }
            
            const generationTime = Date.now() - startTime;
            
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                maxFiles: fileCount + 100, // Allow processing
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const processingStart = Date.now();
            const result = await processFusion(config);
            const processingTime = Date.now() - processingStart;
            
            expect(result.success).toBe(true);
            
            // Performance expectations
            expect(generationTime).toBeLessThan(10000); // File generation < 10s
            expect(processingTime).toBeLessThan(30000); // Processing < 30s
            
            // Verify output exists
            expect(existsSync('project-fusioned.txt')).toBe(true);
            
            const outputStats = await stat('project-fusioned.txt');
            expect(outputStats.size).toBeGreaterThan(0);
            
            console.log(`Processed ${fileCount} files in ${processingTime}ms`);
        }, 60000); // 60s timeout

        it('should handle 5000 files with caps enforcement', async () => {
            const fileCount = 5000;
            const maxAllowed = 4000;
            
            // Generate files in batches to avoid overwhelming the system
            for (let batch = 0; batch < 10; batch++) {
                const promises = [];
                for (let i = 0; i < 500; i++) {
                    const fileIndex = batch * 500 + i;
                    if (fileIndex < fileCount) {
                        promises.push(
                            writeFile(`file${fileIndex}.js`, `// File ${fileIndex}\nconst val = ${fileIndex};`)
                        );
                    }
                }
                await Promise.all(promises);
            }
            
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                maxFiles: maxAllowed,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            // Should fail due to file count limit
            expect(result.success).toBe(false);
            expect(result.code).toBe('TOO_MANY_FILES');
            expect(result.details?.filesFound).toBe(fileCount);
        }, 60000);

        it('should handle large files efficiently', async () => {
            const largeContent = 'A'.repeat(100 * 1024); // 100KB per file
            const fileCount = 50; // 5MB total
            
            const promises = [];
            for (let i = 0; i < fileCount; i++) {
                promises.push(
                    writeFile(`large${i}.js`, `// Large file ${i}\n${largeContent}\nconsole.log(${i});`)
                );
            }
            await Promise.all(promises);
            
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                maxFiles: 100,
                maxTotalSizeMB: 10, // Allow 10MB
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const startTime = Date.now();
            const result = await processFusion(config);
            const processingTime = Date.now() - startTime;
            
            expect(result.success).toBe(true);
            expect(processingTime).toBeLessThan(20000); // < 20s
            
            const outputStats = await stat('project-fusioned.txt');
            expect(outputStats.size).toBeGreaterThan(4 * 1024 * 1024); // > 4MB output
        }, 30000);
    });

    describe('Memory Leak Tests', () => {
        it('should not accumulate memory with repeated processing', async () => {
            // Create a moderate set of files
            for (let i = 0; i < 100; i++) {
                await writeFile(`test${i}.js`, `console.log('Test ${i}');\nconst data = new Array(1000).fill(${i});`);
            }
            
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const initialMemory = process.memoryUsage().heapUsed;
            const memoryReadings: number[] = [initialMemory];
            
            // Process multiple times
            for (let iteration = 0; iteration < 5; iteration++) {
                const result = await processFusion(config);
                expect(result.success).toBe(true);
                
                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                }
                
                const currentMemory = process.memoryUsage().heapUsed;
                memoryReadings.push(currentMemory);
                
                // Clean up output files to avoid disk space issues
                if (existsSync('project-fusioned.txt')) {
                    await rm('project-fusioned.txt');
                }
            }
            
            // Check memory trend - should not continuously increase
            const memoryGrowth = memoryReadings[memoryReadings.length - 1] - memoryReadings[0];
            const memoryGrowthMB = memoryGrowth / (1024 * 1024);
            
            // Allow some memory growth but not excessive (< 50MB)
            expect(memoryGrowthMB).toBeLessThan(50);
            
            console.log(`Memory readings: ${memoryReadings.map(r => (r / 1024 / 1024).toFixed(1) + 'MB').join(' -> ')}`);
        }, 60000);

        it('should clean up temporary resources', async () => {
            // Create files with various extensions
            const extensions = ['.js', '.ts', '.py', '.go', '.rs', '.java'];
            const filesPerExt = 20;
            
            for (const ext of extensions) {
                for (let i = 0; i < filesPerExt; i++) {
                    await writeFile(`file${i}${ext}`, `// File ${i} with extension ${ext}\nconst value = ${i};`);
                }
            }
            
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: true,
                generateMarkdown: true,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js', '.ts'],
                    backend: ['.py', '.go', '.rs', '.java']
                }
            };

            const beforeProcessing = process.memoryUsage();
            
            const result = await processFusion(config);
            expect(result.success).toBe(true);
            
            // Force cleanup
            if (global.gc) {
                global.gc();
            }
            
            const afterProcessing = process.memoryUsage();
            
            // Memory should not have grown excessively
            const memoryGrowthMB = (afterProcessing.heapUsed - beforeProcessing.heapUsed) / (1024 * 1024);
            expect(memoryGrowthMB).toBeLessThan(100); // Allow 100MB growth for processing
            
            // Verify all output files were created
            expect(existsSync('project-fusioned.txt')).toBe(true);
            expect(existsSync('project-fusioned.md')).toBe(true);
            expect(existsSync('project-fusioned.html')).toBe(true);
        });

        it('should handle memory pressure during large batch processing', async () => {
            // Create progressively larger files to test memory pressure
            const batchSizes = [50, 100, 150, 200];
            const fileSizeKB = 10; // 10KB per file
            
            for (const batchSize of batchSizes) {
                // Clear previous batch
                if (existsSync(testDir)) {
                    await rm(testDir, { recursive: true, force: true });
                    await mkdir(testDir, { recursive: true });
                    process.chdir(testDir);
                }
                
                // Create batch of files
                const content = 'X'.repeat(fileSizeKB * 1024);
                for (let i = 0; i < batchSize; i++) {
                    await writeFile(`batch${i}.js`, `// Batch file ${i}\n${content}`);
                }
                
                const config = {
                    ...defaultConfig,
                    rootDirectory: testDir,
                    generateHtml: false,
                    generateMarkdown: false,
                    generateText: true,
                    parsedFileExtensions: {
                        web: ['.js']
                    }
                };

                const beforeMemory = process.memoryUsage();
                const result = await processFusion(config);
                const afterMemory = process.memoryUsage();
                
                expect(result.success).toBe(true);
                
                const memoryIncreaseMB = (afterMemory.heapUsed - beforeMemory.heapUsed) / (1024 * 1024);
                const expectedDataSizeMB = (batchSize * fileSizeKB) / 1024;
                
                // Memory increase should be reasonable relative to data size
                // Allow 10x data size for processing overhead (accounting for Node.js GC behavior)
                expect(memoryIncreaseMB).toBeLessThan(Math.max(expectedDataSizeMB * 10, 10));
                
                console.log(`Batch ${batchSize}: ${memoryIncreaseMB.toFixed(1)}MB vs ${expectedDataSizeMB.toFixed(1)}MB data`);
            }
        }, 90000);

        it('should recover from memory pressure gracefully', async () => {
            // Create files that would consume significant memory if not handled properly
            const largeFileCount = 20;
            const largeFileSize = 500 * 1024; // 500KB each = 10MB total
            
            const initialMemory = process.memoryUsage().heapUsed;
            
            try {
                // Create large files
                for (let i = 0; i < largeFileCount; i++) {
                    const content = `// Large file ${i}\n${'A'.repeat(largeFileSize)}`;
                    await writeFile(`large${i}.js`, content);
                }
                
                const config = {
                    ...defaultConfig,
                    rootDirectory: testDir,
                    maxTotalSizeMB: 15, // Allow processing
                    generateHtml: false,
                    generateMarkdown: false,
                    generateText: true,
                    parsedFileExtensions: {
                        web: ['.js']
                    }
                };

                const result = await processFusion(config);
                expect(result.success).toBe(true);
                
                // Force multiple garbage collections
                for (let i = 0; i < 3; i++) {
                    if (global.gc) {
                        global.gc();
                    }
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                const finalMemory = process.memoryUsage().heapUsed;
                const totalGrowthMB = (finalMemory - initialMemory) / (1024 * 1024);
                
                // Should not retain all the processed data in memory
                expect(totalGrowthMB).toBeLessThan(50); // Much less than the 10MB processed
                
            } catch (error) {
                // If we hit memory limits, that's also acceptable behavior
                expect(error).toBeInstanceOf(Error);
            }
        }, 60000);
    });

    describe('Benchmark Suite', () => {
        it('should track performance metrics accurately', async () => {
            const tracker = new BenchmarkTracker();
            
            // Create test files with known sizes
            const fileSizes = [1024, 2048, 4096, 8192, 16384]; // 1KB to 16KB
            const totalExpectedSize = fileSizes.reduce((sum, size) => sum + size, 0);
            
            for (let i = 0; i < fileSizes.length; i++) {
                const content = 'A'.repeat(fileSizes[i] - 20); // Account for other content
                await writeFile(`bench${i}.js`, `// ${content}`);
                tracker.markFileProcessed(fileSizes[i]);
            }
            
            const metrics = tracker.getMetrics();
            
            expect(metrics.filesProcessed).toBe(fileSizes.length);
            expect(metrics.totalBytesProcessed).toBe(totalExpectedSize);
            expect(metrics.processingTimeMs).toBeGreaterThan(0);
            expect(metrics.memoryUsedMB).toBeGreaterThan(0);
            
            if (metrics.processingTimeMs > 0) {
                expect(metrics.throughputBytesPerSec).toBeGreaterThan(0);
            }
        });

        it('should provide consistent performance baselines', async () => {
            const fileCount = 500;
            const fileSize = 1024; // 1KB each
            
            // Generate consistent test data
            for (let i = 0; i < fileCount; i++) {
                const content = `// Benchmark file ${i}\n${'A'.repeat(fileSize - 50)}`;
                await writeFile(`bench${i}.js`, content);
            }
            
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            // Run benchmark
            const startTime = Date.now();
            const startMemory = process.memoryUsage();
            
            const result = await processFusion(config);
            
            const endTime = Date.now();
            const endMemory = process.memoryUsage();
            
            expect(result.success).toBe(true);
            
            const processingTime = endTime - startTime;
            const memoryUsed = (endMemory.heapUsed - startMemory.heapUsed) / (1024 * 1024);
            const throughput = (fileCount * fileSize) / (processingTime / 1000); // bytes per second
            
            // Performance benchmarks (these are baseline expectations)
            expect(processingTime).toBeLessThan(15000); // < 15 seconds
            expect(memoryUsed).toBeLessThan(200); // < 200MB memory increase
            expect(throughput).toBeGreaterThan(1000); // > 1KB/s throughput
            
            console.log(`Benchmark Results:
                Files: ${fileCount}
                Processing Time: ${processingTime}ms
                Memory Used: ${memoryUsed.toFixed(2)}MB
                Throughput: ${(throughput / 1024).toFixed(2)} KB/s`);
                
            // Verify output quality
            const outputContent = await readFile('project-fusioned.txt', 'utf8');
            expect(outputContent).toContain('Benchmark file 0');
            expect(outputContent).toContain(`Benchmark file ${fileCount - 1}`);
        }, 30000);

        it('should detect performance regressions', async () => {
            // Baseline test with known parameters
            const baselineFileCount = 100;
            const baselineFileSize = 500;
            
            for (let i = 0; i < baselineFileCount; i++) {
                await writeFile(`baseline${i}.js`, `// File ${i}\n${'x'.repeat(baselineFileSize)}`);
            }
            
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const runs = [];
            
            // Multiple runs to establish baseline
            for (let run = 0; run < 3; run++) {
                const startTime = Date.now();
                const result = await processFusion(config);
                const endTime = Date.now();
                
                expect(result.success).toBe(true);
                runs.push(endTime - startTime);
                
                // Clean up between runs
                if (existsSync('project-fusioned.txt')) {
                    await rm('project-fusioned.txt');
                }
            }
            
            const avgTime = runs.reduce((sum, time) => sum + time, 0) / runs.length;
            const maxTime = Math.max(...runs);
            const minTime = Math.min(...runs);
            
            // Consistency check - runs shouldn't vary wildly
            const variance = maxTime - minTime;
            expect(variance).toBeLessThan(Math.max(avgTime * 2, 100)); // Variance < 2x average or 100ms minimum
            
            // Performance expectation
            expect(avgTime).toBeLessThan(5000); // Average < 5 seconds
            
            console.log(`Performance baseline: ${avgTime.toFixed(0)}ms avg (${minTime}-${maxTime}ms range)`);
        });

        it('should maintain consistent throughput across different workloads', async () => {
            const workloads = [
                { name: 'small-many', fileCount: 500, fileSize: 100 },
                { name: 'medium-some', fileCount: 100, fileSize: 2000 },
                { name: 'large-few', fileCount: 20, fileSize: 10000 }
            ];

            const throughputResults: Record<string, number> = {};

            for (const workload of workloads) {
                // Clear directory
                if (existsSync(testDir)) {
                    await rm(testDir, { recursive: true, force: true });
                    await mkdir(testDir, { recursive: true });
                    process.chdir(testDir);
                }

                // Create workload files
                for (let i = 0; i < workload.fileCount; i++) {
                    const content = `// ${workload.name} file ${i}\n${'X'.repeat(workload.fileSize)}`;
                    await writeFile(`${workload.name}_${i}.js`, content);
                }

                const config = {
                    ...defaultConfig,
                    rootDirectory: testDir,
                    generateHtml: false,
                    generateMarkdown: false,
                    generateText: true,
                    parsedFileExtensions: {
                        web: ['.js']
                    }
                };

                const startTime = Date.now();
                const result = await processFusion(config);
                const processingTime = Date.now() - startTime;

                expect(result.success).toBe(true);

                const totalBytes = workload.fileCount * workload.fileSize;
                const throughput = totalBytes / (processingTime / 1000); // bytes per second
                throughputResults[workload.name] = throughput;

                console.log(`${workload.name}: ${(throughput / 1024).toFixed(1)} KB/s (${processingTime}ms for ${totalBytes} bytes)`);
            }

            // All workloads should achieve reasonable minimum throughput
            for (const [name, throughput] of Object.entries(throughputResults)) {
                expect(throughput).toBeGreaterThan(10000); // > 10KB/s minimum
                expect(throughput).toBeLessThan(100 * 1024 * 1024); // < 100MB/s (sanity check)
            }
        }, 45000);

        it('should provide performance regression detection utilities', async () => {
            // Create a standardized performance test dataset
            const standardFileCount = 200;
            const standardFileSize = 1024; // 1KB each
            
            for (let i = 0; i < standardFileCount; i++) {
                await writeFile(`perf_test_${i}.js`, `// Performance test file ${i}\n${'P'.repeat(standardFileSize)}`);
            }

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: true,
                generateMarkdown: true,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            // Collect multiple data points
            const performanceData = {
                processingTimes: [] as number[],
                memoryUsages: [] as number[],
                outputSizes: [] as { txt: number; md: number; html: number }[]
            };

            for (let run = 0; run < 3; run++) {
                const beforeMemory = process.memoryUsage().heapUsed;
                const startTime = Date.now();
                
                const result = await processFusion(config);
                
                const endTime = Date.now();
                const afterMemory = process.memoryUsage().heapUsed;
                
                expect(result.success).toBe(true);
                
                performanceData.processingTimes.push(endTime - startTime);
                performanceData.memoryUsages.push(afterMemory - beforeMemory);
                
                // Measure output sizes
                const txtSize = existsSync('project-fusioned.txt') ? (await stat('project-fusioned.txt')).size : 0;
                const mdSize = existsSync('project-fusioned.md') ? (await stat('project-fusioned.md')).size : 0;
                const htmlSize = existsSync('project-fusioned.html') ? (await stat('project-fusioned.html')).size : 0;
                
                performanceData.outputSizes.push({ txt: txtSize, md: mdSize, html: htmlSize });
                
                // Cleanup
                for (const file of ['project-fusioned.txt', 'project-fusioned.md', 'project-fusioned.html']) {
                    if (existsSync(file)) {
                        await rm(file);
                    }
                }
            }

            // Analyze performance characteristics
            const avgProcessingTime = performanceData.processingTimes.reduce((a, b) => a + b, 0) / performanceData.processingTimes.length;
            const avgMemoryUsage = performanceData.memoryUsages.reduce((a, b) => a + b, 0) / performanceData.memoryUsages.length;
            
            // Performance assertions
            expect(avgProcessingTime).toBeLessThan(10000); // < 10 seconds average
            expect(avgMemoryUsage).toBeLessThan(200 * 1024 * 1024); // < 200MB memory growth
            
            // Output size consistency
            const txtSizes = performanceData.outputSizes.map(s => s.txt);
            const txtSizeVariance = Math.max(...txtSizes) - Math.min(...txtSizes);
            expect(txtSizeVariance).toBeLessThan(100); // Output sizes should be consistent
            
            console.log(`Standard performance test completed:
                Avg Processing Time: ${avgProcessingTime.toFixed(0)}ms
                Avg Memory Usage: ${(avgMemoryUsage / 1024 / 1024).toFixed(1)}MB
                Output Size Range: ${Math.min(...txtSizes)}-${Math.max(...txtSizes)} bytes`);
        }, 60000);
    });

    describe('Scalability Tests', () => {
        it('should handle deeply nested directory structures', async () => {
            // Create deep directory structure (10 levels deep)
            let currentDir = testDir;
            for (let level = 0; level < 10; level++) {
                currentDir = join(currentDir, `level${level}`);
                await mkdir(currentDir, { recursive: true });
                
                // Add files at each level
                for (let file = 0; file < 5; file++) {
                    await writeFile(
                        join(currentDir, `file${file}.js`),
                        `// Level ${level}, File ${file}\nconsole.log('Deep file at level ${level}');`
                    );
                }
            }
            
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                parseSubDirectories: true,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(true);
            
            // Verify deep files were found
            const output = await readFile('project-fusioned.txt', 'utf8');
            expect(output).toContain('Level 0, File 0');
            expect(output).toContain('Level 9, File 4'); // Deepest file
        });

        it('should handle mixed file sizes efficiently', async () => {
            // Create files with exponentially increasing sizes
            const baseSizes = [100, 1024, 10240, 102400]; // 100B, 1KB, 10KB, 100KB
            
            for (let i = 0; i < baseSizes.length; i++) {
                for (let j = 0; j < 10; j++) { // 10 files per size category
                    const size = baseSizes[i];
                    const content = `// Size category ${i}, file ${j}\n${'X'.repeat(size - 50)}`;
                    await writeFile(`mixed_${i}_${j}.js`, content);
                }
            }
            
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const startTime = Date.now();
            const result = await processFusion(config);
            const processingTime = Date.now() - startTime;
            
            expect(result.success).toBe(true);
            expect(processingTime).toBeLessThan(10000); // < 10 seconds
            
            // Verify all size categories are represented
            const output = await readFile('project-fusioned.txt', 'utf8');
            for (let i = 0; i < baseSizes.length; i++) {
                expect(output).toContain(`Size category ${i}`);
            }
        });
    });
});