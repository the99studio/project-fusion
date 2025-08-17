// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Entry point for Project Fusion
 */

// Programmatic API - Main exports for external packages
export { 
    createConfig,
    fusionAPI,
    runFusion,
    type ProgrammaticFusionOptions,
    type ProgrammaticFusionResult 
} from './api.js';

// Core functionality
export { BenchmarkTracker, type BenchmarkMetrics } from './benchmark.js';
export { processFusion } from './fusion.js';

// Types and schemas
export * from './schema.js';
export * from './types.js';

// Utilities
export * from './utils.js';
