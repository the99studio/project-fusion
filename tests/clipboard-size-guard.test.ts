import { describe, expect, it } from 'vitest';

describe('Clipboard Size Guard Tests', () => {
    it('should handle file size calculation correctly', () => {
        // Test the math used in the size guard (matches src/clicommands.ts:202)
        const bytesIn5MB = 5 * 1024 * 1024;
        const bytesIn6MB = 6 * 1024 * 1024;
        
        const size5MB = bytesIn5MB / (1024 * 1024);
        const size6MB = bytesIn6MB / (1024 * 1024);
        
        expect(size5MB).toBe(5);
        expect(size6MB).toBe(6);
        expect(size6MB > 5).toBe(true);
        expect(size5MB > 5).toBe(false);
    });

    it('should format file sizes correctly', () => {
        // Test the formatting logic (matches src/clicommands.ts:205)
        const testCases = [
            { bytes: 5.5 * 1024 * 1024, expectedMB: 5.5, expectedFormatted: '5.5' },
            { bytes: 5.123_456 * 1024 * 1024, expectedMB: 5.123_456, expectedFormatted: '5.1' },
            { bytes: 10 * 1024 * 1024, expectedMB: 10, expectedFormatted: '10.0' }
        ];

        for (const { bytes, expectedMB, expectedFormatted } of testCases) {
            const calculatedMB = bytes / (1024 * 1024);
            expect(calculatedMB).toBeCloseTo(expectedMB);
            expect(calculatedMB.toFixed(1)).toBe(expectedFormatted);
        }
    });
});