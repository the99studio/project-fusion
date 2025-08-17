// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Benchmark utilities for performance monitoring
 */
import { performance } from 'node:perf_hooks';
import process from 'node:process';

export interface BenchmarkMetrics {
    averageFileProcessingTime: number;
    duration: number;
    filesProcessed: number;
    memoryUsed: number;
    memoryUsedMB: number;
    processingTimeMs: number;
    throughputBytesPerSec: number;
    throughputMBps: number;
    totalBytesProcessed: number;
    totalSizeMB: number;
}

export class BenchmarkTracker {
    private readonly startTime: number;
    private readonly startMemory: NodeJS.MemoryUsage;
    private readonly fileTimings: number[] = [];
    private filesProcessed = 0;
    private totalBytes = 0;

    constructor() {
        this.startTime = Date.now();
        this.startMemory = process.memoryUsage();
    }

    /**
     * Record file processing metrics
     */
    markFileProcessed(sizeBytes: number, processingTimeMs?: number): void {
        this.filesProcessed++;
        this.totalBytes += sizeBytes;
        if (processingTimeMs !== undefined) {
            this.fileTimings.push(processingTimeMs);
        }
    }

    /**
     * Record file processing metrics (alias for compatibility)
     */
    recordFile(filename: string, sizeBytes: number): void {
        this.markFileProcessed(sizeBytes);
    }

    /**
     * Calculate and return performance metrics
     */
    getMetrics(): BenchmarkMetrics {
        const endTime = Date.now();
        const endMemory = process.memoryUsage();
        
        const processingTimeMs = endTime - this.startTime; // milliseconds
        const duration = processingTimeMs / 1000; // seconds
        const memoryUsed = (endMemory.heapUsed - this.startMemory.heapUsed) / (1024 * 1024); // MB
        const memoryUsedMB = endMemory.heapUsed / (1024 * 1024); // MB - current memory usage
        const totalSizeMB = this.totalBytes / (1024 * 1024);
        
        const averageFileProcessingTime = this.fileTimings.length > 0
            ? this.fileTimings.reduce((a, b) => a + b, 0) / this.fileTimings.length
            : 0;
        
        const throughputMBps = duration > 0 ? totalSizeMB / duration : 0;
        const throughputBytesPerSec = duration > 0 ? this.totalBytes / duration : 0;

        return {
            duration,
            memoryUsed,
            memoryUsedMB,
            processingTimeMs,
            filesProcessed: this.filesProcessed,
            totalBytesProcessed: this.totalBytes,
            totalSizeMB,
            averageFileProcessingTime,
            throughputMBps,
            throughputBytesPerSec
        };
    }

    /**
     * Log metrics to console
     */
    logMetrics(): void {
        const metrics = this.getMetrics();
        
        console.log('Performance Metrics');
        console.log(`Files processed: ${metrics.filesProcessed}`);
        console.log(`Total size: ${metrics.totalSizeMB.toFixed(2)} MB`);
        console.log(`Processing time: ${metrics.processingTimeMs.toFixed(2)} ms`);
        console.log(`Throughput: ${metrics.throughputMBps.toFixed(2)} MB/s`);
        console.log(`Memory used: ${metrics.memoryUsedMB.toFixed(2)} MB`);
    }

}