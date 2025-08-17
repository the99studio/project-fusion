// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Tests for benchmark functionality
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { BenchmarkTracker } from '../src/benchmark.js';

describe('BenchmarkTracker', () => {
    let originalMemoryUsage: NodeJS.MemoryUsage;
    
    beforeEach(() => {
        // Mock process.memoryUsage
        originalMemoryUsage = process.memoryUsage();
        vi.spyOn(process, 'memoryUsage').mockReturnValue({
            rss: 100 * 1024 * 1024, // 100MB
            heapTotal: 80 * 1024 * 1024,
            heapUsed: 50 * 1024 * 1024,
            external: 10 * 1024 * 1024,
            arrayBuffers: 5 * 1024 * 1024
        });
    });
    
    afterEach(() => {
        vi.restoreAllMocks();
    });
    
    describe('constructor', () => {
        it('should initialize with zero values', () => {
            const tracker = new BenchmarkTracker();
            const metrics = tracker.getMetrics();
            
            expect(metrics.filesProcessed).toBe(0);
            expect(metrics.totalBytesProcessed).toBe(0);
            expect(metrics.memoryUsedMB).toBeGreaterThan(0);
            expect(metrics.processingTimeMs).toBeGreaterThanOrEqual(0);
        });
    });
    
    describe('recordFile', () => {
        it('should track file metrics', () => {
            const tracker = new BenchmarkTracker();
            
            tracker.recordFile('file1.js', 1024);
            tracker.recordFile('file2.ts', 2048);
            
            const metrics = tracker.getMetrics();
            expect(metrics.filesProcessed).toBe(2);
            expect(metrics.totalBytesProcessed).toBe(3072);
        });
        
        it('should handle empty files', () => {
            const tracker = new BenchmarkTracker();
            
            tracker.recordFile('empty.txt', 0);
            
            const metrics = tracker.getMetrics();
            expect(metrics.filesProcessed).toBe(1);
            expect(metrics.totalBytesProcessed).toBe(0);
        });
        
        it('should handle large files', () => {
            const tracker = new BenchmarkTracker();
            const largeSize = 10 * 1024 * 1024; // 10MB
            
            tracker.recordFile('large.bin', largeSize);
            
            const metrics = tracker.getMetrics();
            expect(metrics.filesProcessed).toBe(1);
            expect(metrics.totalBytesProcessed).toBe(largeSize);
        });
    });
    
    describe('getMetrics', () => {
        it('should calculate processing time', async () => {
            const tracker = new BenchmarkTracker();
            
            // Wait a bit to ensure processing time > 0
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const metrics = tracker.getMetrics();
            expect(metrics.processingTimeMs).toBeGreaterThan(0);
        });
        
        it('should calculate throughput correctly', () => {
            const tracker = new BenchmarkTracker();
            
            // Add files
            tracker.recordFile('file1.txt', 1024 * 1024); // 1MB
            tracker.recordFile('file2.txt', 1024 * 1024); // 1MB
            
            const metrics = tracker.getMetrics();
            
            // Throughput should be total bytes / time in seconds
            if (metrics.processingTimeMs > 0) {
                const expectedThroughput = (2 * 1024 * 1024) / (metrics.processingTimeMs / 1000);
                expect(metrics.throughputBytesPerSec).toBeCloseTo(expectedThroughput, 0);
            }
        });
        
        it('should handle zero processing time', () => {
            const tracker = new BenchmarkTracker();
            
            // Mock Date.now to return same value
            const now = Date.now();
            vi.spyOn(Date, 'now').mockReturnValue(now);
            
            tracker.recordFile('instant.txt', 1024);
            const metrics = tracker.getMetrics();
            
            expect(metrics.processingTimeMs).toBe(0);
            expect(metrics.throughputBytesPerSec).toBe(0);
        });
        
        it('should report memory usage', () => {
            const tracker = new BenchmarkTracker();
            const metrics = tracker.getMetrics();
            
            // Based on our mock: 50MB heap used
            expect(metrics.memoryUsedMB).toBeCloseTo(50, 1);
        });
    });
    
    describe('logMetrics', () => {
        it('should log metrics to console', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            const tracker = new BenchmarkTracker();
            
            tracker.recordFile('test.txt', 1024);
            tracker.logMetrics();
            
            expect(consoleSpy).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Performance Metrics'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Files processed'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total size'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Processing time'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Throughput'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Memory used'));
            
            consoleSpy.mockRestore();
        });
        
        it('should format large numbers correctly', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            const tracker = new BenchmarkTracker();
            
            // Add a large file
            tracker.recordFile('large.bin', 5 * 1024 * 1024); // 5MB
            tracker.logMetrics();
            
            // Check that MB formatting is used
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('5.00 MB'));
            
            consoleSpy.mockRestore();
        });
        
        it('should handle multiple file recordings', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            const tracker = new BenchmarkTracker();
            
            for (let i = 0; i < 100; i++) {
                tracker.recordFile(`file${i}.txt`, 1024);
            }
            
            tracker.logMetrics();
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('100'));
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('0.10 MB')); // 100KB
            
            consoleSpy.mockRestore();
        });
    });
    
    describe('Edge Cases', () => {
        it('should handle rapid successive recordings', () => {
            const tracker = new BenchmarkTracker();
            
            for (let i = 0; i < 1000; i++) {
                tracker.recordFile(`file${i}`, i);
            }
            
            const metrics = tracker.getMetrics();
            expect(metrics.filesProcessed).toBe(1000);
            expect(metrics.totalBytesProcessed).toBe(499500); // Sum of 0 to 999
        });
        
        it('should handle special characters in filenames', () => {
            const tracker = new BenchmarkTracker();
            
            tracker.recordFile('file with spaces.txt', 100);
            tracker.recordFile('file-with-dashes.js', 200);
            tracker.recordFile('file_with_underscores.py', 300);
            tracker.recordFile('文件.txt', 400);
            
            const metrics = tracker.getMetrics();
            expect(metrics.filesProcessed).toBe(4);
            expect(metrics.totalBytesProcessed).toBe(1000);
        });
        
        it('should maintain accuracy with floating point sizes', () => {
            const tracker = new BenchmarkTracker();
            
            tracker.recordFile('file1', 0.1);
            tracker.recordFile('file2', 0.2);
            tracker.recordFile('file3', 0.3);
            
            const metrics = tracker.getMetrics();
            expect(metrics.totalBytesProcessed).toBeCloseTo(0.6, 10);
        });
    });
});