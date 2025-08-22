// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Plugin system for extending Project Fusion functionality
 */
import path from 'node:path';
import type { FileSystemAdapter } from '../adapters/file-system.js';
import type { FileInfo, OutputStrategy } from '../strategies/output-strategy.js';
import { type Config, createFilePath, FusionError } from '../types.js';

export interface PluginMetadata {
    name: string;
    version: string;
    description: string;
    author?: string;
    homepage?: string;
}

export interface PluginHooks {
    beforeFileProcessing?(fileInfo: FileInfo, config: Config): Promise<FileInfo | null>;
    afterFileProcessing?(fileInfo: FileInfo, processedContent: string, config: Config): Promise<string>;
    beforeFusion?(config: Config, filesToProcess: FileInfo[]): Promise<{ config: Config; filesToProcess: FileInfo[] }>;
    afterFusion?(result: unknown, config: Config): Promise<unknown>;
    registerOutputStrategies?(): OutputStrategy[];
    registerFileExtensions?(): Record<string, string[]>;
}

export interface Plugin extends PluginHooks {
    metadata: PluginMetadata;
    initialize?(config: Config): Promise<void>;
    cleanup?(): Promise<void>;
}

export interface PluginConfig {
    name: string;
    enabled: boolean;
    options?: Record<string, unknown>;
}

export class PluginManager {
    private readonly plugins: Map<string, Plugin> = new Map();
    private readonly pluginConfigs: Map<string, PluginConfig> = new Map();
    private readonly fs: FileSystemAdapter;

    constructor(fs: FileSystemAdapter) {
        this.fs = fs;
    }

