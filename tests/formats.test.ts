import path from 'node:path';
import fs from 'fs-extra';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import pkg from '../package.json' with { type: 'json' };
import { processFusion } from '../src/fusion.js';
import { Config } from '../src/types.js';

// Test configuration for multiple output formats
const testConfig: Config = {
  schemaVersion: 1,
  generatedFileName: 'test-output',
  copyToClipboard: false,
  generateText: true,
  generateMarkdown: true,
  generateHtml: true,
  parsedFileExtensions: {
    web: ['.js', '.ts'],
    doc: ['.md']
  },
  parseSubDirectories: false,
  rootDirectory: '.',
  maxFileSizeKB: 1024,
  maxFiles: 10_000,
  maxTotalSizeMB: 100,
  ignorePatterns: [],
  useGitIgnoreForExcludes: false,
  allowSymlinks: false,
  
  maxBase64BlockKB: 100,
  maxLineLength: 5000,
  maxTokenLength: 2000
};

const testDir = path.resolve('./temp/test-formats');
const originalCwd = process.cwd();

describe('Multiple Format Generation', () => {
  beforeEach(async () => {
    await fs.ensureDir(testDir);
    process.chdir(testDir);
    
    // Create test files
    await fs.writeFile(path.join(testDir, 'test.js'), `
console.log('Hello World');
function greet(name) {
  return \`Hello, \${name}!\`;
}
export { greet };
    `.trim());

    await fs.writeFile(path.join(testDir, 'README.md'), `
# Test Project

This is a **test** project with _markdown_ content.

## Features
- Feature 1
- Feature 2
    `.trim());
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(testDir);
  });

  it('should generate text format when enabled', async () => {
    const config = { ...testConfig, generateText: true, generateMarkdown: false, generateHtml: false };
    const result = await processFusion(config);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists('test-output.txt')).toBe(true);
    expect(await fs.pathExists('test-output.md')).toBe(false);
    expect(await fs.pathExists('test-output.html')).toBe(false);
  });

  it('should generate markdown format when enabled', async () => {
    const config = { ...testConfig, generateText: false, generateMarkdown: true, generateHtml: false };
    const result = await processFusion(config);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists('test-output.txt')).toBe(false);
    expect(await fs.pathExists('test-output.md')).toBe(true);
    expect(await fs.pathExists('test-output.html')).toBe(false);
  });

  it('should generate HTML format when enabled', async () => {
    const config = { ...testConfig, generateText: false, generateMarkdown: false, generateHtml: true };
    const result = await processFusion(config);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists('test-output.txt')).toBe(false);
    expect(await fs.pathExists('test-output.md')).toBe(false);
    expect(await fs.pathExists('test-output.html')).toBe(true);
  });

  it('should generate multiple formats when enabled', async () => {
    const result = await processFusion(testConfig);
    
    expect(result.success).toBe(true);
    expect(await fs.pathExists('test-output.txt')).toBe(true);
    expect(await fs.pathExists('test-output.md')).toBe(true);
    expect(await fs.pathExists('test-output.html')).toBe(true);
  });

  it('should include proper HTML structure', async () => {
    const result = await processFusion(testConfig);
    
    expect(result.success).toBe(true);
    const htmlContent = await fs.readFile('test-output.html', 'utf8');
    
    expect(htmlContent).toContain('<!DOCTYPE html>');
    expect(htmlContent).toContain('<html lang="en">');
    expect(htmlContent).toContain('<title>Project Fusion - test-formats</title>');
    expect(htmlContent).toContain('📁 Table of Contents');
    expect(htmlContent).toContain('📄 test.js');
    expect(htmlContent).toContain('📄 README.md');
    expect(htmlContent).toContain('</body>');
    expect(htmlContent).toContain('</html>');
  });

  it('should escape HTML in code content', async () => {
    // Add a file with HTML-like content
    await fs.writeFile('html-test.js', `
const html = '<div>Hello & <span>World</span></div>';
console.log(html);
    `.trim());

    const result = await processFusion(testConfig);
    
    expect(result.success).toBe(true);
    const htmlContent = await fs.readFile('test-output.html', 'utf8');
    
    expect(htmlContent).toContain('&lt;div&gt;Hello &amp; &lt;span&gt;World&lt;/span&gt;&lt;/div&gt;');
  });


  it('should include proper metadata in generated files', async () => {
    // Create a package.json with version info
    await fs.writeFile('package.json', JSON.stringify({
      name: 'test-package',
      version: '1.0.0'
    }, null, 2));

    const configWithPackage = {
      ...testConfig,
      parsedFileExtensions: { ...testConfig.parsedFileExtensions, config: ['.json'] }
    };

    const result = await processFusion(configWithPackage);
    
    expect(result.success).toBe(true);
    const txtContent = await fs.readFile('test-output.txt', 'utf8');
    const mdContent = await fs.readFile('test-output.md', 'utf8');
    
    expect(txtContent).toContain('# Generated Project Fusion File');
    expect(txtContent).toContain('# Project: test-formats / test-package v1.0.0');
    expect(txtContent).toContain(`# Generated by: project-fusion v${pkg.version}`);
    
    expect(mdContent).toContain('# Generated Project Fusion File');
    expect(mdContent).toContain('**Project:** test-formats / test-package v1.0.0');
    expect(mdContent).toContain(`[project-fusion v${pkg.version}](https://github.com/the99studio/project-fusion)`);
  });
});