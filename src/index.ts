// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Entry point for Project Fusion
 */

// Core functionality
export { BenchmarkTracker, type BenchmarkMetrics } from './benchmark.js';
export { processFusion } from './fusion.js';

// Programmatic API - Main exports for external packages
export { 
    createConfig,
    fusionAPI,
    runFusion,
    type ProgrammaticFusionOptions,
    type ProgrammaticFusionResult 
} from './api.js';

// Fluent API for enhanced developer experience
export { 
    projectFusion,
    ProjectFusionBuilder 
} from './fluent.js';

// Types and schemas
export * from './schema.js';
export * from './types.js';

// Utilities
export * from './utils.js';

// New architecture exports
export { DefaultFileSystemAdapter, MemoryFileSystemAdapter } from './adapters/file-system.js';
export type { FileSystemAdapter } from './adapters/file-system.js';
export { 
    OutputStrategyManager, 
    TextOutputStrategy, 
    MarkdownOutputStrategy, 
    HtmlOutputStrategy 
} from './strategies/output-strategy.js';
export type { OutputStrategy, OutputContext } from './strategies/output-strategy.js';
export { PluginManager, BasePlugin, createPlugin } from './plugins/plugin-system.js';
export type { Plugin, PluginHooks, PluginMetadata } from './plugins/plugin-system.js';
