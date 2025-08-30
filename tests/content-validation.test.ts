// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Content validation tests for Project Fusion
 */
import { describe, expect, it } from 'vitest';
import { MemoryFileSystemAdapter } from '../src/adapters/file-system.js';
import { processFusion } from '../src/fusion.js';
import { createFilePath, type Config } from '../src/types.js';
import { validateFileContent, isMinifiedContent, defaultConfig } from '../src/utils.js';

// Shared test configuration factory for better consistency
const createTestConfig = (overrides: Partial<Config> = {}): Config => ({
    ...defaultConfig,
    generateHtml: false,
    generateMarkdown: false,
    generateText: true,
    rootDirectory: '.',
    parsedFileExtensions: { web: ['.js'] },
    ...overrides
});

describe('Content Validation Tests', () => {
    describe('Base64 Block Detection', () => {
        const validationConfig: Config = {
            ...defaultConfig,
            maxBase64BlockKB: 2,
            maxLineLength: 5000,
            maxTokenLength: 2000,
        };

        it('should reject large base64 blocks', () => {
            // Create a base64 string larger than 2KB
            const largeBase64 = `${'A'.repeat(3000)  }=`; // ~3KB when decoded
            const content = `const data = "${largeBase64}";`;
            
            const result = validateFileContent(content, 'test.js', validationConfig);
            
            expect(result.issues.hasLargeBase64).toBe(true);
            expect(result.issues.base64BlockSize).toBeGreaterThan(2);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('Large base64 block detected');
            expect(result.valid).toBe(false);
        });

        it('should allow small base64 blocks', () => {
            const smallBase64 = 'SGVsbG9Xb3JsZA=='; // "HelloWorld" encoded
            const content = `const data = "${smallBase64}";`;
            
            const result = validateFileContent(content, 'test.js', validationConfig);
            
            expect(result.issues.hasLargeBase64).toBeFalsy();
            expect(result.warnings).toHaveLength(0);
            expect(result.valid).toBe(true);
        });
    });

    describe('Long Line Detection', () => {
        const validationConfig: Config = {
            ...defaultConfig,
            maxBase64BlockKB: 2,
            maxLineLength: 100, // Very short for testing
            maxTokenLength: 2000,
        };

        it('should reject long lines', () => {
            const longLine = 'a'.repeat(150);
            const content = `Short line\n${longLine}\nAnother short line`;
            
            const result = validateFileContent(content, 'test.js', validationConfig);
            
            expect(result.issues.hasLongLines).toBe(true);
            expect(result.issues.maxLineLength).toBe(150);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('Long line detected');
            expect(result.valid).toBe(false);
        });

        it('should allow normal line lengths', () => {
            const content = 'Normal line\nAnother normal line\nShort';
            
            const result = validateFileContent(content, 'test.js', validationConfig);
            
            expect(result.issues.hasLongLines).toBeFalsy();
            expect(result.warnings).toHaveLength(0);
            expect(result.valid).toBe(true);
        });
    });

    describe('Long Token Detection', () => {
        const validationConfig: Config = {
            ...defaultConfig,
            maxBase64BlockKB: 2,
            maxLineLength: 5000,
            maxTokenLength: 50, // Very short for testing
        };

        it('should reject long tokens (minified content)', () => {
            const longToken = 'a'.repeat(100);
            const content = `function test() { var ${longToken} = 1; }`;
            
            const result = validateFileContent(content, 'test.js', validationConfig);
            
            expect(result.issues.hasLongTokens).toBe(true);
            expect(result.issues.maxTokenLength).toBeGreaterThan(50);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('Long token detected');
            expect(result.errors[0]).toContain('possible minified content');
            expect(result.valid).toBe(false);
        });

        it('should allow normal token lengths', () => {
            const content = 'function test() { return true; }';
            
            const result = validateFileContent(content, 'test.js', validationConfig);
            
            expect(result.issues.hasLongTokens).toBeFalsy();
            expect(result.warnings).toHaveLength(0);
            expect(result.valid).toBe(true);
        });
    });

    describe('Multiple Issues Detection', () => {
        const validationConfig: Config = {
            ...defaultConfig,
            maxBase64BlockKB: 1,
            maxLineLength: 50,
            maxTokenLength: 30,
        };

        it('should detect multiple issues in a single file', () => {
            const largeBase64 = 'A'.repeat(1500);
            const longLine = 'b'.repeat(100);
            const longToken = 'c'.repeat(60);
            const content = `const data="${largeBase64}";\n${longLine}\nvar ${longToken}=1;`;
            
            const result = validateFileContent(content, 'test.js', validationConfig);
            
            expect(result.issues.hasLargeBase64).toBe(true);
            expect(result.issues.hasLongLines).toBe(true);
            expect(result.issues.hasLongTokens).toBe(true);
            expect(result.errors).toHaveLength(3);
            expect(result.valid).toBe(false);
        });
    });

    describe('Minified Content Detection', () => {
        it('should detect files with .min. in path as minified', () => {
            const content = 'normal content';
            expect(isMinifiedContent(content, 'script.min.js')).toBe(true);
            expect(isMinifiedContent(content, 'style.min.css')).toBe(true);
        });

        it('should detect content with very long lines as minified', () => {
            const longLine = 'a'.repeat(6000);
            expect(isMinifiedContent(longLine, 'script.js')).toBe(true);
        });

        it('should detect content with high average line length as minified', () => {
            const longContent = new Array(20).fill('a'.repeat(800)).join('\n');
            expect(isMinifiedContent(longContent, 'script.js')).toBe(true);
        });

        it('should not detect normal code as minified', () => {
            const normalContent = `
                function hello() {
                    console.log("Hello World");
                    return true;
                }
            `;
            expect(isMinifiedContent(normalContent, 'script.js')).toBe(false);
        });
    });

    describe('Integration with Fusion Process', () => {
        it('should include error placeholders for rejected files by default (strict mode)', async () => {
            const memFS = new MemoryFileSystemAdapter();
            
            const largeBase64 = 'A'.repeat(3000);
            memFS.addFile('problem.js', `const data="${largeBase64}";`);
            memFS.addFile('normal.js', 'console.log("hello");');
            
            const config = createTestConfig();

            await processFusion(config, { fs: memFS });
            
            const output = await memFS.readFile(createFilePath('project-fusioned.txt'));
            
            // Should contain error placeholder for problematic file
            expect(output).toContain('[ERROR: Content validation failed for problem.js]');
            expect(output).toContain('Large base64 block detected');
            expect(output).toContain('To include this file anyway, adjust validation limits in your config');
            
            // Should still contain normal file content
            expect(output).toContain('console.log("hello")');
            expect(output).toContain('FILE: normal.js');
        });

        it('should handle minified content appropriately', async () => {
            const memFS = new MemoryFileSystemAdapter();
            
            const minifiedContent = `var a=${  'x'.repeat(1600)}`; // Long line
            memFS.addFile('minified.js', minifiedContent);
            memFS.addFile('normal.js', 'console.log("hello");');
            
            const config = createTestConfig();

            const result = await processFusion(config, { fs: memFS });
            
            // Check if the fusion process handled minified content
            expect(result.success).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        const validationConfig: Config = {
            ...defaultConfig,
            maxBase64BlockKB: 2,
            maxLineLength: 100,
            maxTokenLength: 50,
        };

        it('should handle empty files', () => {
            const result = validateFileContent('', 'empty.js', validationConfig);
            
            expect(result.valid).toBe(true);
            expect(result.warnings).toHaveLength(0);
            expect(result.errors).toHaveLength(0);
        });

        it('should handle files with only whitespace', () => {
            const content = '   \n\t\n   ';
            const result = validateFileContent(content, 'whitespace.js', validationConfig);
            
            expect(result.valid).toBe(true);
            expect(result.warnings).toHaveLength(0);
        });

        it('should handle files with mixed line endings', () => {
            const content = 'line1\r\nline2\nline3\rline4';
            const result = validateFileContent(content, 'mixed.js', validationConfig);
            
            expect(result.valid).toBe(true);
        });
    });
});