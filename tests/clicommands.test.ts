// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Tests for CLI commands
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'node:path';
import { writeFile, mkdir, rm, readFile, pathExists } from 'fs-extra';
import { existsSync } from 'node:fs';
import { 
    runFusionCommand, 
    runInitCommand, 
    runConfigCheckCommand 
} from '../src/clicommands.js';

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

describe('CLI Commands', () => {
    const testDir = join(process.cwd(), 'temp', 'clicommands-test');
    const originalCwd = process.cwd();
    const originalExit = process.exit;
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn
    };

    // Mock console and process.exit
    const mockConsole = {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    };
    const mockExit = vi.fn();

    beforeEach(async () => {
        // Clean up and create test directory
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
        await mkdir(testDir, { recursive: true });
        process.chdir(testDir);

        // Mock console and process.exit
        console.log = mockConsole.log;
        console.error = mockConsole.error;
        console.warn = mockConsole.warn;
        process.exit = mockExit as any;

        // Clear all mocks
        vi.clearAllMocks();
    });

    afterEach(async () => {
        // Restore original functions
        console.log = originalConsole.log;
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
        process.exit = originalExit;

        process.chdir(originalCwd);
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
    });

    describe('runFusionCommand', () => {
        it('should run fusion with default options', async () => {
            // Create sample files
            await writeFile('test.js', 'console.log("Hello");');
            await writeFile('test.ts', 'const msg: string = "TypeScript";');

            await runFusionCommand({});

            // Should log success message
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('✅'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Generated files:'));
        });

        it('should handle custom root directory', async () => {
            // Create subdirectory with files
            await mkdir('subdir');
            await writeFile('subdir/test.js', 'console.log("Subdir");');

            await runFusionCommand({ root: './subdir' });

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Using specified directory as root: ./subdir'));
        });

        it('should handle extension groups', async () => {
            await writeFile('test.js', 'console.log("JS");');
            await writeFile('test.py', 'print("Python")');

            await runFusionCommand({ extensions: 'web,backend' });

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Using extension groups: web, backend'));
        });

        it('should handle clipboard copy', async () => {
            await writeFile('test.js', 'console.log("Test");');
            
            // Create config with clipboard enabled
            const configWithClipboard = {
                schemaVersion: 1,
                copyToClipboard: true,
                generatedFileName: "project-fusioned",
                generateHtml: true,
                generateMarkdown: true,
                generateText: true,
                maxFileSizeKB: 1024,
                parseSubDirectories: true,
                parsedFileExtensions: { web: [".js"] },
                rootDirectory: ".",
                useGitIgnoreForExcludes: true,
                ignorePatterns: []
            };
            
            await writeFile('project-fusion.json', JSON.stringify(configWithClipboard));

            // Mock non-TTY environment
            const originalTTY = process.stdout.isTTY;
            process.stdout.isTTY = true;
            process.env['CI'] = 'false';

            await runFusionCommand({});

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('📋 Fusion content copied to clipboard'));

            // Restore
            process.stdout.isTTY = originalTTY;
        });

        it('should skip clipboard in CI environment', async () => {
            await writeFile('test.js', 'console.log("Test");');
            
            const configWithClipboard = {
                schemaVersion: 1,
                copyToClipboard: true,
                generatedFileName: "project-fusioned",
                generateHtml: true,
                generateMarkdown: true,
                generateText: true,
                maxFileSizeKB: 1024,
                parseSubDirectories: true,
                parsedFileExtensions: { web: [".js"] },
                rootDirectory: ".",
                useGitIgnoreForExcludes: true,
                ignorePatterns: []
            };
            
            await writeFile('project-fusion.json', JSON.stringify(configWithClipboard));

            // Mock CI environment
            process.env['CI'] = 'true';

            await runFusionCommand({});

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('📋 Clipboard copy skipped (non-interactive environment)'));
        });

        it('should handle clipboard error gracefully', async () => {
            await writeFile('test.js', 'console.log("Test");');
            
            const configWithClipboard = {
                schemaVersion: 1,
                copyToClipboard: true,
                generatedFileName: "project-fusioned",
                generateHtml: true,
                generateMarkdown: true,
                generateText: true,
                maxFileSizeKB: 1024,
                parseSubDirectories: true,
                parsedFileExtensions: { web: [".js"] },
                rootDirectory: ".",
                useGitIgnoreForExcludes: true,
                ignorePatterns: []
            };
            
            await writeFile('project-fusion.json', JSON.stringify(configWithClipboard));

            // Mock clipboard error
            const clipboardy = await import('clipboardy');
            vi.mocked(clipboardy.default.write).mockRejectedValueOnce(new Error('Clipboard error'));

            const originalTTY = process.stdout.isTTY;
            process.stdout.isTTY = true;
            process.env['CI'] = 'false';

            await runFusionCommand({});

            expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('⚠️ Could not copy to clipboard'));

            process.stdout.isTTY = originalTTY;
        });

        it('should handle fusion failure', async () => {
            // Create empty directory (no files to process)
            await runFusionCommand({});

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('❌'));
        });

        it('should handle errors and exit', async () => {
            // Create invalid config to trigger error
            await writeFile('project-fusion.json', 'invalid json');

            await runFusionCommand({});

            expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('❌ Fusion process failed'));
            expect(mockExit).toHaveBeenCalledWith(1);
        });
    });

    describe('runInitCommand', () => {
        it('should create config file', async () => {
            await runInitCommand();

            expect(await pathExists('project-fusion.json')).toBe(true);
            
            const config = JSON.parse(await readFile('project-fusion.json', 'utf8'));
            expect(config).toHaveProperty('schemaVersion', 1);
            expect(config).toHaveProperty('generatedFileName', 'project-fusioned');

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('✅ Project Fusion initialized successfully!'));
        });

        it('should not overwrite existing config without force', async () => {
            // Create existing config
            await writeFile('project-fusion.json', '{"custom": "config"}');

            await runInitCommand();

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('⚠️ project-fusion.json file already exists'));
            expect(mockExit).toHaveBeenCalledWith(1);

            // Config should be unchanged
            const config = await readFile('project-fusion.json', 'utf8');
            expect(config).toContain('"custom": "config"');
        });

        it('should overwrite existing config with force flag', async () => {
            // Create existing config
            await writeFile('project-fusion.json', '{"custom": "config"}');

            await runInitCommand({ force: true });

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('⚠️ Overriding existing configuration'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('✅ Project Fusion initialized successfully!'));

            // Config should be replaced
            const config = JSON.parse(await readFile('project-fusion.json', 'utf8'));
            expect(config).not.toHaveProperty('custom');
            expect(config).toHaveProperty('schemaVersion', 1);
        });

        it('should handle write errors', async () => {
            // Create a directory named project-fusion.json to cause write error
            await mkdir('project-fusion.json');

            await runInitCommand();

            expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('❌ Initialization failed'));
            expect(mockExit).toHaveBeenCalledWith(1);
        });
    });

    describe('runConfigCheckCommand', () => {
        it('should validate valid configuration', async () => {
            const validConfig = {
                schemaVersion: 1,
                generatedFileName: "test-fusion",
                generateHtml: true,
                generateMarkdown: true,
                generateText: true,
                maxFileSizeKB: 1024,
                parseSubDirectories: true,
                parsedFileExtensions: {
                    web: [".js", ".ts"],
                    backend: [".py"]
                },
                rootDirectory: ".",
                useGitIgnoreForExcludes: true,
                copyToClipboard: false,
                ignorePatterns: ["node_modules/"]
            };
            
            await writeFile('project-fusion.json', JSON.stringify(validConfig, null, 2));

            await runConfigCheckCommand();

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('✅ Configuration is valid!'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Configuration Summary:'));
        });

        it('should handle missing configuration file', async () => {
            await runConfigCheckCommand();

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('⚠️ No project-fusion.json found'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Using default configuration'));
        });

        it('should handle invalid JSON', async () => {
            await writeFile('project-fusion.json', '{ invalid json');

            await runConfigCheckCommand();

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('❌ Invalid JSON in configuration file'));
            expect(mockExit).toHaveBeenCalledWith(1);
        });

        it('should handle invalid configuration schema', async () => {
            const invalidConfig = {
                schemaVersion: "invalid",
                generateHtml: "not-boolean",
                parsedFileExtensions: "not-object"
            };
            
            await writeFile('project-fusion.json', JSON.stringify(invalidConfig));

            await runConfigCheckCommand();

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('❌ Configuration validation failed'));
            expect(mockExit).toHaveBeenCalledWith(1);
        });

        it('should handle file read errors', async () => {
            // Create a directory instead of file to cause read error
            await mkdir('project-fusion.json');

            await runConfigCheckCommand();

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('❌ Cannot read configuration file'));
            expect(mockExit).toHaveBeenCalledWith(1);
        });

        it('should handle general errors', async () => {
            // Mock fs.pathExists to throw an error
            const fs = await import('fs-extra');
            const originalPathExists = fs.pathExists;
            vi.spyOn(fs, 'pathExists').mockRejectedValueOnce(new Error('Filesystem error'));

            await runConfigCheckCommand();

            expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('❌ Config check failed'));
            expect(mockExit).toHaveBeenCalledWith(1);

            // Restore
            vi.spyOn(fs, 'pathExists').mockImplementation(originalPathExists);
        });

        it('should display config info with file preview', async () => {
            // Create some test files
            await writeFile('test.js', 'console.log("test");');
            await writeFile('test.ts', 'const x: string = "test";');

            await runConfigCheckCommand();

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('🔧 Basic Settings'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('📄 Output Generation'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('📁 File Extension Groups'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('🚫 Ignore Patterns'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('🔍 File Discovery Preview'));
        });
    });
});