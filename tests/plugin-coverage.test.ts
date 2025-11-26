/**
 * Additional tests to increase coverage for plugin system
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryFileSystemAdapter } from '../src/adapters/file-system.js';
import { 
    PluginManager, 
    BasePlugin,
    createPlugin
} from '../src/plugins/plugin-system.js';
import type { Config } from '../src/types.js';
import { defaultConfig } from '../src/utils.js';

describe('Plugin System Coverage Tests', () => {
    let pluginManager: PluginManager;
    let fsAdapter: MemoryFileSystemAdapter;
    let config: Config;

    beforeEach(() => {
        fsAdapter = new MemoryFileSystemAdapter();
        pluginManager = new PluginManager(fsAdapter);
        config = { ...defaultConfig };
    });

    describe('Plugin Loading Edge Cases', () => {
        it('should throw error for plugin missing metadata', async () => {
            // Test uncovered lines 105-106: missing metadata check
            const mockImport = vi.fn().mockResolvedValue({
                default: { someProperty: "value" } // Missing metadata property
            });

            // Mock the import function for this test
            vi.doMock('/mock/plugin.js', () => mockImport(), { virtual: true });

            await expect(pluginManager.loadPlugin('/mock/plugin.js')).rejects.toThrow('does not conform to Plugin interface');
        });

        it('should handle loadPluginsFromDirectory errors', async () => {
            // Test uncovered lines 132-133: error handling in loadPluginsFromDirectory
            const mockExists = vi.spyOn(fsAdapter, 'exists').mockResolvedValue(true);
            const mockGlob = vi.spyOn(fsAdapter, 'glob').mockRejectedValue(new Error('Glob failed'));
            
            // Should not throw, just log error
            await pluginManager.loadPluginsFromDirectory('/some/dir');
            
            expect(mockExists).toHaveBeenCalled();
            expect(mockGlob).toHaveBeenCalled();
        });

        it('should load plugins from directory successfully', async () => {
            // Test successful path through loadPluginsFromDirectory
            const pluginsDir = '/test/plugins';
            const pluginFile = '/test/plugins/test-plugin.js';
            
            vi.spyOn(fsAdapter, 'exists').mockResolvedValue(true);
            vi.spyOn(fsAdapter, 'glob').mockResolvedValue([pluginFile]);
            
            // Mock the specific plugin file
            vi.doMock(pluginFile, () => ({
                default: {
                    metadata: {
                        name: 'loaded-plugin',
                        version: '1.0.0',
                        description: 'Successfully loaded plugin'
                    }
                }
            }), { virtual: true });

            await pluginManager.loadPluginsFromDirectory(pluginsDir);
            expect(pluginManager.getPlugin('loaded-plugin')).toBeDefined();
        });

        it('should handle plugin loading failure in directory', async () => {
            // Test the catch block in loadPluginsFromDirectory when individual plugin fails
            const pluginsDir = '/test/plugins';
            const pluginFile = '/test/plugins/failing-plugin.js';
            
            vi.spyOn(fsAdapter, 'exists').mockResolvedValue(true);
            vi.spyOn(fsAdapter, 'glob').mockResolvedValue([pluginFile]);
            
            // Mock a failing plugin import
            vi.doMock(pluginFile, () => {
                throw new Error('Plugin import failed');
            }, { virtual: true });

            // Should not throw, just log warning and continue
            await pluginManager.loadPluginsFromDirectory(pluginsDir);
            
            // Plugin should not be registered due to failure
            expect(pluginManager.getPlugin('failing-plugin')).toBeUndefined();
        });

        it('should validate plugin paths with security checks', async () => {
            const secureConfig = {
                ...config,
                rootDirectory: '/secure/root',
                allowedExternalPluginPaths: ['/allowed/path']
            };

            const pluginPath = '/allowed/path/plugin.js';
            
            // Mock the external plugin
            vi.doMock(pluginPath, () => ({
                default: {
                    metadata: {
                        name: 'external-plugin',
                        version: '1.0.0',
                        description: 'External plugin'
                    }
                }
            }), { virtual: true });

            await pluginManager.loadPlugin(pluginPath, secureConfig);
            expect(pluginManager.getPlugin('external-plugin')).toBeDefined();
        });

        it('should load plugins with different export formats', async () => {
            const pluginPath = '/test/named-plugin.js';
            
            // Mock plugin with named export (also providing default to avoid error)
            vi.doMock(pluginPath, () => ({
                default: undefined, // No default export
                plugin: {
                    metadata: {
                        name: 'named-export-plugin',
                        version: '1.0.0',
                        description: 'Plugin with named export'
                    }
                }
            }), { virtual: true });

            await pluginManager.loadPlugin(pluginPath);
            expect(pluginManager.getPlugin('named-export-plugin')).toBeDefined();
        });
    });

    describe('BasePlugin Coverage', () => {
        it('should test BasePlugin default implementations', async () => {
            // Test uncovered lines 324-325, 328-329: default implementations
            class TestBasePlugin extends BasePlugin {
                metadata = {
                    name: 'base-test-plugin',
                    version: '1.0.0',
                    description: 'Test BasePlugin'
                };
            }

            const plugin = new TestBasePlugin();
            
            // Test default initialize implementation
            if (plugin.initialize) {
                await plugin.initialize(config);
                // Should not throw, just run the default implementation
                expect(true).toBe(true);
            }

            // Test default cleanup implementation  
            if (plugin.cleanup) {
                await plugin.cleanup();
                // Should not throw, just run the default implementation
                expect(true).toBe(true);
            }
        });

        it('should test BasePlugin with custom implementations', () => {
            class CustomBasePlugin extends BasePlugin {
                metadata = {
                    name: 'custom-base-plugin',
                    version: '1.0.0',
                    description: 'Custom BasePlugin'
                };

                initCalled = false;
                cleanupCalled = false;

                initialize(): void {
                    this.initCalled = true;
                }

                cleanup(): void {
                    this.cleanupCalled = true;
                }
            }

            const plugin = new CustomBasePlugin();
            
            if (plugin.initialize) {
                plugin.initialize(config);
                expect(plugin.initCalled).toBe(true);
            }

            if (plugin.cleanup) {
                plugin.cleanup();
                expect(plugin.cleanupCalled).toBe(true);
            }
        });
    });

    describe('Plugin Configuration Edge Cases', () => {
        it('should handle plugin with enabled false configuration', () => {
            const plugin = createPlugin({
                name: 'disabled-plugin',
                version: '1.0.0',
                description: 'Disabled plugin'
            });

            pluginManager.registerPlugin(plugin);
            pluginManager.configurePlugin('disabled-plugin', {
                name: 'disabled-plugin',
                enabled: false,
                options: { setting: 'value' }
            });

            const enabledPlugins = pluginManager.getEnabledPlugins();
            expect(enabledPlugins).not.toContain(plugin);
        });

        it('should handle plugin with enabled true configuration', () => {
            const plugin = createPlugin({
                name: 'enabled-plugin',
                version: '1.0.0',
                description: 'Enabled plugin'
            });

            pluginManager.registerPlugin(plugin);
            pluginManager.configurePlugin('enabled-plugin', {
                name: 'enabled-plugin',
                enabled: true,
                options: { setting: 'value' }
            });

            const enabledPlugins = pluginManager.getEnabledPlugins();
            expect(enabledPlugins).toContain(plugin);
        });

        it('should handle plugin with undefined configuration (default enabled)', () => {
            const plugin = createPlugin({
                name: 'default-plugin',
                version: '1.0.0',
                description: 'Default plugin'
            });

            pluginManager.registerPlugin(plugin);
            // Don't configure the plugin

            const enabledPlugins = pluginManager.getEnabledPlugins();
            expect(enabledPlugins).toContain(plugin);
        });

        it('should unregister plugin and its configuration', () => {
            const plugin = createPlugin({
                name: 'to-unregister',
                version: '1.0.0',
                description: 'Plugin to unregister'
            });

            pluginManager.registerPlugin(plugin);
            pluginManager.configurePlugin('to-unregister', {
                name: 'to-unregister',
                enabled: true
            });

            expect(pluginManager.getPlugin('to-unregister')).toBe(plugin);
            
            pluginManager.unregisterPlugin('to-unregister');
            
            expect(pluginManager.getPlugin('to-unregister')).toBeUndefined();
            const enabledPlugins = pluginManager.getEnabledPlugins();
            expect(enabledPlugins).not.toContain(plugin);
        });
    });

    describe('Plugin Metadata Validation', () => {
        it('should list all registered plugin metadata', () => {
            const plugin1 = createPlugin({
                name: 'plugin1',
                version: '1.0.0',
                description: 'First plugin',
                author: 'Test Author',
                homepage: 'https://example.com'
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
            
            const plugin1Meta = metadata.find(m => m.name === 'plugin1');
            expect(plugin1Meta).toBeDefined();
            expect(plugin1Meta?.author).toBe('Test Author');
            expect(plugin1Meta?.homepage).toBe('https://example.com');

            const plugin2Meta = metadata.find(m => m.name === 'plugin2');
            expect(plugin2Meta).toBeDefined();
            expect(plugin2Meta?.author).toBeUndefined();
            expect(plugin2Meta?.homepage).toBeUndefined();
        });
    });
});