import { describe, it, expect } from 'vitest';
import { HtmlOutputStrategy } from '../src/strategies/output-strategy.js';
import type { FileInfo, OutputContext } from '../src/types.js';

describe('HTML Escaping', () => {
    const strategy = new HtmlOutputStrategy();
    
    const createFileInfo = (content: string, relativePath = 'test.html'): FileInfo => ({
        path: `/project/${relativePath}`,
        relativePath,
        content,
        isErrorPlaceholder: false
    });

    describe('escapeHtml() through processFile()', () => {
        it('should escape basic HTML entities', () => {
            const fileInfo = createFileInfo('const html = "<div>&test</div>";');
            const result = strategy.processFile(fileInfo);
            
            expect(result).toContain('&lt;div&gt;&amp;test&lt;&#47;div&gt;');
            expect(result).not.toContain('<div>');
            expect(result).not.toContain('&test');
        });

        it('should escape script tags to prevent XSS', () => {
            const maliciousContent = '<script>alert("XSS")</script>';
            const fileInfo = createFileInfo(maliciousContent);
            const result = strategy.processFile(fileInfo);
            
            expect(result).toContain('&lt;script&gt;alert&#40;&quot;XSS&quot;&#41;&lt;&#47;script&gt;');
            expect(result).not.toContain('<script>');
            expect(result).not.toContain('</script>');
        });

        it('should escape double quotes', () => {
            const content = 'const attr = "data-value="test"";';
            const fileInfo = createFileInfo(content);
            const result = strategy.processFile(fileInfo);
            
            expect(result).toContain('&quot;data-value&#61;&quot;test&quot;&quot;');
            expect(result).not.toContain('"data-value="');
        });

        it('should escape single quotes', () => {
            const content = "const text = 'It\\'s a test';";
            const fileInfo = createFileInfo(content);
            const result = strategy.processFile(fileInfo);
            
            expect(result).toContain('&#39;It\\&#39;s a test&#39;');
            expect(result).not.toContain("'It\\'s");
        });

        it('should handle mixed quotes and HTML entities', () => {
            const content = `<button onclick="alert('XSS & "injection"')">Click me</button>`;
            const fileInfo = createFileInfo(content);
            const result = strategy.processFile(fileInfo);
            
            expect(result).toContain('&lt;button onclick&#61;&quot;alert&#40;&#39;XSS &amp; &quot;injection&quot;&#39;&#41;&quot;&gt;Click me&lt;&#47;button&gt;');
            expect(result).not.toContain('<button');
            // The wrapper HTML will contain 'onclick=' in the attributes, so check for the actual XSS pattern
            expect(result).not.toContain('onclick="alert');
        });

        it('should handle high Unicode characters correctly', () => {
            const content = 'const emoji = "🔥💻🚀"; const chinese = "你好世界"; const arabic = "مرحبا بالعالم";';
            const fileInfo = createFileInfo(content);
            const result = strategy.processFile(fileInfo);
            
            // High Unicode should pass through unchanged
            expect(result).toContain('🔥💻🚀');
            expect(result).toContain('你好世界');
            expect(result).toContain('مرحبا بالعالم');
            // But quotes and equals should still be escaped
            expect(result).toContain('const emoji &#61; &quot;🔥💻🚀&quot;');
            expect(result).toContain('const chinese &#61; &quot;你好世界&quot;');
        });

        it('should escape HTML in filenames', () => {
            const content = 'test content';
            const dangerousFileName = '<script>alert("xss")</script>.js';
            const fileInfo = createFileInfo(content, dangerousFileName);
            const result = strategy.processFile(fileInfo);
            
            expect(result).toContain('&lt;script&gt;alert&#40;&quot;xss&quot;&#41;&lt;&#47;script&gt;.js');
            expect(result).not.toContain('<script>');
        });

        it('should handle complex nested HTML structures', () => {
            const content = `
                <div class="container">
                    <h1>Title with "quotes" & special chars</h1>
                    <p>Content with <script>alert('danger')</script></p>
                    <img src="test.jpg" alt="Image with > and < symbols"/>
                </div>
            `;
            const fileInfo = createFileInfo(content);
            const result = strategy.processFile(fileInfo);
            
            // Check that the actual HTML content is escaped (wrapper HTML will contain div elements)
            expect(result).not.toContain('<div class="container">');
            expect(result).not.toContain('<h1>');
            expect(result).not.toContain('<script>');
            expect(result).not.toContain('<img src="test.jpg"');
            expect(result).toContain('&lt;div class&#61;&quot;container&quot;&gt;');
            expect(result).toContain('&lt;script&gt;alert&#40;&#39;danger&#39;&#41;&lt;&#47;script&gt;');
            expect(result).toContain('alt&#61;&quot;Image with &gt; and &lt; symbols&quot;&#47;&gt;');
        });

        it('should handle edge cases with multiple consecutive special characters', () => {
            const content = '<<<>>>&&&"""\'\'\'';
            const fileInfo = createFileInfo(content);
            const result = strategy.processFile(fileInfo);
            
            expect(result).toContain('&lt;&lt;&lt;&gt;&gt;&gt;&amp;&amp;&amp;&quot;&quot;&quot;&#39;&#39;&#39;');
        });

        it('should preserve escaped characters in the original content', () => {
            const content = 'const escaped = "Already escaped: &lt; &gt; &amp; &quot; &#39;";';
            const fileInfo = createFileInfo(content);
            const result = strategy.processFile(fileInfo);
            
            // The & in &lt; should be escaped to &amp;lt;
            expect(result).toContain('&amp;lt;');
            expect(result).toContain('&amp;gt;');
            expect(result).toContain('&amp;amp;');
            expect(result).toContain('&amp;quot;');
            expect(result).toContain('&amp;#39;');
        });

        it('should handle null bytes and control characters', () => {
            const content = 'test\u0000null\u0001control\u001Fescape';
            const fileInfo = createFileInfo(content);
            const result = strategy.processFile(fileInfo);
            
            // Control characters should pass through but HTML chars should be escaped
            expect(result).toContain('test\u0000null\u0001control\u001Fescape');
        });

        it('should handle very long strings with special characters efficiently', () => {
            const longString = `<script>${'x'.repeat(10_000)}</script>`;
            const fileInfo = createFileInfo(longString);
            const result = strategy.processFile(fileInfo);
            
            expect(result).toContain('&lt;script&gt;');
            expect(result).toContain('&lt;&#47;script&gt;');
            expect(result).toContain('x'.repeat(10_000));
        });

        it('should handle error placeholder files with HTML content', () => {
            const errorContent = '<div>Error: File contains <script>dangerous</script> content</div>';
            const fileInfo: FileInfo = {
                path: '/project/error.html',
                relativePath: 'error.html',
                content: errorContent,
                isErrorPlaceholder: true
            };
            const result = strategy.processFile(fileInfo);
            
            // Should escape HTML in error messages
            expect(result).toContain('&lt;div&gt;Error: File contains &lt;script&gt;dangerous&lt;&#47;script&gt; content&lt;&#47;div&gt;');
            expect(result).toContain('class="error"'); // Should have error styling
            expect(result).not.toContain('<script>');
        });
    });

    describe('escapeHtml() through generateHeader()', () => {
        it('should escape HTML in header generation', () => {
            const context: OutputContext = {
                version: '1.0.0',
                generatedAt: new Date().toISOString(),
                projectTitle: 'Test Project',
                versionInfo: ' v1.0.0',
                toolVersion: '1.0.0',
                config: {
                    schemaVersion: 1,
                    generatedFileName: '<script>alert("XSS")</script>',
                    copyToClipboard: false,
                    generateText: false,
                    generateMarkdown: false,
                    generateHtml: true,
                    parsedFileExtensions: {},
                    parseSubDirectories: false,
                    rootDirectory: '.',
                    outputDirectory: './output',
                    maxFileSizeKB: 1024,
                    maxFiles: 100,
                    maxTotalSizeMB: 10,
                    ignorePatterns: [],
                    useGitIgnoreForExcludes: false,
                    allowSymlinks: false,
                    maxBase64BlockKB: 100,
                    maxLineLength: 5000,
                    maxTokenLength: 2000,
                    excludeSecrets: true,
                    maxSymlinkAuditEntries: 100
                },
                filesToProcess: [
                    {
                        path: '/test/<img src=x onerror=alert(1)>.js',
                        relativePath: '<img src=x onerror=alert(1)>.js',
                        content: 'test',
                        isErrorPlaceholder: false
                    }
                ]
            };
            
            const header = strategy.generateHeader(context);
            
            // Should escape HTML in table of contents (the actual file names)
            expect(header).toContain('&lt;img src&#61;x onerror&#61;alert&#40;1&#41;&gt;.js');
            // Verify no unescaped script tags
            expect(header).not.toContain('<script>alert');
            // The href contains a slug version which is safe, but the display text should be escaped
            expect(header).not.toContain('><img src=x'); // This would indicate unescaped HTML tag
        });
    });

    describe('special edge cases', () => {
        it('should handle HTML entity-like strings that are not actual entities', () => {
            const content = 'const regex = /&[a-z]+;/g; // Matches &nbsp; &lt; etc';
            const fileInfo = createFileInfo(content);
            const result = strategy.processFile(fileInfo);
            
            expect(result).toContain('&#47;&amp;&#91;a-z&#93;&#43;;');
            expect(result).toContain('&amp;nbsp;');
            expect(result).toContain('&amp;lt;');
        });

        it('should handle JavaScript template literals with HTML', () => {
            const content = 'const template = `<div>${user}</div>`;';
            const fileInfo = createFileInfo(content);
            const result = strategy.processFile(fileInfo);
            
            expect(result).toContain('&lt;div&gt;&#36;&#123;user&#125;&lt;&#47;div&gt;');
        });

        it('should handle XML/JSX syntax', () => {
            const content = '<Component prop="value" onClick={() => alert("test")} />';
            const fileInfo = createFileInfo(content);
            const result = strategy.processFile(fileInfo);
            
            expect(result).toContain('&lt;Component prop&#61;&quot;value&quot;');
            expect(result).toContain('onClick&#61;&#123;&#40;&#41; &#61;&gt; alert&#40;&quot;test&quot;&#41;&#125;');
        });
    });
});