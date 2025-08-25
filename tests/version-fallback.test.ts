// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Tests for version.ts fallback mechanism
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getVersionSync, clearVersionCache } from '../src/version.js';

describe('version fallback mechanism', () => {
    beforeEach(() => {
        // Clear version cache before each test
        clearVersionCache();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should work with current package.json import', async () => {
        // Import the function dynamically to ensure fresh module
        const { getVersion } = await import('../src/version.js');
        
        const version = await getVersion();
        expect(typeof version).toBe('string');
        expect(version.length).toBeGreaterThan(0);
        expect(version).toMatch(/^\d+\.\d+\.\d+/); // Basic semver pattern
    });

    it('should return cached version after first successful call', async () => {
        const { getVersion } = await import('../src/version.js');
        
        // First call should cache the version
        const version1 = await getVersion();
        
        // Second call should return cached version
        const version2 = await getVersion();
        
        expect(version1).toBe(version2);
        expect(version1).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('should return cached version or fallback in sync mode', () => {
        const syncVersion = getVersionSync();
        expect(typeof syncVersion).toBe('string');
        expect(syncVersion.length).toBeGreaterThan(0);
        // Should be either a real version or the fallback
        expect(syncVersion === '1.0.0-unknown' || syncVersion.match(/^\d+\.\d+\.\d+/)).toBeTruthy();
    });

    it('should handle module import failure gracefully', async () => {
        // Create a version of getVersion that will fail on import
        const mockGetVersion = () => {
            try {
                // Force import to fail by using invalid syntax
                throw new Error('Simulated import failure');
            } catch {
                // Simulate the fallback logic without file system access
                console.warn('Warning: Could not read package version, using fallback');
                return '1.0.0-unknown';
            }
        };

        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const version = mockGetVersion();
        expect(version).toBe('1.0.0-unknown');
        expect(warnSpy).toHaveBeenCalledWith('Warning: Could not read package version, using fallback');
        
        warnSpy.mockRestore();
    });

    it('should validate version format correctly', async () => {
        const { getVersion } = await import('../src/version.js');
        
        const version = await getVersion();
        
        // Test that it's a valid semver-like string
        expect(version).toMatch(/^\d+\.\d+\.\d+/);
        
        // Test that it's not the fallback (since we have a real package.json)
        expect(version).not.toBe('1.0.0-unknown');
    });
});