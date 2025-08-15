/**
 * Configuration schema definitions for Project Fusion
 */
import { z } from 'zod';

/**
 * Schema for fusion configuration
 */
export const FusionConfigSchema = z.object({
    directory: z.string(),
    fusion_file: z.string(),
    fusion_log: z.string(),
    copyToClipboard: z.boolean(),
});

/**
 * Schema for file extensions configuration
 * Allows for dynamic extension groups beyond the predefined ones
 */
export const ParsedFileExtensionsSchema = z.object({
    backend: z.array(z.string()),
    config: z.array(z.string()),
    cpp: z.array(z.string()),
    scripts: z.array(z.string()),
    web: z.array(z.string()),
}).and(z.record(z.string(), z.array(z.string())));

/**
 * Schema for parsing configuration
 */
export const ParsingConfigSchema = z.object({
    parseSubDirectories: z.boolean(),
    rootDirectory: z.string(),
});

/**
 * Complete configuration schema for version 1
 */
export const ConfigSchemaV1 = z.object({
    // Schema version (introduced in version 1)
    schemaVersion: z.literal(1),

    // Core configuration sections
    fusion: FusionConfigSchema,
    parsedFileExtensions: ParsedFileExtensionsSchema,
    parsing: ParsingConfigSchema,

    // Additional options
    useProjectFusionIgnoreForExcludes: z.boolean(),
    useGitIgnoreForExcludes: z.boolean(),
});

// Type inferred from the schema
export type ConfigV1 = z.infer<typeof ConfigSchemaV1>;
