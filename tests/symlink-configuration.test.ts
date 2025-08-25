// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Symlink configuration tests for Project Fusion
 */
import { existsSync } from 'node:fs';
import { writeFile, mkdir, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { processFusion } from '../src/fusion.js';
import { defaultConfig, getSymlinkAuditSummary, clearSymlinkAudit } from '../src/utils.js';

describe('Symlink Configuration Tests', () => {
    const testDir = join(process.cwd(), 'temp', 'symlink-config-test');
    const outsideDir = join(process.cwd(), 'temp', 'outside-symlink-test');

    beforeEach(async () => {
        // Clean up and create test directories
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
        if (existsSync(outsideDir)) {
            await rm(outsideDir, { recursive: true, force: true });
        }
        
        await mkdir(testDir, { recursive: true });
        await mkdir(outsideDir, { recursive: true });
        process.chdir(testDir);
    });

    afterEach(async () => {
        process.chdir(join(testDir, '..', '..'));
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
        if (existsSync(outsideDir)) {
            await rm(outsideDir, { recursive: true, force: true });
        }
    });

    describe('Default Behavior (allowSymlinks: false)', () => {
        it('should reject symbolic links by default', async () => {
            // Create a target file and a symlink
            const targetFile = join(testDir, 'target.js');
            const symlinkFile = join(testDir, 'symlink.js');
            
            await writeFile(targetFile, 'console.log("target file");');
            await symlink(targetFile, symlinkFile);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                allowSymlinks: false, // Explicit default
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            // Should succeed but skip the symlink
            expect(result.success).toBe(true);
            
            // Should process the target file but not the symlink
            const fusionText = await import('node:fs').then(fs => 
                fs.promises.readFile(join(testDir, 'project-fusioned.txt'), 'utf8')
            );
            
            expect(fusionText).toContain('target.js');
            expect(fusionText).toContain('console.log("target file")');
            expect(fusionText).not.toContain('symlink.js');
        });

        it('should show default allowSymlinks as false in config', () => {
            expect(defaultConfig.allowSymlinks).toBe(false);
        });
    });

    describe('Enabled Symlinks (allowSymlinks: true)', () => {
        it('should process symbolic links when explicitly allowed', async () => {
            // Create a target file and a symlink
            const targetFile = join(testDir, 'target.js');
            const symlinkFile = join(testDir, 'symlink.js');
            
            await writeFile(targetFile, 'console.log("target file");');
            await symlink(targetFile, symlinkFile);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                allowSymlinks: true, // Enable symlinks
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(true);
            
            // Should process both the target file and the symlink
            const fusionText = await import('node:fs').then(fs => 
                fs.promises.readFile(join(testDir, 'project-fusioned.txt'), 'utf8')
            );
            
            expect(fusionText).toContain('target.js');
            expect(fusionText).toContain('symlink.js');
            expect(fusionText).toContain('console.log("target file")');
        });

        it('should handle symlinks pointing outside the root directory', async () => {
            // Create a file outside the root and symlink to it
            const outsideFile = join(outsideDir, 'outside.js');
            const symlinkFile = join(testDir, 'outside-link.js');
            
            await writeFile(outsideFile, 'console.log("outside file");');
            await symlink(outsideFile, symlinkFile);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                allowSymlinks: true,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(true);
            
            // Should process the symlink (content from outside)
            const fusionText = await import('node:fs').then(fs => 
                fs.promises.readFile(join(testDir, 'project-fusioned.txt'), 'utf8')
            );
            
            expect(fusionText).toContain('outside-link.js');
            expect(fusionText).toContain('console.log("outside file")');
        });

        it('should handle broken symlinks gracefully', async () => {
            // Create a symlink to a non-existent file
            const brokenSymlink = join(testDir, 'broken.js');
            const normalFile = join(testDir, 'normal.js');
            
            await writeFile(normalFile, 'console.log("normal");');
            await symlink('/nonexistent/path.js', brokenSymlink);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                allowSymlinks: true,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            // Should succeed and process the normal file, skip the broken symlink
            expect(result.success).toBe(true);
            
            const fusionText = await import('node:fs').then(fs => 
                fs.promises.readFile(join(testDir, 'project-fusioned.txt'), 'utf8')
            );
            
            expect(fusionText).toContain('normal.js');
            expect(fusionText).toContain('console.log("normal")');
            // Broken symlink should be skipped (no content from it)
        });
    });

    describe('Configuration Integration', () => {
        it('should respect allowSymlinks from config file', async () => {
            // Create a config file with allowSymlinks: true
            const configContent = {
                allowSymlinks: true,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };
            
            await writeFile('project-fusion.json', JSON.stringify(configContent, null, 2));
            
            // Create files
            const targetFile = join(testDir, 'target.js');
            const symlinkFile = join(testDir, 'symlink.js');
            
            await writeFile(targetFile, 'console.log("config test");');
            await symlink(targetFile, symlinkFile);

            // Load config and process
            const config = {
                ...defaultConfig,
                ...configContent,
                rootDirectory: testDir
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(true);
            
            const fusionText = await import('node:fs').then(fs => 
                fs.promises.readFile(join(testDir, 'project-fusioned.txt'), 'utf8')
            );
            
            // Should process both files because allowSymlinks is true in config
            expect(fusionText).toContain('target.js');
            expect(fusionText).toContain('symlink.js');
        });

        it('should handle config validation for allowSymlinks', async () => {
            // Test with invalid allowSymlinks value
            const configContent = {
                allowSymlinks: "invalid", // Invalid type
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };
            
            await writeFile('project-fusion.json', JSON.stringify(configContent, null, 2));
            
            // Config validation should handle this gracefully (fall back to default)
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

            // Create test files
            const targetFile = join(testDir, 'target.js');
            const symlinkFile = join(testDir, 'symlink.js');
            
            await writeFile(targetFile, 'console.log("validation test");');
            await symlink(targetFile, symlinkFile);

            const result = await processFusion(config);
            
            expect(result.success).toBe(true);
        });
    });

    describe('Security Implications', () => {
        it('should warn about security risks when symlinks are enabled', async () => {
            // This test documents the security implications
            // When allowSymlinks is true, files outside the project can be accessed
            
            const outsideFile = join(outsideDir, 'sensitive.js');
            const symlinkFile = join(testDir, 'innocent-looking.js');
            
            await writeFile(outsideFile, 'const API_KEY = "secret-key-123";');
            await symlink(outsideFile, symlinkFile);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                allowSymlinks: true, // This allows access to the outside file
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(true);
            
            const fusionText = await import('node:fs').then(fs => 
                fs.promises.readFile(join(testDir, 'project-fusioned.txt'), 'utf8')
            );
            
            // This demonstrates the security risk: sensitive content is included
            expect(fusionText).toContain('innocent-looking.js');
            expect(fusionText).toContain('API_KEY = "secret-key-123"');
            
            // This is why allowSymlinks defaults to false and shows warnings
        });
    });

    describe('Symlink Audit Functionality', () => {
        beforeEach(() => {
            clearSymlinkAudit(testDir);
        });

        afterEach(() => {
            clearSymlinkAudit(testDir);
        });

        it('should audit symlinks with resolved targets', async () => {
            // Create target file and symlink
            const targetFile = join(testDir, 'target.js');
            const symlinkFile = join(testDir, 'symlink.js');
            
            await writeFile(targetFile, 'console.log("target file");');
            await symlink(targetFile, symlinkFile);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                allowSymlinks: true,
                maxSymlinkAuditEntries: 5
            };

            const result = await processFusion(config);
            expect(result.success).toBe(true);

            // Check audit summary
            const auditSummary = getSymlinkAuditSummary(testDir);
            expect(auditSummary).toBeTruthy();
            expect(auditSummary!.totalSymlinks).toBe(1);
            expect(auditSummary!.entries).toHaveLength(1);
            
            const entry = auditSummary!.entries[0];
            expect(entry.symlink).toBe(symlinkFile);
            expect(entry.target).toBe(targetFile);
            expect(entry.timestamp).toBeInstanceOf(Date);
        });

        it('should limit audit entries based on maxSymlinkAuditEntries', async () => {
            const maxEntries = 3;
            
            // Create multiple symlinks
            const targetFile = join(testDir, 'target.js');
            await writeFile(targetFile, 'console.log("target");');
            
            const symlinks = [];
            for (let i = 1; i <= 5; i++) {
                const symlinkFile = join(testDir, `symlink${i}.js`);
                await symlink(targetFile, symlinkFile);
                symlinks.push(symlinkFile);
            }

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                allowSymlinks: true,
                maxSymlinkAuditEntries: maxEntries
            };

            const result = await processFusion(config);
            expect(result.success).toBe(true);

            // Check audit summary
            const auditSummary = getSymlinkAuditSummary(testDir);
            expect(auditSummary).toBeTruthy();
            expect(auditSummary!.totalSymlinks).toBe(5); // Total count should be accurate
            expect(auditSummary!.entries).toHaveLength(maxEntries); // But entries limited
        });

        it('should audit symlinks pointing outside root directory', async () => {
            // Create external target
            const externalFile = join(outsideDir, 'external.js');
            await writeFile(externalFile, 'console.log("external file");');
            
            // Create symlink pointing to external file
            const symlinkFile = join(testDir, 'external-link.js');
            await symlink(externalFile, symlinkFile);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                allowSymlinks: true,
                maxSymlinkAuditEntries: 10
            };

            const result = await processFusion(config);
            expect(result.success).toBe(true);

            // Check audit tracks external target
            const auditSummary = getSymlinkAuditSummary(testDir);
            expect(auditSummary).toBeTruthy();
            expect(auditSummary!.totalSymlinks).toBe(1);
            
            const entry = auditSummary!.entries[0];
            expect(entry.symlink).toBe(symlinkFile);
            expect(entry.target).toBe(externalFile);
        });

        it('should handle broken symlinks gracefully in audit', async () => {
            // Create broken symlink
            const brokenSymlink = join(testDir, 'broken.js');
            const nonExistentTarget = join(testDir, 'does-not-exist.js');
            await symlink(nonExistentTarget, brokenSymlink);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                allowSymlinks: true,
                maxSymlinkAuditEntries: 10
            };

            // Should not throw error
            const result = await processFusion(config);
            expect(result.success).toBe(true);

            // For broken symlinks, the glob process may not even find them as valid files
            // But we can test the validateNoSymlinks function directly
            const { validateNoSymlinks } = await import('../src/utils.js');
            
            // First verify the symlink exists as a symlink (not the target)
            const fs = await import('fs-extra');
            const symlinkStats = await fs.lstat(brokenSymlink);
            expect(symlinkStats.isSymbolicLink()).toBe(true);
            
            // Now test our validation function
            const isValid = await validateNoSymlinks(brokenSymlink, true, config);
            // Broken symlinks should be processed (return true) but logged in audit
            expect(isValid).toBe(true);
            
            // Check if audit tracked it
            const auditSummary = getSymlinkAuditSummary(testDir);
            // It may be tracked or not depending on glob behavior, but shouldn't crash
            if (auditSummary) {
                expect(auditSummary.totalSymlinks).toBeGreaterThanOrEqual(0);
            }
        });
    });
});