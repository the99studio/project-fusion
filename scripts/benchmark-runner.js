#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Standalone benchmark runner for Project Fusion
 * Run performance tests and generate regression reports
 */

import { join } from 'node:path';
import { writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { processFusion } from '../dist/fusion.js';
import { defaultConfig } from '../dist/utils.js';
import { BenchmarkTracker } from '../dist/benchmark.js';

class PerformanceBenchmark {
    constructor() {
        this.results = [];
        this.testDir = join(process.cwd(), 'temp', 'benchmark');
    }

    async setup() {
        if (existsSync(this.testDir)) {
            await rm(this.testDir, { recursive: true, force: true });
        }
        await mkdir(this.testDir, { recursive: true });
    }

    async cleanup() {
        if (existsSync(this.testDir)) {
            await rm(this.testDir, { recursive: true, force: true });
        }
    }

    async runScalabilityBenchmark() {
        console.log('🚀 Running scalability benchmark...');
        
        const testCases = [
            { name: 'small', files: 50, sizeKB: 1 },
            { name: 'medium', files: 200, sizeKB: 5 },
            { name: 'large', files: 500, sizeKB: 10 },
            { name: 'xlarge', files: 1000, sizeKB: 2 },
        ];

        for (const testCase of testCases) {
            console.log(`  📊 Testing ${testCase.name}: ${testCase.files} files × ${testCase.sizeKB}KB`);
            
            await this.setup();
            const originalDir = process.cwd();
            process.chdir(this.testDir);

            try {
                // Generate test files
                const content = 'X'.repeat(testCase.sizeKB * 1024);
                for (let i = 0; i < testCase.files; i++) {
                    await writeFile(`file_${i}.js`, `// Test file ${i}\n${content}`);
                }

                const config = {
                    ...defaultConfig,
                    rootDirectory: this.testDir,
                    maxFiles: testCase.files + 100,
                    generateHtml: false,
                    generateMarkdown: false,
                    generateText: true,
                    parsedFileExtensions: { web: ['.js'] }
                };

                const tracker = new BenchmarkTracker();
                const startTime = Date.now();
                const startMemory = process.memoryUsage().heapUsed;

                const result = await processFusion(config);
                
                const endTime = Date.now();
                const endMemory = process.memoryUsage().heapUsed;
                
                // Track files processed
                for (let i = 0; i < testCase.files; i++) {
                    tracker.markFileProcessed(testCase.sizeKB * 1024);
                }

                const metrics = tracker.getMetrics();
                const processingTime = endTime - startTime;
                const memoryUsed = (endMemory - startMemory) / (1024 * 1024);

                this.results.push({
                    testCase: testCase.name,
                    success: result.success,
                    filesProcessed: testCase.files,
                    totalSizeKB: testCase.files * testCase.sizeKB,
                    processingTimeMs: processingTime,
                    memoryUsedMB: memoryUsed,
                    throughputKBps: (testCase.files * testCase.sizeKB) / (processingTime / 1000),
                    benchmarkMetrics: metrics
                });

                console.log(`    ✅ ${processingTime}ms, ${memoryUsed.toFixed(1)}MB, ${((testCase.files * testCase.sizeKB) / (processingTime / 1000) / 1024).toFixed(1)} MB/s`);
            } finally {
                process.chdir(originalDir);
                await this.cleanup();
            }
        }
    }

    async runMemoryStressBenchmark() {
        console.log('🧠 Running memory stress benchmark...');
        
        await this.setup();
        const originalDir = process.cwd();
        process.chdir(this.testDir);

        try {
            // Create memory-intensive scenario
            const largeFileCount = 100;
            const largeFileSizeKB = 50; // 50KB per file = 5MB total
            
            const memoryReadings = [];
            
            for (let iteration = 0; iteration < 5; iteration++) {
                // Create files for this iteration
                for (let i = 0; i < largeFileCount; i++) {
                    const content = `// Memory test iteration ${iteration}, file ${i}\n${'M'.repeat(largeFileSizeKB * 1024)}`;
                    await writeFile(`memory_${iteration}_${i}.js`, content);
                }

                const config = {
                    ...defaultConfig,
                    rootDirectory: this.testDir,
                    generateHtml: false,
                    generateMarkdown: false,
                    generateText: true,
                    parsedFileExtensions: { web: ['.js'] }
                };

                const beforeMemory = process.memoryUsage().heapUsed;
                await processFusion(config);
                
                // Force GC if available
                if (global.gc) global.gc();
                
                const afterMemory = process.memoryUsage().heapUsed;
                memoryReadings.push({
                    iteration,
                    beforeMB: beforeMemory / (1024 * 1024),
                    afterMB: afterMemory / (1024 * 1024),
                    growthMB: (afterMemory - beforeMemory) / (1024 * 1024)
                });

                // Clean output files
                if (existsSync('project-fusioned.txt')) {
                    await rm('project-fusioned.txt');
                }
                
                console.log(`    📈 Iteration ${iteration}: ${memoryReadings[iteration].growthMB.toFixed(1)}MB growth`);
            }

            this.results.push({
                testCase: 'memory-stress',
                memoryReadings,
                totalGrowthMB: memoryReadings[memoryReadings.length - 1].afterMB - memoryReadings[0].beforeMB,
                avgGrowthPerIterationMB: memoryReadings.reduce((sum, r) => sum + r.growthMB, 0) / memoryReadings.length
            });

        } finally {
            process.chdir(originalDir);
            await this.cleanup();
        }
    }

    async runThroughputBenchmark() {
        console.log('⚡ Running throughput benchmark...');
        
        const workloads = [
            { name: 'many-tiny', files: 1000, sizeBytes: 50 },
            { name: 'some-small', files: 200, sizeBytes: 500 },
            { name: 'few-medium', files: 50, sizeBytes: 5000 },
            { name: 'very-few-large', files: 10, sizeBytes: 25000 }
        ];

        for (const workload of workloads) {
            await this.setup();
            const originalDir = process.cwd();
            process.chdir(this.testDir);

            try {
                console.log(`  ⚡ ${workload.name}: ${workload.files} × ${workload.sizeBytes} bytes`);
                
                // Create workload
                for (let i = 0; i < workload.files; i++) {
                    const content = `// ${workload.name} ${i}\n${'T'.repeat(workload.sizeBytes)}`;
                    await writeFile(`throughput_${i}.js`, content);
                }

                const config = {
                    ...defaultConfig,
                    rootDirectory: this.testDir,
                    generateHtml: false,
                    generateMarkdown: false,
                    generateText: true,
                    parsedFileExtensions: { web: ['.js'] }
                };

                const runs = [];
                for (let run = 0; run < 3; run++) {
                    const startTime = Date.now();
                    await processFusion(config);
                    const endTime = Date.now();
                    runs.push(endTime - startTime);
                    
                    if (existsSync('project-fusioned.txt')) {
                        await rm('project-fusioned.txt');
                    }
                }

                const avgTime = runs.reduce((a, b) => a + b, 0) / runs.length;
                const totalBytes = workload.files * workload.sizeBytes;
                const throughput = totalBytes / (avgTime / 1000); // bytes per second

                this.results.push({
                    testCase: `throughput-${workload.name}`,
                    files: workload.files,
                    bytesPerFile: workload.sizeBytes,
                    totalBytes: totalBytes,
                    avgProcessingTimeMs: avgTime,
                    throughputBytesPerSec: throughput,
                    throughputMBPerSec: throughput / (1024 * 1024)
                });

                console.log(`    ⚡ ${(throughput / (1024 * 1024)).toFixed(2)} MB/s (${avgTime.toFixed(0)}ms avg)`);
            } finally {
                process.chdir(originalDir);
                await this.cleanup();
            }
        }
    }

    generateReport() {
        const timestamp = new Date().toISOString();
        const nodeVersion = process.version;
        const platform = `${process.platform} ${process.arch}`;
        
        const report = {
            metadata: {
                timestamp,
                nodeVersion,
                platform,
                testDuration: 'varies'
            },
            scalability: this.results.filter(r => ['small', 'medium', 'large', 'xlarge'].includes(r.testCase)),
            throughput: this.results.filter(r => r.testCase?.startsWith('throughput-')),
            memory: this.results.find(r => r.testCase === 'memory-stress'),
            summary: this.generateSummary()
        };

        return report;
    }

    generateSummary() {
        const scalabilityResults = this.results.filter(r => ['small', 'medium', 'large', 'xlarge'].includes(r.testCase));
        const throughputResults = this.results.filter(r => r.testCase?.startsWith('throughput-'));
        
        const avgThroughput = throughputResults.length > 0 
            ? throughputResults.reduce((sum, r) => sum + r.throughputMBPerSec, 0) / throughputResults.length 
            : 0;

        const maxProcessingTime = scalabilityResults.length > 0
            ? Math.max(...scalabilityResults.map(r => r.processingTimeMs))
            : 0;

        const maxMemoryUsage = scalabilityResults.length > 0
            ? Math.max(...scalabilityResults.map(r => r.memoryUsedMB))
            : 0;

        return {
            overallThroughputMBPerSec: avgThroughput,
            maxProcessingTimeMs: maxProcessingTime,
            maxMemoryUsageMB: maxMemoryUsage,
            allTestsPassed: this.results.every(r => r.success !== false)
        };
    }

    async saveReport(filename = 'performance-report.json') {
        const report = this.generateReport();
        await writeFile(filename, JSON.stringify(report, null, 2));
        console.log(`📊 Report saved to ${filename}`);
        return report;
    }

    printSummary() {
        const summary = this.generateSummary();
        
        console.log('\n📊 Performance Benchmark Summary');
        console.log('═'.repeat(50));
        console.log(`Average Throughput: ${summary.overallThroughputMBPerSec.toFixed(2)} MB/s`);
        console.log(`Max Processing Time: ${summary.maxProcessingTimeMs.toFixed(0)}ms`);
        console.log(`Max Memory Usage: ${summary.maxMemoryUsageMB.toFixed(1)}MB`);
        console.log(`All Tests Passed: ${summary.allTestsPassed ? '✅' : '❌'}`);
        console.log('═'.repeat(50));

        // Performance grades
        const throughputGrade = summary.overallThroughputMBPerSec > 5 ? '🚀' : 
                               summary.overallThroughputMBPerSec > 1 ? '✅' : '⚠️';
        const memoryGrade = summary.maxMemoryUsageMB < 100 ? '🚀' : 
                           summary.maxMemoryUsageMB < 200 ? '✅' : '⚠️';
        const timeGrade = summary.maxProcessingTimeMs < 5000 ? '🚀' : 
                         summary.maxProcessingTimeMs < 15000 ? '✅' : '⚠️';

        console.log(`Performance Grades:`);
        console.log(`  Throughput: ${throughputGrade} ${summary.overallThroughputMBPerSec.toFixed(2)} MB/s`);
        console.log(`  Memory Usage: ${memoryGrade} ${summary.maxMemoryUsageMB.toFixed(1)} MB`);
        console.log(`  Processing Time: ${timeGrade} ${summary.maxProcessingTimeMs.toFixed(0)} ms`);
    }
}

async function main() {
    console.log('🏁 Starting Project Fusion Performance Benchmark');
    console.log(`Node.js ${process.version} on ${process.platform} ${process.arch}`);
    
    const benchmark = new PerformanceBenchmark();
    
    try {
        await benchmark.runScalabilityBenchmark();
        await benchmark.runThroughputBenchmark();
        await benchmark.runMemoryStressBenchmark();
        
        benchmark.printSummary();
        await benchmark.saveReport();
        
    } catch (error) {
        console.error('❌ Benchmark failed:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { PerformanceBenchmark };