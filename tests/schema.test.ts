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
        fusion: {
          fusion_file: "test.txt",
          fusion_log: "test.log",
          copyToClipboard: false
        },
        parsedFileExtensions: {
          backend: [".py", ".go"],
          config: [".json"],
          cpp: [".c"],
          scripts: [".sh"],
          web: [".js", ".ts"],
          godot: [".gd"],
          doc: [".md"]
        },
        parsing: {
          rootDirectory: ".",
          parseSubDirectories: true
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
        // Missing required fields
      };

      const result = ConfigSchemaV1.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject config with invalid copyToClipboard type', () => {
      const invalidConfig = {
        ...defaultConfig,
        fusion: {
          ...defaultConfig.fusion,
          copyToClipboard: "true" // Should be boolean
        }
      };

      const result = ConfigSchemaV1.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should validate config with copyToClipboard true', () => {
      const validConfig = {
        ...defaultConfig,
        fusion: {
          ...defaultConfig.fusion,
          copyToClipboard: true
        }
      };

      const result = ConfigSchemaV1.safeParse(validConfig);
      expect(result.success).toBe(true);
    });
  });
});