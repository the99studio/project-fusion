/**
 * Tests for Plugin System
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryFileSystemAdapter } from '../src/adapters/file-system.js';
import { 
    PluginManager, 
    BasePlugin, 
    createPlugin,
    type PluginMetadata,
    type OutputStrategy
} from '../src/plugins/plugin-system.js';
import { createFilePath, type Config } from '../src/types.js';
import { defaultConfig } from '../src/utils.js';

describe('Plugin System', () => {
    let pluginManager: PluginManager;
    let fs: MemoryFileSystemAdapter;
    let config: Config;

    beforeEach(() => {
        fs = new MemoryFileSystemAdapter();
        pluginManager = new PluginManager(fs);
        config = { ...defaultConfig };
    });

    describe('PluginManager', () => {
        describe('Plugin Registration', () => {
            it('should register and retrieve plugins', () => {
                const plugin = createPlugin({
                    name: 'test-plugin',
                    version: '1.0.0',
                    description: 'Test plugin'
                });

                pluginManager.registerPlugin(plugin);
                const retrieved = pluginManager.getPlugin('test-plugin');

                expect(retrieved).toBe(plugin);
            });

            it('should unregister plugins', () => {
                const plugin = createPlugin({
                    name: 'test-plugin',
                    version: '1.0.0',
                    description: 'Test plugin'
                });

                pluginManager.registerPlugin(plugin);
                pluginManager.unregisterPlugin('test-plugin');
                
                expect(pluginManager.getPlugin('test-plugin')).toBeUndefined();
            });

            it('should configure plugins', () => {
                const plugin = createPlugin({
                    name: 'test-plugin',
                    version: '1.0.0',
                    description: 'Test plugin'
                });

                pluginManager.registerPlugin(plugin);
                pluginManager.configurePlugin('test-plugin', {
                    name: 'test-plugin',
                    enabled: false,
                    options: { key: 'value' }
                });

                const enabledPlugins = pluginManager.getEnabledPlugins();
                expect(enabledPlugins).not.toContain(plugin);
            });

            it('should list plugin metadata', () => {
                const plugin1 = createPlugin({
                    name: 'plugin1',
                    version: '1.0.0',
                    description: 'First plugin'
                });
                const plugin2 = createPlugin({
                    name: 'plugin2',
                    version: '2.0.0',
                    description: 'Second plugin'
                });

                pluginManager.registerPlugin(plugin1);
                pluginManager.registerPlugin(plugin2);

                const metadata = pluginManager.listPlugins();
                expect(metadata).toHaveLength(2);
                expect(metadata[0].name).toBe('plugin1');
                expect(metadata[1].name).toBe('plugin2');
            });
        });

        describe('Plugin Loading', () => {
            it('should handle plugin loading errors gracefully', async () => {
                const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

                // Try to load non-existent plugin
                await expect(pluginManager.loadPlugin('/non/existent/plugin.js')).rejects.toThrow();

                consoleSpy.mockRestore();
            });

            it('should load plugins from directory', async () => {
                const pluginsDir = '/non/existent/plugins';
                
                const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

                // Should handle directory that doesn't exist without throwing
                await pluginManager.loadPluginsFromDirectory(pluginsDir);

                consoleSpy.mockRestore();
            });

            it('should handle missing plugins directory', async () => {
                await pluginManager.loadPluginsFromDirectory('/non/existent/dir');
                // Should not throw
            });
        });

        describe('Plugin Lifecycle', () => {
            it('should initialize plugins', async () => {
                const initSpy = vi.fn();
                const plugin = createPlugin({
                    name: 'test-plugin',
                    version: '1.0.0',
                    description: 'Test plugin'
                }, {
                    initialize: initSpy
                });

                pluginManager.registerPlugin(plugin);
                await pluginManager.initializePlugins(config);

                expect(initSpy).toHaveBeenCalledWith(config);
            });

            it('should cleanup plugins', async () => {
                const cleanupSpy = vi.fn();
                const plugin = createPlugin({
                    name: 'test-plugin',
                    version: '1.0.0',
                    description: 'Test plugin'
                }, {
                    cleanup: cleanupSpy
                });

                pluginManager.registerPlugin(plugin);
                await pluginManager.cleanupPlugins();

                expect(cleanupSpy).toHaveBeenCalled();
            });

            it('should handle plugin initialization errors', async () => {
                const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
                const plugin = createPlugin({
                    name: 'failing-plugin',
                    version: '1.0.0',
                    description: 'Failing plugin'
                }, {
                    initialize: () => { throw new Error('Init failed'); }
                });

                pluginManager.registerPlugin(plugin);
                await pluginManager.initializePlugins(config);

                expect(consoleSpy).toHaveBeenCalled();
                consoleSpy.mockRestore();
            });

            it('should handle plugin cleanup errors', async () => {
                const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
                const plugin = createPlugin({
                    name: 'failing-plugin',
                    version: '1.0.0',
                    description: 'Failing plugin'
                }, {
                    cleanup: () => { throw new Error('Cleanup failed'); }
                });

                pluginManager.registerPlugin(plugin);
                await pluginManager.cleanupPlugins();

                expect(consoleSpy).toHaveBeenCalled();
                consoleSpy.mockRestore();
            });
        });

        describe('Plugin Hooks', () => {
            it('should execute beforeFileProcessing hooks', async () => {
                const hookSpy = vi.fn().mockResolvedValue({
                    content: 'modified',
                    relativePath: 'test.js',
                    path: createFilePath('/test.js'),
                    size: 8
                });

                const plugin = createPlugin({
                    name: 'test-plugin',
                    version: '1.0.0',
                    description: 'Test plugin'
                }, {
                    beforeFileProcessing: hookSpy
                });

                pluginManager.registerPlugin(plugin);

                const fileInfo = {
                    content: 'original',
                    relativePath: 'test.js',
                    path: createFilePath('/test.js'),
                    size: 8
                };

                const result = await pluginManager.executeBeforeFileProcessing(fileInfo, config);

                expect(hookSpy).toHaveBeenCalledWith(fileInfo, config);
                expect(result?.content).toBe('modified');
            });

            it('should filter out files when hook returns null', async () => {
                const plugin = createPlugin({
                    name: 'filter-plugin',
                    version: '1.0.0',
                    description: 'Filter plugin'
                }, {
                    beforeFileProcessing: () => null
                });

                pluginManager.registerPlugin(plugin);

                const fileInfo = {
                    content: 'content',
                    relativePath: 'test.js',
                    path: createFilePath('/test.js'),
                    size: 7
                };

                const result = await pluginManager.executeBeforeFileProcessing(fileInfo, config);
                expect(result).toBeNull();
            });

            it('should execute afterFileProcessing hooks', async () => {
                const hookSpy = vi.fn().mockResolvedValue('processed content');

                const plugin = createPlugin({
                    name: 'test-plugin',
                    version: '1.0.0',
                    description: 'Test plugin'
                }, {
                    afterFileProcessing: hookSpy
                });

                pluginManager.registerPlugin(plugin);

                const fileInfo = {
                    content: 'original',
                    relativePath: 'test.js',
                    path: createFilePath('/test.js'),
                    size: 8
                };

                const result = await pluginManager.executeAfterFileProcessing(fileInfo, 'content', config);

                expect(hookSpy).toHaveBeenCalledWith(fileInfo, 'content', config);
                expect(result).toBe('processed content');
            });

            it('should execute beforeFusion hooks', async () => {
                const hookSpy = vi.fn().mockResolvedValue({
                    config: { ...config, maxFileSizeKB: 100 },
                    filesToProcess: []
                });

                const plugin = createPlugin({
                    name: 'test-plugin',
                    version: '1.0.0',
                    description: 'Test plugin'
                }, {
                    beforeFusion: hookSpy
                });

                pluginManager.registerPlugin(plugin);

                const result = await pluginManager.executeBeforeFusion(config, []);

                expect(hookSpy).toHaveBeenCalledWith(config, []);
                expect(result.config.maxFileSizeKB).toBe(100);
            });

            it('should execute afterFusion hooks', async () => {
                const hookSpy = vi.fn().mockResolvedValue({ modified: true });

                const plugin = createPlugin({
                    name: 'test-plugin',
                    version: '1.0.0',
                    description: 'Test plugin'
                }, {
                    afterFusion: hookSpy
                });

                pluginManager.registerPlugin(plugin);

                const result = await pluginManager.executeAfterFusion({ original: true }, config);

                expect(hookSpy).toHaveBeenCalledWith({ original: true }, config);
                expect(result.modified).toBe(true);
            });

            it('should handle hook errors gracefully', async () => {
                const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
                
                const plugin = createPlugin({
                    name: 'failing-plugin',
                    version: '1.0.0',
                    description: 'Failing plugin'
                }, {
                    beforeFileProcessing: () => { throw new Error('Hook failed'); }
                });

                pluginManager.registerPlugin(plugin);

                const fileInfo = {
                    content: 'content',
                    relativePath: 'test.js',
                    path: createFilePath('/test.js'),
                    size: 7
                };

                const result = await pluginManager.executeBeforeFileProcessing(fileInfo, config);
                expect(result).toBe(fileInfo);
                expect(consoleSpy).toHaveBeenCalled();

                consoleSpy.mockRestore();
            });
        });

        describe('Output Strategies', () => {
            it('should get additional output strategies from plugins', () => {
                const strategy: OutputStrategy = {
                    name: 'custom',
                    extension: '.custom',
                    generateHeader: () => 'header',
                    processFile: () => 'processed'
                };

                const plugin = createPlugin({
                    name: 'strategy-plugin',
                    version: '1.0.0',
                    description: 'Strategy plugin'
                }, {
                    registerOutputStrategies: () => [strategy] as OutputStrategy[]
                });

                pluginManager.registerPlugin(plugin);

                const strategies = pluginManager.getAdditionalOutputStrategies();
                expect(strategies).toContain(strategy);
            });

            it('should handle output strategy errors', () => {
                const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
                
                const plugin = createPlugin({
                    name: 'failing-strategy-plugin',
                    version: '1.0.0',
                    description: 'Failing strategy plugin'
                }, {
                    registerOutputStrategies: () => { throw new Error('Strategy failed'); }
                });

                pluginManager.registerPlugin(plugin);

                const strategies = pluginManager.getAdditionalOutputStrategies();
                expect(strategies).toEqual([]);
                expect(consoleSpy).toHaveBeenCalled();

                consoleSpy.mockRestore();
            });
        });

        describe('File Extensions', () => {
            it('should get additional file extensions from plugins', () => {
                const extensions = { custom: ['.custom1', '.custom2'] };

                const plugin = createPlugin({
                    name: 'extension-plugin',
                    version: '1.0.0',
                    description: 'Extension plugin'
                }, {
                    registerFileExtensions: () => extensions
                });

                pluginManager.registerPlugin(plugin);

                const result = pluginManager.getAdditionalFileExtensions();
                expect(result).toEqual(extensions);
            });

            it('should handle file extension errors', () => {
                const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
                
                const plugin = createPlugin({
                    name: 'failing-extension-plugin',
                    version: '1.0.0',
                    description: 'Failing extension plugin'
                }, {
                    registerFileExtensions: () => { throw new Error('Extension failed'); }
                });

                pluginManager.registerPlugin(plugin);

                const result = pluginManager.getAdditionalFileExtensions();
                expect(result).toEqual({});
                expect(consoleSpy).toHaveBeenCalled();

                consoleSpy.mockRestore();
            });
        });
    });

    describe('BasePlugin', () => {
        it('should create plugins with BasePlugin class', () => {
            class TestPlugin extends BasePlugin {
                metadata = {
                    name: 'test-plugin',
                    version: '1.0.0',
                    description: 'Test plugin'
                };
            }

            const plugin = new TestPlugin();
            expect(plugin.metadata.name).toBe('test-plugin');
        });

        it('should support optional lifecycle methods', async () => {
            class TestPlugin extends BasePlugin {
                metadata = {
                    name: 'test-plugin',
                    version: '1.0.0',
                    description: 'Test plugin'
                };

                initCalled = false;
                cleanupCalled = false;

                initialize() {
                    this.initCalled = true;
                }

                cleanup() {
                    this.cleanupCalled = true;
                }
            }

            const plugin = new TestPlugin();
            
            if (plugin.initialize) plugin.initialize(config);
            if (plugin.cleanup) plugin.cleanup();

            expect(plugin.initCalled).toBe(true);
            expect(plugin.cleanupCalled).toBe(true);
        });
    });

    describe('createPlugin helper', () => {
        it('should create plugins with metadata only', () => {
            const metadata: PluginMetadata = {
                name: 'simple-plugin',
                version: '1.0.0',
                description: 'Simple plugin'
            };

            const plugin = createPlugin(metadata);
            expect(plugin.metadata).toEqual(metadata);
        });

        it('should create plugins with hooks', () => {
            const metadata: PluginMetadata = {
                name: 'hook-plugin',
                version: '1.0.0',
                description: 'Hook plugin'
            };

            const beforeFileProcessing = vi.fn();
            const plugin = createPlugin(metadata, { beforeFileProcessing });

            expect(plugin.metadata).toEqual(metadata);
            expect(plugin.beforeFileProcessing).toBe(beforeFileProcessing);
        });

        it('should support all optional metadata fields', () => {
            const metadata: PluginMetadata = {
                name: 'full-plugin',
                version: '1.0.0',
                description: 'Full plugin',
                author: 'Test Author',
                homepage: 'https://example.com'
            };

            const plugin = createPlugin(metadata);
            expect(plugin.metadata.author).toBe('Test Author');
            expect(plugin.metadata.homepage).toBe('https://example.com');
        });
    });
});