    /**
     * Validates that a plugin path is safe to load
     * @param pluginPath Path to the plugin
     * @param config Configuration containing security settings
     * @throws FusionError if the path is not allowed
     */
    private validatePluginPath(pluginPath: string, config: Config): void {
        // Skip validation if external plugins are explicitly allowed
        if (config.allowExternalPlugins) {
            return;
        }

        // Resolve paths for comparison
        const resolvedPluginPath = path.resolve(pluginPath);
        const resolvedRootDir = path.resolve(config.rootDirectory);
        
        // Check if plugin path is within root directory
        const relativePath = path.relative(resolvedRootDir, resolvedPluginPath);
        
        // If relative path starts with '..' or is absolute, it's outside root
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
            throw new FusionError(
                `Plugin path '${pluginPath}' is outside root directory. ` +
                `Use --allow-external-plugins to load plugins from external directories.`,
                'PATH_TRAVERSAL',
                'error',
                { pluginPath, rootDirectory: config.rootDirectory }
            );
        }
    }

    async loadPlugin(pluginPath: string, config?: Config): Promise<void> {
        try {
            // Validate plugin path if config is provided
            if (config) {
                this.validatePluginPath(pluginPath, config);
            }
            
            const pluginModule = await import(pluginPath) as { default?: Plugin; plugin?: Plugin };
            const plugin: Plugin = pluginModule.default ?? pluginModule.plugin ?? pluginModule as Plugin;
            
            if (!plugin.metadata) {
                throw new Error(`Plugin at ${pluginPath} is missing metadata`);
            }
            
            this.plugins.set(plugin.metadata.name, plugin);
            console.log(`Loaded plugin: ${plugin.metadata.name} v${plugin.metadata.version}`);
        } catch (error) {
            console.error(`Failed to load plugin from ${pluginPath}:`, error);
            throw error;
        }
    }

    async loadPluginsFromDirectory(pluginsDir: string, config?: Config): Promise<void> {
        try {
            if (!(await this.fs.exists(createFilePath(pluginsDir)))) {
                return;
            }

            const pluginFiles = await this.fs.glob(path.join(pluginsDir, '**/*.js'));
            
            for (const pluginFile of pluginFiles) {
                try {
                    await this.loadPlugin(pluginFile, config);
                } catch (error) {
                    console.warn(`Skipping plugin ${pluginFile} due to error:`, error);
                }
            }
        } catch (error) {
            console.error(`Error loading plugins from directory ${pluginsDir}:`, error);
        }
    }

    registerPlugin(plugin: Plugin): void {
        this.plugins.set(plugin.metadata.name, plugin);
    }

    unregisterPlugin(name: string): void {
        this.plugins.delete(name);
        this.pluginConfigs.delete(name);
    }

    configurePlugin(name: string, config: PluginConfig): void {
        this.pluginConfigs.set(name, config);
    }

    getPlugin(name: string): Plugin | undefined {
        return this.plugins.get(name);
    }

    getEnabledPlugins(): Plugin[] {
        return [...this.plugins.values()].filter(plugin => {
            const config = this.pluginConfigs.get(plugin.metadata.name);
            return config?.enabled !== false;
        });
    }

    async initializePlugins(config: Config): Promise<void> {
        const enabledPlugins = this.getEnabledPlugins();
        
        for (const plugin of enabledPlugins) {
            try {
                if (plugin.initialize) {
                    await plugin.initialize(config);
                }
            } catch (error) {
                console.error(`Error initializing plugin ${plugin.metadata.name}:`, error);
            }
        }
    }

    async cleanupPlugins(): Promise<void> {
        const enabledPlugins = this.getEnabledPlugins();
        
        for (const plugin of enabledPlugins) {
            try {
                if (plugin.cleanup) {
                    await plugin.cleanup();
                }
            } catch (error) {
                console.error(`Error cleaning up plugin ${plugin.metadata.name}:`, error);
            }
        }
    }

    async executeBeforeFileProcessing(fileInfo: FileInfo, config: Config): Promise<FileInfo | null> {
        let currentFileInfo = fileInfo;
        
        for (const plugin of this.getEnabledPlugins()) {
            if (plugin.beforeFileProcessing) {
                try {
                    const result = await plugin.beforeFileProcessing(currentFileInfo, config);
                    if (result === null) {
                        return null;
                    }
                    currentFileInfo = result;
                } catch (error) {
                    console.error(`Error in plugin ${plugin.metadata.name} beforeFileProcessing:`, error);
                }
            }
        }
        
        return currentFileInfo;
    }

    async executeAfterFileProcessing(
        fileInfo: FileInfo, 
        processedContent: string, 
        config: Config
    ): Promise<string> {
        let currentContent = processedContent;
        
        for (const plugin of this.getEnabledPlugins()) {
            if (plugin.afterFileProcessing) {
                try {
                    currentContent = await plugin.afterFileProcessing(fileInfo, currentContent, config);
                } catch (error) {
                    console.error(`Error in plugin ${plugin.metadata.name} afterFileProcessing:`, error);
                }
            }
        }
        
        return currentContent;
    }

    async executeBeforeFusion(
        config: Config, 
        filesToProcess: FileInfo[]
    ): Promise<{ config: Config; filesToProcess: FileInfo[] }> {
        let currentConfig = config;
        let currentFiles = filesToProcess;
        
        for (const plugin of this.getEnabledPlugins()) {
            if (plugin.beforeFusion) {
                try {
                    const result = await plugin.beforeFusion(currentConfig, currentFiles);
                    currentConfig = result.config;
                    currentFiles = result.filesToProcess;
                } catch (error) {
                    console.error(`Error in plugin ${plugin.metadata.name} beforeFusion:`, error);
                }
            }
        }
        
        return { config: currentConfig, filesToProcess: currentFiles };
    }

    async executeAfterFusion<T>(result: T, config: Config): Promise<T> {
        let currentResult = result;
        
        for (const plugin of this.getEnabledPlugins()) {
            if (plugin.afterFusion) {
                try {
                    currentResult = await plugin.afterFusion(currentResult, config) as T;
                } catch (error) {
                    console.error(`Error in plugin ${plugin.metadata.name} afterFusion:`, error);
                }
            }
        }
        
        return currentResult;
    }

    getAdditionalOutputStrategies(): OutputStrategy[] {
        const strategies: OutputStrategy[] = [];
        
        for (const plugin of this.getEnabledPlugins()) {
            if (plugin.registerOutputStrategies) {
                try {
                    const pluginStrategies = plugin.registerOutputStrategies();
                    strategies.push(...pluginStrategies);
                } catch (error) {
                    console.error(`Error getting output strategies from plugin ${plugin.metadata.name}:`, error);
                }
            }
        }
        
        return strategies;
    }

    getAdditionalFileExtensions(): Record<string, string[]> {
        const extensions: Record<string, string[]> = {};
        
        for (const plugin of this.getEnabledPlugins()) {
            if (plugin.registerFileExtensions) {
                try {
                    const pluginExtensions = plugin.registerFileExtensions();
                    Object.assign(extensions, pluginExtensions);
                } catch (error) {
                    console.error(`Error getting file extensions from plugin ${plugin.metadata.name}:`, error);
                }
            }
        }
        
        return extensions;
    }

    listPlugins(): PluginMetadata[] {
        return [...this.plugins.values()].map(plugin => plugin.metadata);
    }
}

export abstract class BasePlugin implements Plugin {
    abstract metadata: PluginMetadata;

    async initialize?(): Promise<void> {
        // Default implementation - can be overridden
    }

    async cleanup?(): Promise<void> {
        // Default implementation - can be overridden
    }
}

export function createPlugin(metadata: PluginMetadata, hooks: PluginHooks = {}): Plugin {
    return {
        metadata,
        ...hooks
    };
}