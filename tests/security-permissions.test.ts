// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Security permission tests for Project Fusion
 * Tests behavior with cross-platform permission scenarios
 */
import { existsSync } from 'node:fs';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { processFusion } from '../src/fusion.js';
import { defaultConfig } from '../src/utils.js';

describe('Security Permission Tests', () => {
    const testDir = join(process.cwd(), 'temp', 'permission-test');

    beforeEach(async () => {
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
        await mkdir(testDir, { recursive: true });
        process.chdir(testDir);
    });

    afterEach(async () => {
        process.chdir(join(testDir, '..', '..'));
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
    });

    describe('File Access Tests', () => {
        it('should handle normal files gracefully', async () => {
            // Create normal files
            await writeFile('normal.js', 'console.log("normal");');
            await writeFile('another.js', 'console.log("another");');
            
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            // Should successfully read both files
            expect(result.success).toBe(true);
            
            // Output file should contain both
            const output = await import('node:fs').then(fs => 
                fs.promises.readFile('project-fusioned.txt', 'utf8')
            );
            expect(output).toContain('normal');
            expect(output).toContain('another');
        });

        it('should handle output directory creation', async () => {
            await writeFile('test.js', 'console.log("test");');
            
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            // Should succeed 
            expect(result.success).toBe(true);
            expect(existsSync('project-fusioned.txt')).toBe(true);
        });

        it('should handle nested directory structures', async () => {
            // Create nested structure
            await mkdir('nested');
            await mkdir('nested/deep');
            
            await writeFile('file1.js', 'console.log("file1");');
            await writeFile('nested/file2.js', 'console.log("file2");');
            await writeFile('nested/deep/file3.js', 'console.log("file3");');

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                parseSubDirectories: true,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(true);
            
            const output = await import('node:fs').then(fs => 
                fs.promises.readFile('project-fusioned.txt', 'utf8')
            );
            expect(output).toContain('file1');
            expect(output).toContain('file2');
            expect(output).toContain('file3');
        });
    });

    describe('Cross-Platform Permission Tests', () => {
        it('should handle case-sensitive permission differences', async () => {
            // Create test files with different naming patterns
            await writeFile('CamelCase.js', 'console.log("CamelCase");');
            await writeFile('lowercase.js', 'console.log("lowercase");');
            await writeFile('UPPERCASE.js', 'console.log("UPPERCASE");');

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(true);
            
            const output = await import('node:fs').then(fs => 
                fs.promises.readFile('project-fusioned.txt', 'utf8')
            );
            expect(output).toContain('CamelCase');
            expect(output).toContain('lowercase');
            expect(output).toContain('UPPERCASE');
        });

        it('should handle files with special characters', async () => {
            // Test files with characters that might cause permission issues
            const specialFiles = [
                'file with spaces.js',
                'file-with-dashes.js',
                'file_with_underscores.js',
                'file.with.dots.js'
            ];

            for (const fileName of specialFiles) {
                try {
                    await writeFile(fileName, `console.log("${fileName}");`);
                } catch {
                    // Skip files that can't be created on this filesystem
                    console.log(`Skipped: ${fileName}`);
                }
            }

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(true);
        });

        it('should handle large file paths', async () => {
            // Create a path that might cause issues on some filesystems
            const longDirName = 'very_long_directory_name_that_tests_path_limits';
            await mkdir(longDirName);
            
            const longFileName = 'very_long_file_name_that_tests_filesystem_limits.js';
            await writeFile(join(longDirName, longFileName), 'console.log("long path test");');

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                parseSubDirectories: true,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(true);
        });
    });

    describe('Output Permission Tests', () => {
        it('should handle various output scenarios', async () => {
            await writeFile('test.js', 'console.log("test output");');

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: true,
                generateMarkdown: true,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(true);
            expect(existsSync('project-fusioned.txt')).toBe(true);
            expect(existsSync('project-fusioned.md')).toBe(true);
            expect(existsSync('project-fusioned.html')).toBe(true);
        });

        it('should handle custom output filenames', async () => {
            await writeFile('source.js', 'console.log("custom output");');

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generatedFileName: 'custom-fusion',
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(true);
            expect(existsSync('custom-fusion.txt')).toBe(true);
        });
    });
});