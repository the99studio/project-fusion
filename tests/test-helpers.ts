// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Cross-platform test helpers
 */
import { existsSync } from 'node:fs';
import { symlink, writeFile, rm, mkdir } from 'node:fs/promises';
import os from 'node:os';
import { join } from 'node:path';

/**
 * Check if the current platform supports symlinks without admin privileges
 * On Windows, this requires Developer Mode or admin privileges
 */
export async function canCreateSymlinks(): Promise<boolean> {
    if (os.platform() !== 'win32') {
        return true; // Unix-like systems generally support symlinks
    }

    // On Windows, try to create a symlink to test permissions
    const tempDir = join(os.tmpdir(), `symlink-test-${Date.now()}`);
    
    try {
        await mkdir(tempDir, { recursive: true });
        
        const targetFile = join(tempDir, 'target.txt');
        const symlinkFile = join(tempDir, 'symlink.txt');
        
        await writeFile(targetFile, 'test content');
        await symlink(targetFile, symlinkFile);
        
        // If we get here without error, symlinks work
        await rm(tempDir, { recursive: true, force: true });
        return true;
        
    } catch (error: any) {
        // Clean up on error
        if (existsSync(tempDir)) {
            await rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
        
        // Check for Windows permission errors
        if (error.code === 'EPERM' || error.code === 'ENOTSUP') {
            return false;
        }
        
        // Other errors might indicate a real problem
        throw error;
    }
}

/**
 * Skip test if symlinks cannot be created on this platform
 * Use this with vitest's skipIf function
 */
export const skipIfNoSymlinks = async (): Promise<boolean> => {
    const canCreate = await canCreateSymlinks();
    return !canCreate;
};

/**
 * Normalize path separators for cross-platform snapshot testing
 * Converts all backslashes to forward slashes for consistent snapshots
 */
export function normalizePath(content: string): string {
    return content.replaceAll('\\', '/');
}

/**
 * Normalize file paths in content for snapshot consistency
 * Handles both absolute and relative paths
 */
export function normalizeFilePaths(content: string): string {
    // Convert Windows drive letters and paths to forward slashes
    return content
        .replaceAll('\\', '/')
        // Normalize Windows drive letter format
        .replaceAll(/([C-Z]):\//g, '/$1:/')
        // Remove specific temp directory paths for consistency
        .replaceAll(/\/temp\/[^\s)]+/g, '/temp/test-dir')
        // Normalize HTML entity encoded backslashes (&#47; is /, &#x2F; is /)
        .replaceAll('&#92;', '&#47;')
        .replaceAll('&#x5C;', '&#x2F;');
}

/**
 * Skip test conditionally with a descriptive message
 */
export function skipIfCondition(condition: boolean, reason: string): boolean {
    if (condition) {
        console.log(`⏭️  Skipping test: ${reason}`);
    }
    return condition;
}

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
    return os.platform() === 'win32';
}

/**
 * Get a cross-platform test directory path
 */
export function getTestDir(name: string): string {
    return join(process.cwd(), 'temp', name);
}

/**
 * Normalize error messages for cross-platform testing
 * Different platforms may have slightly different error messages
 */
export function normalizeErrorMessage(message: string): string {
    return message
        .toLowerCase()
        // Normalize different failure terms
        .replaceAll(/failed|error|could not|unable to/gi, 'failed')
        // Remove platform-specific error codes
        .replaceAll(/\s+\([^)]+\)/g, '')
        .trim();
}