/**
 * Contract tests for Plugin API hooks
 * Ensures all plugin hooks conform to their expected interfaces and behavior
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryFileSystemAdapter } from '../src/adapters/file-system.js';
import { 
    PluginManager, 
    createPlugin,
    type Plugin,
    type PluginHooks,
    type PluginMetadata
} from '../src/plugins/plugin-system.js';
import type { FileInfo, OutputStrategy } from '../src/strategies/output-strategy.js';
import { createFilePath, type Config } from '../src/types.js';
import { defaultConfig } from '../src/utils.js';

/**
 * Contract test helper to create a minimal valid plugin
 */
function createTestPlugin(hooks: Partial<PluginHooks> = {}): Plugin {
    return createPlugin({
        name: 'contract-test-plugin',
        version: '1.0.0',
        description: 'Plugin for contract testing'
    }, hooks);
}

/**
 * Helper to create valid FileInfo for testing
 */
function createTestFileInfo(overrides: Partial<FileInfo> = {}): FileInfo {
    return {
        content: 'test content',
        relativePath: 'test.js',
        path: createFilePath('/test/test.js'),
        size: 12,
        ...overrides
    };
}

describe('Plugin API Contract Tests', () => {
    let pluginManager: PluginManager;
    let fs: MemoryFileSystemAdapter;
    let config: Config;

    beforeEach(() => {
        fs = new MemoryFileSystemAdapter();
        pluginManager = new PluginManager(fs);
        config = { ...defaultConfig };
    });

    describe('initialize hook contract', () => {
        it('should be called with valid Config object', async () => {
            const initializeSpy = vi.fn();
            const plugin = createTestPlugin();
            plugin.initialize = initializeSpy;

            pluginManager.registerPlugin(plugin);
            await pluginManager.initializePlugins(config);

            expect(initializeSpy).toHaveBeenCalledTimes(1);
            expect(initializeSpy).toHaveBeenCalledWith(config);
            
            // Verify config parameter has required properties
            const calledWith = initializeSpy.mock.calls[0][0];
            expect(calledWith).toHaveProperty('rootDirectory');
            expect(calledWith).toHaveProperty('parsedFileExtensions');
            // outputDirectory is optional in Config interface
            expect(typeof calledWith).toBe('object');
        });

        it('should handle async initialization', async () => {
            let initCompleted = false;
            const plugin = createTestPlugin();
            plugin.initialize = async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                initCompleted = true;
            };

            pluginManager.registerPlugin(plugin);
            await pluginManager.initializePlugins(config);

            expect(initCompleted).toBe(true);
        });

        it('should handle initialization errors without affecting other plugins', async () => {
            const workingPlugin = createTestPlugin();
            const workingInitSpy = vi.fn();
            workingPlugin.metadata.name = 'working-plugin';
            workingPlugin.initialize = workingInitSpy;

            const failingPlugin = createTestPlugin();
            failingPlugin.metadata.name = 'failing-plugin';
            failingPlugin.initialize = () => {
                throw new Error('Initialization failed');
            };

            pluginManager.registerPlugin(workingPlugin);
            pluginManager.registerPlugin(failingPlugin);

            // Should not throw
            await pluginManager.initializePlugins(config);

            // Working plugin should still be initialized
            expect(workingInitSpy).toHaveBeenCalled();
        });

        it('should be optional - plugin without initialize should work', async () => {
            const plugin = createTestPlugin();
            // Don't set initialize method

            pluginManager.registerPlugin(plugin);
            
            // Should not throw
            await expect(pluginManager.initializePlugins(config)).resolves.not.toThrow();
        });
    });

    describe('cleanup hook contract', () => {
        it('should be called without parameters', async () => {
            const cleanupSpy = vi.fn();
            const plugin = createTestPlugin();
            plugin.cleanup = cleanupSpy;

            pluginManager.registerPlugin(plugin);
            await pluginManager.cleanupPlugins();

            expect(cleanupSpy).toHaveBeenCalledTimes(1);
            expect(cleanupSpy).toHaveBeenCalledWith();
        });

        it('should handle async cleanup', async () => {
            let cleanupCompleted = false;
            const plugin = createTestPlugin();
            plugin.cleanup = async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                cleanupCompleted = true;
            };

            pluginManager.registerPlugin(plugin);
            await pluginManager.cleanupPlugins();

            expect(cleanupCompleted).toBe(true);
        });

        it('should handle cleanup errors without affecting other plugins', async () => {
            const workingPlugin = createTestPlugin();
            const workingCleanupSpy = vi.fn();
            workingPlugin.metadata.name = 'working-plugin';
            workingPlugin.cleanup = workingCleanupSpy;

            const failingPlugin = createTestPlugin();
            failingPlugin.metadata.name = 'failing-plugin';
            failingPlugin.cleanup = () => {
                throw new Error('Cleanup failed');
            };

            pluginManager.registerPlugin(workingPlugin);
            pluginManager.registerPlugin(failingPlugin);

            // Should not throw
            await pluginManager.cleanupPlugins();

            // Working plugin should still be cleaned up
            expect(workingCleanupSpy).toHaveBeenCalled();
        });

        it('should be optional - plugin without cleanup should work', async () => {
            const plugin = createTestPlugin();
            // Don't set cleanup method

            pluginManager.registerPlugin(plugin);
            
            // Should not throw
            await expect(pluginManager.cleanupPlugins()).resolves.not.toThrow();
        });
    });

    describe('beforeFileProcessing hook contract', () => {
        it('should be called with FileInfo and Config parameters', async () => {
            const hookSpy = vi.fn().mockResolvedValue(null);
            const plugin = createTestPlugin({
                beforeFileProcessing: hookSpy
            });

            pluginManager.registerPlugin(plugin);
            
            const fileInfo = createTestFileInfo();
            await pluginManager.executeBeforeFileProcessing(fileInfo, config);

            expect(hookSpy).toHaveBeenCalledTimes(1);
            expect(hookSpy).toHaveBeenCalledWith(fileInfo, config);
        });

        it('should return FileInfo or null', async () => {
            const modifiedFileInfo = createTestFileInfo({ content: 'modified' });
            
            // Test returning modified FileInfo
            const modifyingPlugin = createTestPlugin({
                beforeFileProcessing: vi.fn().mockResolvedValue(modifiedFileInfo)
            });

            pluginManager.registerPlugin(modifyingPlugin);
            
            const result = await pluginManager.executeBeforeFileProcessing(
                createTestFileInfo(), 
                config
            );

            expect(result).toEqual(modifiedFileInfo);
        });

        it('should support filtering by returning null', async () => {
            const filteringPlugin = createTestPlugin({
                beforeFileProcessing: vi.fn().mockResolvedValue(null)
            });

            pluginManager.registerPlugin(filteringPlugin);
            
            const result = await pluginManager.executeBeforeFileProcessing(
                createTestFileInfo(), 
                config
            );

            expect(result).toBeNull();
        });

        it('should chain multiple plugins correctly', async () => {
            const plugin1 = createTestPlugin({
                beforeFileProcessing: vi.fn().mockResolvedValue(
                    createTestFileInfo({ content: 'step1' })
                )
            });
            plugin1.metadata.name = 'plugin1';

            const plugin2 = createTestPlugin({
                beforeFileProcessing: vi.fn().mockResolvedValue(
                    createTestFileInfo({ content: 'step2' })
                )
            });
            plugin2.metadata.name = 'plugin2';

            pluginManager.registerPlugin(plugin1);
            pluginManager.registerPlugin(plugin2);
            
            const result = await pluginManager.executeBeforeFileProcessing(
                createTestFileInfo({ content: 'original' }), 
                config
            );

            expect(result?.content).toBe('step2');
            expect(plugin1.beforeFileProcessing).toHaveBeenCalledWith(
                expect.objectContaining({ content: 'original' }),
                config
            );
            expect(plugin2.beforeFileProcessing).toHaveBeenCalledWith(
                expect.objectContaining({ content: 'step1' }),
                config
            );
        });

        it('should handle errors gracefully and continue processing', async () => {
            const failingPlugin = createTestPlugin({
                beforeFileProcessing: vi.fn().mockRejectedValue(new Error('Hook failed'))
            });
            failingPlugin.metadata.name = 'failing-plugin';

            const workingPlugin = createTestPlugin({
                beforeFileProcessing: vi.fn().mockResolvedValue(
                    createTestFileInfo({ content: 'processed' })
                )
            });
            workingPlugin.metadata.name = 'working-plugin';

            pluginManager.registerPlugin(failingPlugin);
            pluginManager.registerPlugin(workingPlugin);
            
            const fileInfo = createTestFileInfo();
            const result = await pluginManager.executeBeforeFileProcessing(fileInfo, config);

            // Should still process with working plugin
            expect(result?.content).toBe('processed');
            expect(workingPlugin.beforeFileProcessing).toHaveBeenCalled();
        });

        it('should respect cancellation token', async () => {
            const slowPlugin = createTestPlugin({
                beforeFileProcessing: vi.fn().mockImplementation(() => 
                    new Promise(resolve => setTimeout(() => resolve(null), 100))
                )
            });

            pluginManager.registerPlugin(slowPlugin);

            const cancellationToken = {
                isCancellationRequested: true
            };

            await expect(
                pluginManager.executeBeforeFileProcessing(
                    createTestFileInfo(), 
                    config, 
                    cancellationToken
                )
            ).rejects.toThrow('Operation was cancelled');
        });
    });

    describe('afterFileProcessing hook contract', () => {
        it('should be called with FileInfo, processed content, and Config', async () => {
            const hookSpy = vi.fn().mockResolvedValue('final content');
            const plugin = createTestPlugin({
                afterFileProcessing: hookSpy
            });

            pluginManager.registerPlugin(plugin);
            
            const fileInfo = createTestFileInfo();
            const processedContent = 'processed content';
            
            await pluginManager.executeAfterFileProcessing(fileInfo, processedContent, config);

            expect(hookSpy).toHaveBeenCalledTimes(1);
            expect(hookSpy).toHaveBeenCalledWith(fileInfo, processedContent, config);
        });

        it('should return processed content string', async () => {
            const plugin = createTestPlugin({
                afterFileProcessing: vi.fn().mockResolvedValue('final processed content')
            });

            pluginManager.registerPlugin(plugin);
            
            const result = await pluginManager.executeAfterFileProcessing(
                createTestFileInfo(), 
                'input content', 
                config
            );

            expect(result).toBe('final processed content');
            expect(typeof result).toBe('string');
        });

        it('should chain multiple plugins correctly', async () => {
            const plugin1 = createTestPlugin({
                afterFileProcessing: vi.fn().mockResolvedValue('step1')
            });
            plugin1.metadata.name = 'plugin1';

            const plugin2 = createTestPlugin({
                afterFileProcessing: vi.fn().mockResolvedValue('step2')
            });
            plugin2.metadata.name = 'plugin2';

            pluginManager.registerPlugin(plugin1);
            pluginManager.registerPlugin(plugin2);
            
            const result = await pluginManager.executeAfterFileProcessing(
                createTestFileInfo(), 
                'original', 
                config
            );

            expect(result).toBe('step2');
            expect(plugin1.afterFileProcessing).toHaveBeenCalledWith(
                expect.any(Object),
                'original',
                config
            );
            expect(plugin2.afterFileProcessing).toHaveBeenCalledWith(
                expect.any(Object),
                'step1',
                config
            );
        });

        it('should handle errors gracefully', async () => {
            const failingPlugin = createTestPlugin({
                afterFileProcessing: vi.fn().mockRejectedValue(new Error('Hook failed'))
            });
            failingPlugin.metadata.name = 'failing-plugin';

            const workingPlugin = createTestPlugin({
                afterFileProcessing: vi.fn().mockResolvedValue('processed by working plugin')
            });
            workingPlugin.metadata.name = 'working-plugin';

            pluginManager.registerPlugin(failingPlugin);
            pluginManager.registerPlugin(workingPlugin);
            
            const result = await pluginManager.executeAfterFileProcessing(
                createTestFileInfo(), 
                'original content', 
                config
            );

            expect(result).toBe('processed by working plugin');
        });
    });

    describe('beforeFusion hook contract', () => {
        it('should be called with Config and FileInfo array', async () => {
            const hookSpy = vi.fn().mockResolvedValue({
                config,
                filesToProcess: []
            });
            const plugin = createTestPlugin({
                beforeFusion: hookSpy
            });

            pluginManager.registerPlugin(plugin);
            
            const files = [createTestFileInfo()];
            await pluginManager.executeBeforeFusion(config, files);

            expect(hookSpy).toHaveBeenCalledTimes(1);
            expect(hookSpy).toHaveBeenCalledWith(config, files);
        });

        it('should return object with config and filesToProcess properties', async () => {
            const modifiedConfig = { ...config, maxFileSizeKB: 999 };
            const modifiedFiles = [createTestFileInfo({ content: 'modified' })];
            
            const plugin = createTestPlugin({
                beforeFusion: vi.fn().mockResolvedValue({
                    config: modifiedConfig,
                    filesToProcess: modifiedFiles
                })
            });

            pluginManager.registerPlugin(plugin);
            
            const result = await pluginManager.executeBeforeFusion(config, [createTestFileInfo()]);

            expect(result).toHaveProperty('config');
            expect(result).toHaveProperty('filesToProcess');
            expect(result.config.maxFileSizeKB).toBe(999);
            expect(result.filesToProcess).toEqual(modifiedFiles);
        });

        it('should chain multiple plugins correctly', async () => {
            const plugin1 = createTestPlugin({
                beforeFusion: vi.fn().mockResolvedValue({
                    config: { ...config, maxFileSizeKB: 100 },
                    filesToProcess: [createTestFileInfo({ content: 'step1' })]
                })
            });
            plugin1.metadata.name = 'plugin1';

            const plugin2 = createTestPlugin({
                beforeFusion: vi.fn().mockResolvedValue({
                    config: { ...config, maxFileSizeKB: 200 },
                    filesToProcess: [createTestFileInfo({ content: 'step2' })]
                })
            });
            plugin2.metadata.name = 'plugin2';

            pluginManager.registerPlugin(plugin1);
            pluginManager.registerPlugin(plugin2);
            
            const result = await pluginManager.executeBeforeFusion(config, [createTestFileInfo()]);

            expect(result.config.maxFileSizeKB).toBe(200);
            expect(result.filesToProcess[0]?.content).toBe('step2');
        });

        it('should handle errors gracefully', async () => {
            const failingPlugin = createTestPlugin({
                beforeFusion: vi.fn().mockRejectedValue(new Error('Hook failed'))
            });
            failingPlugin.metadata.name = 'failing-plugin';

            pluginManager.registerPlugin(failingPlugin);
            
            const files = [createTestFileInfo()];
            const result = await pluginManager.executeBeforeFusion(config, files);

            // Should return original values when hook fails
            expect(result.config).toEqual(config);
            expect(result.filesToProcess).toEqual(files);
        });

        it('should respect cancellation token', async () => {
            const slowPlugin = createTestPlugin({
                beforeFusion: vi.fn().mockImplementation(() => 
                    new Promise(resolve => setTimeout(() => resolve({ config, filesToProcess: [] }), 100))
                )
            });

            pluginManager.registerPlugin(slowPlugin);

            const cancellationToken = {
                isCancellationRequested: true
            };

            await expect(
                pluginManager.executeBeforeFusion(config, [], cancellationToken)
            ).rejects.toThrow('Operation was cancelled');
        });
    });

    describe('afterFusion hook contract', () => {
        it('should be called with result and Config', async () => {
            const hookSpy = vi.fn().mockResolvedValue({ modified: true });
            const plugin = createTestPlugin({
                afterFusion: hookSpy
            });

            pluginManager.registerPlugin(plugin);
            
            const originalResult = { original: true };
            await pluginManager.executeAfterFusion(originalResult, config);

            expect(hookSpy).toHaveBeenCalledTimes(1);
            expect(hookSpy).toHaveBeenCalledWith(originalResult, config);
        });

        it('should return modified result', async () => {
            const plugin = createTestPlugin({
                afterFusion: vi.fn().mockResolvedValue({ processed: true })
            });

            pluginManager.registerPlugin(plugin);
            
            const result = await pluginManager.executeAfterFusion({ original: true }, config);

            expect(result).toEqual({ processed: true });
        });

        it('should preserve result type through generic', async () => {
            interface CustomResult {
                value: string;
                count: number;
            }

            const plugin = createTestPlugin({
                afterFusion: vi.fn().mockResolvedValue({ value: 'processed', count: 42 })
            });

            pluginManager.registerPlugin(plugin);
            
            const result = await pluginManager.executeAfterFusion<CustomResult>(
                { value: 'original', count: 1 }, 
                config
            );

            expect(result.value).toBe('processed');
            expect(result.count).toBe(42);
        });

        it('should chain multiple plugins correctly', async () => {
            const plugin1 = createTestPlugin({
                afterFusion: vi.fn().mockResolvedValue({ step: 1 })
            });
            plugin1.metadata.name = 'plugin1';

            const plugin2 = createTestPlugin({
                afterFusion: vi.fn().mockResolvedValue({ step: 2 })
            });
            plugin2.metadata.name = 'plugin2';

            pluginManager.registerPlugin(plugin1);
            pluginManager.registerPlugin(plugin2);
            
            const result = await pluginManager.executeAfterFusion({ step: 0 }, config);

            expect(result).toEqual({ step: 2 });
        });

        it('should handle errors gracefully', async () => {
            const failingPlugin = createTestPlugin({
                afterFusion: vi.fn().mockRejectedValue(new Error('Hook failed'))
            });
            failingPlugin.metadata.name = 'failing-plugin';

            pluginManager.registerPlugin(failingPlugin);
            
            const originalResult = { original: true };
            const result = await pluginManager.executeAfterFusion(originalResult, config);

            // Should return original result when hook fails
            expect(result).toEqual(originalResult);
        });
    });

    describe('registerOutputStrategies hook contract', () => {
        it('should return array of OutputStrategy objects', () => {
            const customStrategy: OutputStrategy = {
                name: 'custom',
                extension: '.custom',
                generateHeader: vi.fn().mockReturnValue('Custom Header'),
                processFile: vi.fn().mockReturnValue('processed file'),
                createStream: vi.fn().mockReturnValue({} as any)
            };

            const plugin = createTestPlugin({
                registerOutputStrategies: vi.fn().mockReturnValue([customStrategy])
            });

            pluginManager.registerPlugin(plugin);
            
            const strategies = pluginManager.getAdditionalOutputStrategies();

            expect(Array.isArray(strategies)).toBe(true);
            expect(strategies).toHaveLength(1);
            expect(strategies[0]).toEqual(customStrategy);
        });

        it('should validate OutputStrategy structure', () => {
            const validStrategy: OutputStrategy = {
                name: 'test-strategy',
                extension: '.test',
                generateHeader: vi.fn(),
                processFile: vi.fn(),
                createStream: vi.fn()
            };

            const plugin = createTestPlugin({
                registerOutputStrategies: () => [validStrategy]
            });

            pluginManager.registerPlugin(plugin);
            const strategies = pluginManager.getAdditionalOutputStrategies();

            const strategy = strategies[0];
            expect(strategy).toBeDefined();
            expect(strategy?.name).toBe('test-strategy');
            expect(strategy?.extension).toBe('.test');
            expect(typeof strategy?.generateHeader).toBe('function');
            expect(typeof strategy?.processFile).toBe('function');
            expect(typeof strategy?.createStream).toBe('function');
        });

        it('should handle multiple strategies from single plugin', () => {
            const strategies = [
                { name: 'strategy1', extension: '.s1', generateHeader: vi.fn(), processFile: vi.fn(), createStream: vi.fn() },
                { name: 'strategy2', extension: '.s2', generateHeader: vi.fn(), processFile: vi.fn(), createStream: vi.fn() }
            ];

            const plugin = createTestPlugin({
                registerOutputStrategies: () => strategies
            });

            pluginManager.registerPlugin(plugin);
            
            const result = pluginManager.getAdditionalOutputStrategies();
            expect(result).toHaveLength(2);
        });

        it('should handle errors gracefully', () => {
            const plugin = createTestPlugin({
                registerOutputStrategies: vi.fn().mockImplementation(() => {
                    throw new Error('Strategy registration failed');
                })
            });

            pluginManager.registerPlugin(plugin);
            
            const strategies = pluginManager.getAdditionalOutputStrategies();
            expect(strategies).toEqual([]);
        });
    });

    describe('registerFileExtensions hook contract', () => {
        it('should return Record<string, string[]>', () => {
            const extensions = {
                custom: ['.custom1', '.custom2'],
                special: ['.spec']
            };

            const plugin = createTestPlugin({
                registerFileExtensions: vi.fn().mockReturnValue(extensions)
            });

            pluginManager.registerPlugin(plugin);
            
            const result = pluginManager.getAdditionalFileExtensions();

            expect(result).toEqual(extensions);
            expect(typeof result).toBe('object');
            expect(Array.isArray(result.custom)).toBe(true);
            expect(result.custom).toEqual(['.custom1', '.custom2']);
        });

        it('should validate extension format', () => {
            const validExtensions = {
                group1: ['.ext1', '.ext2'],
                group2: ['.ext3']
            };

            const plugin = createTestPlugin({
                registerFileExtensions: () => validExtensions
            });

            pluginManager.registerPlugin(plugin);
            const result = pluginManager.getAdditionalFileExtensions();

            // Verify structure
            for (const [groupName, extensions] of Object.entries(result)) {
                expect(typeof groupName).toBe('string');
                expect(Array.isArray(extensions)).toBe(true);
                for (const ext of extensions) {
                    expect(typeof ext).toBe('string');
                    expect(ext.startsWith('.')).toBe(true);
                }
            }
        });

        it('should handle empty extensions object', () => {
            const plugin = createTestPlugin({
                registerFileExtensions: () => ({})
            });

            pluginManager.registerPlugin(plugin);
            
            const result = pluginManager.getAdditionalFileExtensions();
            expect(result).toEqual({});
        });

        it('should handle errors gracefully', () => {
            const plugin = createTestPlugin({
                registerFileExtensions: vi.fn().mockImplementation(() => {
                    throw new Error('Extension registration failed');
                })
            });

            pluginManager.registerPlugin(plugin);
            
            const result = pluginManager.getAdditionalFileExtensions();
            expect(result).toEqual({});
        });
    });

    describe('Plugin metadata contract', () => {
        it('should require name, version, and description', () => {
            const validMetadata: PluginMetadata = {
                name: 'test-plugin',
                version: '1.0.0',
                description: 'Test plugin for validation'
            };

            const plugin = createPlugin(validMetadata);

            expect(plugin.metadata.name).toBe('test-plugin');
            expect(plugin.metadata.version).toBe('1.0.0');
            expect(plugin.metadata.description).toBe('Test plugin for validation');
        });

        it('should support optional author and homepage fields', () => {
            const metadataWithOptionals: PluginMetadata = {
                name: 'full-plugin',
                version: '2.0.0',
                description: 'Full plugin metadata',
                author: 'Test Author',
                homepage: 'https://example.com/plugin'
            };

            const plugin = createPlugin(metadataWithOptionals);

            expect(plugin.metadata.author).toBe('Test Author');
            expect(plugin.metadata.homepage).toBe('https://example.com/plugin');
        });

        it('should validate metadata fields are strings', () => {
            const plugin = createTestPlugin();
            
            expect(typeof plugin.metadata.name).toBe('string');
            expect(typeof plugin.metadata.version).toBe('string');
            expect(typeof plugin.metadata.description).toBe('string');
            
            if (plugin.metadata.author) {
                expect(typeof plugin.metadata.author).toBe('string');
            }
            if (plugin.metadata.homepage) {
                expect(typeof plugin.metadata.homepage).toBe('string');
            }
        });
    });
});