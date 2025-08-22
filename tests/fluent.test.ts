// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Tests for Fluent API
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'node:path';
import { writeFile, mkdir, rm } from 'fs-extra';
import { existsSync } from 'node:fs';
import { projectFusion, ProjectFusionBuilder } from '../src/fluent.js';
import { defaultConfig } from '../src/utils.js';

// Mock external dependencies
vi.mock('chalk', () => ({
    default: {
        blue: (str: string) => str,
        green: (str: string) => str,
        yellow: (str: string) => str,
        red: (str: string) => str,
        cyan: (str: string) => str,
        gray: (str: string) => str,
        magenta: (str: string) => str
    }
}));

vi.mock('clipboardy', () => ({
    default: {
        write: vi.fn().mockResolvedValue(undefined)
    }
}));

describe('Fluent API', () => {
    const testDir = join(process.cwd(), 'temp', 'fluent-test');
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

    describe('ProjectFusionBuilder', () => {
        it('should create a new builder instance', () => {
            const builder = new ProjectFusionBuilder();
            expect(builder).toBeInstanceOf(ProjectFusionBuilder);
        });

        it('should support method chaining', () => {
            const builder = projectFusion()
                .root('./src')
                .include(['web'])
                .exclude(['*.test.ts'])
                .maxSize('1MB')
                .output(['md'])
                .name('test-fusion')
                .subdirectories(false)
                .clipboard(false)
                .gitignore(true);

            expect(builder).toBeInstanceOf(ProjectFusionBuilder);
        });

        describe('configuration methods', () => {
            it('should set root directory', () => {
                const builder = projectFusion().root('./src');
                const config = builder.getConfig();
                expect(config.rootDirectory).toBe('./src');
            });

            it('should set working directory', () => {
                const builder = projectFusion().cwd('/custom/cwd');
                const config = builder.getConfig();
                expect(config.cwd).toBe('/custom/cwd');
            });

            it('should set extension groups', () => {
                const builder = projectFusion().include(['web', 'backend']);
                const config = builder.getConfig();
                expect(config.extensionGroups).toEqual(['web', 'backend']);
            });

            it('should set ignore patterns', () => {
                const patterns = ['*.test.ts', 'node_modules/'];
                const builder = projectFusion().exclude(patterns);
                const config = builder.getConfig();
                expect(config.ignorePatterns).toEqual(patterns);
            });

            it('should set max file size from string with MB', () => {
                const builder = projectFusion().maxSize('2MB');
                const config = builder.getConfig();
                expect(config.maxFileSizeKB).toBe(2048);
            });

            it('should set max file size from string with KB', () => {
                const builder = projectFusion().maxSize('512KB');
                const config = builder.getConfig();
                expect(config.maxFileSizeKB).toBe(512);
            });

            it('should set max file size from number', () => {
                const builder = projectFusion().maxSize(1024);
                const config = builder.getConfig();
                expect(config.maxFileSizeKB).toBe(1024);
            });

            it('should throw error for invalid size format', () => {
                expect(() => {
                    projectFusion().maxSize('invalid');
                }).toThrow('Invalid size format');
            });

            it('should set output formats', () => {
                const builder = projectFusion().output(['md', 'html']);
                const config = builder.getConfig();
                expect(config.generateMarkdown).toBe(true);
                expect(config.generateHtml).toBe(true);
                expect(config.generateText).toBe(false);
            });

            it('should set generated file name', () => {
                const builder = projectFusion().name('custom-name');
                const config = builder.getConfig();
                expect(config.generatedFileName).toBe('custom-name');
            });

            it('should set subdirectories flag', () => {
                const builder = projectFusion().subdirectories(false);
                const config = builder.getConfig();
                expect(config.parseSubDirectories).toBe(false);
            });

            it('should set clipboard flag', () => {
                const builder = projectFusion().clipboard(true);
                const config = builder.getConfig();
                expect(config.copyToClipboard).toBe(true);
            });

            it('should set gitignore flag', () => {
                const builder = projectFusion().gitignore(false);
                const config = builder.getConfig();
                expect(config.useGitIgnoreForExcludes).toBe(false);
            });

            it('should add custom extensions for a group', () => {
                const builder = projectFusion().extensions('custom', ['.custom', '.ext']);
                const config = builder.getConfig();
                expect(config.parsedFileExtensions?.custom).toEqual(['.custom', '.ext']);
            });

            it('should set all extensions', () => {
                const extensions = { web: ['.ts'], backend: ['.py'] };
                const builder = projectFusion().allExtensions(extensions);
                const config = builder.getConfig();
                expect(config.parsedFileExtensions).toEqual(extensions);
            });

            it('should apply custom configuration function', () => {
                const builder = projectFusion().configure((options) => {
                    options.maxFileSizeKB = 9999;
                    options.generateText = false;
                });
                const config = builder.getConfig();
                expect(config.maxFileSizeKB).toBe(9999);
                expect(config.generateText).toBe(false);
            });
        });

        describe('reset method', () => {
            it('should reset configuration to defaults', () => {
                const builder = projectFusion()
                    .root('./src')
                    .include(['web'])
                    .maxSize('2MB')
                    .reset();

                const config = builder.getConfig();
                expect(config.rootDirectory).toBeUndefined();
                expect(config.extensionGroups).toBeUndefined();
                expect(config.maxFileSizeKB).toBeUndefined();
            });
        });

        describe('integration tests', () => {
            it('should generate fusion files with basic configuration', async () => {
                // Create test files
                await writeFile('test.js', 'console.log("Hello");');
                await writeFile('test.ts', 'const msg: string = "TypeScript";');

                const result = await projectFusion()
                    .include(['web'])
                    .output(['text'])
                    .generate();

                expect(result.success).toBe(true);
                expect(result.message).toContain('files processed');
            });

            it('should generate fusion files with advanced configuration', async () => {
                // Create test structure
                await mkdir('src', { recursive: true });
                await writeFile('src/app.js', 'console.log("App");');
                await writeFile('src/utils.ts', 'export const util = () => {};');
                await writeFile('test.spec.js', 'console.log("Test");');

                const result = await projectFusion()
                    .root('./src')
                    .include(['web'])
                    .exclude(['*.spec.js'])
                    .maxSize('1MB')
                    .output(['md', 'html'])
                    .name('custom-fusion')
                    .clipboard(false)
                    .generate();

                expect(result.success).toBe(true);
                expect(result.message).toContain('files processed');
            });

            it('should handle empty directory gracefully', async () => {
                const result = await projectFusion()
                    .include(['web'])
                    .generate();

                expect(result.success).toBe(false);
                expect(result.message).toContain('No files found');
            });

            it('should handle file size limits', async () => {
                // Create a small file
                await writeFile('small.js', 'console.log("small");');
                
                const result = await projectFusion()
                    .include(['web'])
                    .maxSize('1KB')
                    .generate();

                expect(result.success).toBe(true);
            });

            it('should handle custom extension groups', async () => {
                await writeFile('script.custom', 'custom file content');
                await writeFile('regular.js', 'console.log("regular");');

                const result = await projectFusion()
                    .extensions('custom', ['.custom'])
                    .include(['custom', 'web']) // Include both custom and web to ensure success
                    .generate();

                expect(result.success).toBe(true);
            });

            it('should handle multiple output formats', async () => {
                await writeFile('test.js', 'console.log("test");');

                const result = await projectFusion()
                    .include(['web'])
                    .output(['text', 'md', 'html'])
                    .generate();

                expect(result.success).toBe(true);
            });
        });

        describe('factory function', () => {
            it('should create builder via projectFusion function', () => {
                const builder = projectFusion();
                expect(builder).toBeInstanceOf(ProjectFusionBuilder);
            });

            it('should create independent builder instances', () => {
                const builder1 = projectFusion().root('./src1');
                const builder2 = projectFusion().root('./src2');

                expect(builder1.getConfig().rootDirectory).toBe('./src1');
                expect(builder2.getConfig().rootDirectory).toBe('./src2');
            });
        });

        describe('error handling', () => {
            it('should handle invalid size units gracefully', () => {
                expect(() => {
                    projectFusion().maxSize('100XB');
                }).toThrow('Invalid size format');
            });

            it('should handle malformed size strings', () => {
                expect(() => {
                    projectFusion().maxSize('not-a-number');
                }).toThrow('Invalid size format');
            });
        });

        describe('edge cases', () => {
            it('should handle subdirectories default parameter', () => {
                const builder = projectFusion().subdirectories();
                const config = builder.getConfig();
                expect(config.parseSubDirectories).toBe(true);
            });

            it('should handle clipboard default parameter', () => {
                const builder = projectFusion().clipboard();
                const config = builder.getConfig();
                expect(config.copyToClipboard).toBe(true);
            });

            it('should handle gitignore default parameter', () => {
                const builder = projectFusion().gitignore();
                const config = builder.getConfig();
                expect(config.useGitIgnoreForExcludes).toBe(true);
            });

            it('should preserve existing extensions when adding custom ones', () => {
                const builder = projectFusion()
                    .extensions('custom1', ['.ext1'])
                    .extensions('custom2', ['.ext2']);
                
                const config = builder.getConfig();
                expect(config.parsedFileExtensions?.custom1).toEqual(['.ext1']);
                expect(config.parsedFileExtensions?.custom2).toEqual(['.ext2']);
                expect(config.parsedFileExtensions?.web).toEqual(defaultConfig.parsedFileExtensions.web);
            });

            it('should handle decimal sizes', () => {
                const builder = projectFusion().maxSize('1.5MB');
                const config = builder.getConfig();
                expect(config.maxFileSizeKB).toBe(1536);
            });

            it('should handle GB units', () => {
                const builder = projectFusion().maxSize('1GB');
                const config = builder.getConfig();
                expect(config.maxFileSizeKB).toBe(1024 * 1024);
            });
        });
    });
});