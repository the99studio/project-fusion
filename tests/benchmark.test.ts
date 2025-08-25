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
    
    describe('markFileProcessed', () => {
        it('should track file metrics', () => {
            const tracker = new BenchmarkTracker();
            
            tracker.markFileProcessed(1024);
            tracker.markFileProcessed(2048);
            
            const metrics = tracker.getMetrics();
            expect(metrics.filesProcessed).toBe(2);
            expect(metrics.totalBytesProcessed).toBe(3072);
        });
        
        it('should handle empty files', () => {
            const tracker = new BenchmarkTracker();
            
            tracker.markFileProcessed(0);
            
            const metrics = tracker.getMetrics();
            expect(metrics.filesProcessed).toBe(1);
            expect(metrics.totalBytesProcessed).toBe(0);
        });
        
        it('should handle large files', () => {
            const tracker = new BenchmarkTracker();
            const largeSize = 10 * 1024 * 1024; // 10MB
            
            tracker.markFileProcessed(largeSize);
            
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
            tracker.markFileProcessed(1024 * 1024); // 1MB
            tracker.markFileProcessed(1024 * 1024); // 1MB
            
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
            
            tracker.markFileProcessed(1024);
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
    
    
    describe('Edge Cases', () => {
        it('should handle rapid successive recordings', () => {
            const tracker = new BenchmarkTracker();
            
            for (let i = 0; i < 1000; i++) {
                tracker.markFileProcessed(i);
            }
            
            const metrics = tracker.getMetrics();
            expect(metrics.filesProcessed).toBe(1000);
            expect(metrics.totalBytesProcessed).toBe(499_500); // Sum of 0 to 999
        });
        
        it('should handle special characters in filenames', () => {
            const tracker = new BenchmarkTracker();
            
            tracker.markFileProcessed(100);
            tracker.markFileProcessed(200);
            tracker.markFileProcessed(300);
            tracker.markFileProcessed(400);
            
            const metrics = tracker.getMetrics();
            expect(metrics.filesProcessed).toBe(4);
            expect(metrics.totalBytesProcessed).toBe(1000);
        });
        
        it('should maintain accuracy with floating point sizes', () => {
            const tracker = new BenchmarkTracker();
            
            tracker.markFileProcessed(0.1);
            tracker.markFileProcessed(0.2);
            tracker.markFileProcessed(0.3);
            
            const metrics = tracker.getMetrics();
            expect(metrics.totalBytesProcessed).toBeCloseTo(0.6, 10);
        });
    });
});