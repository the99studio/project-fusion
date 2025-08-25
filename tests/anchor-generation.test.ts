import GithubSlugger from 'github-slugger';
import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownOutputStrategy, HtmlOutputStrategy, type OutputContext, type FileInfo } from '../src/strategies/output-strategy.js';
import { createFilePath } from '../src/types.js';
import { defaultConfig } from '../src/utils.js';

describe('Anchor Generation with github-slugger', () => {
    describe('github-slugger behavior', () => {
        let slugger: GithubSlugger;

        beforeEach(() => {
            slugger = new GithubSlugger();
        });

        it('should handle duplicate file paths correctly', () => {
            // Test that duplicate paths get unique anchors
            const path1 = slugger.slug('src/foo.js');
            const path2 = slugger.slug('src/foo.js');
            const path3 = slugger.slug('src/foo.js');
            
            expect(path1).toBe('srcfoojs');
            expect(path2).toBe('srcfoojs-1');
            expect(path3).toBe('srcfoojs-2');
        });

        it('should handle similar paths that would collide with regex', () => {
            // These would all produce 'src-foo-js' with the old regex approach
            const path1 = slugger.slug('src/foo.js');
            const path2 = slugger.slug('src-foo.js');
            const path3 = slugger.slug('src.foo.js');
            
            expect(path1).toBe('srcfoojs');
            expect(path2).toBe('src-foojs');
            expect(path3).toBe('srcfoojs-1'); // Collision with first, gets suffix
        });

        it('should handle case sensitivity properly', () => {
            const path1 = slugger.slug('Test.md');
            const path2 = slugger.slug('test.md');
            const path3 = slugger.slug('TEST.md');
            
            expect(path1).toBe('testmd');
            expect(path2).toBe('testmd-1'); // Same as first when lowercased
            expect(path3).toBe('testmd-2'); // Same as first when lowercased
        });

        it('should handle special characters and brackets', () => {
            const path1 = slugger.slug('file (1).txt');
            const path2 = slugger.slug('file [1].txt');
            const path3 = slugger.slug('file {1}.txt');
            const path4 = slugger.slug('file <1>.txt');
            
            // All should get unique anchors despite different brackets
            expect(path1).toBe('file-1txt');
            expect(path2).toBe('file-1txt-1');
            expect(path3).toBe('file-1txt-2');
            expect(path4).toBe('file-1txt-3');
        });

        it('should handle complex paths with multiple special chars', () => {
            const path1 = slugger.slug('src/components/Button (v2).tsx');
            const path2 = slugger.slug('src/components/Button [v2].tsx');
            const path3 = slugger.slug('src-components-Button-v2.tsx');
            
            expect(path1).toBe('srccomponentsbutton-v2tsx');
            expect(path2).toBe('srccomponentsbutton-v2tsx-1');
            expect(path3).toBe('src-components-button-v2tsx');
        });

        it('should reset properly for new documents', () => {
            slugger.slug('test.js');
            const path2 = slugger.slug('test.js');
            expect(path2).toBe('testjs-1');
            
            // Reset should clear the memory
            slugger.reset();
            const path3 = slugger.slug('test.js');
            expect(path3).toBe('testjs'); // Should be back to base slug
        });
    });

    describe('MarkdownOutputStrategy anchor generation', () => {
        let strategy: MarkdownOutputStrategy;
        let context: OutputContext;

        beforeEach(() => {
            strategy = new MarkdownOutputStrategy();
            context = {
                projectTitle: 'Test Project',
                versionInfo: '',
                filesToProcess: [],
                config: defaultConfig,
                toolVersion: '1.0.0'
            };
        });

        it('should generate unique anchors in TOC for duplicate paths', () => {
            const files: FileInfo[] = [
                {
                    content: 'content1',
                    relativePath: 'src/index.ts',
                    path: createFilePath('/test/src/index.ts'),
                    size: 100
                },
                {
                    content: 'content2',
                    relativePath: 'src/index.ts', // Duplicate path
                    path: createFilePath('/test/src/index.ts'),
                    size: 100
                },
                {
                    content: 'content3',
                    relativePath: 'src-index.ts', // Similar path that might collide
                    path: createFilePath('/test/src-index.ts'),
                    size: 100
                }
            ];
            
            context.filesToProcess = files;
            const header = strategy.generateHeader(context);
            
            // Check that TOC contains unique anchors
            expect(header).toContain('#srcindexts');
            expect(header).toContain('#srcindexts-1');
            expect(header).toContain('#src-indexts');
        });

        it('should use consistent anchors between TOC and file sections', () => {
            const files: FileInfo[] = [
                {
                    content: 'content1',
                    relativePath: 'test/file.js',
                    path: createFilePath('/test/file.js'),
                    size: 100
                },
                {
                    content: 'content2',
                    relativePath: 'test/file.js', // Duplicate
                    path: createFilePath('/test/file.js'),
                    size: 100
                }
            ];
            
            context.filesToProcess = files;
            
            // Generate header (which resets slugger twice)
            strategy.generateHeader(context);
            
            // Process files should generate same anchors
            const file1 = strategy.processFile(files[0]!);
            const file2 = strategy.processFile(files[1]!);
            
            expect(file1).toContain('{#testfilejs}');
            expect(file2).toContain('{#testfilejs-1}');
        });
    });

    describe('HtmlOutputStrategy anchor generation', () => {
        let strategy: HtmlOutputStrategy;
        let context: OutputContext;

        beforeEach(() => {
            strategy = new HtmlOutputStrategy();
            context = {
                projectTitle: 'Test Project',
                versionInfo: '',
                filesToProcess: [],
                config: defaultConfig,
                toolVersion: '1.0.0'
            };
        });

        it('should generate unique anchors in TOC for duplicate paths', () => {
            const files: FileInfo[] = [
                {
                    content: 'content1',
                    relativePath: 'app/main.py',
                    path: createFilePath('/test/app/main.py'),
                    size: 100
                },
                {
                    content: 'content2',
                    relativePath: 'app/main.py', // Duplicate path
                    path: createFilePath('/test/app/main.py'),
                    size: 100
                },
                {
                    content: 'content3',
                    relativePath: 'app-main.py', // Similar path
                    path: createFilePath('/test/app-main.py'),
                    size: 100
                }
            ];
            
            context.filesToProcess = files;
            const header = strategy.generateHeader(context);
            
            // Check that TOC contains unique anchors
            expect(header).toContain('#appmainpy');
            expect(header).toContain('#appmainpy-1');
            expect(header).toContain('#app-mainpy');
        });

        it('should use consistent anchors between TOC and file sections', () => {
            const files: FileInfo[] = [
                {
                    content: 'content1',
                    relativePath: 'components/Button.tsx',
                    path: createFilePath('/test/components/Button.tsx'),
                    size: 100
                },
                {
                    content: 'content2',
                    relativePath: 'components/Button.tsx', // Duplicate
                    path: createFilePath('/test/components/Button.tsx'),
                    size: 100
                }
            ];
            
            context.filesToProcess = files;
            
            // Generate header (which resets slugger twice)
            strategy.generateHeader(context);
            
            // Process files should generate same anchors
            const file1 = strategy.processFile(files[0]!);
            const file2 = strategy.processFile(files[1]!);
            
            expect(file1).toContain('id="componentsbuttontsx"');
            expect(file2).toContain('id="componentsbuttontsx-1"');
        });

        it('should handle error placeholders with unique anchors', () => {
            const files: FileInfo[] = [
                {
                    content: 'Error content',
                    relativePath: 'error/file.txt',
                    path: createFilePath('/test/error/file.txt'),
                    size: 100,
                    isErrorPlaceholder: true
                },
                {
                    content: 'Another error',
                    relativePath: 'error/file.txt', // Duplicate error path
                    path: createFilePath('/test/error/file.txt'),
                    size: 100,
                    isErrorPlaceholder: true
                }
            ];
            
            context.filesToProcess = files;
            strategy.generateHeader(context);
            
            const file1 = strategy.processFile(files[0]!);
            const file2 = strategy.processFile(files[1]!);
            
            expect(file1).toContain('id="errorfiletxt"');
            expect(file2).toContain('id="errorfiletxt-1"');
        });
    });

    describe('Edge cases and special scenarios', () => {
        let slugger: GithubSlugger;

        beforeEach(() => {
            slugger = new GithubSlugger();
        });

        it('should handle Godot file extensions', () => {
            const gd = slugger.slug('player.gd');
            const tres = slugger.slug('scene.tres');
            const tscn = slugger.slug('level.tscn');
            
            expect(gd).toBe('playergd');
            expect(tres).toBe('scenetres');
            expect(tscn).toBe('leveltscn');
        });

        it('should handle deeply nested paths', () => {
            const path1 = slugger.slug('src/components/ui/buttons/PrimaryButton.tsx');
            const path2 = slugger.slug('src/components/ui/buttons/SecondaryButton.tsx');
            const path3 = slugger.slug('src-components-ui-buttons-PrimaryButton.tsx');
            
            expect(path1).toBe('srccomponentsuibuttonsprimarybuttontsx');
            expect(path2).toBe('srccomponentsuibuttonssecondarybuttontsx');
            expect(path3).toBe('src-components-ui-buttons-primarybuttontsx');
        });

        it('should handle unicode characters', () => {
            const path1 = slugger.slug('文档/说明.md');
            const path2 = slugger.slug('café/menü.txt');
            const path3 = slugger.slug('файл/данные.json');
            
            // github-slugger handles unicode by transliterating or removing
            expect(path1).toBeTruthy();
            expect(path2).toBeTruthy();
            expect(path3).toBeTruthy();
        });

        it('should handle empty strings and edge inputs', () => {
            // github-slugger behavior with edge cases
            expect(slugger.slug('')).toBe('');
            expect(slugger.slug('   ')).toBe('---'); // Three spaces become three dashes
            expect(slugger.slug('.')).toBe('-1'); // Period becomes -1 (github-slugger behavior)
            expect(slugger.slug('/')).toBe('-2'); // Slash becomes -2 (github-slugger behavior)
        });

        it('should handle strategy with empty filesToProcess array', () => {
            const strategy = new MarkdownOutputStrategy();
            const context: OutputContext = {
                projectTitle: 'Test Project',
                versionInfo: '',
                filesToProcess: [], // Empty array
                config: defaultConfig,
                toolVersion: '1.0.0'
            };
            
            // Should handle gracefully without throwing
            expect(() => strategy.generateHeader(context)).not.toThrow();
            const header = strategy.generateHeader(context);
            expect(header).toContain('Test Project');
        });
    });
});