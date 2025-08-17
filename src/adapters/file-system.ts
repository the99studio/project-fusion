// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * File system abstraction layer for I/O operations
 */
import path from 'node:path';
import fs from 'fs-extra';
import { glob } from 'glob';
import { type FilePath, createFilePath } from '../types.js';

export interface FileSystemStats {
    size: number;
    isDirectory: boolean;
    isFile: boolean;
    isSymbolicLink: boolean;
}

export interface FileSystemAdapter {
    readFile(filePath: FilePath): Promise<string>;
    writeFile(filePath: FilePath, content: string): Promise<void>;
    appendFile(filePath: FilePath, content: string): Promise<void>;
    stat(filePath: FilePath): Promise<FileSystemStats>;
    lstat(filePath: FilePath): Promise<FileSystemStats>;
    exists(filePath: FilePath): Promise<boolean>;
    ensureDir(dirPath: string): Promise<void>;
    glob(pattern: string, options?: { nodir?: boolean; follow?: boolean }): Promise<FilePath[]>;
    readBuffer(filePath: FilePath, options?: { encoding: null }): Promise<Buffer>;
}

export class DefaultFileSystemAdapter implements FileSystemAdapter {
    async readFile(filePath: FilePath): Promise<string> {
        return await fs.readFile(filePath, 'utf8');
    }

    async writeFile(filePath: FilePath, content: string): Promise<void> {
        await fs.writeFile(filePath, content);
    }

    async appendFile(filePath: FilePath, content: string): Promise<void> {
        await fs.appendFile(filePath, content);
    }

    async stat(filePath: FilePath): Promise<FileSystemStats> {
        const stats = await fs.stat(filePath);
        return {
            size: stats.size,
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            isSymbolicLink: stats.isSymbolicLink()
        };
    }

    async lstat(filePath: FilePath): Promise<FileSystemStats> {
        const stats = await fs.lstat(filePath);
        return {
            size: stats.size,
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            isSymbolicLink: stats.isSymbolicLink()
        };
    }

    async exists(filePath: FilePath): Promise<boolean> {
        return await fs.pathExists(filePath);
    }

    async ensureDir(dirPath: string): Promise<void> {
        await fs.ensureDir(dirPath);
    }

    async glob(pattern: string, options?: { nodir?: boolean; follow?: boolean }): Promise<FilePath[]> {
        const filePaths = await glob(pattern, options);
        return filePaths.map(createFilePath);
    }

    async readBuffer(filePath: FilePath, options?: { encoding: null }): Promise<Buffer> {
        return await fs.readFile(filePath, options);
    }
}

export class MemoryFileSystemAdapter implements FileSystemAdapter {
    private readonly files: Map<string, string> = new Map();
    private readonly directories: Set<string> = new Set();

    readFile(filePath: FilePath): Promise<string> {
        const content = this.files.get(filePath);
        if (content === undefined) {
            return Promise.reject(new Error(`File not found: ${filePath}`));
        }
        return Promise.resolve(content);
    }

    writeFile(filePath: FilePath, content: string): Promise<void> {
        const dir = path.dirname(filePath);
        this.directories.add(dir);
        this.files.set(filePath, content);
        return Promise.resolve();
    }

    async appendFile(filePath: FilePath, content: string): Promise<void> {
        const existing = this.files.get(filePath) ?? '';
        await this.writeFile(filePath, existing + content);
    }

    stat(filePath: FilePath): Promise<FileSystemStats> {
        if (this.files.has(filePath)) {
            const content = this.files.get(filePath)!;
            return Promise.resolve({
                size: Buffer.byteLength(content, 'utf8'),
                isDirectory: false,
                isFile: true,
                isSymbolicLink: false
            });
        }
        if (this.directories.has(filePath)) {
            return Promise.resolve({
                size: 0,
                isDirectory: true,
                isFile: false,
                isSymbolicLink: false
            });
        }
        return Promise.reject(new Error(`File not found: ${filePath}`));
    }

    async lstat(filePath: FilePath): Promise<FileSystemStats> {
        return this.stat(filePath);
    }

    exists(filePath: FilePath): Promise<boolean> {
        return Promise.resolve(this.files.has(filePath) || this.directories.has(filePath));
    }

    ensureDir(dirPath: string): Promise<void> {
        this.directories.add(dirPath);
        return Promise.resolve();
    }

    glob(pattern: string, options?: { nodir?: boolean; follow?: boolean }): Promise<FilePath[]> {
        const allPaths = [...this.files.keys(), ...this.directories.keys()];
        const result = allPaths
            .filter(p => {
                if (options?.nodir && this.directories.has(p)) return false;
                return true;
            })
            .map(createFilePath);
        return Promise.resolve(result);
    }

    async readBuffer(filePath: FilePath): Promise<Buffer> {
        const content = await this.readFile(filePath);
        return Buffer.from(content, 'utf8');
    }

    addFile(filePath: string, content: string): void {
        this.files.set(filePath, content);
        const dir = path.dirname(filePath);
        this.ensureParentDirectory(dir);
        this.directories.add(dir);
    }

    private ensureParentDirectory(dirPath: string): void {
        const parent = path.dirname(dirPath);
        if (parent && parent !== dirPath && parent !== '.') {
            this.ensureParentDirectory(parent);
            this.directories.add(parent);
        }
    }

    getFiles(): Map<string, string> {
        return new Map(this.files);
    }

    clear(): void {
        this.files.clear();
        this.directories.clear();
    }
}