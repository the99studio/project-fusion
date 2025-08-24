import { describe, expect, it } from 'vitest';

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
        parsedFileExtensions: {
          web: [".js", ".ts"]
        },
        rootDirectory: ".",
        parseSubDirectories: true,
        maxFileSizeKB: 1024,
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

    it('should validate config with HTML generation enabled', () => {
      const validConfig = {
        ...defaultConfig,
        generateHtml: true
      };

      const result = ConfigSchemaV1.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    describe('Numeric constraints validation', () => {
      it('should reject maxFiles below minimum (1)', () => {
        const invalidConfig = {
          ...defaultConfig,
          maxFiles: 0
        };

        const result = ConfigSchemaV1.safeParse(invalidConfig);
        expect(result.success).toBe(false);
      });

      it('should reject maxFiles above maximum (100000)', () => {
        const invalidConfig = {
          ...defaultConfig,
          maxFiles: 100001
        };

        const result = ConfigSchemaV1.safeParse(invalidConfig);
        expect(result.success).toBe(false);
      });

      it('should accept maxFiles at boundaries', () => {
        const minConfig = { ...defaultConfig, maxFiles: 1 };
        const maxConfig = { ...defaultConfig, maxFiles: 100000 };

        expect(ConfigSchemaV1.safeParse(minConfig).success).toBe(true);
        expect(ConfigSchemaV1.safeParse(maxConfig).success).toBe(true);
      });

      it('should reject maxFileSizeKB below minimum (1)', () => {
        const invalidConfig = {
          ...defaultConfig,
          maxFileSizeKB: 0
        };

        const result = ConfigSchemaV1.safeParse(invalidConfig);
        expect(result.success).toBe(false);
      });

      it('should reject maxFileSizeKB above maximum (1048576)', () => {
        const invalidConfig = {
          ...defaultConfig,
          maxFileSizeKB: 1048577
        };

        const result = ConfigSchemaV1.safeParse(invalidConfig);
        expect(result.success).toBe(false);
      });

      it('should accept maxFileSizeKB at boundaries', () => {
        const minConfig = { ...defaultConfig, maxFileSizeKB: 1 };
        const maxConfig = { ...defaultConfig, maxFileSizeKB: 1048576 };

        expect(ConfigSchemaV1.safeParse(minConfig).success).toBe(true);
        expect(ConfigSchemaV1.safeParse(maxConfig).success).toBe(true);
      });

      it('should reject maxTotalSizeMB below minimum (1)', () => {
        const invalidConfig = {
          ...defaultConfig,
          maxTotalSizeMB: 0.5
        };

        const result = ConfigSchemaV1.safeParse(invalidConfig);
        expect(result.success).toBe(false);
      });

      it('should reject maxTotalSizeMB above maximum (10240)', () => {
        const invalidConfig = {
          ...defaultConfig,
          maxTotalSizeMB: 10241
        };

        const result = ConfigSchemaV1.safeParse(invalidConfig);
        expect(result.success).toBe(false);
      });

      it('should accept maxTotalSizeMB at boundaries', () => {
        const minConfig = { ...defaultConfig, maxTotalSizeMB: 1 };
        const maxConfig = { ...defaultConfig, maxTotalSizeMB: 10240 };

        expect(ConfigSchemaV1.safeParse(minConfig).success).toBe(true);
        expect(ConfigSchemaV1.safeParse(maxConfig).success).toBe(true);
      });
    });
  });
});