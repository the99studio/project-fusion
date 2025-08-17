// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Tests for programmatic API
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createConfig, fusionAPI, runFusion } from '../src/api.js';
import { defaultConfig } from '../src/utils.js';
import type { Config } from '../src/types.js';

describe('API Tests', () => {
    const testDir = join(process.cwd(), 'temp', 'test-api');
    const testProjectDir = join(testDir, 'test-project');
    
    beforeEach(async () => {
        // Create test directories
        await mkdir(testProjectDir, { recursive: true });
        
        // Create test files
        await writeFile(join(testProjectDir, 'index.js'), 'console.log("Hello");');
        await writeFile(join(testProjectDir, 'app.ts'), 'const app = "test";');
        await writeFile(join(testProjectDir, 'style.css'), 'body { margin: 0; }');
        await writeFile(join(testProjectDir, 'config.json'), '{"test": true}');
        await writeFile(join(testProjectDir, 'README.md'), '# Test Project');
        await writeFile(join(testProjectDir, 'script.py'), 'print("Python")');
    });
    
    afterEach(async () => {
        // Clean up test directories
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
        
        // Clean up generated files in current directory if any
        const generatedFiles = [
            'project-fusioned.txt',
            'project-fusioned.md',
            'project-fusioned.html',
            'project-fusion.log'
        ];
        for (const file of generatedFiles) {
            const filePath = join(testProjectDir, file);
            if (existsSync(filePath)) {
                await rm(filePath, { force: true });
            }
        }
    });
    
    describe('createConfig', () => {
        it('should create a complete config with defaults', () => {
            const config = createConfig();
            
            expect(config.schemaVersion).toBe(1);
            expect(config.copyToClipboard).toBe(defaultConfig.copyToClipboard);
            expect(config.generatedFileName).toBe(defaultConfig.generatedFileName);
            expect(config.generateHtml).toBe(defaultConfig.generateHtml);
            expect(config.generateMarkdown).toBe(defaultConfig.generateMarkdown);
            expect(config.generateText).toBe(defaultConfig.generateText);
            expect(config.maxFileSizeKB).toBe(defaultConfig.maxFileSizeKB);
            expect(config.parsedFileExtensions).toEqual(defaultConfig.parsedFileExtensions);
            expect(config.parseSubDirectories).toBe(defaultConfig.parseSubDirectories);
            expect(config.rootDirectory).toBe(process.cwd());
            expect(config.useGitIgnoreForExcludes).toBe(defaultConfig.useGitIgnoreForExcludes);
        });
        
        it('should override defaults with provided values', () => {
            const overrides = {
                generateHtml: false,
                maxFileSizeKB: 2048,
                rootDirectory: '/custom/path'
            };
            
            const config = createConfig(overrides);
            
            expect(config.generateHtml).toBe(false);
            expect(config.maxFileSizeKB).toBe(2048);
            expect(config.rootDirectory).toBe('/custom/path');
            expect(config.generateMarkdown).toBe(defaultConfig.generateMarkdown);
        });
        
        it('should handle partial parsedFileExtensions override', () => {
            const config = createConfig({
                parsedFileExtensions: {
                    web: ['.ts', '.tsx'],
                    backend: ['.py']
                }
            });
            
            expect(config.parsedFileExtensions).toEqual({
                web: ['.ts', '.tsx'],
                backend: ['.py']
            });
        });
    });
    
    describe('fusionAPI', () => {
        it('should process fusion with default config', async () => {
            const result = await fusionAPI({
                rootDirectory: testProjectDir,
                generateHtml: false,
                copyToClipboard: false
            });
            
            expect(result.success).toBe(true);
            expect(result.message).toContain('Fusion completed');
            expect(result.fusionFilePath).toBeDefined();
            expect(result.logFilePath).toBeDefined();
            
            // Check files were created
            expect(existsSync(join(testProjectDir, 'project-fusioned.txt'))).toBe(true);
            expect(existsSync(join(testProjectDir, 'project-fusioned.md'))).toBe(true);
            expect(existsSync(join(testProjectDir, 'project-fusion.log'))).toBe(true);
        });
        
        it('should handle custom extensions', async () => {
            const result = await fusionAPI({
                rootDirectory: testProjectDir,
                parsedFileExtensions: {
                    web: ['.js', '.ts'],
                    backend: [],
                    config: [],
                    cpp: [],
                    doc: [],
                    godot: [],
                    scripts: []
                },
                generateHtml: false,
                generateMarkdown: false,
                copyToClipboard: false
            });
            
            expect(result.success).toBe(true);
            
            // Check that only .js and .ts files were processed
            const content = await import('node:fs').then(fs => 
                fs.promises.readFile(join(testProjectDir, 'project-fusioned.txt'), 'utf8')
            );
            expect(content).toContain('index.js');
            expect(content).toContain('app.ts');
            expect(content).not.toContain('style.css');
            expect(content).not.toContain('config.json');
        });
        
        it('should respect extensionGroups filter', async () => {
            const result = await fusionAPI({
                rootDirectory: testProjectDir,
                extensionGroups: ['web'],
                generateHtml: false,
                copyToClipboard: false
            });
            
            expect(result.success).toBe(true);
            
            const content = await import('node:fs').then(fs => 
                fs.promises.readFile(join(testProjectDir, 'project-fusioned.txt'), 'utf8')
            );
            expect(content).toContain('index.js');
            expect(content).toContain('app.ts');
            expect(content).toContain('style.css');
            expect(content).not.toContain('config.json');
            expect(content).not.toContain('script.py');
        });
        
        it('should handle rootDir option', async () => {
            const result = await fusionAPI({
                cwd: testDir,
                rootDir: 'test-project',
                generateHtml: false,
                copyToClipboard: false
            });
            
            expect(result.success).toBe(true);
            expect(existsSync(join(testProjectDir, 'project-fusioned.txt'))).toBe(true);
        });
        
        it('should handle errors gracefully', async () => {
            const result = await fusionAPI({
                rootDirectory: '/non/existent/path',
                copyToClipboard: false
            });
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('failed');
            expect(result.error).toBeDefined();
        });
    });
    
    describe('runFusion', () => {
        it('should work with partial config', async () => {
            const result = await runFusion({
                rootDirectory: testProjectDir,
                generateHtml: false,
                copyToClipboard: false
            });
            
            expect(result.success).toBe(true);
            expect(result.message).toContain('Fusion completed');
        });
        
        it('should work with complete config', async () => {
            const config = createConfig({
                rootDirectory: testProjectDir,
                generateHtml: false,
                generateMarkdown: false,
                copyToClipboard: false
            });
            
            const result = await runFusion(config);
            
            expect(result.success).toBe(true);
            expect(existsSync(join(testProjectDir, 'project-fusioned.txt'))).toBe(true);
            expect(existsSync(join(testProjectDir, 'project-fusioned.md'))).toBe(false);
            expect(existsSync(join(testProjectDir, 'project-fusioned.html'))).toBe(false);
        });
        
        it('should accept fusion options', async () => {
            const result = await runFusion(
                { rootDirectory: testProjectDir, copyToClipboard: false },
                { extensionGroups: ['config', 'doc'] }
            );
            
            expect(result.success).toBe(true);
            
            const content = await import('node:fs').then(fs => 
                fs.promises.readFile(join(testProjectDir, 'project-fusioned.txt'), 'utf8')
            );
            expect(content).toContain('config.json');
            expect(content).toContain('README.md');
            expect(content).not.toContain('index.js');
            expect(content).not.toContain('script.py');
        });
        
        it('should handle empty extension groups', async () => {
            const result = await runFusion(
                { 
                    rootDirectory: testProjectDir,
                    parsedFileExtensions: {
                        backend: [],
                        config: [],
                        cpp: [],
                        doc: [],
                        godot: [],
                        scripts: [],
                        web: []
                    },
                    copyToClipboard: false
                }
            );
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('No file extensions to process');
        });
    });
    
    describe('Integration Tests', () => {
        it('should handle complex nested project structure', async () => {
            // Create nested structure
            const nestedDir = join(testProjectDir, 'src', 'components');
            await mkdir(nestedDir, { recursive: true });
            await writeFile(join(nestedDir, 'Button.tsx'), 'export const Button = () => <button />;');
            await writeFile(join(nestedDir, 'Card.tsx'), 'export const Card = () => <div />;');
            
            const utilsDir = join(testProjectDir, 'src', 'utils');
            await mkdir(utilsDir, { recursive: true });
            await writeFile(join(utilsDir, 'helpers.ts'), 'export const helper = () => {};');
            
            const result = await fusionAPI({
                rootDirectory: testProjectDir,
                parseSubDirectories: true,
                generateHtml: false,
                copyToClipboard: false
            });
            
            expect(result.success).toBe(true);
            
            const content = await import('node:fs').then(fs => 
                fs.promises.readFile(join(testProjectDir, 'project-fusioned.txt'), 'utf8')
            );
            expect(content).toContain('Button.tsx');
            expect(content).toContain('Card.tsx');
            expect(content).toContain('helpers.ts');
        });
        
        it('should respect ignore patterns', async () => {
            // Create test files
            await writeFile(join(testProjectDir, 'test.example.js'), 'console.log("test example");');
            await writeFile(join(testProjectDir, '.env'), 'SECRET=123');
            await writeFile(join(testProjectDir, 'main.ts'), 'const main = () => {};');
            
            const result = await fusionAPI({
                rootDirectory: testProjectDir,
                ignorePatterns: ['*.example.js', '.env'],
                generateHtml: false,
                copyToClipboard: false
            });
            
            expect(result.success).toBe(true);
            
            const content = await import('node:fs').then(fs => 
                fs.promises.readFile(join(testProjectDir, 'project-fusioned.txt'), 'utf8')
            );
            expect(content).toContain('main.ts');
            expect(content).not.toContain('test.example.js');
            expect(content).not.toContain('.env');
        });
        
        it('should handle file size limits', async () => {
            // Create a large file
            const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
            await writeFile(join(testProjectDir, 'large.js'), largeContent);
            
            const result = await fusionAPI({
                rootDirectory: testProjectDir,
                maxFileSizeKB: 1024, // 1MB limit
                generateHtml: false,
                copyToClipboard: false
            });
            
            expect(result.success).toBe(true);
            
            const content = await import('node:fs').then(fs => 
                fs.promises.readFile(join(testProjectDir, 'project-fusioned.txt'), 'utf8')
            );
            expect(content).not.toContain('large.js');
            expect(content).toContain('index.js'); // Small files should still be included
        });
    });
});