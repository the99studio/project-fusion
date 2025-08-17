// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Tests for main index.ts exports
 */
import { describe, it, expect } from 'vitest';

describe('Index Exports', () => {
    it('should export core functionality from benchmark', async () => {
        const { BenchmarkTracker } = await import('../src/index.js');
        expect(BenchmarkTracker).toBeDefined();
        expect(typeof BenchmarkTracker).toBe('function');
    });

    it('should export core functionality from fusion', async () => {
        const { processFusion } = await import('../src/index.js');
        expect(processFusion).toBeDefined();
        expect(typeof processFusion).toBe('function');
    });

    it('should export programmatic API', async () => {
        const { 
            createConfig,
            fusionAPI,
            runFusion
        } = await import('../src/index.js');
        
        expect(createConfig).toBeDefined();
        expect(typeof createConfig).toBe('function');
        expect(fusionAPI).toBeDefined();
        expect(typeof fusionAPI).toBe('function');
        expect(runFusion).toBeDefined();
        expect(typeof runFusion).toBe('function');
    });

    it('should export schemas', async () => {
        const { ConfigSchemaV1 } = await import('../src/index.js');
        expect(ConfigSchemaV1).toBeDefined();
    });

    it('should export types', async () => {
        const { 
            FusionError,
            isValidExtensionGroup,
            isNonEmptyArray
        } = await import('../src/index.js');
        
        expect(FusionError).toBeDefined();
        expect(typeof FusionError).toBe('function');
        expect(isValidExtensionGroup).toBeDefined();
        expect(typeof isValidExtensionGroup).toBe('function');
        expect(isNonEmptyArray).toBeDefined();
        expect(typeof isNonEmptyArray).toBe('function');
    });

    it('should export utilities', async () => {
        const { 
            defaultConfig,
            loadConfig,
            getExtensionsFromGroups,
            formatTimestamp
        } = await import('../src/index.js');
        
        expect(defaultConfig).toBeDefined();
        expect(typeof defaultConfig).toBe('object');
        expect(loadConfig).toBeDefined();
        expect(typeof loadConfig).toBe('function');
        expect(getExtensionsFromGroups).toBeDefined();
        expect(typeof getExtensionsFromGroups).toBe('function');
        expect(formatTimestamp).toBeDefined();
        expect(typeof formatTimestamp).toBe('function');
    });

    it('should have consistent exports structure', async () => {
        const exports = await import('../src/index.js');
        
        // Verify no undefined exports
        const exportKeys = Object.keys(exports);
        expect(exportKeys.length).toBeGreaterThan(0);
        
        for (const key of exportKeys) {
            expect(exports[key as keyof typeof exports]).toBeDefined();
        }
    });
});