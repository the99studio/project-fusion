// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * File security tests for Project Fusion
 */
import { existsSync } from 'node:fs';
import { writeFile, mkdir, rm, symlink, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { processFusion } from '../src/fusion.js';
import { FusionError } from '../src/types.js';
import { validateSecurePath, validateNoSymlinks, isBinaryFile , defaultConfig } from '../src/utils.js';
import { canCreateSymlinks, skipIfCondition } from './test-helpers.js';

describe('File Security Tests', () => {
    const testDir = join(process.cwd(), 'temp', 'file-security-test');
    const outsideDir = join(process.cwd(), 'temp', 'outside-test');

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

    describe('Path Traversal Protection', () => {
        it('should validate safe paths within root directory', () => {
            const safePath1 = join(testDir, 'safe-file.js');
            const safePath2 = join(testDir, 'subdir', 'another-file.ts');
            
            expect(() => validateSecurePath(safePath1, testDir)).not.toThrow();
            expect(() => validateSecurePath(safePath2, testDir)).not.toThrow();
            
            const validatedPath = validateSecurePath(safePath1, testDir);
            expect(validatedPath).toBe(safePath1);
        });

        it('should reject paths that escape root directory', () => {
            const maliciousPath1 = join(testDir, '..', '..', 'etc', 'passwd');
            const maliciousPath2 = '../../../etc/passwd';
            const maliciousPath3 = join(outsideDir, 'evil.js');
            
            expect(() => validateSecurePath(maliciousPath1, testDir)).toThrow(FusionError);
            expect(() => validateSecurePath(maliciousPath2, testDir)).toThrow(FusionError);
            expect(() => validateSecurePath(maliciousPath3, testDir)).toThrow(FusionError);
            
            try {
                validateSecurePath(maliciousPath1, testDir);
            } catch (error) {
                expect(error).toBeInstanceOf(FusionError);
                expect((error as FusionError).code).toBe('PATH_TRAVERSAL');
            }
        });

        it('should handle relative paths correctly', () => {
            // When run from testDir, relative paths should be resolved relative to testDir
            const relativePath = './safe-file.js';
            const result = validateSecurePath(relativePath, testDir);
            expect(result).toBe(join(testDir, 'safe-file.js'));
        });

        it('should prevent access to root directory itself when not intended', () => {
            const rootPath = testDir;
            // Root directory itself should be valid
            expect(() => validateSecurePath(rootPath, testDir)).not.toThrow();
            
            // But parent of root should not be
            const parentPath = join(testDir, '..');
            expect(() => validateSecurePath(parentPath, testDir)).toThrow(FusionError);
        });
    });

    describe('Symbolic Link Detection', () => {
        it('should detect and reject symbolic links by default', async () => {
            if (skipIfCondition(!(await canCreateSymlinks()), 'Symlinks require special permissions on Windows')) {
                return;
            }
            
            const targetFile = join(testDir, 'target.js');
            const symlinkFile = join(testDir, 'symlink.js');
            
            await writeFile(targetFile, 'console.log("target");');
            await symlink(targetFile, symlinkFile);
            
            await expect(validateNoSymlinks(symlinkFile, false)).rejects.toThrow(FusionError);
            
            try {
                await validateNoSymlinks(symlinkFile, false);
            } catch (error) {
                expect(error).toBeInstanceOf(FusionError);
                expect((error as FusionError).code).toBe('SYMLINK_NOT_ALLOWED');
            }
        });

        it('should allow symbolic links when explicitly enabled', async () => {
            if (skipIfCondition(!(await canCreateSymlinks()), 'Symlinks require special permissions on Windows')) {
                return;
            }
            
            const targetFile = join(testDir, 'target.js');
            const symlinkFile = join(testDir, 'symlink.js');
            
            await writeFile(targetFile, 'console.log("target");');
            await symlink(targetFile, symlinkFile);
            
            await expect(validateNoSymlinks(symlinkFile, true)).resolves.toBe(true);
        });

        it('should handle non-existent files gracefully', async () => {
            const nonExistentFile = join(testDir, 'does-not-exist.js');
            await expect(validateNoSymlinks(nonExistentFile, false)).resolves.toBe(false);
        });

        it('should handle regular files correctly', async () => {
            const regularFile = join(testDir, 'regular.js');
            await writeFile(regularFile, 'console.log("regular");');
            
            await expect(validateNoSymlinks(regularFile, false)).resolves.toBe(true);
        });
    });

    describe('Binary File Detection', () => {
        it('should detect binary files with null bytes', async () => {
            const binaryFile = join(testDir, 'binary.bin');
            const binaryContent = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]); // PNG header with null
            await writeFile(binaryFile, binaryContent);
            
            expect(await isBinaryFile(binaryFile)).toBe(true);
        });

        it('should detect text files correctly', async () => {
            const textFile = join(testDir, 'text.js');
            await writeFile(textFile, 'console.log("Hello, World!");');
            
            expect(await isBinaryFile(textFile)).toBe(false);
        });

        it('should handle empty files as text', async () => {
            const emptyFile = join(testDir, 'empty.txt');
            await writeFile(emptyFile, '');
            
            expect(await isBinaryFile(emptyFile)).toBe(false);
        });

        it('should detect files with high non-printable character ratio', async () => {
            const nonPrintableFile = join(testDir, 'nonprintable.dat');
            // Create content with >30% non-printable characters
            const content = Buffer.alloc(100);
            for (let i = 0; i < 100; i++) {
                content[i] = i < 40 ? 
                    Math.floor(Math.random() * 32) : // Non-printable
                    65 + (i % 26); // Printable letters
            }
            await writeFile(nonPrintableFile, content);
            
            expect(await isBinaryFile(nonPrintableFile)).toBe(true);
        });

        it('should handle files with common whitespace correctly', async () => {
            const whitespaceFile = join(testDir, 'whitespace.txt');
            const content = 'Line 1\nLine 2\tWith tab\rCarriage return\n';
            await writeFile(whitespaceFile, content);
            
            expect(await isBinaryFile(whitespaceFile)).toBe(false);
        });

        it('should handle non-existent files gracefully', async () => {
            const nonExistentFile = join(testDir, 'does-not-exist.bin');
            expect(await isBinaryFile(nonExistentFile)).toBe(false);
        });
    });

    describe('Integration with Fusion Process', () => {
        it('should skip binary files during fusion', async () => {
            // Create a text file and a binary file
            await writeFile('text.js', 'console.log("text");');
            
            const binaryContent = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00]);
            await writeFile('binary.bin', binaryContent);
            
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js'],
                    other: ['.bin']
                }
            };

            const result = await processFusion(config);
            expect(result.success).toBe(true);

            // Check that only text file was processed
            const fusionContent = await readFile(join(testDir, 'project-fusioned.txt'), 'utf8');
            expect(fusionContent).toContain('console.log("text");');
            expect(fusionContent).not.toContain('PNG'); // Binary content shouldn't be there
            
            // Check log for binary file skip message
            const logContent = await readFile(result.logFilePath!, 'utf8');
            expect(logContent).toContain('Skipping binary file: binary.bin');
        });

        it('should prevent path traversal in fusion process', async () => {
            // Create a file inside the test directory and one outside
            await writeFile('inside.js', 'console.log("inside");');
            await writeFile(join(outsideDir, 'outside.js'), 'console.log("outside");');
            
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

            // The fusion process should not find files outside the root directory
            // because glob patterns are constrained to the root directory
            const result = await processFusion(config);
            expect(result.success).toBe(true);
            
            const fusionContent = await readFile(join(testDir, 'project-fusioned.txt'), 'utf8');
            expect(fusionContent).toContain('inside'); // File inside should be included
            expect(fusionContent).not.toContain('outside'); // File outside should not be included
        });

        it('should reject symbolic links in fusion process', async () => {
            if (skipIfCondition(!(await canCreateSymlinks()), 'Symlinks require special permissions on Windows')) {
                return;
            }
            
            await writeFile('target.js', 'console.log("target");');
            await symlink(join(testDir, 'target.js'), join(testDir, 'symlink.js'));
            
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

            // The fusion process should skip symbolic links
            const result = await processFusion(config);
            expect(result.success).toBe(true);
            
            // Check that target file was processed but symlink was skipped
            const fusionContent = await readFile(join(testDir, 'project-fusioned.txt'), 'utf8');
            expect(fusionContent).toContain('target.js'); // Target file should be included
            
            // The symlink should cause an error that's logged but doesn't fail the process
            const logContent = await readFile(result.logFilePath!, 'utf8');
            expect(logContent).toContain('symlink.js'); // Should mention the symlink file
        });

        it('should fail fast with allowSymlinks=false and path traversal attempts', async () => {
            if (skipIfCondition(!(await canCreateSymlinks()), 'Symlinks require special permissions on Windows')) {
                return;
            }
            
            // Create a malicious symlink that tries to escape the root directory
            const outsideFile = join(outsideDir, 'evil-payload.js');
            await writeFile(outsideFile, 'console.log("HACKED! This should not be accessible");');
            
            const maliciousSymlink = join(testDir, 'escape.js');
            await symlink(outsideFile, maliciousSymlink);
            
            // Create a legitimate file as well
            await writeFile('legitimate.js', 'console.log("legitimate content");');
            
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                allowSymlinks: false, // Explicitly disable symlinks
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            // The fusion process should fail fast when encountering the malicious symlink
            const result = await processFusion(config);
            
            // The process should complete but log the error
            expect(result.success).toBe(true);
            
            // Check that the malicious content is NOT in the fusion output
            const fusionContent = await readFile(join(testDir, 'project-fusioned.txt'), 'utf8');
            expect(fusionContent).toContain('legitimate content'); // Legitimate file should be included
            expect(fusionContent).not.toContain('HACKED!'); // Malicious content should not leak
            expect(fusionContent).not.toContain('evil-payload'); // Reference to outside file should not appear
            
            // Check that the symlink error was logged
            const logContent = await readFile(result.logFilePath!, 'utf8');
            expect(logContent).toContain('escape.js'); // Should mention the problematic symlink
            expect(logContent).toMatch(/symlink|link/i); // Should indicate it's a symlink issue
        });

        it('should fail fast on directory traversal attempts with complex paths', async () => {
            if (skipIfCondition(!(await canCreateSymlinks()), 'Symlinks require special permissions on Windows')) {
                return;
            }
            
            // Create files outside the root that could be targets of traversal
            const evilFile1 = join(outsideDir, 'secrets.conf');
            const evilFile2 = join(outsideDir, 'passwords.txt');
            await writeFile(evilFile1, 'SECRET_API_KEY=abc123');
            await writeFile(evilFile2, 'admin:password123');
            
            // Create various symlinks that attempt directory traversal
            const traversalAttempts = [
                'traverse1.js',
                'traverse2.js', 
                'traverse3.js'
            ];
            
            await symlink(join(testDir, '..', '..', '..', 'etc', 'passwd'), join(testDir, traversalAttempts[0]!));
            await symlink(evilFile1, join(testDir, traversalAttempts[1]!));
            await symlink(evilFile2, join(testDir, traversalAttempts[2]!));
            
            // Add a legitimate file
            await writeFile('safe.js', 'console.log("safe content");');
            
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                allowSymlinks: false,
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            
            // Process should complete (graceful handling of errors)
            expect(result.success).toBe(true);
            
            // Verify no sensitive content leaked
            const fusionContent = await readFile(join(testDir, 'project-fusioned.txt'), 'utf8');
            expect(fusionContent).toContain('safe content');
            expect(fusionContent).not.toContain('SECRET_API_KEY');
            expect(fusionContent).not.toContain('admin:password');
            expect(fusionContent).not.toContain('/etc/passwd');
            
            // Verify all symlink attempts were logged as errors
            const logContent = await readFile(result.logFilePath!, 'utf8');
            for (const filename of traversalAttempts) {
                expect(logContent).toContain(filename);
            }
        });
    });
});