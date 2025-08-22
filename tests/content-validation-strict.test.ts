/**
 * Tests for strict content validation behavior using in-memory files
 */
import { describe, it, expect } from 'vitest';
import { processFusion } from '../src/fusion.js';
import { MemoryFileSystemAdapter } from '../src/adapters/file-system.js';
import { defaultConfig } from '../src/utils.js';
import { type Config, createFilePath } from '../src/types.js';

describe('Strict Content Validation (In-Memory)', () => {
    describe('Error Placeholders for Rejected Files', () => {
        it('should include error placeholder for files with large base64 blocks', async () => {
            const memFS = new MemoryFileSystemAdapter();
            
            // Create problematic file in memory only
            const largeBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.repeat(100); // ~3.5KB base64
            
            memFS.addFile('problematic.js', `const imageData = "${largeBase64}";`);
            memFS.addFile('normal.js', 'console.log("hello");');
            
            const config: Config = {
                ...defaultConfig,
                rootDirectory: '.',
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
                // Using default strict contentValidation
            };

            const result = await processFusion(config, { fs: memFS });
            
            expect(result.success).toBe(true);
            expect(result.filesProcessed).toBe(2); // Both files processed
            
            // Read the generated content from the correct path
            const output = await memFS.readFile(createFilePath('project-fusioned.txt'));
            
            // Should contain error placeholder for problematic file
            expect(output).toContain('[ERROR: Content validation failed for problematic.js]');
            expect(output).toContain('Large base64 block detected');
            expect(output).toContain('To include this file anyway, adjust validation limits in your config');
            
            // Should still contain normal file content
            expect(output).toContain('console.log("hello")');
            expect(output).toContain('FILE: normal.js');
        });

        it('should include error placeholder for files with long lines', async () => {
            const memFS = new MemoryFileSystemAdapter();
            
            // Create file with very long line in memory
            const longLine = 'var ' + 'a'.repeat(6000) + ' = "test";'; // 6000+ chars
            
            memFS.addFile('minified.js', longLine);
            memFS.addFile('normal.js', 'const x = 1;');
            
            const config: Config = {
                ...defaultConfig,
                rootDirectory: '.',
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config, { fs: memFS });
            
            expect(result.success).toBe(true);
            expect(result.filesProcessed).toBe(2);
            
            const output = await memFS.readFile(createFilePath('project-fusioned.txt'));
            
            // Should contain error placeholder
            expect(output).toContain('[ERROR: Content validation failed for minified.js]');
            expect(output).toContain('Long line detected');
            expect(output).toContain('6014 chars');
            
            // Normal file should be fine
            expect(output).toContain('const x = 1;');
        });

        it('should include error placeholder for files with long tokens', async () => {
            const memFS = new MemoryFileSystemAdapter();
            
            // Create file with very long token (non-base64)
            const longToken = 'function_' + 'x'.repeat(2500) + '_end'; // 2500+ chars
            
            memFS.addFile('obfuscated.js', `var ${longToken} = true;`);
            memFS.addFile('clean.js', 'function hello() { return "world"; }');
            
            const config: Config = {
                ...defaultConfig,
                rootDirectory: '.',
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config, { fs: memFS });
            
            expect(result.success).toBe(true);
            expect(result.filesProcessed).toBe(2);
            
            const output = await memFS.readFile(createFilePath('project-fusioned.txt'));
            
            expect(output).toContain('[ERROR: Content validation failed for obfuscated.js]');
            expect(output).toContain('Long token detected');
            expect(output).toContain('possible minified content');
            
            expect(output).toContain('function hello()');
        });

        it('should handle multiple validation issues in one file', async () => {
            const memFS = new MemoryFileSystemAdapter();
            
            // File with multiple issues
            const largeBase64 = 'A'.repeat(3000); // Large base64
            const longLine = 'x'.repeat(6000);    // Long line
            const content = `const data="${largeBase64}"; // ${longLine}`;
            
            memFS.addFile('disaster.js', content);
            memFS.addFile('good.js', 'console.log("ok");');
            
            const config: Config = {
                ...defaultConfig,
                rootDirectory: '.',
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config, { fs: memFS });
            
            const output = await memFS.readFile(createFilePath('project-fusioned.txt'));
            
            expect(output).toContain('[ERROR: Content validation failed for disaster.js]');
            expect(output).toContain('Large base64 block detected');
            expect(output).toContain('Long line detected');
        });
    });

    describe('Format-Specific Error Display', () => {
        it('should display error placeholders correctly in Markdown', async () => {
            const memFS = new MemoryFileSystemAdapter();
            
            const largeBase64 = 'A'.repeat(3000);
            memFS.addFile('bad.js', `const data="${largeBase64}";`);
            
            const config: Config = {
                ...defaultConfig,
                rootDirectory: '.',
                generateHtml: false,
                generateMarkdown: true,
                generateText: false,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config, { fs: memFS });
            
            const output = await memFS.readFile(createFilePath('project-fusioned.md'));
            
            expect(output).toContain('## ⚠️ bad.js');
            expect(output).toContain('> **Content Validation Error**');
            expect(output).toContain('[ERROR: Content validation failed for bad.js]');
        });

        it('should display error placeholders correctly in HTML', async () => {
            const memFS = new MemoryFileSystemAdapter();
            
            const longLine = 'x'.repeat(6000);
            memFS.addFile('minified.js', longLine);
            
            const config: Config = {
                ...defaultConfig,
                rootDirectory: '.',
                generateHtml: true,
                generateMarkdown: false,
                generateText: false,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config, { fs: memFS });
            
            const output = await memFS.readFile(createFilePath('project-fusioned.html'));
            
            expect(output).toContain('⚠️ minified.js');
            expect(output).toContain('error-section');
            expect(output).toContain('role="alert"');
            expect(output).toContain('background: #fee');
        });
    });

});