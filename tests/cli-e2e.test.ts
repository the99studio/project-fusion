// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * End-to-end CLI tests for Project Fusion
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { writeFile, mkdir, rm, readFile, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';

describe('CLI E2E Tests', () => {
    const testDir = join(process.cwd(), 'temp', 'cli-e2e-test');
    const originalCwd = process.cwd();
    const cliBin = join(process.cwd(), 'dist', 'cli.js');

    beforeEach(async () => {
        // Clean up and create test directory
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

    describe('Default Command', () => {
        it('should create fusion files with default settings', async () => {
            // Create sample files
            await writeFile('test.js', 'console.log("Hello, World!");');
            await writeFile('test.ts', 'const message: string = "TypeScript";');
            
            // Run the CLI
            const output = execSync(`node "${cliBin}"`, { 
                encoding: 'utf8',
                env: { ...process.env, CI: 'true' } // Disable clipboard and TTY
            });
            
            // Check output contains success message
            expect(output).toContain('✅');
            expect(output).toContain('files processed');
            expect(output).toContain('Generated files:');
            
            // Check that fusion files were created
            expect(existsSync('project-fusioned.txt')).toBe(true);
            expect(existsSync('project-fusioned.md')).toBe(true);
            expect(existsSync('project-fusioned.html')).toBe(true);
            expect(existsSync('project-fusioned.log')).toBe(true);
            
            // Check content of text file
            const txtContent = await readFile('project-fusioned.txt', 'utf8');
            expect(txtContent).toContain('test.js');
            expect(txtContent).toContain('test.ts');
            expect(txtContent).toContain('Hello, World!');
            expect(txtContent).toContain('TypeScript');
            
            // Check content of markdown file
            const mdContent = await readFile('project-fusioned.md', 'utf8');
            expect(mdContent).toContain('## 📄 test.js');
            expect(mdContent).toContain('## 📄 test.ts');
            expect(mdContent).toContain('```javascript');
            expect(mdContent).toContain('```typescript');
            
            // Check content of HTML file
            const htmlContent = await readFile('project-fusioned.html', 'utf8');
            expect(htmlContent).toContain('<!DOCTYPE html>');
            expect(htmlContent).toContain('📄 test.js');
            expect(htmlContent).toContain('📄 test.ts');
            expect(htmlContent).toContain('<code class="language-javascript" lang="javascript">');
            expect(htmlContent).toContain('<code class="language-typescript" lang="typescript">');
        });

        it('should handle empty directory gracefully', async () => {
            // Run CLI in empty directory
            const output = execSync(`node "${cliBin}"`, { 
                encoding: 'utf8',
                env: { ...process.env, CI: 'true' }
            });
            
            expect(output).toContain('❌');
            expect(output).toContain('No files found to process');
            
            // Should still create a log file
            expect(existsSync('project-fusioned.log')).toBe(true);
        });

        it('should respect command line options', async () => {
            // Create sample files
            await writeFile('test.js', 'console.log("Test");');
            await writeFile('test.py', 'print("Python")');
            
            // Run CLI with specific root directory and extensions
            const output = execSync(`node "${cliBin}" --extensions web`, { 
                encoding: 'utf8',
                env: { ...process.env, CI: 'true' }
            });
            
            expect(output).toContain('✅');
            expect(output).toContain('Using extension groups: web');
            
            // Check that only JS file was processed (web extensions)
            const txtContent = await readFile('project-fusioned.txt', 'utf8');
            expect(txtContent).toContain('test.js');
            expect(txtContent).not.toContain('test.py'); // Python not in web group
        });
    });

    describe('Init Command', () => {
        it('should create configuration file', async () => {
            const output = execSync(`node "${cliBin}" init`, { 
                encoding: 'utf8',
                env: { ...process.env, CI: 'true' }
            });
            
            expect(output).toContain('✅ Project Fusion initialized successfully!');
            expect(output).toContain('Created:');
            expect(output).toContain('project-fusion.json');
            
            // Check config file was created
            expect(existsSync('project-fusion.json')).toBe(true);
            
            // Validate config content
            const config = JSON.parse(await readFile('project-fusion.json', 'utf8'));
            expect(config).toHaveProperty('schemaVersion', 1);
            expect(config).toHaveProperty('generatedFileName', 'project-fusioned');
            expect(config).toHaveProperty('parsedFileExtensions');
            expect(config.parsedFileExtensions).toHaveProperty('web');
            expect(config.parsedFileExtensions).toHaveProperty('backend');
        });

        it('should not overwrite existing config without force flag', async () => {
            // Create initial config
            await writeFile('project-fusion.json', '{"custom": "config"}');
            
            // Try to init again without force
            try {
                execSync(`node "${cliBin}" init`, { 
                    encoding: 'utf8',
                    env: { ...process.env, CI: 'true' }
                });
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.status).toBe(1);
                expect(error.stdout).toContain('already exists');
                expect(error.stdout).toContain('Use --force to override');
            }
            
            // Config should be unchanged
            const config = await readFile('project-fusion.json', 'utf8');
            expect(config).toContain('"custom": "config"');
        });

        it('should overwrite existing config with force flag', async () => {
            // Create initial config
            await writeFile('project-fusion.json', '{"custom": "config"}');
            
            // Init with force flag
            const output = execSync(`node "${cliBin}" init --force`, { 
                encoding: 'utf8',
                env: { ...process.env, CI: 'true' }
            });
            
            expect(output).toContain('✅ Project Fusion initialized successfully!');
            expect(output).toContain('Overriding existing configuration');
            
            // Config should be replaced with default
            const config = JSON.parse(await readFile('project-fusion.json', 'utf8'));
            expect(config).not.toHaveProperty('custom');
            expect(config).toHaveProperty('schemaVersion', 1);
        });
    });

    describe('Config Check Command', () => {
        it('should validate valid configuration', async () => {
            // Create valid config
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
            
            const output = execSync(`node "${cliBin}" config-check`, { 
                encoding: 'utf8',
                env: { ...process.env, CI: 'true' }
            });
            
            expect(output).toContain('✅ Configuration is valid!');
            expect(output).toContain('Configuration Summary:');
            expect(output).toContain('Schema Version: 1');
            expect(output).toContain('Generated File Name: test-fusion');
            expect(output).toContain('│ web         │ 2       │ .js, .ts');
            expect(output).toContain('│ backend     │ 1       │ .py');
        });

        it('should handle invalid configuration', async () => {
            // Create invalid config
            const invalidConfig = {
                schemaVersion: "invalid",
                generateHtml: "not-boolean",
                parsedFileExtensions: "not-object"
            };
            
            await writeFile('project-fusion.json', JSON.stringify(invalidConfig));
            
            try {
                execSync(`node "${cliBin}" config-check`, { 
                    encoding: 'utf8',
                    env: { ...process.env, CI: 'true' }
                });
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.status).toBe(1);
                expect(error.stdout).toContain('❌ Configuration validation failed:');
                expect(error.stdout).toContain('schemaVersion');
                expect(error.stdout).toContain('expected 1');
            }
        });

        it('should handle missing configuration file', async () => {
            const output = execSync(`node "${cliBin}" config-check`, { 
                encoding: 'utf8',
                env: { ...process.env, CI: 'true' }
            });
            
            expect(output).toContain('⚠️ No project-fusion.json found.');
            expect(output).toContain('Using default configuration.');
            expect(output).toContain('Configuration Summary:');
            expect(output).toContain('(Using default configuration)');
        });

        it('should handle malformed JSON', async () => {
            // Create malformed JSON
            await writeFile('project-fusion.json', '{ invalid json');
            
            try {
                execSync(`node "${cliBin}" config-check`, { 
                    encoding: 'utf8',
                    env: { ...process.env, CI: 'true' }
                });
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.status).toBe(1);
                expect(error.stdout).toContain('❌ Invalid JSON in configuration file:');
            }
        });
    });

    describe('Clipboard and Environment Handling', () => {
        it('should skip clipboard copy in CI environment', async () => {
            // Create sample file
            await writeFile('test.js', 'console.log("test");');
            
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
            
            const output = execSync(`node "${cliBin}"`, { 
                encoding: 'utf8',
                env: { ...process.env, CI: 'true' } // Simulate CI environment
            });
            
            expect(output).toContain('✅');
            expect(output).toContain('📋 Clipboard copy skipped (non-interactive environment)');
        });

        it('should handle non-TTY environment', async () => {
            // Create sample file
            await writeFile('test.js', 'console.log("test");');
            
            const output = execSync(`node "${cliBin}"`, { 
                encoding: 'utf8',
                env: { ...process.env, CI: 'false' }, // Not CI but still non-TTY via execSync
                stdio: ['pipe', 'pipe', 'pipe'] // Force non-TTY
            });
            
            expect(output).toContain('✅');
            // Should not attempt clipboard copy even without CI flag due to non-TTY
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid command line options', async () => {
            try {
                execSync(`node "${cliBin}" --unknown-option`, { 
                    encoding: 'utf8',
                    env: { ...process.env, CI: 'true' }
                });
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.status).toBe(1);
                // Commander.js should show help after error
                expect(error.stdout || error.stderr).toContain('Usage:');
            }
        });

        it('should show help information', async () => {
            const output = execSync(`node "${cliBin}" --help`, { 
                encoding: 'utf8',
                env: { ...process.env, CI: 'true' }
            });
            
            expect(output).toContain('Usage:');
            expect(output).toContain('project-fusion');
            expect(output).toContain('init');
            expect(output).toContain('config-check');
            expect(output).toContain('Options:');
        });

        it('should show version information', async () => {
            const output = execSync(`node "${cliBin}" --version`, { 
                encoding: 'utf8',
                env: { ...process.env, CI: 'true' }
            });
            
            expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/); // Version format
        });
    });
});