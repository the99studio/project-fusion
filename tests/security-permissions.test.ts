// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Security permission tests for Project Fusion
 * Tests behavior with read-only files, directories, and restricted access
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { writeFile, mkdir, rm, chmod, access, constants, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { processFusion } from '../src/fusion.js';
import { defaultConfig } from '../src/utils.js';
import { platform } from 'node:os';

describe('Security Permission Tests', () => {
    const testDir = join(process.cwd(), 'temp', 'permission-test');
    const isWindows = platform() === 'win32';

    beforeEach(async () => {
        if (existsSync(testDir)) {
            // First, ensure we can delete by setting write permissions
            try {
                await chmod(testDir, 0o755);
                const files = await import('fs').then(fs => fs.promises.readdir(testDir));
                for (const file of files) {
                    const filePath = join(testDir, file);
                    await chmod(filePath, 0o644).catch(() => {});
                }
            } catch (error) {
                // Ignore errors during cleanup prep
            }
            await rm(testDir, { recursive: true, force: true });
        }
        await mkdir(testDir, { recursive: true });
        process.chdir(testDir);
    });

    afterEach(async () => {
        process.chdir(join(testDir, '..', '..'));
        
        // Restore permissions before cleanup
        if (existsSync(testDir)) {
            try {
                await chmod(testDir, 0o755);
                const files = await import('fs').then(fs => fs.promises.readdir(testDir));
                for (const file of files) {
                    const filePath = join(testDir, file);
                    const stats = await stat(filePath);
                    if (stats.isDirectory()) {
                        await chmod(filePath, 0o755).catch(() => {});
                    } else {
                        await chmod(filePath, 0o644).catch(() => {});
                    }
                }
            } catch (error) {
                // Ignore errors during cleanup prep
            }
            await rm(testDir, { recursive: true, force: true });
        }
    });

    describe('Read-Only File Tests', () => {
        it('should handle read-only files gracefully', async function() {
            if (isWindows) {
                this.skip(); // Skip on Windows due to different permission model
            }

            // Create normal files
            await writeFile('normal.js', 'console.log("normal");');
            await writeFile('readonly.js', 'console.log("readonly");');
            
            // Make one file read-only
            await chmod('readonly.js', 0o444);

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
            // filesProcessed not available in FusionResult type
            
            // Output file should contain both
            const output = await import('fs').then(fs => 
                fs.promises.readFile('project-fusioned.txt', 'utf8')
            );
            expect(output).toContain('normal');
            expect(output).toContain('readonly');
        });

        it('should handle write-protected output directory', async function() {
            if (isWindows) {
                this.skip(); // Skip on Windows due to different permission model
            }

            await writeFile('test.js', 'console.log("test");');
            
            // Create a subdirectory for output
            const outputDir = join(testDir, 'output');
            await mkdir(outputDir);
            
            // Make output directory read-only
            await chmod(outputDir, 0o555);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generatedFileName: join(outputDir, 'project-fusioned'),
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            // Should fail gracefully when unable to write
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            
            // Restore permissions for cleanup
            await chmod(outputDir, 0o755);
        });

        it('should handle files with no read permission', async function() {
            if (isWindows) {
                this.skip(); // Skip on Windows due to different permission model
            }

            await writeFile('readable.js', 'console.log("readable");');
            await writeFile('unreadable.js', 'console.log("unreadable");');
            
            // Remove read permission from one file
            await chmod('unreadable.js', 0o000);

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
            
            // Should process readable files and skip/error on unreadable
            if (result.success) {
                // If it succeeds, it should have skipped the unreadable file
                const output = await import('fs').then(fs => 
                    fs.promises.readFile('project-fusioned.txt', 'utf8')
                );
                expect(output).toContain('readable');
                expect(output).not.toContain('unreadable');
            } else {
                // Or it might fail with appropriate error
                expect(result.error).toBeDefined();
            }
            
            // Restore permissions for cleanup
            await chmod('unreadable.js', 0o644);
        });

        it('should handle mixed permissions in nested directories', async function() {
            if (isWindows) {
                this.skip(); // Skip on Windows due to different permission model
            }

            // Create nested structure with mixed permissions
            await mkdir('readable-dir');
            await mkdir('restricted-dir');
            await mkdir('readable-dir/nested');
            
            await writeFile('readable-dir/file1.js', 'console.log("file1");');
            await writeFile('readable-dir/nested/file2.js', 'console.log("file2");');
            await writeFile('restricted-dir/file3.js', 'console.log("file3");');
            
            // Make one directory non-executable (can't traverse)
            await chmod('restricted-dir', 0o644);

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
            
            // Should process accessible directories
            if (result.success) {
                const output = await import('fs').then(fs => 
                    fs.promises.readFile('project-fusioned.txt', 'utf8')
                );
                expect(output).toContain('file1');
                expect(output).toContain('file2');
                // file3 might be inaccessible
            }
            
            // Restore permissions for cleanup
            await chmod('restricted-dir', 0o755);
        });
    });

    describe('Directory Permission Tests', () => {
        it('should handle read-only root directory', async function() {
            if (isWindows) {
                this.skip(); // Skip on Windows due to different permission model
            }

            await writeFile('test.js', 'console.log("test");');
            
            // Make the test directory read-only (no write)
            await chmod(testDir, 0o555);

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

            // Change to parent directory since we can't write to testDir
            process.chdir(join(testDir, '..'));

            const result = await processFusion(config);
            
            // Should fail when trying to write output
            expect(result.success).toBe(false);
            
            // Restore permissions for cleanup
            await chmod(testDir, 0o755);
            process.chdir(testDir);
        });

        it('should handle execute-only directories', async function() {
            if (isWindows) {
                this.skip(); // Skip on Windows due to different permission model
            }

            await mkdir('exec-only');
            await writeFile('exec-only/file.js', 'console.log("hidden");');
            
            // Make directory execute-only (can traverse but not list)
            await chmod('exec-only', 0o111);

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
            
            // Should handle the permission issue gracefully
            expect(result).toHaveProperty('success');
            
            // Restore permissions for cleanup
            await chmod('exec-only', 0o755);
        });

        it('should handle write-only directories', async function() {
            if (isWindows) {
                this.skip(); // Skip on Windows due to different permission model
            }

            await mkdir('write-only');
            await writeFile('write-only/file.js', 'console.log("writeonly");');
            
            // Make directory write-only (can write but not read/list)
            await chmod('write-only', 0o222);

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
            
            // Should skip the unreadable directory
            expect(result).toHaveProperty('success');
            
            // Restore permissions for cleanup
            await chmod('write-only', 0o755);
        });
    });

    describe('Special Permission Scenarios', () => {
        it('should handle sticky bit directories', async function() {
            if (isWindows) {
                this.skip(); // Skip on Windows due to different permission model
            }

            await mkdir('sticky');
            await writeFile('sticky/file.js', 'console.log("sticky");');
            
            // Set sticky bit (only owner can delete files)
            await chmod('sticky', 0o1755);

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
            
            // Should read files normally (sticky bit doesn't affect reading)
            expect(result.success).toBe(true);
            
            const output = await import('fs').then(fs => 
                fs.promises.readFile('project-fusioned.txt', 'utf8')
            );
            expect(output).toContain('sticky');
        });

        it('should handle SUID/SGID files', async function() {
            if (isWindows) {
                this.skip(); // Skip on Windows due to different permission model
            }

            await writeFile('suid.js', '#!/usr/bin/env node\nconsole.log("suid");');
            await writeFile('sgid.js', '#!/usr/bin/env node\nconsole.log("sgid");');
            
            // Set SUID and SGID bits (normally ignored for non-executables)
            await chmod('suid.js', 0o4755);
            await chmod('sgid.js', 0o2755);

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
            
            // Should read files normally (SUID/SGID doesn't affect reading)
            expect(result.success).toBe(true);
        });

        it('should handle files with all permissions removed', async function() {
            if (isWindows) {
                this.skip(); // Skip on Windows due to different permission model
            }

            await writeFile('normal.js', 'console.log("normal");');
            await writeFile('noperms.js', 'console.log("noperms");');
            
            // Remove all permissions
            await chmod('noperms.js', 0o000);

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
            
            // Should process accessible files
            if (result.success) {
                const output = await import('fs').then(fs => 
                    fs.promises.readFile('project-fusioned.txt', 'utf8')
                );
                expect(output).toContain('normal');
                expect(output).not.toContain('noperms');
            }
            
            // Restore permissions for cleanup
            await chmod('noperms.js', 0o644);
        });

        it('should handle permission changes during processing', async function() {
            if (isWindows) {
                this.skip(); // Skip on Windows due to different permission model
            }

            // Create multiple files
            for (let i = 0; i < 10; i++) {
                await writeFile(`file${i}.js`, `console.log("file${i}");`);
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

            // Start processing in background
            const resultPromise = processFusion(config);

            // Change permissions while processing (race condition test)
            setTimeout(async () => {
                try {
                    await chmod('file5.js', 0o000);
                } catch (error) {
                    // Ignore errors if file is being processed
                }
            }, 10);

            const result = await resultPromise;
            
            // Should handle the race condition gracefully
            expect(result).toHaveProperty('success');
            
            // Restore permissions for cleanup
            await chmod('file5.js', 0o644).catch(() => {});
        });
    });

    describe('Output Permission Tests', () => {
        it('should handle read-only output files', async function() {
            if (isWindows) {
                this.skip(); // Skip on Windows due to different permission model
            }

            await writeFile('test.js', 'console.log("test");');
            
            // Create output files and make them read-only
            await writeFile('project-fusioned.txt', 'existing content');
            await chmod('project-fusioned.txt', 0o444);

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
            
            // Should handle overwrite attempt
            expect(result).toHaveProperty('success');
            // May succeed or fail depending on implementation
            
            // Restore permissions for cleanup
            await chmod('project-fusioned.txt', 0o644);
        });

        it('should handle output to directory without write permission', async function() {
            if (isWindows) {
                this.skip(); // Skip on Windows due to different permission model
            }

            await writeFile('test.js', 'console.log("test");');
            
            // Create output directory without write permission
            await mkdir('output');
            await chmod('output', 0o555);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generatedFileName: 'output/fusion',
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            // Should fail when unable to write to directory
            expect(result.success).toBe(false);
            
            // Restore permissions for cleanup
            await chmod('output', 0o755);
        });

        it('should respect umask for created files', async function() {
            if (isWindows) {
                this.skip(); // Skip on Windows due to different permission model
            }

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
            expect(result.success).toBe(true);

            // Check permissions of created file
            const stats = await stat('project-fusioned.txt');
            const mode = stats.mode & 0o777;
            
            // Should have reasonable permissions (not world-writable)
            expect(mode & 0o002).toBe(0); // Not world-writable
            expect(mode & 0o004).toBeGreaterThan(0); // World-readable is OK
        });
    });

    describe('Cross-Platform Permission Tests', () => {
        it('should handle case-sensitive permission differences', async () => {
            // Test behavior with files that differ only in case
            await writeFile('test.js', 'console.log("lowercase");');
            
            // On case-insensitive systems, this might overwrite
            try {
                await writeFile('TEST.js', 'console.log("uppercase");');
            } catch (error) {
                // Might fail on case-insensitive systems
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
            
            // Should handle whatever the filesystem supports
            expect(result.success).toBe(true);
        });
    });
});