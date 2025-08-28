// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio

import { describe, expect, it } from 'vitest';
import { HtmlOutputStrategy, MarkdownOutputStrategy, TextOutputStrategy, type OutputContext } from '../src/strategies/output-strategy.js';
import { createFilePath } from '../src/types.js';

describe('Aggressive Content Sanitization', () => {
    
    const testFileInfo = {
        content: '<script>alert("XSS")</script>\n<iframe src="evil.html"></iframe>\njavascript:evil()\n`${eval("dangerous")}`\nDROP TABLE users',
        relativePath: 'test.html',
        path: createFilePath('/test/test.html'),
        size: 100,
        isErrorPlaceholder: false
    };

    const createTestContext = (aggressiveSanitization: boolean): OutputContext => ({
        projectTitle: 'Test',
        versionInfo: '',
        filesToProcess: [testFileInfo],
        config: {
            aggressiveContentSanitization: aggressiveSanitization,
            allowedExternalPluginPaths: [],
            allowSymlinks: false,
            copyToClipboard: false,
            excludeSecrets: true,
            generatedFileName: 'test',
            generateHtml: true,
            generateMarkdown: true,
            generateText: true,
            ignorePatterns: [],
            maxBase64BlockKB: 2,
            maxFileSizeKB: 1024,
            maxFiles: 1000,
            maxLineLength: 5000,
            maxSymlinkAuditEntries: 10,
            maxTokenLength: 2000,
            maxTotalSizeMB: 100,
            maxOutputSizeMB: 50,
            overwriteFiles: false,
            parsedFileExtensions: {
                web: ['.html', '.js']
            },
            parseSubDirectories: true,
            rootDirectory: '.',
            schemaVersion: 1,
            useGitIgnoreForExcludes: true
        }
    });

    describe('HTML Output Strategy', () => {
        it('should sanitize dangerous content when aggressive mode is enabled', () => {
            const strategy = new HtmlOutputStrategy();
            const context = createTestContext(true);
            
            const result = strategy.processFile(testFileInfo, context);
            
            // Check for HTML-escaped versions since HTML strategy escapes content
            expect(result).toContain('&#91;REMOVED: SCRIPT BLOCK&#93;');
            expect(result).toContain('&#91;REMOVED: IFRAME&#93;');
            expect(result).toContain('&#91;REMOVED: JAVASCRIPT PROTOCOL&#93;');
            expect(result).toContain('&#91;REMOVED: TEMPLATE LITERAL&#93;');
            expect(result).toContain('&#91;REMOVED: SQL-LIKE COMMAND&#93;');
            expect(result).not.toContain('<script>');
            expect(result).not.toContain('<iframe>');
            expect(result).not.toContain('javascript:');
        });

        it('should not apply aggressive sanitization when disabled', () => {
            const strategy = new HtmlOutputStrategy();
            const context = createTestContext(false);
            
            const result = strategy.processFile(testFileInfo, context);
            
            // Should still escape HTML but not remove dangerous patterns
            expect(result).toContain('&lt;script&gt;');
            expect(result).toContain('&lt;iframe');
            expect(result).not.toContain('[REMOVED: SCRIPT BLOCK]');
            expect(result).not.toContain('[REMOVED: IFRAME]');
        });
    });

    describe('Markdown Output Strategy', () => {
        it('should sanitize dangerous content when aggressive mode is enabled', () => {
            const strategy = new MarkdownOutputStrategy();
            const context = createTestContext(true);
            
            const result = strategy.processFile(testFileInfo, context);
            
            expect(result).toContain('[REMOVED: SCRIPT BLOCK]');
            expect(result).toContain('[REMOVED: IFRAME]');
            expect(result).toContain('[REMOVED: JAVASCRIPT PROTOCOL]');
            expect(result).toContain('[REMOVED: TEMPLATE LITERAL]');
            expect(result).toContain('[REMOVED: SQL-LIKE COMMAND]');
        });

        it('should not apply aggressive sanitization when disabled', () => {
            const strategy = new MarkdownOutputStrategy();
            const context = createTestContext(false);
            
            const result = strategy.processFile(testFileInfo, context);
            
            expect(result).not.toContain('[REMOVED: SCRIPT BLOCK]');
            expect(result).not.toContain('[REMOVED: IFRAME]');
            expect(result).toContain('<script>');
        });
    });

    describe('Text Output Strategy', () => {
        it('should sanitize dangerous content when aggressive mode is enabled', () => {
            const strategy = new TextOutputStrategy();
            const context = createTestContext(true);
            
            const result = strategy.processFile(testFileInfo, context);
            
            expect(result).toContain('[REMOVED: SCRIPT BLOCK]');
            expect(result).toContain('[REMOVED: IFRAME]');
            expect(result).toContain('[REMOVED: JAVASCRIPT PROTOCOL]');
            expect(result).toContain('[REMOVED: TEMPLATE LITERAL]');
            expect(result).toContain('[REMOVED: SQL-LIKE COMMAND]');
        });

        it('should not apply aggressive sanitization when disabled', () => {
            const strategy = new TextOutputStrategy();
            const context = createTestContext(false);
            
            const result = strategy.processFile(testFileInfo, context);
            
            expect(result).not.toContain('[REMOVED: SCRIPT BLOCK]');
            expect(result).not.toContain('[REMOVED: IFRAME]');
            expect(result).toContain('<script>');
        });
    });

    describe('Link validation', () => {
        it('should validate HTML href links in table of contents', () => {
            const strategy = new HtmlOutputStrategy();
            const context = createTestContext(false);
            
            const maliciousFileInfo = {
                ...testFileInfo,
                relativePath: 'test<script>alert("xss")</script>.js'
            };
            
            const contextWithMaliciousFile = {
                ...context,
                filesToProcess: [maliciousFileInfo]
            };
            
            const result = strategy.generateHeader(contextWithMaliciousFile);
            
            // Should sanitize the href attribute
            expect(result).not.toContain('<script>');
            expect(result).toContain('href="#test');
        });
    });
});