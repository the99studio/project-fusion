import path from 'node:path';
import fs from 'fs-extra';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
    DefaultFileSystemAdapter, 
    MemoryFileSystemAdapter,
    OutputStrategyManager,
    PluginManager,
    createPlugin,
    processFusion
} from '../src/index.js';
import { createFilePath, type Config } from '../src/types.js';

const tempDir = path.join(process.cwd(), 'temp', 'architecture-tests');

describe('Architecture Tests', () => {
    beforeEach(async () => {
        await fs.ensureDir(tempDir);
        await fs.emptyDir(tempDir);
    });

    afterEach(async () => {
        await fs.remove(tempDir);
    });

    describe('FileSystemAdapter', () => {
        it('should provide consistent interface between adapters', async () => {
            const defaultFs = new DefaultFileSystemAdapter();
            const memoryFs = new MemoryFileSystemAdapter();

            const testFilePath = createFilePath(path.join(tempDir, 'test.txt'));
            const content = 'Hello World';

            await defaultFs.writeFile(testFilePath, content);
            memoryFs.addFile(testFilePath, content);

            expect(await defaultFs.readFile(testFilePath)).toBe(content);
            expect(await memoryFs.readFile(testFilePath)).toBe(content);

            const defaultStats = await defaultFs.stat(testFilePath);
            const memoryStats = await memoryFs.stat(testFilePath);

            expect(defaultStats.isFile).toBe(true);
            expect(memoryStats.isFile).toBe(true);
            expect(defaultStats.size).toBeGreaterThan(0);
            expect(memoryStats.size).toBeGreaterThan(0);
        });
    });

    describe('OutputStrategy Pattern', () => {
        it('should provide consistent output generation across strategies', async () => {
            const manager = new OutputStrategyManager();
            const memoryFs = new MemoryFileSystemAdapter();

            const context = {
                projectTitle: 'Test Project',
                versionInfo: ' v1.0.0',
                filesToProcess: [{
                    content: 'console.log("hello");',
                    relativePath: 'test.js',
                    path: createFilePath('/test.js'),
                    size: 100
                }],
                config: {
                    rootDirectory: tempDir,
                    generatedFileName: 'test-fusion'
                } as Config
            };

            const textStrategy = manager.getStrategy('text');
            const mdStrategy = manager.getStrategy('markdown');
            const htmlStrategy = manager.getStrategy('html');

            expect(textStrategy).toBeDefined();
            expect(mdStrategy).toBeDefined();
            expect(htmlStrategy).toBeDefined();

            if (textStrategy && mdStrategy && htmlStrategy) {
                const textOutput = await manager.generateOutput(textStrategy, context, memoryFs);
                const mdOutput = await manager.generateOutput(mdStrategy, context, memoryFs);
                const htmlOutput = await manager.generateOutput(htmlStrategy, context, memoryFs);

                expect(textOutput).toContain('.txt');
                expect(mdOutput).toContain('.md');
                expect(htmlOutput).toContain('.html');

                const textContent = await memoryFs.readFile(textOutput);
                const mdContent = await memoryFs.readFile(mdOutput);
                const htmlContent = await memoryFs.readFile(htmlOutput);

                expect(textContent).toContain('console.log("hello");');
                expect(mdContent).toContain('console.log("hello");');
                expect(htmlContent).toContain('console.log&#40;&quot;hello&quot;&#41;;');
            }
        });
    });

    describe('Plugin System', () => {
        it('should support plugin registration and execution', async () => {
            const fs = new MemoryFileSystemAdapter();
            const manager = new PluginManager(fs);

            let beforeCalled = false;
            let afterCalled = false;

            const testPlugin = createPlugin(
                {
                    name: 'test-plugin',
                    version: '1.0.0',
                    description: 'Test plugin'
                },
                {
                    beforeFileProcessing: async (fileInfo) => {
                        beforeCalled = true;
                        return Promise.resolve(fileInfo);
                    },
                    afterFileProcessing: async (fileInfo, content) => {
                        afterCalled = true;
                        return Promise.resolve(`${content  }\n// Plugin processed`);
                    }
                }
            );

            manager.registerPlugin(testPlugin);
            manager.configurePlugin('test-plugin', { name: 'test-plugin', enabled: true });

            const fileInfo = {
                content: 'test content',
                relativePath: 'test.js',
                path: createFilePath('/test.js'),
                size: 100
            };

            const config = { rootDirectory: tempDir } as Config;

            const processedFile = await manager.executeBeforeFileProcessing(fileInfo, config);
            expect(beforeCalled).toBe(true);
            expect(processedFile).toEqual(fileInfo);

            const processedContent = await manager.executeAfterFileProcessing(fileInfo, 'content', config);
            expect(afterCalled).toBe(true);
            expect(processedContent).toBe('content\n// Plugin processed');
        });
    });

    describe('Fusion V2 Integration', () => {
        it('should process fusion with new architecture', async () => {
            const testDir = path.join(tempDir, 'fusion-v2-test');
            await fs.ensureDir(testDir);

            await fs.writeFile(path.join(testDir, 'test.js'), 'console.log("test");');
            await fs.writeFile(path.join(testDir, 'test.ts'), 'const x: string = "test";');

            const config: Config = {
                schemaVersion: 1,
                copyToClipboard: false,
                excludeSecrets: true,
                maxSymlinkAuditEntries: 100,
                generatedFileName: 'test-fusion',
                generateHtml: true,
                generateMarkdown: true,
                generateText: true,
                maxFileSizeKB: 1024,
                maxFiles: 10_000,
                maxTotalSizeMB: 100,
                parseSubDirectories: false,
                parsedFileExtensions: {
                    web: ['.js', '.ts']
                },
                ignorePatterns: [],
                rootDirectory: testDir,
                outputDirectory: testDir,
                useGitIgnoreForExcludes: false,
                allowSymlinks: false,
                
                maxBase64BlockKB: 100,
                maxLineLength: 50_000,
                maxTokenLength: 20_000
            };

            const result = await processFusion(config, {
                extensionGroups: ['web']
            });

            expect(result.success).toBe(true);
            expect(result.message).toContain('2 files processed');

            const txtPath = path.join(testDir, 'test-fusion.txt');
            const mdPath = path.join(testDir, 'test-fusion.md');
            const htmlPath = path.join(testDir, 'test-fusion.html');

            expect(await fs.pathExists(txtPath)).toBe(true);
            expect(await fs.pathExists(mdPath)).toBe(true);
            expect(await fs.pathExists(htmlPath)).toBe(true);

            const txtContent = await fs.readFile(txtPath, 'utf8');
            const mdContent = await fs.readFile(mdPath, 'utf8');
            const htmlContent = await fs.readFile(htmlPath, 'utf8');

            expect(txtContent).toContain('console.log("test");');
            expect(txtContent).toContain('const x: string = "test";');

            expect(mdContent).toContain('```javascript');
            expect(mdContent).toContain('```typescript');

            expect(htmlContent).toContain('<html');
            expect(htmlContent).toContain('</html>');
        });
    });
});