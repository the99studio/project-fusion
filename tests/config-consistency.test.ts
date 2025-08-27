import fs from 'fs-extra';
import { describe, it, expect } from 'vitest';
import type { FusionConfig } from '../src/types.js';
import { defaultConfig } from '../src/utils.js';

describe('Config Consistency', () => {
  describe('project-fusion.json vs defaultConfig', () => {
    it('should match the default configuration from utils.ts', async () => {
      const projectConfigPath = './project-fusion.json';
      
      // Read the project-fusion.json file
      const projectConfigRaw = await fs.readFile(projectConfigPath, 'utf-8');
      const projectConfig: FusionConfig = JSON.parse(projectConfigRaw);
      
      // Compare all properties
      expect(projectConfig.allowedExternalPluginPaths).toEqual(defaultConfig.allowedExternalPluginPaths);
      expect(projectConfig.allowSymlinks).toBe(defaultConfig.allowSymlinks);
      expect(projectConfig.copyToClipboard).toBe(defaultConfig.copyToClipboard);
      expect(projectConfig.excludeSecrets).toBe(defaultConfig.excludeSecrets);
      expect(projectConfig.generatedFileName).toBe(defaultConfig.generatedFileName);
      expect(projectConfig.generateHtml).toBe(defaultConfig.generateHtml);
      expect(projectConfig.generateMarkdown).toBe(defaultConfig.generateMarkdown);
      expect(projectConfig.generateText).toBe(defaultConfig.generateText);
      expect(projectConfig.ignorePatterns).toEqual(defaultConfig.ignorePatterns);
      expect(projectConfig.maxBase64BlockKB).toBe(defaultConfig.maxBase64BlockKB);
      expect(projectConfig.maxFileSizeKB).toBe(defaultConfig.maxFileSizeKB);
      expect(projectConfig.maxFiles).toBe(defaultConfig.maxFiles);
      expect(projectConfig.maxLineLength).toBe(defaultConfig.maxLineLength);
      expect(projectConfig.maxSymlinkAuditEntries).toBe(defaultConfig.maxSymlinkAuditEntries);
      expect(projectConfig.maxTokenLength).toBe(defaultConfig.maxTokenLength);
      expect(projectConfig.maxTotalSizeMB).toBe(defaultConfig.maxTotalSizeMB);
      expect(projectConfig.parsedFileExtensions).toEqual(defaultConfig.parsedFileExtensions);
      expect(projectConfig.parseSubDirectories).toBe(defaultConfig.parseSubDirectories);
      expect(projectConfig.rootDirectory).toBe(defaultConfig.rootDirectory);
      expect(projectConfig.schemaVersion).toBe(defaultConfig.schemaVersion);
      expect(projectConfig.useGitIgnoreForExcludes).toBe(defaultConfig.useGitIgnoreForExcludes);
    });

    it('should have all required properties', async () => {
      const projectConfigPath = './project-fusion.json';
      
      // Read the project-fusion.json file
      const projectConfigRaw = await fs.readFile(projectConfigPath, 'utf-8');
      const projectConfig: FusionConfig = JSON.parse(projectConfigRaw);
      
      // Check all required properties exist
      const requiredProperties = [
        'allowedExternalPluginPaths',
        'allowSymlinks', 
        'copyToClipboard',
        'excludeSecrets',
        'generatedFileName',
        'generateHtml',
        'generateMarkdown', 
        'generateText',
        'ignorePatterns',
        'maxBase64BlockKB',
        'maxFileSizeKB',
        'maxFiles',
        'maxLineLength',
        'maxSymlinkAuditEntries',
        'maxTokenLength',
        'maxTotalSizeMB',
        'parsedFileExtensions',
        'parseSubDirectories',
        'rootDirectory',
        'schemaVersion',
        'useGitIgnoreForExcludes'
      ];

      for (const prop of requiredProperties) {
        expect(projectConfig).toHaveProperty(prop);
      }
    });

    it('should not have extra unknown properties', async () => {
      const projectConfigPath = './project-fusion.json';
      
      // Read the project-fusion.json file
      const projectConfigRaw = await fs.readFile(projectConfigPath, 'utf-8');
      const projectConfig: FusionConfig = JSON.parse(projectConfigRaw);
      
      // Get all properties from both configs
      const projectConfigKeys = Object.keys(projectConfig).sort();
      const defaultConfigKeys = Object.keys(defaultConfig).sort();
      
      // They should be identical
      expect(projectConfigKeys).toEqual(defaultConfigKeys);
    });
  });
});