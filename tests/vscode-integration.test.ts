// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Integration tests that simulate VS Code extension usage
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryFileSystemAdapter } from '../src/adapters/file-system.js';
import { fusionAPI, type CancellationToken, type FusionProgress, type ProgrammaticFusionOptions, type ProgrammaticFusionResult } from '../src/index.js';

// Mock VS Code-like progress reporting
interface VSCodeProgress {
    report(value: { message?: string; increment?: number }): void;
}

interface VSCodeCancellationToken {
    isCancellationRequested: boolean;
    onCancellationRequested: (listener: () => void) => void;
}

describe('VS Code Extension Integration', () => {
    let memoryFs: MemoryFileSystemAdapter;
    
    beforeEach(() => {
        memoryFs = new MemoryFileSystemAdapter();
        
        // Setup a realistic project structure
        memoryFs.writeFileSync('/project/src/index.ts', `
export { App } from './app.js';
export { Utils } from './utils.js';
        `);
        
        memoryFs.writeFileSync('/project/src/app.ts', `
import { Utils } from './utils.js';

export class App {
    constructor() {
        console.log('App initialized');
    }
    
    start() {
        Utils.log('Starting app...');
    }
}
        `);
        
        memoryFs.writeFileSync('/project/src/utils.ts', `
export class Utils {
    static log(message: string) {
        console.log(\`[\${new Date().toISOString()}] \${message}\`);
    }
    
    static formatDate(date: Date): string {
        return date.toLocaleDateString();
    }
}
        `);
        
        memoryFs.writeFileSync('/project/src/components/Button.tsx', `
import React from 'react';

interface ButtonProps {
    onClick: () => void;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
    return (
        <button onClick={onClick} className="btn">
            {children}
        </button>
    );
};
        `);
        
        memoryFs.writeFileSync('/project/src/styles/main.css', `
.btn {
    background: #007acc;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}

.btn:hover {
    background: #005a9e;
}
        `);
        
        memoryFs.writeFileSync('/project/package.json', JSON.stringify({
            name: 'my-awesome-project',
            version: '1.2.3',
            description: 'A demo project for VS Code integration',
            main: 'dist/index.js',
            scripts: {
                build: 'tsc',
                test: 'jest'
            }
        }, null, 2));
        
        memoryFs.writeFileSync('/project/README.md', `
# My Awesome Project

This is a demo project for testing VS Code integration.

## Features

- TypeScript support
- React components
- CSS styling
        `);
        
        memoryFs.writeFileSync('/project/.gitignore', `
node_modules/
dist/
*.log
.env
        `);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('VS Code Command: Generate Fusion', () => {
        it('should simulate VS Code extension command execution', async () => {
            // Mock VS Code progress API
            const vscodeProgress: VSCodeProgress = {
                report: vi.fn((value) => {
                    if ((value as { increment?: number }).increment) {
                        // Increment tracking removed
                    }
                })
            };
            
            // Mock VS Code cancellation token
            const vscodeCancellationToken: VSCodeCancellationToken = {
                isCancellationRequested: false,
                onCancellationRequested: vi.fn()
            };
            
            // Convert VS Code interfaces to our interfaces
            const cancellationToken: CancellationToken = {
                get isCancellationRequested() {
                    return vscodeCancellationToken.isCancellationRequested;
                },
                onCancellationRequested: vscodeCancellationToken.onCancellationRequested
            };
            
            let lastProgress: FusionProgress | null = null;
            const onProgress = (progress: FusionProgress) => {
                lastProgress = progress;
                vscodeProgress.report({
                    message: progress.message,
                    increment: lastProgress ? progress.percentage - (lastProgress.percentage || 0) : progress.percentage
                });
            };
            
            let finalResult: ProgrammaticFusionResult | null = null;
            const onDidFinish = (result: ProgrammaticFusionResult) => {
                finalResult = result;
            };
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/project',
                generateText: true,
                generateMarkdown: true,
                generateHtml: false,
                extensionGroups: ['web', 'doc'],
                fs: memoryFs,
                onProgress,
                onDidFinish,
                cancellationToken
            };

            // Execute fusion (this is what the VS Code extension would do)
            const result = await fusionAPI(options);
            
            // Verify successful execution
            expect(result.success).toBe(true);
            expect(result.fusionFilePath).toBeDefined();
            expect(finalResult).toBe(result);
            
            // Verify progress was reported
            expect(vscodeProgress.report).toHaveBeenCalled();
            expect((lastProgress as any)?.percentage).toBe(100);
            
            // Verify files were processed
            expect(result.message).toContain('files processed');
        });
        
        it('should handle cancellation from VS Code UI', async () => {
            let shouldCancel = false;
            const cancellationListeners: (() => void)[] = [];
            
            const vscodeCancellationToken: VSCodeCancellationToken = {
                get isCancellationRequested() {
                    return shouldCancel;
                },
                onCancellationRequested: (listener: () => void) => {
                    cancellationListeners.push(listener);
                }
            };
            
            const cancellationToken: CancellationToken = {
                get isCancellationRequested() {
                    return vscodeCancellationToken.isCancellationRequested;
                },
                onCancellationRequested: vscodeCancellationToken.onCancellationRequested
            };
            
            const onProgress = vi.fn((progress: FusionProgress) => {
                // Simulate user clicking cancel button after scanning
                if (progress.step === 'processing') {
                    shouldCancel = true;
                    for (const listener of cancellationListeners) listener();
                }
            });
            
            const onDidFinish = vi.fn();
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/project',
                generateText: true,
                fs: memoryFs,
                onProgress,
                onDidFinish,
                cancellationToken
            };

            const result = await fusionAPI(options);
            
            expect(result.success).toBe(false);
            expect(result.message).toContain('cancelled');
            expect(onDidFinish).toHaveBeenCalledWith(result);
        });
    });

    describe('VS Code Status Bar Integration', () => {
        it('should provide status updates suitable for status bar', async () => {
            const statusUpdates: string[] = [];
            
            const onProgress = (progress: FusionProgress) => {
                // Simulate updating VS Code status bar
                const statusText = `Fusion: ${progress.step} (${progress.percentage}%)`;
                statusUpdates.push(statusText);
            };
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/project',
                generateText: true,
                fs: memoryFs,
                onProgress
            };

            await fusionAPI(options);
            
            expect(statusUpdates.length).toBeGreaterThan(0);
            expect(statusUpdates[0]).toContain('scanning');
            expect(statusUpdates.at(-1)).toContain('100%');
        });
    });

    describe('VS Code Output Channel Integration', () => {
        it('should provide detailed progress for output channel logging', async () => {
            const outputLogs: string[] = [];
            
            const onProgress = (progress: FusionProgress) => {
                // Simulate logging to VS Code output channel
                const timestamp = new Date().toISOString();
                const logEntry = `[${timestamp}] ${progress.message}${progress.currentFile ? ` - ${progress.currentFile}` : ''}`;
                outputLogs.push(logEntry);
            };
            
            let finalResult: ProgrammaticFusionResult | null = null;
            const onDidFinish = (result: ProgrammaticFusionResult) => {
                finalResult = result;
                const timestamp = new Date().toISOString();
                const statusLog = `[${timestamp}] Fusion ${result.success ? 'completed' : 'failed'}: ${result.message}`;
                outputLogs.push(statusLog);
            };
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/project',
                generateText: true,
                extensionGroups: ['web'],
                fs: memoryFs,
                onProgress,
                onDidFinish
            };

            await fusionAPI(options);
            
            expect(outputLogs.length).toBeGreaterThan(0);
            expect(outputLogs.some(log => log.toLowerCase().includes('scanning'))).toBe(true);
            expect(outputLogs.some(log => log.toLowerCase().includes('processing'))).toBe(true);
            expect(outputLogs.some(log => log.toLowerCase().includes('completed'))).toBe(true);
            expect((finalResult as any)?.success).toBe(true);
        });
    });

    describe('VS Code Settings Integration', () => {
        it('should work with VS Code workspace configuration', async () => {
            // Simulate VS Code workspace settings
            const workspaceConfig = {
                'projectFusion.generateText': true,
                'projectFusion.generateMarkdown': false,
                'projectFusion.generateHtml': true,
                'projectFusion.maxFileSizeKB': 1024,
                'projectFusion.extensionGroups': ['web', 'doc'],
                'projectFusion.ignorePatterns': ['*.test.ts', 'dist/*']
            };
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/project',
                generateText: workspaceConfig['projectFusion.generateText'],
                generateMarkdown: workspaceConfig['projectFusion.generateMarkdown'],
                generateHtml: workspaceConfig['projectFusion.generateHtml'],
                maxFileSizeKB: workspaceConfig['projectFusion.maxFileSizeKB'],
                extensionGroups: workspaceConfig['projectFusion.extensionGroups'],
                ignorePatterns: workspaceConfig['projectFusion.ignorePatterns'],
                fs: memoryFs
            };

            const result = await fusionAPI(options);
            
            expect(result.success).toBe(true);
        });
    });

    describe('Error Handling for VS Code', () => {
        it('should provide user-friendly error messages', async () => {
            const errors: string[] = [];
            
            const onDidFinish = (result: ProgrammaticFusionResult) => {
                if (!result.success) {
                    errors.push(result.message);
                }
            };
            
            // Test with empty file system (no files found)
            const emptyFs = new MemoryFileSystemAdapter();
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/empty',
                generateText: true,
                parsedFileExtensions: {
                    web: ['.ts', '.js'] // Only look for code files
                },
                fs: emptyFs,
                onDidFinish
            };

            const result = await fusionAPI(options);
            
            expect(result.success).toBe(false);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]).toContain('No files found');
        });
        
        it('should handle permission errors gracefully', async () => {
            // Mock file system that throws permission errors
            const errorFs = {
                ...memoryFs,
                readFile: vi.fn().mockRejectedValue(new Error('Permission denied'))
            };
            
            let errorResult: ProgrammaticFusionResult | null = null;
            const onDidFinish = (result: ProgrammaticFusionResult) => {
                errorResult = result;
            };
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/project',
                generateText: true,
                fs: errorFs as unknown as import('../src/adapters/file-system.js').FileSystemAdapter,
                onDidFinish
            };

            const result = await fusionAPI(options);
            
            expect(result.success).toBe(false);
            expect(errorResult).toBe(result);
            expect(result.error).toBeInstanceOf(Error);
        });
    });

    describe('Performance Monitoring for VS Code', () => {
        it('should provide timing information for performance monitoring', async () => {
            const timings: { step: string; timestamp: number }[] = [];
            
            const onProgress = (progress: FusionProgress) => {
                timings.push({
                    step: progress.step,
                    timestamp: Date.now()
                });
            };
            
            const startTime = Date.now();
            
            const options: ProgrammaticFusionOptions = {
                rootDirectory: '/project',
                generateText: true,
                fs: memoryFs,
                onProgress
            };

            const result = await fusionAPI(options);
            const endTime = Date.now();
            
            expect(result.success).toBe(true);
            expect(timings.length).toBeGreaterThan(0);
            
            // Verify timing progression
            for (let i = 1; i < timings.length; i++) {
                expect(timings[i]!.timestamp).toBeGreaterThanOrEqual(timings[i-1]!.timestamp);
            }
            
            const totalDuration = endTime - startTime;
            expect(totalDuration).toBeGreaterThan(0);
        });
    });
});