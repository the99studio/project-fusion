// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryFileSystemAdapter } from '../src/adapters/file-system.js';
import { OutputStrategyManager, TextOutputStrategy } from '../src/strategies/output-strategy.js';
import { createFilePath, type Config, type FileInfo, type OutputContext } from '../src/types.js';
import { defaultConfig } from '../src/utils.js';

describe('Output Size Limits', () => {
    let fs: MemoryFileSystemAdapter;
    let manager: OutputStrategyManager;
    let strategy: TextOutputStrategy;

    beforeEach(() => {
        fs = new MemoryFileSystemAdapter();
        manager = new OutputStrategyManager();
        strategy = new TextOutputStrategy();
    });

    it('should enforce maxOutputSizeMB limit in memory file system', async () => {
        const config: Config = {
            ...defaultConfig,
            maxOutputSizeMB: 1 // 1MB limit
        };

        // Create file content that exceeds 1MB
        const largeContent = 'x'.repeat((1024 * 1024) + 1000); // ~1MB + 1000 chars
        const fileInfo: FileInfo = {
            content: largeContent,
            relativePath: 'large-file.txt',
            path: createFilePath('/test/large-file.txt'),
            size: largeContent.length
        };

        const context: OutputContext = {
            projectTitle: 'Test Project',
            versionInfo: '',
            filesToProcess: [fileInfo],
            config,
            toolVersion: '1.0.0'
        };

        await expect(
            manager.generateOutput(strategy, context, fs)
        ).rejects.toThrow('Output size would exceed maximum limit of 1MB');
    });

    it('should allow content within size limit', async () => {
        const config: Config = {
            ...defaultConfig,
            maxOutputSizeMB: 2 // 2MB limit
        };

        const smallContent = 'small content for testing';
        const fileInfo: FileInfo = {
            content: smallContent,
            relativePath: 'small-file.txt',
            path: createFilePath('/test/small-file.txt'),
            size: smallContent.length
        };

        const context: OutputContext = {
            projectTitle: 'Test Project',
            versionInfo: '',
            filesToProcess: [fileInfo],
            config,
            toolVersion: '1.0.0'
        };

        const outputPath = await manager.generateOutput(strategy, context, fs);
        expect(outputPath).toBeDefined();
        
        const output = await fs.readFile(outputPath);
        expect(output).toContain(smallContent);
    });

    it('should enforce size limit across multiple files', async () => {
        const config: Config = {
            ...defaultConfig,
            maxOutputSizeMB: 1 // 1MB limit
        };

        // Create multiple files that together exceed 1MB
        const files: FileInfo[] = [];
        for (let i = 0; i < 5; i++) {
            const content = 'x'.repeat(250 * 1024); // 250KB each = 1.25MB total
            files.push({
                content,
                relativePath: `file-${i}.txt`,
                path: createFilePath(`/test/file-${i}.txt`),
                size: content.length
            });
        }

        const context: OutputContext = {
            projectTitle: 'Test Project',
            versionInfo: '',
            filesToProcess: files,
            config,
            toolVersion: '1.0.0'
        };

        await expect(
            manager.generateOutput(strategy, context, fs)
        ).rejects.toThrow('Output size would exceed maximum limit of 1MB');
    });

    it('should count header and footer in size calculation', async () => {
        const config: Config = {
            ...defaultConfig,
            maxOutputSizeMB: 1 // 1MB limit
        };

        // Create content that's just under 1MB but with header+footer goes over
        const content = 'x'.repeat((1024 * 1024) - 200); // ~1MB - 200 chars (smaller buffer to ensure header pushes over)
        const fileInfo: FileInfo = {
            content,
            relativePath: 'borderline-file.txt',
            path: createFilePath('/test/borderline-file.txt'),
            size: content.length
        };

        const context: OutputContext = {
            projectTitle: 'Test Project with a very long name that adds to the header size',
            versionInfo: ' v1.0.0-very-long-version-string-that-adds-bytes',
            filesToProcess: [fileInfo],
            config,
            toolVersion: '1.0.0'
        };

        await expect(
            manager.generateOutput(strategy, context, fs)
        ).rejects.toThrow('Output size would exceed maximum limit of 1MB');
    });

    it('should use default maxOutputSizeMB when not configured', async () => {
        const config: Config = {
            ...defaultConfig,
            maxOutputSizeMB: undefined as any
        };

        // Create content larger than default 50MB
        const largeContent = 'x'.repeat(51 * 1024 * 1024); // 51MB
        const fileInfo: FileInfo = {
            content: largeContent,
            relativePath: 'huge-file.txt',
            path: createFilePath('/test/huge-file.txt'),
            size: largeContent.length
        };

        const context: OutputContext = {
            projectTitle: 'Test Project',
            versionInfo: '',
            filesToProcess: [fileInfo],
            config,
            toolVersion: '1.0.0'
        };

        await expect(
            manager.generateOutput(strategy, context, fs)
        ).rejects.toThrow(/Output size would exceed maximum limit of 50MB/);
    });
});