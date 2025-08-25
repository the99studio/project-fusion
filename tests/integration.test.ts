import path from 'node:path';
import fs from 'fs-extra';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { processFusion } from '../src/fusion.js';
import type { Config } from '../src/types.js';
import { defaultConfig } from '../src/utils.js';

describe('integration', () => {
  const testDir = path.join(process.cwd(), 'temp', 'test-integration');
  const originalCwd = process.cwd();

  beforeEach(async () => {
    // Clean up and create test directory
    await fs.remove(testDir);
    await fs.ensureDir(testDir);
    
    // Change to test directory
    process.chdir(testDir);
  });

  afterEach(async () => {
    // Restore original directory
    process.chdir(originalCwd);
    
    // Clean up test directory
    await fs.remove(testDir);
  });

  describe('processFusion', () => {
    it('should process fusion successfully with test files', async () => {
      // Create test files
      await fs.writeFile('test.js', 'console.log("Hello World");');
      await fs.writeFile('test.ts', 'const message: string = "TypeScript";');
      await fs.writeFile('Dockerfile', 'FROM node:18\nCOPY . .\nRUN npm install');
      
      // Create config for test
      const testConfig: Config = {
        ...defaultConfig,
        rootDirectory: '.',
        parseSubDirectories: false,
        parsedFileExtensions: {
          web: ['.js', '.ts']
        }
      };

      const result = await processFusion(testConfig);

      expect(result.success).toBe(true);
      expect(result.message).toContain('2 files processed');
      
      if (result.success) {
        expect(result.fusionFilePath).toBeDefined();
        
        // Check if fusion files were created
        expect(await fs.pathExists(result.fusionFilePath as string)).toBe(true);
        expect(await fs.pathExists((result.fusionFilePath as string).replace('.txt', '.md'))).toBe(true);
        
        // Check content of fusion file
        const fusionContent = await fs.readFile(result.fusionFilePath as string, 'utf8');
        expect(fusionContent).toContain('test.js');
        expect(fusionContent).toContain('test.ts');
        expect(fusionContent).toContain('console.log("Hello World");');
        expect(fusionContent).toContain('const message: string = "TypeScript";');
        expect(fusionContent).not.toContain('Dockerfile'); // Not in web extensions
      }
    });

    it('should handle empty directory gracefully', async () => {
      const testConfig: Config = {
        ...defaultConfig,
        rootDirectory: '.',
        parseSubDirectories: false
      };

      const result = await processFusion(testConfig);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No files found to process');
    });

    it('should respect ignore patterns', async () => {
      // Create test files
      await fs.writeFile('test.js', 'console.log("Hello World");');
      await fs.writeFile('ignored.js', 'console.log("Should be ignored");');
      
      const testConfig: Config = {
        ...defaultConfig,
        rootDirectory: '.',
        parseSubDirectories: false,
        parsedFileExtensions: {
          web: ['.js']
        },
        ignorePatterns: ['ignored.js']
      };

      const result = await processFusion(testConfig);

      expect(result.success).toBe(true);
      expect(result.message).toContain('1 files processed'); // Only test.js
      
      if (result.success) {
        const fusionContent = await fs.readFile(result.fusionFilePath as string, 'utf8');
        expect(fusionContent).toContain('test.js');
        expect(fusionContent).not.toContain('ignored.js');
      }
    });

    it('should filter files by extensions correctly', async () => {
      // Create test files with different extensions
      await fs.writeFile('app.js', 'console.log("JavaScript");');
      await fs.writeFile('app.ts', 'const app: string = "TypeScript";');
      await fs.writeFile('app.py', 'print("Python")');
      await fs.writeFile('config.json', '{"test": true}');
      
      // Test web extensions only
      const webConfig: Config = {
        ...defaultConfig,
        rootDirectory: '.',
        parseSubDirectories: false,
        parsedFileExtensions: {
          web: ['.js', '.ts']
        }
      };

      const webResult = await processFusion(webConfig);
      expect(webResult.success).toBe(true);
      expect(webResult.message).toContain('2 files processed');
      
      if (webResult.success) {
        const webContent = await fs.readFile(webResult.fusionFilePath, 'utf8');
        expect(webContent).toContain('app.js');
        expect(webContent).toContain('app.ts');
        expect(webContent).not.toContain('app.py');
        expect(webContent).not.toContain('config.json');
      }

      // Test backend extensions only
      const backendConfig: Config = {
        ...defaultConfig,
        rootDirectory: '.',
        parseSubDirectories: false,
        parsedFileExtensions: {
          backend: ['.py']
        }
      };

      const backendResult = await processFusion(backendConfig);
      expect(backendResult.success).toBe(true);
      expect(backendResult.message).toContain('1 files processed');
      
      if (backendResult.success) {
        const backendContent = await fs.readFile(backendResult.fusionFilePath, 'utf8');
        expect(backendContent).toContain('app.py');
        expect(backendContent).not.toContain('app.js');
        expect(backendContent).not.toContain('app.ts');
      }
    });

    it('should respect .gitignore patterns', async () => {
      // Create test files
      await fs.writeFile('app.js', 'console.log("main app");');
      await fs.writeFile('build.js', 'console.log("build file");');
      await fs.ensureDir('node_modules');
      await fs.writeFile('node_modules/lib.js', 'console.log("dependency");');
      await fs.ensureDir('dist');
      await fs.writeFile('dist/output.js', 'console.log("compiled");');
      
      // Create .gitignore
      await fs.writeFile('.gitignore', 'node_modules/\ndist/\nbuild.js');
      
      const testConfig: Config = {
        ...defaultConfig,
        rootDirectory: '.',
        parseSubDirectories: true,
        useGitIgnoreForExcludes: true,
        parsedFileExtensions: {
          web: ['.js']
        }
      };

      const result = await processFusion(testConfig);
      expect(result.success).toBe(true);
      expect(result.message).toContain('1 files processed'); // Only app.js
      
      if (result.success) {
        const fusionContent = await fs.readFile(result.fusionFilePath as string, 'utf8');
        expect(fusionContent).toContain('app.js');
        expect(fusionContent).not.toContain('build.js');
        expect(fusionContent).not.toContain('node_modules');
        expect(fusionContent).not.toContain('dist');
      }
    });

    it('should skip files larger than maxFileSizeKB', async () => {
      // Create small file
      await fs.writeFile('small.js', 'console.log("small");');
      
      // Create large file (2KB)
      const largeContent = `console.log("large");${  'x'.repeat(2000)}`;
      await fs.writeFile('large.js', largeContent);
      
      const testConfig: Config = {
        ...defaultConfig,
        rootDirectory: '.',
        parseSubDirectories: false,
        maxFileSizeKB: 1, // 1KB limit
        parsedFileExtensions: {
          web: ['.js']
        }
      };

      const result = await processFusion(testConfig);
      expect(result.success).toBe(true);
      expect(result.message).toContain('1 files processed'); // Only small.js
      
      if (result.success) {
        const fusionContent = await fs.readFile(result.fusionFilePath as string, 'utf8');
        expect(fusionContent).toContain('small.js');
        expect(fusionContent).not.toContain('large.js');
      }
    });

    it('should respect non-recursive directory parsing', async () => {
      // Create files in root
      await fs.writeFile('root.js', 'console.log("root");');
      
      // Create files in subdirectory
      await fs.ensureDir('sub');
      await fs.writeFile('sub/nested.js', 'console.log("nested");');
      
      const testConfig: Config = {
        ...defaultConfig,
        rootDirectory: '.',
        parseSubDirectories: false, // Non-recursive
        parsedFileExtensions: {
          web: ['.js']
        }
      };

      const result = await processFusion(testConfig);
      expect(result.success).toBe(true);
      expect(result.message).toContain('1 files processed'); // Only root.js
      
      if (result.success) {
        const fusionContent = await fs.readFile(result.fusionFilePath as string, 'utf8');
        expect(fusionContent).toContain('root.js');
        expect(fusionContent).not.toContain('nested.js');
      }
    });

    it('should generate HTML output when enabled', async () => {
      // Create test files
      await fs.writeFile('test.js', 'console.log("Hello HTML");');
      
      const testConfig: Config = {
        ...defaultConfig,
        rootDirectory: '.',
        parseSubDirectories: false,
        generateHtml: true,
        parsedFileExtensions: {
          web: ['.js']
        }
      };

      const result = await processFusion(testConfig);
      expect(result.success).toBe(true);
      
      if (result.success) {
        // Check HTML file was created
        const htmlPath = (result.fusionFilePath as string).replace('.txt', '.html');
        expect(await fs.pathExists(htmlPath)).toBe(true);
        
        const htmlContent = await fs.readFile(htmlPath, 'utf8');
        expect(htmlContent).toContain('<!DOCTYPE html>');
        expect(htmlContent).toContain('<html lang="en">');
        expect(htmlContent).toContain('test.js');
        expect(htmlContent).toContain('console.log(&quot;Hello HTML&quot;);');
      }
    });
  });
});