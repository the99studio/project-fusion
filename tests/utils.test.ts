import { describe, it, expect } from 'vitest';
import { getMarkdownLanguage, getExtensionsFromGroups, formatTimestamp } from '../src/utils.js';
import { defaultConfig } from '../src/utils.js';

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
      const extensions = getExtensionsFromGroups(defaultConfig, ['unknown']);
      expect(extensions).toEqual([]);
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
});