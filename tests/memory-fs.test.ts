/**
 * Tests for MemoryFileSystemAdapter
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryFileSystemAdapter } from '../src/adapters/file-system.js';
import { createFilePath } from '../src/types.js';

describe('MemoryFileSystemAdapter', () => {
    let fs: MemoryFileSystemAdapter;

    beforeEach(() => {
        fs = new MemoryFileSystemAdapter();
    });

    describe('File Operations', () => {
        it('should write and read files', async () => {
            const filePath = createFilePath('/test/file.txt');
            const content = 'Hello, World!';

            await fs.writeFile(filePath, content);
            const result = await fs.readFile(filePath);

            expect(result).toBe(content);
        });

        it('should append to files', async () => {
            const filePath = createFilePath('/test/file.txt');
            
            await fs.writeFile(filePath, 'Hello, ');
            await fs.appendFile(filePath, 'World!');
            const result = await fs.readFile(filePath);

            expect(result).toBe('Hello, World!');
        });

        it('should append to non-existent files', async () => {
            const filePath = createFilePath('/new/file.txt');
            
            await fs.appendFile(filePath, 'New content');
            const result = await fs.readFile(filePath);

            expect(result).toBe('New content');
        });

        it('should throw error when reading non-existent file', async () => {
            const filePath = createFilePath('/missing/file.txt');
            
            await expect(fs.readFile(filePath)).rejects.toThrow('File not found');
        });

        it('should read files as buffer', async () => {
            const filePath = createFilePath('/test/file.txt');
            const content = 'Hello, Buffer!';

            await fs.writeFile(filePath, content);
            const buffer = await fs.readBuffer(filePath);

            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.toString('utf8')).toBe(content);
        });
    });

    describe('File Stats', () => {
        it('should return stats for files', async () => {
            const filePath = createFilePath('/test/file.txt');
            const content = 'Hello, World!';

            await fs.writeFile(filePath, content);
            const stats = await fs.stat(filePath);

            expect(stats.isFile).toBe(true);
            expect(stats.isDirectory).toBe(false);
            expect(stats.isSymbolicLink).toBe(false);
            expect(stats.size).toBe(Buffer.byteLength(content, 'utf8'));
        });

        it('should return stats for directories', async () => {
            const dirPath = createFilePath('/test/dir');
            
            await fs.ensureDir(dirPath);
            const stats = await fs.stat(dirPath);

            expect(stats.isFile).toBe(false);
            expect(stats.isDirectory).toBe(true);
            expect(stats.isSymbolicLink).toBe(false);
            expect(stats.size).toBe(0);
        });

        it('should throw error for non-existent paths', async () => {
            const filePath = createFilePath('/missing/file.txt');
            
            await expect(fs.stat(filePath)).rejects.toThrow('File not found');
        });

        it('should support lstat (same as stat for memory fs)', async () => {
            const filePath = createFilePath('/test/file.txt');
            
            await fs.writeFile(filePath, 'content');
            const stats = await fs.lstat(filePath);

            expect(stats.isFile).toBe(true);
            expect(stats.isSymbolicLink).toBe(false);
        });
    });

    describe('Directory Operations', () => {
        it('should ensure directories exist', async () => {
            const dirPath = '/test/nested/deep';
            
            await fs.ensureDir(dirPath);
            
            expect(await fs.exists(createFilePath(dirPath))).toBe(true);
        });

        it('should check file existence', async () => {
            const filePath = createFilePath('/test/file.txt');
            
            expect(await fs.exists(filePath)).toBe(false);
            
            await fs.writeFile(filePath, 'content');
            expect(await fs.exists(filePath)).toBe(true);
        });

        it('should check directory existence', async () => {
            const dirPath = createFilePath('/test/dir');
            
            expect(await fs.exists(dirPath)).toBe(false);
            
            await fs.ensureDir(dirPath);
            expect(await fs.exists(dirPath)).toBe(true);
        });
    });

    describe('Glob Operations', () => {
        beforeEach(async () => {
            await fs.writeFile(createFilePath('/test/file1.js'), 'content1');
            await fs.writeFile(createFilePath('/test/file2.ts'), 'content2');
            await fs.writeFile(createFilePath('/test/nested/file3.js'), 'content3');
            await fs.ensureDir('/test/empty-dir');
        });

        it('should glob all files and directories', async () => {
            const results = await fs.glob('*');
            
            expect(results.length).toBeGreaterThan(0);
            expect(results.map(p => p.toString())).toContain('/test/file1.js');
            expect(results.map(p => p.toString())).toContain('/test/file2.ts');
        });

        it('should glob files only when nodir option is set', async () => {
            const results = await fs.glob('*', { nodir: true });
            
            const paths = results.map(p => p.toString());
            expect(paths).toContain('/test/file1.js');
            expect(paths).not.toContain('/test/empty-dir');
        });

        it('should glob with follow option (no effect in memory fs)', async () => {
            const results = await fs.glob('*', { follow: true });
            
            expect(results.length).toBeGreaterThan(0);
        });
    });

    describe('Helper Methods', () => {
        it('should add files with addFile helper', async () => {
            fs.addFile('/test/file.txt', 'content');
            
            await expect(fs.readFile(createFilePath('/test/file.txt'))).resolves.toBe('content');
        });

        it('should get all files with getFiles', async () => {
            await fs.writeFile(createFilePath('/file1.txt'), 'content1');
            await fs.writeFile(createFilePath('/file2.txt'), 'content2');
            
            const files = fs.getFiles();
            
            expect(files.size).toBe(2);
            expect(files.get('/file1.txt')).toBe('content1');
            expect(files.get('/file2.txt')).toBe('content2');
        });

        it('should clear all files and directories', async () => {
            await fs.writeFile(createFilePath('/file.txt'), 'content');
            await fs.ensureDir('/dir');
            
            expect(await fs.exists(createFilePath('/file.txt'))).toBe(true);
            expect(await fs.exists(createFilePath('/dir'))).toBe(true);
            
            fs.clear();
            
            expect(await fs.exists(createFilePath('/file.txt'))).toBe(false);
            expect(await fs.exists(createFilePath('/dir'))).toBe(false);
        });
    });

    describe('Auto Directory Creation', () => {
        it('should auto-create parent directories when writing files', async () => {
            const filePath = createFilePath('/deep/nested/path/file.txt');
            
            await fs.writeFile(filePath, 'content');
            
            expect(await fs.exists(createFilePath('/deep/nested/path'))).toBe(true);
            expect(await fs.readFile(filePath)).toBe('content');
        });
    });
});