// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Version utility with fallback for package.json import
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let cachedVersion: string | null = null;

/**
 * Clear cached version - for testing purposes only
 * @internal
 */
export function clearVersionCache(): void {
    cachedVersion = null;
}

/**
 * Initialize version synchronously at module load
 */
function initializeVersion(): string {
    if (cachedVersion) {
        return cachedVersion;
    }

    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const packagePath = path.resolve(__dirname, '..', 'package.json');
        
        const packageContent = readFileSync(packagePath, 'utf-8');
        const packageJson = JSON.parse(packageContent) as { version?: unknown };
        
        if (!packageJson.version || typeof packageJson.version !== 'string') {
            throw new Error('Invalid version field in package.json');
        }
        
        cachedVersion = packageJson.version;
        return cachedVersion;
    } catch {
        cachedVersion = '1.0.0-unknown';
        return cachedVersion;
    }
}

/**
 * Get package version with fallback mechanism
 * First tries modern JSON import, falls back to fs.readFile if that fails
 */
export async function getVersion(): Promise<string> {
    if (cachedVersion) {
        return cachedVersion;
    }

    try {
        const pkg = await import('../package.json', { with: { type: 'json' } });
        cachedVersion = pkg.default.version;
        return cachedVersion;
    } catch {
        return initializeVersion();
    }
}

/**
 * Synchronous version getter
 */
export function getVersionSync(): string {
    return cachedVersion ?? initializeVersion();
}

// Initialize version at module load time
initializeVersion();