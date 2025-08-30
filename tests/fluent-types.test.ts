// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Type tests for Fluent API
 */
import { describe, it, expectTypeOf } from 'vitest';
import { projectFusion, type ProjectFusionBuilder } from '../src/fluent.js';
import type { FusionResult } from '../src/types.js';

describe('Fluent API Type Tests', () => {
    it('should have correct type for projectFusion factory function', () => {
        expectTypeOf(projectFusion).toBeFunction();
        expectTypeOf(projectFusion()).toEqualTypeOf<ProjectFusionBuilder>();
    });

    it('should have correct return types for all builder methods', () => {
        const builder = projectFusion();
        
        expectTypeOf(builder.root('./src')).toEqualTypeOf<ProjectFusionBuilder>();
        expectTypeOf(builder.cwd('/path')).toEqualTypeOf<ProjectFusionBuilder>();
        expectTypeOf(builder.include(['web'])).toEqualTypeOf<ProjectFusionBuilder>();
        expectTypeOf(builder.exclude(['*.test.ts'])).toEqualTypeOf<ProjectFusionBuilder>();
        expectTypeOf(builder.maxSize('1MB')).toEqualTypeOf<ProjectFusionBuilder>();
        expectTypeOf(builder.maxSize(1024)).toEqualTypeOf<ProjectFusionBuilder>();
        expectTypeOf(builder.output(['md', 'html'])).toEqualTypeOf<ProjectFusionBuilder>();
        expectTypeOf(builder.name('test')).toEqualTypeOf<ProjectFusionBuilder>();
        expectTypeOf(builder.subdirectories(true)).toEqualTypeOf<ProjectFusionBuilder>();
        expectTypeOf(builder.clipboard(false)).toEqualTypeOf<ProjectFusionBuilder>();
        expectTypeOf(builder.gitignore(true)).toEqualTypeOf<ProjectFusionBuilder>();
        expectTypeOf(builder.extensions('custom', ['.ext'])).toEqualTypeOf<ProjectFusionBuilder>();
        expectTypeOf(builder.reset()).toEqualTypeOf<ProjectFusionBuilder>();
    });

    it('should have correct type for generate method', () => {
        const builder = projectFusion();
        expectTypeOf(builder.generate).toEqualTypeOf<() => Promise<FusionResult>>();
    });

    it('should support method chaining with correct types', () => {
        const chain = projectFusion()
            .root('./src')
            .include(['web', 'backend'])
            .exclude(['*.test.ts'])
            .maxSize('2MB')
            .output(['md'])
            .name('fusion')
            .subdirectories(false)
            .clipboard(true)
            .gitignore(false);
            
        expectTypeOf(chain).toEqualTypeOf<ProjectFusionBuilder>();
    });

    it('should correctly type configure callback parameter', () => {
        projectFusion().configure((options) => {
            expectTypeOf(options.maxFileSizeKB).toEqualTypeOf<number | undefined>();
            expectTypeOf(options.generateText).toEqualTypeOf<boolean | undefined>();
            expectTypeOf(options.rootDirectory).toEqualTypeOf<string | undefined>();
            expectTypeOf(options.extensionGroups).toEqualTypeOf<string[] | undefined>();
        });
    });

    it('should correctly type allExtensions parameter', () => {
        const extensions: Record<string, string[]> = {
            web: ['.ts', '.js'],
            backend: ['.py']
        };
        
        const builder = projectFusion().allExtensions(extensions);
        expectTypeOf(builder).toEqualTypeOf<ProjectFusionBuilder>();
    });

    it('should correctly type output format parameter', () => {
        type OutputFormat = 'text' | 'md' | 'html';
        const formats: OutputFormat[] = ['text', 'md', 'html'];
        
        const builder = projectFusion().output(formats);
        expectTypeOf(builder).toEqualTypeOf<ProjectFusionBuilder>();
    });

    it('should correctly type optional parameters with defaults', () => {
        const builder = projectFusion();
        
        expectTypeOf(builder.subdirectories()).toEqualTypeOf<ProjectFusionBuilder>();
        expectTypeOf(builder.clipboard()).toEqualTypeOf<ProjectFusionBuilder>();
        expectTypeOf(builder.gitignore()).toEqualTypeOf<ProjectFusionBuilder>();
    });

    it('should correctly type getConfig return value', () => {
        const config = projectFusion().getConfig();
        
        expectTypeOf(config).toMatchTypeOf<{
            rootDirectory?: string;
            cwd?: string;
            extensionGroups?: string[];
            ignorePatterns?: string[];
            maxFileSizeKB?: number;
            generateText?: boolean;
            generateMarkdown?: boolean;
            generateHtml?: boolean;
            generatedFileName?: string;
            parseSubDirectories?: boolean;
            copyToClipboard?: boolean;
            useGitIgnoreForExcludes?: boolean;
            parsedFileExtensions?: Record<string, string[]>;
        }>();
    });

    it('should correctly type FusionResult from generate', () => {
        const builder = projectFusion();
        
        expectTypeOf(builder.generate).toMatchTypeOf<() => Promise<{
            success: boolean;
            message: string;
            error?: unknown;
        }>>();
    });
});