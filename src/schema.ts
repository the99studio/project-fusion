/**
 * Configuration schema definitions for Project Fusion
 */
import { z } from 'zod';

/**
 * Schema for output generation configuration
 */
const OutputConfigSchema = z.object({
    generatedFileName: z.string(),
    copyToClipboard: z.boolean(),
    generateText: z.boolean(),
    generateMarkdown: z.boolean(),
    generateHtml: z.boolean(),
    generatePdf: z.boolean(),
});

/**
 * Schema for file extensions configuration
 * Allows for dynamic extension groups beyond the predefined ones
 */
const ParsedFileExtensionsSchema = z.object({
    backend: z.array(z.string()).optional(),
    config: z.array(z.string()).optional(),
    cpp: z.array(z.string()).optional(),
    scripts: z.array(z.string()).optional(),
    web: z.array(z.string()).optional(),
    godot: z.array(z.string()).optional(),
    doc: z.array(z.string()).optional(),
}).and(z.record(z.string(), z.array(z.string())));

/**
 * Schema for parsing configuration
 */
const ParsingConfigSchema = z.object({
    parseSubDirectories: z.boolean(),
    rootDirectory: z.string(),
    maxFileSizeKB: z.number(),
});

/**
 * Complete configuration schema for version 1
 */
export const ConfigSchemaV1 = z.object({
    schemaVersion: z.literal(1),
    generatedFileName: z.string(),
    copyToClipboard: z.boolean(),
    generateText: z.boolean(),
    generateMarkdown: z.boolean(),
    generateHtml: z.boolean(),
    generatePdf: z.boolean(),
    parsedFileExtensions: ParsedFileExtensionsSchema,
    parsing: ParsingConfigSchema,
    ignorePatterns: z.array(z.string()),
    useGitIgnoreForExcludes: z.boolean(),
});