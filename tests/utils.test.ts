import path from 'node:path';
import fs from 'fs-extra';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  getMarkdownLanguage, 
  getExtensionsFromGroups, 
  formatTimestamp,
  formatLocalTimestamp,
  loadConfig,
  writeLog,
  ensureDirectoryExists
, defaultConfig } from '../src/utils.js';

describe('utils', () => {
  describe('getMarkdownLanguage', () => {
    it('should return correct language for file extensions', () => {
      expect(getMarkdownLanguage('.ts')).toBe('typescript');
      expect(getMarkdownLanguage('.js')).toBe('javascript');
      expect(getMarkdownLanguage('.py')).toBe('python');
      expect(getMarkdownLanguage('.json')).toBe('json');
    });

    it('should return correct language for files without extensions', () => {
      expect(getMarkdownLanguage('Dockerfile')).toBe('dockerfile');
      expect(getMarkdownLanguage('Makefile')).toBe('makefile');
      expect(getMarkdownLanguage('Jenkinsfile')).toBe('groovy');
    });

    it('should return text for unknown extensions', () => {
      expect(getMarkdownLanguage('.unknown')).toBe('text');
      expect(getMarkdownLanguage('UnknownFile')).toBe('text');
    });

    it('should handle case insensitive extensions', () => {
      expect(getMarkdownLanguage('.TS')).toBe('typescript');
      expect(getMarkdownLanguage('.JS')).toBe('javascript');
    });

    it('should handle Godot extensions correctly', () => {
      expect(getMarkdownLanguage('.gd')).toBe('gdscript');
      expect(getMarkdownLanguage('.tres')).toBe('gdscript');
      expect(getMarkdownLanguage('.tscn')).toBe('gdscript');
    });
  });

  describe('getExtensionsFromGroups', () => {
    it('should return all extensions when no groups specified', () => {
      const extensions = getExtensionsFromGroups(defaultConfig);
      expect(extensions.length).toBeGreaterThan(0);
      expect(extensions).toContain('.js');
      expect(extensions).toContain('.py');
      expect(extensions).toContain('.json');
    });

    it('should return extensions for specific groups', () => {
      const extensions = getExtensionsFromGroups(defaultConfig, ['web']);
      expect(extensions).toContain('.js');
      expect(extensions).toContain('.ts');
      expect(extensions).toContain('.html');
      expect(extensions).not.toContain('.py');
    });

    it('should return extensions for multiple groups', () => {
      const extensions = getExtensionsFromGroups(defaultConfig, ['web', 'backend']);
      expect(extensions).toContain('.js');
      expect(extensions).toContain('.py');
      expect(extensions).toContain('.go');
    });

    it('should handle unknown groups gracefully', () => {
      // Should return empty array for unknown groups and log warning
      const result = getExtensionsFromGroups(defaultConfig, ['unknown']);
      expect(result).toEqual([]);
    });
  });

  describe('formatTimestamp', () => {
    it('should format current date when no date provided', () => {
      const timestamp = formatTimestamp();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should format provided date', () => {
      const date = new Date('2025-01-01T12:00:00.000Z');
      const timestamp = formatTimestamp(date);
      expect(timestamp).toBe('2025-01-01T12:00:00.000Z');
    });
  });

  describe('formatLocalTimestamp', () => {
    it('should format current date when no date provided', () => {
      const timestamp = formatLocalTimestamp();
      expect(timestamp).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/);
    });

    it('should format provided date', () => {
      const date = new Date('2025-01-01T12:00:00.000Z');
      const timestamp = formatLocalTimestamp(date);
      expect(timestamp).toContain('01/01/2025');
    });
  });

  describe('file operations', () => {
    const testDir = path.resolve('./temp/test-utils');

    beforeEach(async () => {
      await fs.ensureDir(testDir);
    });

    afterEach(async () => {
      await fs.remove(testDir);
    });

    describe('ensureDirectoryExists', () => {
      it('should create directory if it does not exist', async () => {
        const newDir = path.join(testDir, 'new-dir');
        expect(await fs.pathExists(newDir)).toBe(false);
        
        await ensureDirectoryExists(newDir);
        expect(await fs.pathExists(newDir)).toBe(true);
      });

      it('should not fail if directory already exists', async () => {
        await ensureDirectoryExists(testDir);
        // Should not throw
        await ensureDirectoryExists(testDir);
        expect(await fs.pathExists(testDir)).toBe(true);
      });
    });


    describe('writeLog', () => {
      it('should write log content to file', async () => {
        const logFile = path.join(testDir, 'test.log');
        const logContent = 'Log entry';
        
        await writeLog(logFile, logContent);
        expect(await fs.pathExists(logFile)).toBe(true);
        const content = await fs.readFile(logFile, 'utf8');
        expect(content).toBe(`${logContent  }\n`);
      });

      it('should append log content when append is true', async () => {
        const logFile = path.join(testDir, 'test.log');
        const firstEntry = 'First entry';
        const secondEntry = 'Second entry';
        
        await writeLog(logFile, firstEntry);
        await writeLog(logFile, secondEntry, true);
        
        const content = await fs.readFile(logFile, 'utf8');
        expect(content).toBe(`${firstEntry  }\n${  secondEntry  }\n`);
      });

      it('should overwrite log content when append is false', async () => {
        const logFile = path.join(testDir, 'test.log');
        const firstEntry = 'First entry';
        const secondEntry = 'Second entry';
        
        await writeLog(logFile, firstEntry);
        await writeLog(logFile, secondEntry, false);
        
        const content = await fs.readFile(logFile, 'utf8');
        expect(content).toBe(`${secondEntry  }\n`);
      });
    });
  });

  describe('loadConfig', () => {
    const testDir = path.resolve('./temp/test-config');
    const configFile = path.join(testDir, 'project-fusion.json');

    beforeEach(async () => {
      await fs.ensureDir(testDir);
      // Set working directory to test directory
      process.chdir(testDir);
    });

    afterEach(async () => {
      // Restore original working directory
      process.chdir(path.resolve('./../../'));
      await fs.remove(testDir);
    });

    it('should return default config when no config file exists', async () => {
      const config = await loadConfig();
      expect(config).toEqual(defaultConfig);
    });

    it('should load valid config from file', async () => {
      const validConfig = {
        schemaVersion: 1,
        generatedFileName: 'custom-fusion',
        copyToClipboard: true,
        generateText: true,
        generateMarkdown: false,
        generateHtml: true,
        parsedFileExtensions: {
          web: ['.js', '.ts']
        },
        parseSubDirectories: false,
        rootDirectory: '.',
        maxFileSizeKB: 512,
        ignorePatterns: ['*.log'],
        useGitIgnoreForExcludes: false
      };

      await fs.writeJson(configFile, validConfig);
      const config = await loadConfig();
      // Config will be merged with defaults, so just check our specific values
      expect(config.schemaVersion).toBe(validConfig.schemaVersion);
      expect(config.generatedFileName).toBe(validConfig.generatedFileName);
      expect(config.copyToClipboard).toBe(validConfig.copyToClipboard);
      expect(config.generateText).toBe(validConfig.generateText);
      expect(config.generateMarkdown).toBe(validConfig.generateMarkdown);
      expect(config.generateHtml).toBe(validConfig.generateHtml);
      expect(config.parsedFileExtensions.web).toEqual(validConfig.parsedFileExtensions.web);
      expect(config.parseSubDirectories).toBe(validConfig.parseSubDirectories);
      expect(config.rootDirectory).toBe(validConfig.rootDirectory);
      expect(config.maxFileSizeKB).toBe(validConfig.maxFileSizeKB);
      expect(config.ignorePatterns).toEqual(validConfig.ignorePatterns);
      expect(config.useGitIgnoreForExcludes).toBe(validConfig.useGitIgnoreForExcludes);
    });

    it('should return default config for invalid JSON', async () => {
      await fs.writeFile(configFile, 'invalid json {');
      const config = await loadConfig();
      expect(config).toEqual(defaultConfig);
    });

    it('should return default config for invalid schema', async () => {
      const invalidConfig = {
        schemaVersion: 'invalid',
        invalidField: true
      };

      await fs.writeJson(configFile, invalidConfig);
      const config = await loadConfig();
      expect(config).toEqual(defaultConfig);
    });
  });
});