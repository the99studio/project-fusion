// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Entry point for Project Fusion
 */

// Architecture exports (alphabetical)
export { DefaultFileSystemAdapter, MemoryFileSystemAdapter } from './adapters/file-system.js';
export type { FileSystemAdapter } from './adapters/file-system.js';
export { BasePlugin, createPlugin, PluginManager } from './plugins/plugin-system.js';
export type { Plugin, PluginHooks, PluginMetadata } from './plugins/plugin-system.js';
export { 
    HtmlOutputStrategy,
    MarkdownOutputStrategy, 
    OutputStrategyManager, 
    TextOutputStrategy
} from './strategies/output-strategy.js';
export type { OutputContext, OutputStrategy } from './strategies/output-strategy.js';

// Core API (alphabetical)
export { 
    createConfig,
    fusionAPI,
    runFusion,
    type CancellationToken,
    type FusionProgress,
    type ProgrammaticFusionOptions,
    type ProgrammaticFusionResult 
} from './api.js';
export { BenchmarkTracker, type BenchmarkMetrics } from './benchmark.js';
export { 
    ProjectFusionBuilder,
    projectFusion
} from './fluent.js';
export { processFusion } from './fusion.js';

// Schemas and types (alphabetical)
export * from './schema.js';
export * from './types.js';
export * from './utils.js';
