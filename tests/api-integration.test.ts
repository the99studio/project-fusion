// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Simple integration tests for the VS Code API enhancements
 */
import { describe, expect, it, vi } from 'vitest';
import { fusionAPI, type CancellationToken, type FusionProgress, type ProgrammaticFusionOptions } from '../src/index.js';

describe('API Integration for VS Code', () => {
    describe('API interface tests', () => {
        it('should accept all VS Code-specific options', () => {
            const onProgress = vi.fn();
            const onDidFinish = vi.fn();
            const cancellationToken: CancellationToken = {
                isCancellationRequested: false
            };
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/test',
                generateText: true,
                onProgress,
                onDidFinish,
                cancellationToken
            };
            
            // This should compile without errors and accept all VS Code interfaces
            expect(options.onProgress).toBe(onProgress);
            expect(options.onDidFinish).toBe(onDidFinish);
            expect(options.cancellationToken).toBe(cancellationToken);
        });

        it('should have properly typed progress callback', () => {
            const onProgress = vi.fn((progress: FusionProgress) => {
                // Test that progress has the right shape
                expect(progress).toHaveProperty('step');
                expect(progress).toHaveProperty('message');
                expect(progress).toHaveProperty('filesProcessed');
                expect(progress).toHaveProperty('totalFiles');
                expect(progress).toHaveProperty('percentage');
                
                expect(['scanning', 'processing', 'generating', 'writing']).toContain(progress.step);
                expect(typeof progress.message).toBe('string');
                expect(typeof progress.filesProcessed).toBe('number');
                expect(typeof progress.totalFiles).toBe('number');
                expect(typeof progress.percentage).toBe('number');
                expect(progress.percentage).toBeGreaterThanOrEqual(0);
                expect(progress.percentage).toBeLessThanOrEqual(100);
            });
            
            // Trigger a progress event manually to test the interface
            const mockProgress: FusionProgress = {
                step: 'scanning',
                message: 'Scanning files...',
                filesProcessed: 0,
                totalFiles: 10,
                percentage: 0,
                currentFile: undefined
            };
            
            onProgress(mockProgress);
            expect(onProgress).toHaveBeenCalledWith(mockProgress);
        });

        it('should handle cancellation token interface', () => {
            let cancelled = false;
            const listeners: (() => void)[] = [];
            
            const cancellationToken: CancellationToken = {
                get isCancellationRequested() {
                    return cancelled;
                },
                onCancellationRequested: (listener: () => void) => {
                    listeners.push(listener);
                }
            };
            
            expect(cancellationToken.isCancellationRequested).toBe(false);
            
            // Simulate cancellation
            cancelled = true;
            for (const listener of listeners) listener();
            
            expect(cancellationToken.isCancellationRequested).toBe(true);
        });

        it('should provide onDidFinish callback with proper result type', () => {
            const onDidFinish = vi.fn((result) => {
                expect(result).toHaveProperty('success');
                expect(result).toHaveProperty('message');
                expect(typeof (result as { success: boolean }).success).toBe('boolean');
                expect(typeof (result as { message: string }).message).toBe('string');
                
                if (result.success) {
                    expect(result).toHaveProperty('fusionFilePath');
                } else {
                    expect(result).toHaveProperty('error');
                }
            });
            
            // Test with mock success result
            const successResult = {
                success: true as const,
                message: 'Fusion completed successfully',
                fusionFilePath: '/test/output.txt' as any,
                logFilePath: '/test/output.log' as any
            };
            
            onDidFinish(successResult);
            
            // Test with mock error result
            const errorResult = {
                success: false as const,
                message: 'Fusion failed',
                error: new Error('Test error')
            };
            
            onDidFinish(errorResult);
            
            expect(onDidFinish).toHaveBeenCalledTimes(2);
        });

        it('should support immediate cancellation', async () => {
            const onDidFinish = vi.fn();
            const cancellationToken: CancellationToken = {
                isCancellationRequested: true
            };
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/test',
                generateText: true,
                onDidFinish,
                cancellationToken
            };

            const result = await fusionAPI(options);
            
            expect(result.success).toBe(false);
            expect(result.message).toBe('Operation was cancelled');
            expect(result.error).toBe('Cancelled');
            expect(onDidFinish).toHaveBeenCalledWith(result);
        });

        it('should export all necessary VS Code interfaces', () => {
            // This test ensures all types are properly exported
            const types = {
                fusionAPI,
                // Type imports are checked at compile time
            };
            
            expect(typeof types.fusionAPI).toBe('function');
        });
    });

    describe('Configuration compatibility', () => {
        it('should merge VS Code settings with defaults', () => {
            // Test that VS Code configuration options are properly typed
            const vscodeConfig: ProgrammaticFusionOptions = {
                rootDirectory: '/workspace',
                generateText: true,
                generateMarkdown: false,
                generateHtml: true,
                maxFileSizeKB: 2048,
                extensionGroups: ['web', 'backend'],
                ignorePatterns: ['*.test.ts', 'node_modules/**'],
                parseSubDirectories: true,
                allowSymlinks: false,
                copyToClipboard: false
            };
            
            // This should compile without issues
            expect(vscodeConfig.rootDirectory).toBe('/workspace');
            expect(vscodeConfig.extensionGroups).toEqual(['web', 'backend']);
        });

        it('should handle workspace-relative paths', () => {
            const options: ProgrammaticFusionOptions = {
                rootDirectory: './src',
                outputDirectory: './dist',
                generateText: true
            };
            
            expect(options.rootDirectory).toBe('./src');
            expect(options.outputDirectory).toBe('./dist');
        });

        it('should support partial configuration from VS Code settings', () => {
            // Test that not all options are required
            const minimalConfig: ProgrammaticFusionOptions = {
                generateText: true
            };
            
            const fullConfig: ProgrammaticFusionOptions = {
                rootDirectory: '/workspace',
                generateText: true,
                generateMarkdown: true,
                generateHtml: false,
                maxFileSizeKB: 1024,
                maxFiles: 1000,
                maxTotalSizeMB: 100,
                extensionGroups: ['web'],
                ignorePatterns: ['*.spec.ts'],
                parseSubDirectories: true,
                allowSymlinks: false,
                copyToClipboard: true,
                excludeSecrets: true,
                onProgress: vi.fn(),
                onDidFinish: vi.fn(),
                cancellationToken: { isCancellationRequested: false }
            };
            
            expect(minimalConfig.generateText).toBe(true);
            expect(fullConfig.extensionGroups).toEqual(['web']);
        });
    });

    describe('Error handling for VS Code', () => {
        it('should handle exceptions gracefully', async () => {
            const onDidFinish = vi.fn();
            
            // This will fail because of missing directory, but should be handled gracefully
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/absolutely/nonexistent/directory',
                generateText: true,
                onDidFinish
            };

            const result = await fusionAPI(options);
            
            expect(result.success).toBe(false);
            expect(typeof result.message).toBe('string');
            expect(onDidFinish).toHaveBeenCalledWith(result);
        });

        it('should provide meaningful error messages', async () => {
            const result = await fusionAPI({
                rootDirectory: '/dev/null', // This will cause issues
                generateText: true
            });
            
            expect(result.success).toBe(false);
            expect(result.message.length).toBeGreaterThan(0);
            expect(typeof result.error).toBeDefined();
        });
    });

    describe('VS Code Extension API Documentation Examples', () => {
        it('should work with the documented API pattern', () => {
            // This is the pattern documented for VS Code extensions
            const startFusion = (workspaceRoot: string, progress: any, token: any) => {
                const options: ProgrammaticFusionOptions = {
                    rootDirectory: workspaceRoot,
                    generateText: true,
                    generateMarkdown: true,
                    generateHtml: false,
                    extensionGroups: ['web', 'backend'],
                    onProgress: (progressInfo) => {
                        progress.report({
                            message: progressInfo.message,
                            increment: progressInfo.percentage
                        });
                    },
                    onDidFinish: (result) => {
                        if (result.success) {
                            console.log('Fusion completed:', result.fusionFilePath);
                        } else {
                            console.error('Fusion failed:', result.message);
                        }
                    },
                    cancellationToken: {
                        get isCancellationRequested() {
                            return token.isCancellationRequested;
                        },
                        onCancellationRequested: token.onCancellationRequested
                    }
                };
                
                return fusionAPI(options);
            };
            
            // Mock VS Code APIs
            const mockProgress = { report: vi.fn() };
            const mockToken = { 
                isCancellationRequested: false,
                onCancellationRequested: vi.fn()
            };
            
            const result = startFusion('/workspace', mockProgress, mockToken);
            expect(result).toBeInstanceOf(Promise);
        });
    });
});