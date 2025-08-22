// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * File system abstraction layer for I/O operations
 */
import path from 'node:path';
import fs from 'fs-extra';
import { glob } from 'glob';
import { Minimatch } from 'minimatch';
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
        // Apply secure defaults: don't follow symlinks and only return files
        const secureOptions = {
            nodir: true,
            follow: false,
            ...options
        };
        const filePaths = await glob(pattern, secureOptions);
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
        // Try exact match first
        let content = this.files.get(filePath);
        
        // If not found, try resolved absolute path
        if (content === undefined) {
            const resolved = path.resolve(filePath);
            content = this.files.get(resolved);
        }
        
        // If still not found, try basename (for MemoryFS compatibility)
        if (content === undefined) {
            const basename = path.basename(filePath);
            content = this.files.get(basename);
        }
        
        if (content === undefined) {
            return Promise.reject(new Error(`File not found: ${filePath}`));
        }
        return Promise.resolve(content);
    }

    writeFile(filePath: FilePath, content: string): Promise<void> {
        const dir = path.dirname(filePath);
        this.directories.add(dir);
        
        // Store the file using the exact path provided
        this.files.set(filePath, content);
        
        // Also store using resolved absolute path for compatibility
        const resolved = path.resolve(filePath);
        if (resolved !== filePath) {
            this.files.set(resolved, content);
        }
        
        return Promise.resolve();
    }

    writeFileSync(filePath: string, content: string): void {
        const dir = path.dirname(filePath);
        this.directories.add(dir);
        
        // Store the file using the exact path provided
        this.files.set(filePath, content);
        
        // Also store using resolved absolute path for compatibility
        const resolved = path.resolve(filePath);
        if (resolved !== filePath) {
            this.files.set(resolved, content);
        }
    }

    async appendFile(filePath: FilePath, content: string): Promise<void> {
        const existing = this.files.get(filePath) ?? '';
        await this.writeFile(filePath, existing + content);
    }

    stat(filePath: FilePath): Promise<FileSystemStats> {
        // Try exact match first
        if (this.files.has(filePath)) {
            const content = this.files.get(filePath)!;
            return Promise.resolve({
                size: Buffer.byteLength(content, 'utf8'),
                isDirectory: false,
                isFile: true,
                isSymbolicLink: false
            });
        }
        
        // Try resolved absolute path
        const resolved = path.resolve(filePath);
        if (this.files.has(resolved)) {
            const content = this.files.get(resolved)!;
            return Promise.resolve({
                size: Buffer.byteLength(content, 'utf8'),
                isDirectory: false,
                isFile: true,
                isSymbolicLink: false
            });
        }
        
        // Try basename match for MemoryFS compatibility
        const basename = path.basename(filePath);
        if (this.files.has(basename)) {
            const content = this.files.get(basename)!;
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
        const hasExact = this.files.has(filePath) || this.directories.has(filePath);
        if (hasExact) return Promise.resolve(true);
        
        // Try resolved absolute path
        const resolved = path.resolve(filePath);
        if (this.files.has(resolved) || this.directories.has(resolved)) {
            return Promise.resolve(true);
        }
        
        // Try basename for MemoryFS compatibility
        const basename = path.basename(filePath);
        return Promise.resolve(this.files.has(basename));
    }

    ensureDir(dirPath: string): Promise<void> {
        this.directories.add(dirPath);
        return Promise.resolve();
    }

    glob(pattern: string, options?: { nodir?: boolean; follow?: boolean }): Promise<FilePath[]> {
        const allPaths = [...this.files.keys(), ...this.directories.keys()];
        let filteredPaths = allPaths;
        
        // Apply directory filtering first
        if (options?.nodir) {
            filteredPaths = filteredPaths.filter(p => this.files.has(p));
        }
        
        // Handle extension matching for processFusion patterns like "/path/**/*@(.js|.ts)"
        const extensionMatch = pattern.match(/@\(([^)]+)\)/);
        if (extensionMatch?.[1]) {
            const extensions = extensionMatch[1].split('|').map(ext => ext.trim());
            filteredPaths = filteredPaths.filter(filePath => {
                return extensions.some(ext => filePath.endsWith(ext));
            });
        } else if (pattern === '*') {
            // Special case for simple '*' pattern - return all paths (already filtered by nodir above)
            // No additional filtering needed
        } else {
            // Use minimatch for other patterns
            const mm = new Minimatch(pattern, { nocase: false, dot: true });
            filteredPaths = filteredPaths.filter(p => mm.match(p));
        }
        
        return Promise.resolve(filteredPaths.map(createFilePath));
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

    // Debug method for tests
    getAllFileKeys(): string[] {
        return [...this.files.keys()];
    }

    getFiles(): Map<string, string> {
        return new Map(this.files);
    }

    clear(): void {
        this.files.clear();
        this.directories.clear();
    }
}