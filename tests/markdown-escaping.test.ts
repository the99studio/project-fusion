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

    describe('Protocol detection and sanitization', () => {
        it('should detect and block javascript: protocol in file content', () => {
            const maliciousContent = 'Click [here](javascript:alert("XSS")) for more info';
            const fileInfo = createFileInfo('test.js', maliciousContent);
            
            const result = strategy.processFile(fileInfo);
            
            // Should replace javascript: with [BLOCKED-JAVASCRIPT]:
            expect(result).toContain('[BLOCKED-JAVASCRIPT]:alert("XSS")');
            expect(result).not.toContain('javascript:alert("XSS")');
        });

        it('should detect and block data: protocol in file content', () => {
            const maliciousContent = 'Image: ![image](data:text/html,<script>alert("XSS")</script>)';
            const fileInfo = createFileInfo('test.js', maliciousContent);
            
            const result = strategy.processFile(fileInfo);
            
            // Should replace data: with [BLOCKED-DATA]:
            expect(result).toContain('[BLOCKED-DATA]:text/html,<script>alert("XSS")</script>');
            expect(result).not.toContain('data:text/html,<script>alert("XSS")</script>');
        });

        it('should detect and block vbscript: protocol in file content', () => {
            const maliciousContent = 'Link: [click](vbscript:msgbox("XSS"))';
            const fileInfo = createFileInfo('test.js', maliciousContent);
            
            const result = strategy.processFile(fileInfo);
            
            // Should replace vbscript: with [BLOCKED-VBSCRIPT]:
            expect(result).toContain('[BLOCKED-VBSCRIPT]:msgbox("XSS")');
            expect(result).not.toContain('vbscript:msgbox("XSS")');
        });

        it('should handle multiple dangerous protocols in same content', () => {
            const maliciousContent = `
                javascript:alert(1)
                data:text/html,<script>
                vbscript:execute("evil")
            `;
            const fileInfo = createFileInfo('test.js', maliciousContent);
            
            const result = strategy.processFile(fileInfo);
            
            // Should replace all dangerous protocols
            expect(result).toContain('[BLOCKED-JAVASCRIPT]:alert(1)');
            expect(result).toContain('[BLOCKED-DATA]:text/html,<script>');
            expect(result).toContain('[BLOCKED-VBSCRIPT]:execute("evil")');
            
            // Should not contain any original dangerous protocols
            expect(result).not.toContain('javascript:');
            expect(result).not.toContain('data:');
            expect(result).not.toContain('vbscript:');
        });

        it('should be case insensitive when detecting protocols', () => {
            const maliciousContent = 'JAVASCRIPT:alert(1) JavaScript:alert(2) jAvAsCrIpT:alert(3)';
            const fileInfo = createFileInfo('test.js', maliciousContent);
            
            const result = strategy.processFile(fileInfo);
            
            // Should detect and block all case variations
            expect(result).toContain('[BLOCKED-JAVASCRIPT]:alert(1)');
            expect(result).toContain('[BLOCKED-JAVASCRIPT]:alert(2)');
            expect(result).toContain('[BLOCKED-JAVASCRIPT]:alert(3)');
            expect(result).not.toContain('javascript:');
            expect(result).not.toContain('JAVASCRIPT:');
            expect(result).not.toContain('JavaScript:');
        });

        it('should not affect legitimate protocols', () => {
            const legitimateContent = `
                https://example.com
                http://test.com
                ftp://files.example.com
                mailto:user@example.com
            `;
            const fileInfo = createFileInfo('test.js', legitimateContent);
            
            const result = strategy.processFile(fileInfo);
            
            // Should preserve legitimate protocols
            expect(result).toContain('https://example.com');
            expect(result).toContain('http://test.com');
            expect(result).toContain('ftp://files.example.com');
            expect(result).toContain('mailto:user@example.com');
        });

        it('should sanitize error placeholder content', () => {
            const errorFileInfo: FileInfo = {
                path: '/project/test.js',
                relativePath: 'test.js',
                content: 'Error: File contains javascript:alert("XSS") in content',
                isErrorPlaceholder: true
            };
            
            const result = strategy.processFile(errorFileInfo);
            
            // Should sanitize error content too
            expect(result).toContain('[BLOCKED-JAVASCRIPT]:alert("XSS")');
            expect(result).not.toContain('javascript:alert("XSS")');
        });

        it('should handle edge cases with protocol detection', () => {
            const edgeContent = `
                // This is not a protocol: javascript
                const url = "javascript" + ":alert(1)";
                javascript:void(0)
            `;
            const fileInfo = createFileInfo('test.js', edgeContent);
            
            const result = strategy.processFile(fileInfo);
            
            // Should only block the actual protocol usage
            expect(result).toContain('// This is not a protocol: javascript');
            expect(result).toContain('const url = "javascript" + ":alert(1)";');
            expect(result).toContain('[BLOCKED-JAVASCRIPT]:void(0)');
            expect(result).not.toContain('javascript:void(0)');
        });
    });
});