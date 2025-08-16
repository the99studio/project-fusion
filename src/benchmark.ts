/**
 * Benchmark utilities for performance monitoring
 */
import { performance } from 'perf_hooks';
import process from 'process';

export interface BenchmarkMetrics {
    duration: number;
    memoryUsed: number;
    filesProcessed: number;
    totalSizeMB: number;
    averageFileProcessingTime: number;
    throughputMBps: number;
}

export class BenchmarkTracker {
    private startTime: number;
    private startMemory: NodeJS.MemoryUsage;
    private fileTimings: number[] = [];
    private filesProcessed = 0;
    private totalBytes = 0;

    constructor() {
        this.startTime = performance.now();
        this.startMemory = process.memoryUsage();
    }

    /**
     * Mark a file as processed with its size
     */
    markFileProcessed(sizeBytes: number, processingTimeMs?: number) {
        this.filesProcessed++;
        this.totalBytes += sizeBytes;
        if (processingTimeMs !== undefined) {
            this.fileTimings.push(processingTimeMs);
        }
    }

    /**
     * Get current metrics
     */
    getMetrics(): BenchmarkMetrics {
        const endTime = performance.now();
        const endMemory = process.memoryUsage();
        
        const duration = (endTime - this.startTime) / 1000; // seconds
        const memoryUsed = (endMemory.heapUsed - this.startMemory.heapUsed) / (1024 * 1024); // MB
        const totalSizeMB = this.totalBytes / (1024 * 1024);
        
        const averageFileProcessingTime = this.fileTimings.length > 0
            ? this.fileTimings.reduce((a, b) => a + b, 0) / this.fileTimings.length
            : 0;
        
        const throughputMBps = duration > 0 ? totalSizeMB / duration : 0;

        return {
            duration,
            memoryUsed,
            filesProcessed: this.filesProcessed,
            totalSizeMB,
            averageFileProcessingTime,
            throughputMBps
        };
    }

    /**
     * Format metrics for display
     */
    formatMetrics(): string {
        const metrics = this.getMetrics();
        return [
            `Performance Metrics:`,
            `  Duration: ${metrics.duration.toFixed(2)}s`,
            `  Memory Used: ${metrics.memoryUsed.toFixed(2)} MB`,
            `  Files Processed: ${metrics.filesProcessed}`,
            `  Total Size: ${metrics.totalSizeMB.toFixed(2)} MB`,
            `  Average File Processing Time: ${metrics.averageFileProcessingTime.toFixed(2)} ms`,
            `  Throughput: ${metrics.throughputMBps.toFixed(2)} MB/s`
        ].join('\n');
    }
}