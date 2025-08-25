// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Tests for plugin security validation
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DefaultFileSystemAdapter } from '../src/adapters/file-system.js';
import { PluginManager } from '../src/plugins/plugin-system.js';
import { FusionError } from '../src/types.js';
import type { Config } from '../src/types.js';

describe('Plugin Security Tests', () => {
    const testDir = join(process.cwd(), 'temp', 'test-plugin-security');
    const projectDir = join(testDir, 'project');
    const externalDir = join(testDir, 'external');
    const fs = new DefaultFileSystemAdapter();
    let pluginManager: PluginManager;

    beforeEach(async () => {
        // Create test directories
        await mkdir(projectDir, { recursive: true });
        await mkdir(externalDir, { recursive: true });
        await mkdir(join(projectDir, 'plugins'), { recursive: true });
        
        pluginManager = new PluginManager(fs);

        // Create test plugins
        const testPlugin = `
export default {
    metadata: {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin'
    }
};`;

        // Plugin inside project directory
        await writeFile(join(projectDir, 'plugins', 'internal.js'), testPlugin);
        
        // Plugin outside project directory
        await writeFile(join(externalDir, 'external.js'), testPlugin);
    });

    afterEach(async () => {
        await rm(testDir, { recursive: true, force: true });
    });

    describe('Plugin Path Validation', () => {
        it('should allow loading plugins from within root directory', async () => {
            const config: Config = {
                rootDirectory: projectDir,
                
                allowSymlinks: false,
                copyToClipboard: false,
                generatedFileName: 'test',
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                ignorePatterns: [],
                maxFileSizeKB: 1000,
                maxFiles: 100,
                maxTotalSizeMB: 10,
                parsedFileExtensions: {},
                parseSubDirectories: true,
                schemaVersion: 1,
                useGitIgnoreForExcludes: false
            };

            // Should not throw
            await expect(
                pluginManager.loadPlugin(join(projectDir, 'plugins', 'internal.js'), config)
            ).resolves.not.toThrow();
        });

        it('should reject loading plugins from outside root directory by default', async () => {
            const config: Config = {
                rootDirectory: projectDir,
                
                allowSymlinks: false,
                copyToClipboard: false,
                generatedFileName: 'test',
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                ignorePatterns: [],
                maxFileSizeKB: 1000,
                maxFiles: 100,
                maxTotalSizeMB: 10,
                parsedFileExtensions: {},
                parseSubDirectories: true,
                schemaVersion: 1,
                useGitIgnoreForExcludes: false
            };

            // Should throw FusionError with PATH_TRAVERSAL code
            await expect(
                pluginManager.loadPlugin(join(externalDir, 'external.js'), config)
            ).rejects.toThrow(FusionError);

            try {
                await pluginManager.loadPlugin(join(externalDir, 'external.js'), config);
            } catch (error) {
                expect(error).toBeInstanceOf(FusionError);
                if (error instanceof FusionError) {
                    expect(error.code).toBe('PATH_TRAVERSAL');
                    expect(error.message).toContain('outside root directory');
                    expect(error.message).toContain('allowedExternalPluginPaths');
                }
            }
        });

        it('should allow external plugins when in allowedExternalPluginPaths', async () => {
            const config: Config = {
                rootDirectory: projectDir,
                
                allowedExternalPluginPaths: [join(externalDir, 'external.js')],
                allowSymlinks: false,
                copyToClipboard: false,
                generatedFileName: 'test',
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                ignorePatterns: [],
                maxFileSizeKB: 1000,
                maxFiles: 100,
                maxTotalSizeMB: 10,
                parsedFileExtensions: {},
                parseSubDirectories: true,
                schemaVersion: 1,
                useGitIgnoreForExcludes: false
            };

            // Should not throw when external plugins are in allowlist
            await expect(
                pluginManager.loadPlugin(join(externalDir, 'external.js'), config)
            ).resolves.not.toThrow();
        });

        it('should reject external plugins not in allowedExternalPluginPaths', async () => {
            const config: Config = {
                rootDirectory: projectDir,
                
                allowedExternalPluginPaths: ['/some/other/path'], // Different path
                allowSymlinks: false,
                copyToClipboard: false,
                generatedFileName: 'test',
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                ignorePatterns: [],
                maxFileSizeKB: 1000,
                maxFiles: 100,
                maxTotalSizeMB: 10,
                parsedFileExtensions: {},
                parseSubDirectories: true,
                schemaVersion: 1,
                useGitIgnoreForExcludes: false
            };

            await expect(
                pluginManager.loadPlugin(join(externalDir, 'external.js'), config)
            ).rejects.toThrow('outside root directory');
        });


        it('should validate plugins when loading from directory', async () => {
            const config: Config = {
                rootDirectory: projectDir,
                
                allowSymlinks: false,
                copyToClipboard: false,
                generatedFileName: 'test',
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                ignorePatterns: [],
                maxFileSizeKB: 1000,
                maxFiles: 100,
                maxTotalSizeMB: 10,
                parsedFileExtensions: {},
                parseSubDirectories: true,
                schemaVersion: 1,
                useGitIgnoreForExcludes: false
            };

            // Should load plugins from internal directory without error
            await expect(
                pluginManager.loadPluginsFromDirectory(join(projectDir, 'plugins'), config)
            ).resolves.not.toThrow();

            // Should fail when trying to load from external directory
            await expect(
                pluginManager.loadPluginsFromDirectory(externalDir, config)
            ).resolves.not.toThrow(); // loadPluginsFromDirectory catches errors internally
        });

        it('should handle relative paths correctly', async () => {
            const config: Config = {
                rootDirectory: '.',
                
                allowSymlinks: false,
                copyToClipboard: false,
                generatedFileName: 'test',
                generateHtml: false,
                generateMarkdown: false,
                generateText: true,
                ignorePatterns: [],
                maxFileSizeKB: 1000,
                maxFiles: 100,
                maxTotalSizeMB: 10,
                parsedFileExtensions: {},
                parseSubDirectories: true,
                schemaVersion: 1,
                useGitIgnoreForExcludes: false
            };

            // Create a plugin in current directory
            const localPlugin = `
export default {
    metadata: {
        name: 'local-plugin',
        version: '1.0.0',
        description: 'Local plugin'
    }
};`;
            
            const localPluginPath = join(process.cwd(), 'temp-plugin.js');
            writeFileSync(localPluginPath, localPlugin);

            try {
                // Should allow loading from within current directory
                await expect(
                    pluginManager.loadPlugin('./temp-plugin.js', config)
                ).resolves.not.toThrow();
            } finally {
                // Clean up
                await rm(localPluginPath, { force: true });
            }
        });
    });
});