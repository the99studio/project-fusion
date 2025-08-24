# Project Fusion

[![CI](https://img.shields.io/github/actions/workflow/status/the99studio/project-fusion/ci.yml?label=CI&logo=github)](https://github.com/the99studio/project-fusion/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@the99studio/project-fusion.svg)](https://www.npmjs.com/package/@the99studio/project-fusion)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Merge project files into a single file for easy sharing and collaboration.

> 📋 **For Developers**: See [DEVELOPMENT.md](./DEVELOPMENT.md)

## Overview

Merges selected project files into consolidated text, markdown, or HTML formats. Perfect for:
- AI assistant context (Claude, ChatGPT, etc.)
- Code review and collaboration
- Project documentation and snapshots
- Sharing filtered codebase content

## Features

- **Advanced processing** - Cancellation support, backpressure handling, chunked writing (64KB), non-printable character analysis
- **Comprehensive configuration** - 30+ configurable options, schema versioning, extension groups, granular limits
- **Content validation** - Detects and handles base64 blocks, long tokens, oversized lines, minified code
- **Cross-platform** - Windows, macOS, Linux support with platform-specific path handling
- **Developer friendly** - TypeScript support, ESM modules, fluent API, programmatic API with callbacks
- **Error handling** - Discriminated unions, error placeholders, severity levels, safe logging without path exposure
- **File analysis** - Language detection, syntax highlighting, table of contents generation, file statistics
- **Memory safeguards** - Usage monitoring, configurable thresholds, memory warnings, heap usage tracking
- **Multi-format output** - Plain text, Markdown with syntax highlighting, interactive HTML with navigation
- **Performance optimization** - Streaming for large files, memory management, progress reporting with ETA, throughput metrics, benchmarking system
- **Plugin architecture** - Lifecycle hooks, custom output strategies, file system adapters, external plugin support
- **Secret detection** - Automatic detection and redaction of 18+ secret types (AWS keys, GitHub tokens, JWT, API keys, passwords, private keys)
- **Security hardening** - Path traversal protection, symlink detection and audit logging, XSS prevention, secure path validation
- **Smart filtering** - Binary file detection, .gitignore support, custom patterns, null byte detection
- **VS Code integration** - Direct API support for VS Code extensions, debug configurations

## Installation

Requires [Node.js 20.10.0+](https://nodejs.org/en/download)

```bash
npm install -g @the99studio/project-fusion
```

## Quick Start

```bash
cd [YOUR-PROJECT-FOLDER]
project-fusion
```

Generates three output formats:
- `project-fusioned.txt` - Plain text with file separators
- `project-fusioned.md` - Markdown with syntax highlighting and table of contents
- `project-fusioned.html` - Interactive HTML with navigation and responsive design

## Configuration

Run `project-fusion init` to create `project-fusion.json` if you want to fine-tune file selection, output formats, processing limits, etc.:

```jsonc
{
  "copyToClipboard": false,                    // Copy output to clipboard
  "generateHtml": true,                        // Generate .html output with navigation
  "generateMarkdown": true,                    // Generate .md output with syntax highlighting
  "generateText": true,                        // Generate .txt output
  "generatedFileName": "project-fusioned",     // Base name for output files
  "outputDirectory": "./output",               // Optional: Custom output directory
  "rootDirectory": ".",                        // Root directory to scan
  "schemaVersion": 1,                          // Config schema version
  
  // File processing limits
  "maxFileSizeKB": 1024,                       // Max size per file (KB)
  "maxFiles": 10000,                           // Max number of files to process
  "maxTotalSizeMB": 100,                       // Max total output size (MB)
  
  // Content validation limits
  "maxBase64BlockKB": 2,                       // Max base64 block size before rejection (KB)
  "maxLineLength": 5000,                       // Max line length before rejection
  "maxTokenLength": 2000,                      // Max token length before rejection
  
  // Directory and filter settings
  "ignorePatterns": [                          // Additional patterns to ignore
    "node_modules/",
    "*.test.js",
    "dist/",
    "*.min.js"
  ],
  "parseSubDirectories": true,                 // Include subdirectories
  "useGitIgnoreForExcludes": true,             // Use .gitignore patterns
  
  // Security settings
  "allowExternalPlugins": false,               // Allow external plugins
  "allowSymlinks": false,                      // Allow symbolic links
  "allowedExternalPluginPaths": [],            // Allowed external plugin paths
  "excludeSecrets": true,                      // Exclude files with secrets
  "maxSymlinkAuditEntries": 10,                // Max symlink audit log entries
  
  // File extension groups
  "parsedFileExtensions": {
    "backend": [".cs", ".go", ".java", ".php", ".py", ".rb", ".rs"],
    "config": [".json", ".toml", ".xml", ".yaml", ".yml"],
    "cpp": [".c", ".cc", ".cpp", ".h", ".hpp"],
    "doc": [".adoc", ".md", ".rst"],
    "godot": [".cfg", ".cs", ".gd", ".import", ".tres", ".tscn"],
    "scripts": [".bat", ".cmd", ".ps1", ".sh"],
    "web": [".css", ".html", ".js", ".jsx", ".svelte", ".ts", ".tsx", ".vue"]
  }
}
```

## CLI Options

```bash
project-fusion [options]

# Basic Options
  --help                        Display help information
  --preview                     Preview mode: list files without generating output
  --version                     Display version number
  
# File Selection
  --extensions <groups>         Include specific file types (e.g., backend,web,config)
  --groups <groups>             Same as --extensions (alias)
  --ignore <patterns>           Additional comma-separated ignore patterns
  --root <directory>            Root directory to scan (default: current directory)
  
# Output Configuration  
  --clipboard                   Copy output to clipboard (default: from config)
  --name <filename>             Custom filename for generated files (without extension)
  --no-clipboard                Disable clipboard copying
  --out <directory>             Output directory for generated files
  
# Output Formats (override config)
  --html                        Generate HTML output only
  --md                          Generate Markdown output only  
  --no-html                     Skip HTML generation (legacy)
  --no-markdown                 Skip Markdown generation (legacy)
  --no-text                     Skip text generation (legacy)
  --txt                         Generate text output only
  
# Processing Limits
  --max-file-size <kb>          Maximum file size in KB (default: 1024)
  --max-files <count>           Maximum number of files (default: 10000)
  --max-total-size <mb>         Maximum total size in MB (default: 100)
  
# Parsing Behavior
  --no-exclude-secrets          Disable automatic secret detection/exclusion
  --no-gitignore                Don't use .gitignore for exclusions
  --no-subdirs                  Don't scan subdirectories
  
# Security Options (use with caution)
  --allow-external-plugins      Allow plugins from outside root directory (SECURITY WARNING)
  --allow-symlinks              Allow processing symbolic links (SECURITY WARNING)
  
# Plugin System
  --plugins <names>             Comma-separated list of plugin names to enable
  --plugins-dir <directory>     Directory containing plugins to load

# Commands
  config-check                  Validate configuration and display active settings
  init [--force]                Create project-fusion.json configuration file
```

## License

MIT - See [LICENSE](./LICENSE)

## Links

- [GitHub Repository](https://github.com/the99studio/project-fusion)
- [Issue Tracker](https://github.com/the99studio/project-fusion/issues)
- [NPM Package](https://npmjs.com/package/@the99studio/project-fusion)