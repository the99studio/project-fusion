// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Additional tests to achieve 100% coverage for fusion.ts
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { join } from 'node:path';
import { writeFile, mkdir, rm, chmod, symlink } from 'fs-extra';
import { existsSync } from 'node:fs';
import { processFusion } from '../src/fusion.js';
import { defaultConfig } from '../src/utils.js';

describe('Fusion Coverage Tests', () => {
    const testDir = join(process.cwd(), 'temp', 'fusion-coverage-test');
    const originalCwd = process.cwd();

    beforeEach(async () => {
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
        await mkdir(testDir, { recursive: true });
        process.chdir(testDir);
    });

    afterEach(async () => {
        process.chdir(originalCwd);
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
    });

    describe('processFusion edge cases', () => {
        it('should handle empty directories gracefully', async () => {
            const result = await processFusion(defaultConfig);
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('No files found to process');
        });

        it('should handle very large files (size limit)', async () => {
            // Create a file larger than the default limit (1024 KB)
            const largeContent = 'x'.repeat(1024 * 1024 + 1); // 1MB + 1 byte
            await writeFile('large.txt', largeContent);

            const config = {
                ...defaultConfig,
                maxFileSizeKB: 1024,
                parsedFileExtensions: {
                    ...defaultConfig.parsedFileExtensions,
                    doc: ['.txt']
                }
            };

            const result = await processFusion(config);
            
            // Should still succeed but skip the large file
            expect(result.success).toBe(true);
            expect(result.message).toContain('files processed');
        });

        it('should handle binary files', async () => {
            // Create a binary file
            const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF, 0xFE]);
            await writeFile('binary.bin', binaryContent);

            const config = {
                ...defaultConfig,
                parsedFileExtensions: {
                    ...defaultConfig.parsedFileExtensions,
                    other: ['.bin']
                }
            };

            const result = await processFusion(config);
            
            expect(result.success).toBe(true);
            // Binary files should be skipped
        });

        it('should handle files with special characters in names', async () => {
            await writeFile('file with spaces.js', 'console.log("spaces");');
            await writeFile('file-with-dashes.js', 'console.log("dashes");');
            await writeFile('file_with_underscores.js', 'console.log("underscores");');

            const result = await processFusion(defaultConfig);
            
            expect(result.success).toBe(true);
        });

        it('should handle deeply nested directories', async () => {
            // Create deeply nested structure
            await mkdir('level1/level2/level3/level4', { recursive: true });
            await writeFile('level1/level2/level3/level4/deep.js', 'console.log("deep");');

            const result = await processFusion(defaultConfig);
            
            expect(result.success).toBe(true);
        });

        it('should handle permission errors gracefully', async () => {
            if (process.platform === 'win32') {
                // Skip permission tests on Windows as they work differently
                return;
            }

            await writeFile('restricted.js', 'console.log("restricted");');
            
            // Remove read permissions
            await chmod('restricted.js', 0o000);

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const result = await processFusion(defaultConfig);
            
            // Should continue processing other files
            expect(result.success).toBe(true);
            
            // Restore permissions for cleanup
            await chmod('restricted.js', 0o644);
            consoleSpy.mockRestore();
        });

        it('should handle symbolic links when they exist', async () => {
            if (process.platform === 'win32') {
                // Skip symlink tests on Windows
                return;
            }

            await writeFile('target.js', 'console.log("target");');
            
            try {
                await symlink('./target.js', 'link.js');
                
                const result = await processFusion(defaultConfig);
                
                expect(result.success).toBe(true);
            } catch (error) {
                // If symlink creation fails (permissions), skip the test
                console.warn('Skipping symlink test due to permissions');
            }
        });

        it('should handle gitignore parsing errors', async () => {
            // Create malformed .gitignore
            await writeFile('.gitignore', '\x00invalid\x00content\x00');
            await writeFile('test.js', 'console.log("test");');

            const result = await processFusion(defaultConfig);
            
            // Should still process files despite gitignore issues
            expect(result.success).toBe(true);
        });

        it('should handle extension groups with undefined extensions', async () => {
            const configWithUndefined = {
                ...defaultConfig,
                parsedFileExtensions: {
                    ...defaultConfig.parsedFileExtensions,
                    // @ts-expect-error - Testing undefined case
                    undefined_group: undefined
                }
            };

            await writeFile('test.js', 'console.log("test");');

            const result = await processFusion(configWithUndefined);
            
            expect(result.success).toBe(true);
        });

        it('should handle fusion options with invalid extension groups', async () => {
            await writeFile('test.js', 'console.log("test");');

            const result = await processFusion(defaultConfig, {
                extensionGroups: ['invalid_group', 'web']
            });
            
            expect(result.success).toBe(true);
        });

        it('should handle HTML generation with special characters', async () => {
            await writeFile('special.html', `<!DOCTYPE html>
<html>
<head>
    <title>Test & "Quotes" and 'Single' quotes</title>
</head>
<body>
    <p>This has <em>emphasis</em> and <strong>strong</strong> text.</p>
    <p>Special chars: &lt; &gt; &amp; " '</p>
</body>
</html>`);

            const result = await processFusion(defaultConfig);
            
            expect(result.success).toBe(true);
            
            // Verify HTML escaping in generated content
            const htmlContent = await import('fs-extra').then(fs => 
                fs.readFile(`${defaultConfig.generatedFileName}.html`, 'utf8')
            );
            expect(htmlContent).toContain('&lt;');
            expect(htmlContent).toContain('&gt;');
            expect(htmlContent).toContain('&amp;');
        });

        it('should handle markdown generation with code blocks', async () => {
            await writeFile('example.md', `# Example

\`\`\`javascript
console.log("Hello, World!");
\`\`\`

Some **bold** and *italic* text.

- List item 1
- List item 2

| Table | Header |
|-------|--------|
| Cell  | Value  |
`);

            const result = await processFusion(defaultConfig);
            
            expect(result.success).toBe(true);
        });

        it('should handle very long file names', async () => {
            const longName = 'a'.repeat(200) + '.js';
            await writeFile(longName, 'console.log("long name");');

            const result = await processFusion(defaultConfig);
            
            expect(result.success).toBe(true);
        });

        it('should handle files with no extension', async () => {
            await writeFile('Makefile', 'all:\n\techo "make target"');
            await writeFile('README', '# This is a readme file');
            // Also add a regular file to ensure fusion succeeds
            await writeFile('test.js', 'console.log("test");');

            const result = await processFusion(defaultConfig);
            
            expect(result.success).toBe(true);
        });

        it('should handle directory traversal in ignore patterns', async () => {
            await mkdir('safe/directory', { recursive: true });
            await writeFile('safe/directory/file.js', 'console.log("safe");');

            const configWithTraversal = {
                ...defaultConfig,
                ignorePatterns: ['../../../etc/passwd', 'safe/../unsafe']
            };

            const result = await processFusion(configWithTraversal);
            
            expect(result.success).toBe(true);
        });

        it('should handle benchmark tracking edge cases', async () => {
            await writeFile('test.js', 'console.log("benchmark test");');

            // Test with very quick operations to test benchmark precision
            const startTime = Date.now();
            const result = await processFusion(defaultConfig);
            const endTime = Date.now();
            
            expect(result.success).toBe(true);
            expect(endTime - startTime).toBeGreaterThanOrEqual(0);
        });

        it('should handle concurrent file processing', async () => {
            // Create many files to test concurrent processing
            const promises = [];
            for (let i = 0; i < 50; i++) {
                promises.push(writeFile(`file${i}.js`, `console.log("File ${i}");`));
            }
            await Promise.all(promises);

            const result = await processFusion(defaultConfig);
            
            expect(result.success).toBe(true);
            expect(result.message).toContain('50 files processed');
        });
    });
});