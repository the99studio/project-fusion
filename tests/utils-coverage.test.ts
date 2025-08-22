// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Additional tests to achieve 100% coverage for utils.ts
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'node:path';
import { writeFile, mkdir, rm, chmod, readFile } from 'fs-extra';
import { existsSync } from 'node:fs';
import {
    loadConfig,
    writeLog,
    validateSecurePath,
    validateNoSymlinks,
    isBinaryFile,
    getMarkdownLanguage
} from '../src/utils.js';
import { FusionError } from '../src/types.js';

describe('Utils Coverage Tests', () => {
    const testDir = join(process.cwd(), 'temp', 'utils-coverage-test');
    const originalCwd = process.cwd();

    beforeEach(async () => {
        // Clear all mocks before each test
        vi.clearAllMocks();
        
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
        await mkdir(testDir, { recursive: true });
        process.chdir(testDir);
    });

    afterEach(async () => {
        process.chdir(originalCwd);
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
    });

    describe('loadConfig error handling', () => {
        it('should handle unknown validation errors', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            // Create config with invalid JSON structure
            await writeFile('project-fusion.json', '{"schemaVersion": []}');

            const config = await loadConfig();
            
            expect(config).toEqual(expect.objectContaining({
                schemaVersion: 1,
                generatedFileName: 'project-fusioned'
            }));
            
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Configuration validation failed'));
            
            consoleSpy.mockRestore();
        });

    });

    describe('writeLog error handling', () => {
        it('should handle log write errors gracefully', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            // Try to write to an invalid path
            await writeLog('/invalid/path/that/does/not/exist.log', 'test content');
            
            expect(consoleSpy).toHaveBeenCalledWith('Error writing log:', expect.any(Error));
            
            consoleSpy.mockRestore();
        });
    });


    describe('validateSecurePath error handling', () => {
        it('should detect path traversal attacks', () => {
            expect(() => {
                validateSecurePath('../../../etc/passwd', '/safe/directory');
            }).toThrow(FusionError);
        });

        it('should handle invalid paths', () => {
            expect(() => {
                validateSecurePath('\x00invalid', '/safe/directory');
            }).toThrow(FusionError);
        });

        it('should validate safe paths', () => {
            const safePath = validateSecurePath('./file.txt', process.cwd());
            expect(safePath).toBeDefined();
        });
    });

    describe('validateNoSymlinks', () => {
        it('should handle nonexistent files', async () => {
            const result = await validateNoSymlinks('/nonexistent/file.txt');
            expect(result).toBe(false);
        });

        it('should allow regular files', async () => {
            await writeFile('regular.txt', 'content');
            const result = await validateNoSymlinks('./regular.txt');
            expect(result).toBe(true);
        });
    });

    describe('isBinaryFile edge cases', () => {
        it('should handle empty files', async () => {
            await writeFile('empty.txt', '');
            const result = await isBinaryFile('./empty.txt');
            expect(result).toBe(false);
        });

        it('should detect binary files with null bytes', async () => {
            // Create a file with null bytes
            const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03]);
            await writeFile('binary.bin', binaryContent);
            
            const result = await isBinaryFile('./binary.bin');
            expect(result).toBe(true);
        });

        it('should detect files with high ratio of non-printable characters', async () => {
            // Create content with lots of non-printable characters
            const nonPrintableContent = Buffer.from(Array.from({ length: 1000 }, (_, i) => i % 256));
            await writeFile('nonprintable.bin', nonPrintableContent);
            
            const result = await isBinaryFile('./nonprintable.bin');
            expect(result).toBe(true);
        });

        it('should handle file read errors', async () => {
            // File that doesn't exist
            const result = await isBinaryFile('./nonexistent.txt');
            expect(result).toBe(false);
        });

        it('should handle files with undefined bytes gracefully', async () => {
            // This tests the byte checking logic with edge cases
            const content = Buffer.alloc(100);
            content.fill(32); // Fill with spaces (printable)
            await writeFile('spaces.txt', content);
            
            const result = await isBinaryFile('./spaces.txt');
            expect(result).toBe(false);
        });
    });

    describe('getMarkdownLanguage comprehensive mapping', () => {
        it('should handle case sensitivity', () => {
            expect(getMarkdownLanguage('.JS')).toBe('javascript');
            expect(getMarkdownLanguage('.dockerfile')).toBe('dockerfile');
            expect(getMarkdownLanguage('Dockerfile')).toBe('dockerfile');
        });

        it('should handle special file basenames', () => {
            expect(getMarkdownLanguage('Makefile')).toBe('makefile');
            expect(getMarkdownLanguage('Gemfile')).toBe('ruby');
            expect(getMarkdownLanguage('Vagrantfile')).toBe('ruby');
            expect(getMarkdownLanguage('requirements.txt')).toBe('text');
        });

        it('should fall back to text for unknown extensions', () => {
            expect(getMarkdownLanguage('.unknown')).toBe('text');
            expect(getMarkdownLanguage('.weird-extension')).toBe('text');
            expect(getMarkdownLanguage('')).toBe('text');
        });

        it('should handle all supported languages', () => {
            // Test a comprehensive set of languages
            const testCases = [
                ['.py', 'python'],
                ['.rs', 'rust'],
                ['.go', 'go'],
                ['.java', 'java'],
                ['.cpp', 'cpp'],
                ['.c', 'c'],
                ['.h', 'c'],
                ['.hpp', 'cpp'],
                ['.cs', 'csharp'],
                ['.php', 'php'],
                ['.rb', 'ruby'],
                ['.html', 'html'],
                ['.css', 'css'],
                ['.js', 'javascript'],
                ['.ts', 'typescript'],
                ['.jsx', 'jsx'],
                ['.tsx', 'tsx'],
                ['.vue', 'vue'],
                ['.json', 'json'],
                ['.yaml', 'yaml'],
                ['.yml', 'yaml'],
                ['.toml', 'toml'],
                ['.xml', 'xml'],
                ['.md', 'markdown'],
                ['.sh', 'bash'],
                ['.bash', 'bash'],
                ['.ps1', 'powershell'],
                ['.sql', 'sql'],
                ['.gd', 'gdscript']
            ];

            for (const [ext, expected] of testCases) {
                expect(getMarkdownLanguage(ext)).toBe(expected);
            }
        });
    });
});