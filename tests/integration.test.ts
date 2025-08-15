import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { processFusion } from '../src/fusion.js';
import { defaultConfig } from '../src/utils.js';
import { Config } from '../src/types.js';

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
        parsing: {
          rootDirectory: '.',
          parseSubDirectories: false
        },
        parsedFileExtensions: {
          web: ['.js', '.ts']
        }
      };

      const result = await processFusion(testConfig);

      expect(result.success).toBe(true);
      expect(result.message).toContain('2 files processed');
      expect(result.fusionFilePath).toBeDefined();
      
      // Check if fusion files were created
      expect(await fs.pathExists(result.fusionFilePath!)).toBe(true);
      expect(await fs.pathExists(result.fusionFilePath!.replace('.txt', '.md'))).toBe(true);
      
      // Check content of fusion file
      const fusionContent = await fs.readFile(result.fusionFilePath!, 'utf8');
      expect(fusionContent).toContain('test.js');
      expect(fusionContent).toContain('test.ts');
      expect(fusionContent).toContain('console.log("Hello World");');
      expect(fusionContent).toContain('const message: string = "TypeScript";');
      expect(fusionContent).not.toContain('Dockerfile'); // Not in web extensions
    });

    it('should handle empty directory gracefully', async () => {
      const testConfig: Config = {
        ...defaultConfig,
        parsing: {
          rootDirectory: '.',
          parseSubDirectories: false
        }
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
        parsing: {
          rootDirectory: '.',
          parseSubDirectories: false
        },
        parsedFileExtensions: {
          web: ['.js']
        },
        ignorePatterns: ['ignored.js']
      };

      const result = await processFusion(testConfig);

      expect(result.success).toBe(true);
      expect(result.message).toContain('1 files processed'); // Only test.js
      
      const fusionContent = await fs.readFile(result.fusionFilePath!, 'utf8');
      expect(fusionContent).toContain('test.js');
      expect(fusionContent).not.toContain('ignored.js');
    });
  });
});