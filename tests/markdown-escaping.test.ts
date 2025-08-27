import { describe, it, expect } from 'vitest';
import { MarkdownOutputStrategy } from '../src/strategies/output-strategy.js';
import type { FileInfo, OutputContext } from '../src/types.js';
import { defaultConfig } from '../src/utils.js';

describe('Markdown Escaping', () => {
    const strategy = new MarkdownOutputStrategy();
    
    const createFileInfo = (relativePath: string, content = 'test content'): FileInfo => ({
        path: `/project/${relativePath}`,
        relativePath,
        content,
        isErrorPlaceholder: false
    });

    const createContext = (filesToProcess: FileInfo[]): OutputContext => ({
        projectTitle: 'Test Project',
        versionInfo: ' v1.0.0',
        config: defaultConfig,
        filesToProcess
    });

    describe('Table of Contents escaping', () => {
        it('should escape square brackets in filenames to prevent link injection', () => {
            const fileInfo = createFileInfo('malicious[injection].js');
            const context = createContext([fileInfo]);
            
            const header = strategy.generateHeader(context);
            
            // Should escape the brackets in the TOC link text
            expect(header).toContain('- [malicious\\[injection\\].js](#maliciousinjectionjs)');
            // Should not contain unescaped brackets
            expect(header).not.toContain('- [malicious[injection].js]');
        });

        it('should escape parentheses in filenames to prevent URL injection', () => {
            const fileInfo = createFileInfo('file(with)parens.js');
            const context = createContext([fileInfo]);
            
            const header = strategy.generateHeader(context);
            
            // Should escape the parentheses in the TOC link text
            expect(header).toContain('- [file\\(with\\)parens.js](#filewithparensjs)');
            // Should not contain unescaped parentheses
            expect(header).not.toContain('- [file(with)parens.js]');
        });

        it('should escape backticks to prevent code injection', () => {
            const fileInfo = createFileInfo('file`with`backticks.js');
            const context = createContext([fileInfo]);
            
            const header = strategy.generateHeader(context);
            
            // Should escape the backticks in the TOC link text
            expect(header).toContain('- [file\\`with\\`backticks.js](#filewithbackticksjs)');
            // Should not contain unescaped backticks
            expect(header).not.toContain('- [file`with`backticks.js]');
        });

        it('should handle complex malicious filename patterns', () => {
            const fileInfo = createFileInfo('[click here](javascript:alert("XSS")).js');
            const context = createContext([fileInfo]);
            
            const header = strategy.generateHeader(context);
            
            // All special characters should be escaped
            expect(header).toContain('- [\\[click here\\]\\(javascript:alert\\("XSS"\\)\\).js]');
            // Should not create a clickable malicious link
            expect(header).not.toContain('[click here](javascript:alert("XSS"))');
        });
    });

    describe('File header escaping', () => {
        it('should escape square brackets in file headers', () => {
            const fileInfo = createFileInfo('test[malicious].js');
            
            const result = strategy.processFile(fileInfo);
            
            // Should escape brackets in the header
            expect(result).toContain('## 📄 test\\[malicious\\].js {#');
            // Should not contain unescaped brackets
            expect(result).not.toContain('## 📄 test[malicious].js {#');
        });

        it('should escape parentheses in file headers', () => {
            const fileInfo = createFileInfo('test(malicious).js');
            
            const result = strategy.processFile(fileInfo);
            
            // Should escape parentheses in the header
            expect(result).toContain('## 📄 test\\(malicious\\).js {#');
            // Should not contain unescaped parentheses
            expect(result).not.toContain('## 📄 test(malicious).js {#');
        });

        it('should escape backticks in file headers', () => {
            const fileInfo = createFileInfo('test`malicious`.js');
            
            const result = strategy.processFile(fileInfo);
            
            // Should escape backticks in the header
            expect(result).toContain('## 📄 test\\`malicious\\`.js {#');
            // Should not contain unescaped backticks
            expect(result).not.toContain('## 📄 test`malicious`.js {#');
        });
    });

    describe('Error placeholder escaping', () => {
        it('should escape special characters in error placeholder headers', () => {
            const fileInfo: FileInfo = {
                path: '/project/test[malicious].js',
                relativePath: 'test[malicious].js',
                content: 'Error: File too large',
                isErrorPlaceholder: true
            };
            
            const result = strategy.processFile(fileInfo);
            
            // Should escape brackets in error placeholder header
            expect(result).toContain('## ⚠️ test\\[malicious\\].js {#');
            // Should not contain unescaped brackets
            expect(result).not.toContain('## ⚠️ test[malicious].js {#');
        });
    });

    describe('Multiple files with special characters', () => {
        it('should handle multiple files with different special characters', () => {
            const files = [
                createFileInfo('file[1].js'),
                createFileInfo('file(2).js'), 
                createFileInfo('file`3`.js'),
                createFileInfo('normal.js')
            ];
            const context = createContext(files);
            
            const header = strategy.generateHeader(context);
            
            // All special characters should be escaped
            expect(header).toContain('- [file\\[1\\].js](#file1js)');
            expect(header).toContain('- [file\\(2\\).js](#file2js)');
            expect(header).toContain('- [file\\`3\\`.js](#file3js)');
            expect(header).toContain('- [normal.js](#normaljs)');
            
            // Should not contain any unescaped special characters
            expect(header).not.toContain('- [file[1].js]');
            expect(header).not.toContain('- [file(2).js]');
            expect(header).not.toContain('- [file`3`.js]');
        });
    });

    describe('Edge cases', () => {
        it('should handle empty filenames gracefully', () => {
            const fileInfo = createFileInfo('');
            const context = createContext([fileInfo]);
            
            expect(() => strategy.generateHeader(context)).not.toThrow();
            expect(() => strategy.processFile(fileInfo)).not.toThrow();
        });

        it('should handle filenames with only special characters', () => {
            const fileInfo = createFileInfo('[]()``');
            const context = createContext([fileInfo]);
            
            const header = strategy.generateHeader(context);
            const fileResult = strategy.processFile(fileInfo);
            
            // Should escape all characters
            expect(header).toContain('\\[\\]\\(\\)\\`\\`');
            expect(fileResult).toContain('\\[\\]\\(\\)\\`\\`');
        });

        it('should preserve anchor generation despite escaping', () => {
            const fileInfo = createFileInfo('test[file].js');
            const context = createContext([fileInfo]);
            
            const header = strategy.generateHeader(context);
            const fileResult = strategy.processFile(fileInfo);
            
            // Anchor should be generated from original filename (slugified)
            const anchorMatch = header.match(/#([\da-z-]+)/);
            const fileAnchorMatch = fileResult.match(/{#([\da-z-]+)}/);
            
            expect(anchorMatch).toBeTruthy();
            expect(fileAnchorMatch).toBeTruthy();
            expect(anchorMatch?.[1]).toBe(fileAnchorMatch?.[1]);
        });
    });
});