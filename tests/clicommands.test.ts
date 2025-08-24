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
import { logger } from '../src/utils/logger.js';

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
        // Clear all mocks before each test
        vi.clearAllMocks();
        
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

        it('should handle custom output directory with --out option', async () => {
            // Create test files in current directory
            await writeFile('test.js', 'console.log("Test");');
            await mkdir('output-dir');
            
            // Create a basic config file
            const config = {
                schemaVersion: 1,
                generatedFileName: "project-fusioned",
                generateHtml: true,
                generateMarkdown: true,
                generateText: true,
                maxFileSizeKB: 1024,
                parseSubDirectories: true,
                parsedFileExtensions: { web: [".js"] },
                rootDirectory: ".",
                useGitIgnoreForExcludes: false,
                ignorePatterns: [],
                allowSymlinks: false,
                copyToClipboard: false,
                maxFiles: 10000,
                maxTotalSizeMB: 100
            };
            await writeFile('project-fusion.json', JSON.stringify(config));

            await runFusionCommand({ out: './output-dir' });

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Using output directory: '));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('output-dir'));
            
            // Check that output files are created in the output directory
            expect(await pathExists('output-dir/project-fusioned.txt')).toBe(true);
            expect(await pathExists('output-dir/project-fusioned.log')).toBe(true);
        });

        it('should not modify rootDirectory when using --out option', async () => {
            // Create test files in subdirectory
            await mkdir('source-dir');
            await writeFile('source-dir/test.js', 'console.log("Source");');
            await mkdir('output-dir');
            
            // Create a basic config file
            const config = {
                schemaVersion: 1,
                generatedFileName: "project-fusioned",
                generateHtml: true,
                generateMarkdown: true,
                generateText: true,
                maxFileSizeKB: 1024,
                parseSubDirectories: false,
                parsedFileExtensions: { web: [".js"] },
                rootDirectory: ".",
                useGitIgnoreForExcludes: false,
                ignorePatterns: [],
                allowSymlinks: false,
                copyToClipboard: false,
                maxFiles: 10000,
                maxTotalSizeMB: 100
            };
            await writeFile('project-fusion.json', JSON.stringify(config));

            // Use both --root and --out to verify they work independently
            await runFusionCommand({ 
                root: './source-dir',
                out: './output-dir'
            });

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Using specified directory as root: ./source-dir'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Using output directory: '));
            
            // Verify output files are in output-dir, not source-dir
            expect(await pathExists('output-dir/project-fusioned.txt')).toBe(true);
            expect(await pathExists('output-dir/project-fusioned.log')).toBe(true);
            expect(await pathExists('source-dir/project-fusioned.txt')).toBe(false);
            expect(await pathExists('source-dir/project-fusioned.log')).toBe(false);
        });

        it('should generate output in rootDirectory when --out is not specified', async () => {
            await writeFile('test.js', 'console.log("Test");');
            
            // Create a basic config file
            const config = {
                schemaVersion: 1,
                generatedFileName: "project-fusioned",
                generateHtml: true,
                generateMarkdown: true,
                generateText: true,
                maxFileSizeKB: 1024,
                parseSubDirectories: true,
                parsedFileExtensions: { web: [".js"] },
                rootDirectory: ".",
                useGitIgnoreForExcludes: false,
                ignorePatterns: [],
                allowSymlinks: false,
                copyToClipboard: false,
                maxFiles: 10000,
                maxTotalSizeMB: 100
            };
            await writeFile('project-fusion.json', JSON.stringify(config));
            
            await runFusionCommand({});

            // Files should be in current directory (rootDirectory)
            expect(await pathExists('project-fusioned.txt')).toBe(true);
            expect(await pathExists('project-fusioned.log')).toBe(true);
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

        it('should validate numeric flags and show error for invalid maxFileSize', async () => {
            await writeFile('test.js', 'console.log("Test");');

            await runFusionCommand({ maxFileSize: 'abc' });

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('❌ Invalid value for --max-file-size: "abc". Expected a positive number (KB).'));
            expect(mockExit).toHaveBeenCalledWith(1);
        });

        it('should validate numeric flags and show error for invalid maxFiles', async () => {
            await writeFile('test.js', 'console.log("Test");');

            await runFusionCommand({ maxFiles: 'invalid' });

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('❌ Invalid value for --max-files: "invalid". Expected a positive integer.'));
            expect(mockExit).toHaveBeenCalledWith(1);
        });

        it('should validate numeric flags and show error for invalid maxTotalSize', async () => {
            await writeFile('test.js', 'console.log("Test");');

            await runFusionCommand({ maxTotalSize: 'xyz' });

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('❌ Invalid value for --max-total-size: "xyz". Expected a positive number (MB).'));
            expect(mockExit).toHaveBeenCalledWith(1);
        });

        it('should validate numeric flags and show error for zero values', async () => {
            await writeFile('test.js', 'console.log("Test");');

            await runFusionCommand({ maxFileSize: '0' });

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('❌ Invalid value for --max-file-size: "0". Expected a positive number (KB).'));
            expect(mockExit).toHaveBeenCalledWith(1);
        });

        it('should validate numeric flags and show error for negative values', async () => {
            await writeFile('test.js', 'console.log("Test");');

            await runFusionCommand({ maxFiles: '-5' });

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('❌ Invalid value for --max-files: "-5". Expected a positive integer.'));
            expect(mockExit).toHaveBeenCalledWith(1);
        });

        it('should accept valid numeric values', async () => {
            await writeFile('test.js', 'console.log("Test");');

            await runFusionCommand({ 
                maxFileSize: '2048', 
                maxFiles: '500', 
                maxTotalSize: '50.5' 
            });

            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('ℹ️ Maximum file size set to: 2048 KB'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('ℹ️ Maximum files set to: 500'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('ℹ️ Maximum total size set to: 50.5 MB'));
            expect(mockExit).not.toHaveBeenCalledWith(1);
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

        it('should display structured table for extension groups', async () => {
            await runConfigCheckCommand();

            // Check for structured table elements
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('📁 File Extension Groups (Structured View)'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('┌─────────────┬─────────┬────────────────────────────────────────────┐'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('│ Group       │ Count   │ Extensions                                 │'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('└─────────────┴─────────┴────────────────────────────────────────────┘'));
        });

        it('should highlight differences from default config', async () => {
            // Create a modified config
            const modifiedConfig = {
                schemaVersion: 1,
                generatedFileName: "custom-fusion", // Modified
                generateHtml: true,
                generateMarkdown: true,
                generateText: true,
                maxFileSizeKB: 2048, // Modified
                parseSubDirectories: true,
                parsedFileExtensions: {
                    web: [".js", ".ts"], // Modified - fewer extensions
                    backend: [".py"]
                },
                rootDirectory: ".",
                useGitIgnoreForExcludes: true,
                copyToClipboard: false,
                ignorePatterns: ["custom-pattern"], // Modified
                allowSymlinks: false,
                maxFiles: 10000,
                maxTotalSizeMB: 100
            };
            
            await writeFile('project-fusion.json', JSON.stringify(modifiedConfig, null, 2));

            await runConfigCheckCommand();

            // Should show modifications in the output
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('custom-fusion'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('2048 KB'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Legend'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Green: Default values'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Yellow: Modified from defaults'));
        });

        it('should log config check details', async () => {
            // Mock the logger to capture calls
            const loggerSpy = vi.spyOn(logger, 'info');

            await runConfigCheckCommand();

            // Should log the config check details
            expect(loggerSpy).toHaveBeenCalledWith('Config check details logged', expect.objectContaining({
                configCheckOutput: expect.any(String),
                isDefault: true,
                timestamp: expect.any(String)
            }));

            loggerSpy.mockRestore();
        });

        it('should show pattern changes for modified ignore patterns', async () => {
            // Create config with modified ignore patterns
            const configWithModifiedPatterns = {
                schemaVersion: 1,
                generatedFileName: "project-fusioned",
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
                ignorePatterns: ["*.custom", "new-pattern"], // Different from defaults
                allowSymlinks: false,
                maxFiles: 10000,
                maxTotalSizeMB: 100
            };
            
            await writeFile('project-fusion.json', JSON.stringify(configWithModifiedPatterns, null, 2));

            await runConfigCheckCommand();

            // Should show pattern changes summary
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Pattern Changes'));
            expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Added:'));
        });
    });
});