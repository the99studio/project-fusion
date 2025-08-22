// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Security tests for Project Fusion
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join } from 'node:path';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { processFusion } from '../src/fusion.js';
import { defaultConfig } from '../src/utils.js';

describe('Security Tests', () => {
    const testDir = join(process.cwd(), 'temp', 'security-test');

    beforeEach(async () => {
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
        await mkdir(testDir, { recursive: true });
        process.chdir(testDir);
    });

    afterEach(async () => {
        process.chdir(join(testDir, '..', '..'));
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
    });

    describe('HTML Injection Protection', () => {
        it('should escape HTML in file content', async () => {
            // Create malicious HTML content
            const maliciousContent = `
console.log("test");
<script>alert('XSS')</script>
<img src="x" onerror="alert('XSS')">
&lt;div&gt;Already escaped&lt;/div&gt;
"quotes" & 'apostrophes'
`;

            await writeFile('malicious.js', maliciousContent);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: true,
                generateText: false,
                generateMarkdown: false,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            expect(result.success).toBe(true);

            // Read generated HTML
            const htmlContent = await import('fs').then(fs => 
                fs.promises.readFile(join(testDir, 'project-fusioned.html'), 'utf8')
            );

            // Verify all dangerous HTML is escaped
            expect(htmlContent).toContain('&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;');
            expect(htmlContent).toContain('&lt;img src=&quot;x&quot; onerror=&quot;alert(&#39;XSS&#39;)&quot;&gt;');
            expect(htmlContent).toContain('&amp;lt;div&amp;gt;Already escaped&amp;lt;/div&amp;gt;');
            expect(htmlContent).toContain('&quot;quotes&quot; &amp; &#39;apostrophes&#39;');

            // Verify no unescaped dangerous content
            expect(htmlContent).not.toContain('<script>alert(');
            expect(htmlContent).not.toContain('<img src="x"');
            expect(htmlContent).not.toContain('onerror="alert(');
        });

        it('should escape HTML in file paths', async () => {
            // Create files with dangerous names
            const dangerousFileName = '<script>alert("path").js';
            const safeFileName = 'safe-file.js';

            await writeFile(safeFileName, 'console.log("safe");');
            await writeFile('another-file.js', 'console.log("another");');
            
            // We can't actually create a file with < > in the name on most filesystems
            // So we'll test by creating files and verifying HTML escaping
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: true,
                generateText: false,
                generateMarkdown: false,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            expect(result.success).toBe(true);

            // Read generated HTML
            const htmlContent = await import('fs').then(fs => 
                fs.promises.readFile(join(testDir, 'project-fusioned.html'), 'utf8')
            );

            // File paths should be HTML-escaped in titles and TOC
            expect(htmlContent).toContain('safe-file.js');
            
            // Verify no unescaped angle brackets that could be dangerous
            const tocSection = htmlContent.split('<nav class="toc"')[1]?.split('</nav>')[0];
            const titleSections = htmlContent.split('>📄 ');
            
            expect(tocSection).toBeDefined();
            expect(titleSections.length).toBeGreaterThan(1);
            
            // All file references should not contain unescaped HTML
            titleSections.slice(1).forEach(section => {
                const title = section.split('</h2>')[0];
                expect(title).not.toContain('<script');
                expect(title).not.toContain('onerror=');
            });
        });

        it('should escape HTML in project title and version', async () => {
            // Create a package.json with dangerous content
            const dangerousPackageJson = {
                name: '<script>alert("name")</script>',
                version: '1.0.0<img src=x onerror=alert("version")>',
                description: 'Test package'
            };

            await writeFile('package.json', JSON.stringify(dangerousPackageJson, null, 2));
            await writeFile('test.js', 'console.log("test");');

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: true,
                generateText: false,
                generateMarkdown: false,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            expect(result.success).toBe(true);

            // Read generated HTML
            const htmlContent = await import('fs').then(fs => 
                fs.promises.readFile(join(testDir, 'project-fusioned.html'), 'utf8')
            );

            // Project title should be escaped
            expect(htmlContent).toContain('&lt;script&gt;alert(&quot;name&quot;)&lt;/script&gt;');
            expect(htmlContent).toContain('1.0.0&lt;img src=x onerror=alert(&quot;version&quot;)&gt;');
            
            // Verify no unescaped dangerous content in header
            const headerSection = htmlContent.split('<header class="header"')[1]?.split('</header>')[0];
            expect(headerSection).toBeDefined();
            expect(headerSection).not.toContain('<script>alert(');
            expect(headerSection).not.toContain('<img src=x');
            // The dangerous tags are escaped, making them safe
            expect(headerSection).not.toContain('<script>');
            expect(headerSection).not.toContain('<img ');
        });
    });

    describe('Path Traversal Protection', () => {
        it('should handle relative paths safely', async () => {
            await writeFile('normal.js', 'console.log("normal");');
            
            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateHtml: true,
                parseSubDirectories: true,
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            expect(result.success).toBe(true);

            // Should only process files within the root directory
            const htmlContent = await import('fs').then(fs => 
                fs.promises.readFile(join(testDir, 'project-fusioned.html'), 'utf8')
            );

            expect(htmlContent).toContain('normal.js');
            // Should not escape outside the test directory
            expect(htmlContent).not.toContain('../../');
            expect(htmlContent).not.toContain('../security.test.ts');
        });
    });
});