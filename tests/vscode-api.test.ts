// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Tests for VS Code extension API enhancements
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryFileSystemAdapter, type FileSystemAdapter } from '../src/adapters/file-system.js';
import { fusionAPI, type CancellationToken, type FusionProgress, type ProgrammaticFusionOptions } from '../src/index.js';

describe('VS Code API enhancements', () => {
    let memoryFs: MemoryFileSystemAdapter;
    
    beforeEach(async () => {
        memoryFs = new MemoryFileSystemAdapter();
        
        // Ensure directories exist
        await memoryFs.ensureDir('/test');
        await memoryFs.ensureDir('/test/src');
        
        // Setup test files
        memoryFs.writeFileSync('/test/src/main.ts', 'console.log("Hello World");');
        memoryFs.writeFileSync('/test/src/utils.js', 'export const utils = {};');
        memoryFs.writeFileSync('/test/package.json', JSON.stringify({ name: 'test-project', version: '1.0.0' }));
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('onDidFinish callback', () => {
        it('should call onDidFinish on successful completion', async () => {
            const onDidFinish = vi.fn();
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/test',
                generateText: true,
                generateMarkdown: false,
                generateHtml: false,
                parsedFileExtensions: {
                    web: ['.ts', '.js']
                },
                fs: memoryFs,
                onDidFinish
            };

            const result = await fusionAPI(options);
            
            expect(result.success).toBe(true);
            expect(onDidFinish).toHaveBeenCalledTimes(1);
            expect(onDidFinish).toHaveBeenCalledWith(result);
        });

        it('should call onDidFinish on failure', async () => {
            const onDidFinish = vi.fn();
            
            // Create empty directory with no matching files
            await memoryFs.ensureDir('/empty');
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/empty',
                generateText: true,
                parsedFileExtensions: {
                    web: ['.ts', '.js']
                },
                fs: memoryFs,
                onDidFinish
            };

            const result = await fusionAPI(options);
            
            expect(result.success).toBe(false);
            expect(onDidFinish).toHaveBeenCalledTimes(1);
            expect(onDidFinish).toHaveBeenCalledWith(result);
        });

        it('should call onDidFinish even when exception occurs', async () => {
            const onDidFinish = vi.fn();
            const mockFs = {
                ...memoryFs,
                glob: vi.fn().mockRejectedValue(new Error('Test error'))
            };
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/test',
                generateText: true,
                fs: mockFs as unknown as FileSystemAdapter,
                onDidFinish
            };

            const result = await fusionAPI(options);
            
            expect(result.success).toBe(false);
            expect(onDidFinish).toHaveBeenCalledTimes(1);
            expect(onDidFinish).toHaveBeenCalledWith(result);
            expect(result.error).toBeInstanceOf(Error);
        });
    });

    describe('onProgress callback', () => {
        it('should report progress during processing', async () => {
            const progressEvents: FusionProgress[] = [];
            const onProgress = vi.fn((progress: FusionProgress) => {
                progressEvents.push(progress);
            });
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/test',
                generateText: true,
                generateMarkdown: false,
                generateHtml: false,
                parsedFileExtensions: {
                    web: ['.ts', '.js']
                },
                fs: memoryFs,
                onProgress
            };

            await fusionAPI(options);
            
            expect(onProgress).toHaveBeenCalled();
            expect(progressEvents.length).toBeGreaterThan(0);
            
            // Check that we have different progress steps
            const steps = progressEvents.map(p => p.step);
            expect(steps).toContain('scanning');
            expect(steps).toContain('processing');
            expect(steps).toContain('generating');
            expect(steps).toContain('writing');
            
            // Check progress structure
            for (const progress of progressEvents) {
                expect(progress).toHaveProperty('step');
                expect(progress).toHaveProperty('message');
                expect(progress).toHaveProperty('filesProcessed');
                expect(progress).toHaveProperty('totalFiles');
                expect(progress).toHaveProperty('percentage');
                expect(typeof progress.percentage).toBe('number');
                expect(progress.percentage).toBeGreaterThanOrEqual(0);
                expect(progress.percentage).toBeLessThanOrEqual(100);
            }
        });

        it('should include current file in progress when processing files', async () => {
            const progressEvents: FusionProgress[] = [];
            const onProgress = vi.fn((progress: FusionProgress) => {
                progressEvents.push(progress);
            });
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/test',
                generateText: true,
                generateMarkdown: false,
                generateHtml: false,
                fs: memoryFs,
                onProgress
            };

            await fusionAPI(options);
            
            // Find processing events with current file
            const processingEvents = progressEvents.filter(p => 
                p.step === 'processing' && p.currentFile
            );
            
            expect(processingEvents.length).toBeGreaterThan(0);
            
            for (const event of processingEvents) {
                expect(event.currentFile).toBeDefined();
                expect(typeof event.currentFile).toBe('string');
            }
        });
    });

    describe('cancellation token', () => {
        it('should cancel operation before starting', async () => {
            const cancellationToken: CancellationToken = {
                isCancellationRequested: true
            };
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/test',
                generateText: true,
                fs: memoryFs,
                cancellationToken
            };

            const result = await fusionAPI(options);
            
            expect(result.success).toBe(false);
            expect(result.message).toBe('Operation was cancelled');
            expect(result.error).toBe('Cancelled');
        });

        it('should handle cancellation during processing', async () => {
            let cancelAfterFirstFile = false;
            const cancellationToken: CancellationToken = {
                get isCancellationRequested() {
                    if (cancelAfterFirstFile) {
                        return true;
                    }
                    return false;
                }
            };
            
            const onProgress = vi.fn((progress: FusionProgress) => {
                if (progress.step === 'processing' && progress.filesProcessed > 0) {
                    cancelAfterFirstFile = true;
                }
            });
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/test',
                generateText: true,
                fs: memoryFs,
                cancellationToken,
                onProgress
            };

            const result = await fusionAPI(options);
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('cancelled');
        });

        it('should respect cancellation event callback', async () => {
            let isCancelled = false;
            const cancellationListeners: (() => void)[] = [];
            
            const cancellationToken: CancellationToken = {
                get isCancellationRequested() {
                    return isCancelled;
                },
                onCancellationRequested: (listener: () => void) => {
                    cancellationListeners.push(listener);
                }
            };
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/test',
                generateText: true,
                fs: memoryFs,
                cancellationToken
            };

            // Start the operation
            const fusionPromise = fusionAPI(options);
            
            // Trigger cancellation immediately using setImmediate to ensure it happens in the next event loop tick
            setImmediate(() => {
                isCancelled = true;
                for (const listener of cancellationListeners) { listener(); }
            });
            
            const result = await fusionPromise;
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('cancelled');
        });
    });

    describe('VS Code integration scenarios', () => {
        it('should provide all necessary callbacks for VS Code progress UI', async () => {
            let progressStarted = false;
            let progressCompleted = false;
            const progressEvents: FusionProgress[] = [];
            
            const onProgress = vi.fn((progress: FusionProgress) => {
                progressEvents.push(progress);
                if (progress.step === 'scanning') {
                    progressStarted = true;
                }
                if (progress.step === 'writing') {
                    progressCompleted = true;
                }
            });
            
            const onDidFinish = vi.fn();
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/test',
                generateText: true,
                generateMarkdown: true,
                generateHtml: false,
                fs: memoryFs,
                onProgress,
                onDidFinish
            };

            const result = await fusionAPI(options);
            
            // Verify successful completion
            expect(result.success).toBe(true);
            expect(onDidFinish).toHaveBeenCalledWith(result);
            
            // Verify progress flow
            expect(progressStarted).toBe(true);
            expect(progressCompleted).toBe(true);
            
            // Verify progress increments
            const percentages = progressEvents.map(p => p.percentage);
            expect(Math.max(...percentages)).toBe(100);
        });

        it('should handle empty project gracefully', async () => {
            const emptyFs = new MemoryFileSystemAdapter();
            emptyFs.writeFileSync('/empty/package.json', '{}');
            
            const onProgress = vi.fn();
            const onDidFinish = vi.fn();
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/empty',
                generateText: true,
                parsedFileExtensions: {
                    web: ['.ts', '.js'] // Only look for code files, not config files
                },
                fs: emptyFs,
                onProgress,
                onDidFinish
            };

            const result = await fusionAPI(options);
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('No files found');
            expect(onDidFinish).toHaveBeenCalledWith(result);
            expect(onProgress).toHaveBeenCalled();
        });

        it('should handle large project with cancellation', async () => {
            // Create a larger project
            const largeFs = new MemoryFileSystemAdapter();
            for (let i = 0; i < 100; i++) {
                largeFs.writeFileSync(`/large/file${i}.ts`, `export const value${i} = ${i};`);
            }
            largeFs.writeFileSync('/large/package.json', JSON.stringify({ name: 'large-project' }));
            
            let shouldCancel = false;
            const cancellationToken: CancellationToken = {
                get isCancellationRequested() {
                    return shouldCancel;
                }
            };
            
            const onProgress = vi.fn((progress: FusionProgress) => {
                // Cancel after processing 10 files
                if (progress.step === 'processing' && progress.filesProcessed >= 10) {
                    shouldCancel = true;
                }
            });
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/large',
                generateText: true,
                fs: largeFs,
                cancellationToken,
                onProgress
            };

            const result = await fusionAPI(options);
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('cancelled');
        });
    });
});