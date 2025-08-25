// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Fluent API for Project Fusion
 * Provides a chainable interface for better developer experience
 */
import { fusionAPI, type ProgrammaticFusionOptions, type ProgrammaticFusionResult } from './api.js';
import type { Config } from './types.js';
import { defaultConfig } from './utils.js';

/**
 * Fluent API builder for Project Fusion
 * 
 * @example
 * ```typescript
 * import { projectFusion } from '@the99studio/project-fusion/fluent';
 * 
 * const result = await projectFusion()
 *   .include(['web', 'backend'])
 *   .exclude(['*.test.ts', 'node_modules'])
 *   .maxSize('2MB')
 *   .output(['md', 'html'])
 *   .generate();
 * ```
 */
export class ProjectFusionBuilder {
    private options: ProgrammaticFusionOptions = {};

    /**
     * Set the root directory to scan
     * @param path Root directory path
     */
    root(path: string): this {
        this.options.rootDirectory = path;
        return this;
    }

    /**
     * Set the working directory
     * @param path Working directory path
     */
    cwd(path: string): this {
        this.options.cwd = path;
        return this;
    }

    /**
     * Include specific extension groups
     * @param groups Array of extension group names (e.g., ['web', 'backend'])
     */
    include(groups: string[]): this {
        this.options.extensionGroups = groups;
        return this;
    }

    /**
     * Add ignore patterns
     * @param patterns Array of glob patterns to ignore
     */
    exclude(patterns: string[]): this {
        this.options.ignorePatterns = patterns;
        return this;
    }

    /**
     * Set maximum file size limit
     * @param size Size limit as string (e.g., '1MB', '512KB') or number in KB
     */
    maxSize(size: string | number): this {
        if (typeof size === 'string') {
            const match = size.match(/^(\d+(?:\.\d+)?)\s*(kb|mb|gb)?$/i);
            if (!match) {
                throw new Error(`Invalid size format: ${size}. Use format like "1MB", "512KB", or number in KB`);
            }
            
            const value = Number.parseFloat(match[1] ?? '0');
            const unit = (match[2] ?? 'KB').toUpperCase();
            
            const multipliers = { KB: 1, MB: 1024, GB: 1024 * 1024 };
            this.options.maxFileSizeKB = value * (multipliers[unit as keyof typeof multipliers] ?? 1);
        } else {
            this.options.maxFileSizeKB = size;
        }
        return this;
    }

    /**
     * Set output formats to generate
     * @param formats Array of format names ('text', 'md', 'html')
     */
    output(formats: Array<'text' | 'md' | 'html'>): this {
        this.options.generateText = formats.includes('text');
        this.options.generateMarkdown = formats.includes('md');
        this.options.generateHtml = formats.includes('html');
        return this;
    }

    /**
     * Set the generated file name (without extension)
     * @param name Base name for generated files
     */
    name(name: string): this {
        this.options.generatedFileName = name;
        return this;
    }

    /**
     * Enable or disable subdirectory parsing
     * @param enabled Whether to parse subdirectories
     */
    subdirectories(enabled = true): this {
        this.options.parseSubDirectories = enabled;
        return this;
    }

    /**
     * Enable or disable clipboard copying
     * @param enabled Whether to copy result to clipboard
     */
    clipboard(enabled = true): this {
        this.options.copyToClipboard = enabled;
        return this;
    }

    /**
     * Enable or disable .gitignore usage
     * @param enabled Whether to use .gitignore for exclusions
     */
    gitignore(enabled = true): this {
        this.options.useGitIgnoreForExcludes = enabled;
        return this;
    }

    /**
     * Add custom file extensions for a specific group
     * @param group Extension group name (e.g., 'web', 'backend')
     * @param extensions Array of extensions (e.g., ['.ts', '.tsx'])
     */
    extensions(group: string, extensions: string[]): this {
        this.options.parsedFileExtensions ??= { ...defaultConfig.parsedFileExtensions };
        this.options.parsedFileExtensions[group] = extensions;
        return this;
    }

    /**
     * Set complete extension configuration
     * @param config Extension configuration object
     */
    allExtensions(config: Config['parsedFileExtensions']): this {
        this.options.parsedFileExtensions = config;
        return this;
    }

    /**
     * Apply a custom configuration function
     * @param configFn Function that receives and modifies options
     */
    configure(configFn: (options: ProgrammaticFusionOptions) => void): this {
        configFn(this.options);
        return this;
    }

    /**
     * Generate fusion files with the configured options
     * @returns Promise resolving to fusion result
     */
    async generate(): Promise<ProgrammaticFusionResult> {
        return await fusionAPI(this.options);
    }

    /**
     * Get the current configuration without generating
     * @returns Current configuration options
     */
    getConfig(): ProgrammaticFusionOptions {
        return { ...this.options };
    }

    /**
     * Reset the builder to default state
     */
    reset(): this {
        this.options = {};
        return this;
    }
}

/**
 * Create a new Project Fusion builder instance
 * 
 * @example
 * ```typescript
 * import { projectFusion } from '@the99studio/project-fusion/fluent';
 * 
 * // Basic usage
 * const result = await projectFusion()
 *   .include(['web'])
 *   .generate();
 * 
 * // Advanced configuration
 * const result = await projectFusion()
 *   .root('./src')
 *   .include(['web', 'backend'])
 *   .exclude(['*.test.ts', 'node_modules/', '__tests__/'])
 *   .maxSize('2MB')
 *   .output(['md', 'html'])
 *   .name('my-project-fusion')
 *   .clipboard(false)
 *   .generate();
 * ```
 */
export function projectFusion(): ProjectFusionBuilder {
    return new ProjectFusionBuilder();
}