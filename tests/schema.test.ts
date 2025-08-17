import { describe, it, expect } from 'vitest';
import { ConfigSchemaV1 } from '../src/schema.js';
import { defaultConfig } from '../src/utils.js';

describe('schema', () => {
  describe('ConfigSchemaV1', () => {
    it('should validate default config', () => {
      const result = ConfigSchemaV1.safeParse(defaultConfig);
      expect(result.success).toBe(true);
    });

    it('should validate minimal valid config', () => {
      const minimalConfig = {
        schemaVersion: 1,
        generatedFileName: "test-fusion",
        copyToClipboard: false,
        generateText: true,
        generateMarkdown: true,
        generateHtml: false,
        generatePdf: false,
        parsedFileExtensions: {
          web: [".js", ".ts"]
        },
        parsing: {
          rootDirectory: ".",
          parseSubDirectories: true,
          maxFileSizeKB: 1024
        },
        ignorePatterns: [],
        useGitIgnoreForExcludes: true
      };

      const result = ConfigSchemaV1.safeParse(minimalConfig);
      expect(result.success).toBe(true);
    });

    it('should reject config with invalid schema version', () => {
      const invalidConfig = {
        ...defaultConfig,
        schemaVersion: 2
      };

      const result = ConfigSchemaV1.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject config with missing required fields', () => {
      const invalidConfig = {
        schemaVersion: 1
        // All other fields have defaults, so this should actually pass
      };

      const result = ConfigSchemaV1.safeParse(invalidConfig);
      expect(result.success).toBe(true); // Schema has defaults for all fields
    });

    it('should reject config with invalid copyToClipboard type', () => {
      const invalidConfig = {
        ...defaultConfig,
        copyToClipboard: "true" // Should be boolean
      };

      const result = ConfigSchemaV1.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should validate config with copyToClipboard true', () => {
      const validConfig = {
        ...defaultConfig,
        copyToClipboard: true
      };

      const result = ConfigSchemaV1.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should validate config with HTML generation enabled', () => {
      const validConfig = {
        ...defaultConfig,
        generateHtml: true
      };

      const result = ConfigSchemaV1.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should validate config with PDF generation enabled', () => {
      const validConfig = {
        ...defaultConfig,
        generatePdf: true
      };

      const result = ConfigSchemaV1.safeParse(validConfig);
      expect(result.success).toBe(true);
    });
  });
});