/**
 * Configuration schema definitions for Project Fusion
 */
import { z } from 'zod';

/**
 * Schema for fusion configuration
 */
const FusionConfigSchema = z.object({
    fusion_file: z.string(),
    fusion_log: z.string(),
    copyToClipboard: z.boolean(),
});

/**
 * Schema for file extensions configuration
 * Allows for dynamic extension groups beyond the predefined ones
 */
const ParsedFileExtensionsSchema = z.object({
    backend: z.array(z.string()),
    config: z.array(z.string()),
    cpp: z.array(z.string()),
    scripts: z.array(z.string()),
    web: z.array(z.string()),
    godot: z.array(z.string()),
    doc: z.array(z.string()),
}).and(z.record(z.string(), z.array(z.string())));

/**
 * Schema for parsing configuration
 */
const ParsingConfigSchema = z.object({
    parseSubDirectories: z.boolean(),
    rootDirectory: z.string(),
    maxFileSizeKB: z.number().optional(),
});

/**
 * Complete configuration schema for version 1
 */
export const ConfigSchemaV1 = z.object({
    schemaVersion: z.literal(1),
    fusion: FusionConfigSchema,
    parsedFileExtensions: ParsedFileExtensionsSchema,
    parsing: ParsingConfigSchema,
    ignorePatterns: z.array(z.string()),
    useGitIgnoreForExcludes: z.boolean(),
});