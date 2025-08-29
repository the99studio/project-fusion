// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Snapshot tests for verifying MD/HTML format output
 */
import { existsSync } from 'node:fs';
import { writeFile, mkdir, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { processFusion } from '../src/fusion.js';
import { defaultConfig } from '../src/utils.js';
import { normalizeFilePaths } from './test-helpers.js';

describe('Format Snapshot Tests', () => {
    const testDir = join(process.cwd(), 'temp', 'snapshot-test');
    const originalCwd = process.cwd();

    beforeEach(async () => {
        // Clean up and create test directory
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
        await mkdir(testDir, { recursive: true });
        process.chdir(testDir);
    });

    afterEach(async () => {
        process.chdir(originalCwd);
        if (existsSync(testDir)) {
            await rm(testDir, { recursive: true, force: true });
        }
    });

    describe('Markdown Format Snapshots', () => {
        it('should generate consistent markdown format for JavaScript files', async () => {
            // Create sample JavaScript files
            await writeFile('index.js', `// Main application entry point
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});`);

            await writeFile('utils.js', `// Utility functions
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = { formatDate, capitalize };`);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateText: false,
                generateMarkdown: true,
                generateHtml: false,
                generatedFileName: 'test-fusion',
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            expect(result.success).toBe(true);

            const mdContent = await readFile('test-fusion.md', 'utf8');
            
            // Normalize timestamps and paths for consistent snapshots
            const normalizedMd = mdContent
                .replaceAll(/\*\*Generated:\*\* [^\n]+/g, '**Generated:** [TIMESTAMP]')
            
            const pathNormalizedMd = normalizeFilePaths(normalizedMd);
            
            // Test structure and content
            expect(pathNormalizedMd).toMatchSnapshot('javascript-files.md');
        });

        it('should generate consistent markdown format for TypeScript files', async () => {
            await writeFile('types.ts', `// Type definitions
export interface User {
    id: number;
    name: string;
    email: string;
    createdAt: Date;
}

export type UserRole = 'admin' | 'user' | 'moderator';

export interface CreateUserRequest {
    name: string;
    email: string;
    role?: UserRole;
}`);

            await writeFile('service.ts', `// User service
import { User, CreateUserRequest, UserRole } from './types.js';

export class UserService {
    private users: User[] = [];
    private nextId = 1;

    createUser(request: CreateUserRequest): User {
        const user: User = {
            id: this.nextId++,
            name: request.name,
            email: request.email,
            createdAt: new Date()
        };
        
        this.users.push(user);
        return user;
    }

    findUser(id: number): User | undefined {
        return this.users.find(user => user.id === id);
    }
}`);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateText: false,
                generateMarkdown: true,
                generateHtml: false,
                generatedFileName: 'typescript-fusion',
                parsedFileExtensions: {
                    web: ['.ts']
                }
            };

            const result = await processFusion(config);
            expect(result.success).toBe(true);

            const mdContent = await readFile('typescript-fusion.md', 'utf8');
            
            // Normalize timestamps and paths for consistent snapshots
            const normalizedMd = mdContent
                .replaceAll(/\*\*Generated:\*\* [^\n]+/g, '**Generated:** [TIMESTAMP]');
                
            const pathNormalizedMd = normalizeFilePaths(normalizedMd);
            expect(pathNormalizedMd).toMatchSnapshot('typescript-files.md');
        });

        it('should generate consistent markdown format for mixed file types', async () => {
            await writeFile('config.json', `{
  "name": "test-project",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "typescript": "^5.0.0"
  },
  "scripts": {
    "start": "node index.js",
    "build": "tsc"
  }
}`);

            await writeFile('README.md', `# Test Project

This is a test project for snapshot testing.

## Features

- **Fast**: Built with performance in mind
- **Secure**: Follows security best practices
- **Reliable**: Comprehensive test coverage

## Installation

\`\`\`bash
npm install
npm start
\`\`\`

## License

MIT License`);

            await writeFile('script.sh', `#!/bin/bash
# Deployment script

echo "Starting deployment..."

# Build the project
npm run build

# Run tests
npm test

# Deploy to production
echo "Deploying to production..."
rsync -av dist/ user@server:/var/www/app/

echo "Deployment complete!"`);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateText: false,
                generateMarkdown: true,
                generateHtml: false,
                generatedFileName: 'mixed-fusion',
                parsedFileExtensions: {
                    config: ['.json'],
                    doc: ['.md'],
                    scripts: ['.sh']
                }
            };

            const result = await processFusion(config);
            expect(result.success).toBe(true);

            const mdContent = await readFile('mixed-fusion.md', 'utf8');
            
            // Normalize timestamps and paths for consistent snapshots
            const normalizedMd = mdContent
                .replaceAll(/\*\*Generated:\*\* [^\n]+/g, '**Generated:** [TIMESTAMP]');
                
            const pathNormalizedMd = normalizeFilePaths(normalizedMd);
            expect(pathNormalizedMd).toMatchSnapshot('mixed-files.md');
        });
    });

    describe('HTML Format Snapshots', () => {
        it('should generate consistent HTML format for JavaScript files', async () => {
            await writeFile('app.js', `// Simple Express application
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
});`);

            await writeFile('helpers.js', `// Helper functions
const crypto = require('crypto');

/**
 * Generate a random ID
 * @param {number} length - Length of the ID
 * @returns {string} Random ID
 */
function generateId(length = 8) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    const regex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return regex.test(email);
}

module.exports = {
    generateId,
    isValidEmail
};`);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateText: false,
                generateMarkdown: false,
                generateHtml: true,
                generatedFileName: 'html-test',
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            expect(result.success).toBe(true);

            const htmlContent = await readFile('html-test.html', 'utf8');
            
            // Normalize timestamps and paths for consistent snapshots
            const normalizedHtml = htmlContent
                .replaceAll(/<p><strong>Generated:<\/strong> [^<]+<\/p>/g, '<p><strong>Generated:</strong> TIMESTAMP</p>');
            
            const pathNormalizedHtml = normalizeFilePaths(normalizedHtml);
            expect(pathNormalizedHtml).toMatchSnapshot('javascript-files.html');
        });

        it('should generate consistent HTML format with proper escaping', async () => {
            await writeFile('template.html', `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Template</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Test App</h1>
            <p>This is a <strong>test</strong> application with <em>HTML</em> content.</p>
        </div>
        
        <main>
            <h2>Features & Benefits</h2>
            <ul>
                <li>Fast & reliable</li>
                <li>Secure by design</li>
                <li>Easy to use</li>
            </ul>
            
            <p>Contact us at: <a href="mailto:test@example.com">test@example.com</a></p>
        </main>
    </div>
    
    <script>
        console.log('Page loaded successfully!');
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM ready');
        });
    </script>
</body>
</html>`);

            await writeFile('styles.css', `/* Global styles */
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Button styles */
.btn {
    display: inline-block;
    padding: 12px 24px;
    background: #007bff;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    transition: background 0.3s ease;
}

.btn:hover {
    background: #0056b3;
}

/* Responsive design */
@media (max-width: 768px) {
    .container {
        padding: 0 10px;
    }
    
    .btn {
        display: block;
        text-align: center;
        margin: 10px 0;
    }
}`);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateText: false,
                generateMarkdown: false,
                generateHtml: true,
                generatedFileName: 'html-escape-test',
                parsedFileExtensions: {
                    web: ['.html', '.css']
                }
            };

            const result = await processFusion(config);
            expect(result.success).toBe(true);

            const htmlContent = await readFile('html-escape-test.html', 'utf8');
            
            // Normalize timestamps and paths
            const normalizedHtml = htmlContent
                .replaceAll(/<p><strong>Generated:<\/strong> [^<]+<\/p>/g, '<p><strong>Generated:</strong> TIMESTAMP</p>');
            
            const pathNormalizedHtml = normalizeFilePaths(normalizedHtml);
            expect(pathNormalizedHtml).toMatchSnapshot('html-with-escaping.html');
        });

        it('should generate HTML with proper table of contents structure', async () => {
            await mkdir('api', { recursive: true });
            await mkdir('components', { recursive: true });
            await mkdir('utils', { recursive: true });
            
            await writeFile('api/users.js', 'const users = [];');
            await writeFile('api/posts.js', 'const posts = [];');
            await writeFile('components/Header.js', 'export default function Header() {}');
            await writeFile('components/Footer.js', 'export default function Footer() {}');
            await writeFile('utils/database.js', 'class Database {}');

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateText: false,
                generateMarkdown: false,
                generateHtml: true,
                generatedFileName: 'toc-test',
                parsedFileExtensions: {
                    web: ['.js']
                }
            };

            const result = await processFusion(config);
            expect(result.success).toBe(true);

            const htmlContent = await readFile('toc-test.html', 'utf8');
            
            // Check TOC structure with simplified HTML format
            expect(htmlContent).toContain('<h2>Table of Contents</h2>');
            expect(htmlContent).toContain('<ul>');
            expect(htmlContent).toContain('href="#apiusersjs"');
            expect(htmlContent).toContain('href="#componentsheaderjs"');
            
            // Normalize timestamps and paths for consistent snapshots
            const normalizedHtml = htmlContent
                .replaceAll(/<p><strong>Generated:<\/strong> [^<]+<\/p>/g, '<p><strong>Generated:</strong> TIMESTAMP</p>');
            
            const pathNormalizedHtml = normalizeFilePaths(normalizedHtml);
            expect(pathNormalizedHtml).toMatchSnapshot('html-with-toc.html');
        });
    });

    describe('Cross-Format Consistency', () => {
        it('should maintain content consistency between markdown and HTML formats', async () => {
            await writeFile('example.ts', `// Example TypeScript module
export interface Config {
    apiUrl: string;
    timeout: number;
    retries: number;
}

export class ApiClient {
    constructor(private config: Config) {}
    
    async get<T>(path: string): Promise<T> {
        const response = await fetch(\`\${this.config.apiUrl}\${path}\`);
        if (!response.ok) {
            throw new Error(\`HTTP \${response.status}\`);
        }
        return response.json();
    }
}`);

            const config = {
                ...defaultConfig,
                rootDirectory: testDir,
                generateText: false,
                generateMarkdown: true,
                generateHtml: true,
                generatedFileName: 'consistency-test',
                parsedFileExtensions: {
                    web: ['.ts']
                }
            };

            const result = await processFusion(config);
            expect(result.success).toBe(true);

            const mdContent = await readFile('consistency-test.md', 'utf8');
            const htmlContent = await readFile('consistency-test.html', 'utf8');

            // Both should contain the same source code
            expect(mdContent).toContain('export interface Config');
            expect(htmlContent).toContain('export interface Config');
            
            expect(mdContent).toContain('export class ApiClient');
            expect(htmlContent).toContain('export class ApiClient');
            
            // Both should reference the same file
            expect(mdContent).toContain('example.ts');
            expect(htmlContent).toContain('example.ts');
            
            // Both should have proper structure
            expect(mdContent).toContain('## example.ts');
            expect(htmlContent).toContain('<h2 id="examplets">example.ts</h2>');
        });
    });
});