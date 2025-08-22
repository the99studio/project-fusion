# Project Fusion

[![CI](https://img.shields.io/github/actions/workflow/status/the99studio/project-fusion/ci.yml?label=CI&logo=github)](https://github.com/the99studio/project-fusion/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@the99studio/project-fusion.svg)](https://www.npmjs.com/package/@the99studio/project-fusion)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Merge project files into a single file for easy sharing and AI collaboration.

> 📚 **[Development Guide](./DEVELOPMENT.md)** | 📋 **[AI Context](./CLAUDE.md)**

## Overview

Scans your project directory and creates fusion files containing all source code. Perfect for:
- AI assistant context (Claude, ChatGPT, etc.)
- Code review and collaboration
- Project documentation and snapshots
- Sharing code across teams

## Installation

```bash
npm install -g @the99studio/project-fusion
```

Requires Node.js 20.10.0+

## Quick Start

```bash
cd your-project
project-fusion
```

Generates three output formats:
- `project-fusioned.txt` - Plain text with file separators
- `project-fusioned.md` - Markdown with syntax highlighting and table of contents
- `project-fusioned.html` - Interactive HTML with navigation and responsive design

## Usage

```bash
# Basic fusion
project-fusion

# Initialize config (optional)
project-fusion init

# Filter by file type
project-fusion --extensions web,backend

# Custom output directory
project-fusion --out ./output

# Preview files without generating
project-fusion --preview
```

## Configuration

Optional: Run `project-fusion init` to create `project-fusion.json`:

```json
{
  "generatedFileName": "project-fusioned",
  "generateText": true,
  "generateMarkdown": true,
  "generateHtml": true,
  "maxFileSizeKB": 500,
  "maxFiles": 1000,
  "maxTotalSizeMB": 50,
  "parseSubDirectories": true,
  "useGitIgnoreForExcludes": true,
  "copyToClipboard": false,
  "ignorePatterns": ["node_modules/", "*.test.js"],
  "parsedFileExtensions": {
    "backend": [".go", ".java", ".py"],
    "web": [".js", ".jsx", ".ts", ".tsx"]
  }
}
```

## Supported File Types

| Category | Extensions |
|----------|------------|
| **Backend** | .cs, .go, .java, .php, .py, .rb, .rs |
| **C/C++** | .c, .cc, .cpp, .h, .hpp |
| **Config** | .json, .toml, .xml, .yaml, .yml |
| **Docs** | .adoc, .md, .rst |
| **Godot** | .cfg, .gd, .import, .tres, .tscn |
| **Scripts** | .bat, .cmd, .ps1, .sh |
| **Web** | .css, .html, .js, .jsx, .svelte, .ts, .tsx, .vue |  

## Programmatic Usage

### Fluent API
```javascript
import { projectFusion } from '@the99studio/project-fusion/fluent';

const result = await projectFusion()
  .include(['web', 'backend'])
  .exclude(['*.test.js'])
  .maxSize('2MB')
  .output(['md', 'html'])
  .generate();
```

### Standard API
```javascript
import { fusionAPI } from '@the99studio/project-fusion/api';

const result = await fusionAPI({
  rootDirectory: './src',
  extensionGroups: ['web'],
  onProgress: (progress) => console.log(progress.message)
});
```

## Features

- **Content validation** - Detects and handles base64 blocks, long tokens, oversized lines
- **Extensible** - Plugin system, custom output strategies, file system adapters
- **Multi-format output** - Plain text, Markdown with syntax highlighting, HTML with navigation
- **Performance** - Streaming for large files, configurable limits, progress reporting
- **Security** - Path traversal protection, symlink handling, XSS prevention
- **Smart filtering** - Automatic binary file detection, .gitignore support, custom patterns

## CLI Options

```bash
project-fusion [options]

Options:
  --clipboard                Copy output to clipboard
  -e, --extensions <groups>  Include specific file types (web,backend,config)
  --help                     Display help
  -n, --name <name>          Output filename (without extension)
  --no-html                  Skip .html generation
  --no-markdown              Skip .md generation
  --no-text                  Skip .txt generation
  -o, --out <dir>            Output directory
  --preview                  List files without generating output
```

## Requirements

- Node.js 20.10.0 or higher
- TypeScript 5.9.2+ (for development)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](./LICENSE)

## Links

- [GitHub Repository](https://github.com/the99studio/project-fusion)
- [NPM Package](https://npmjs.com/package/@the99studio/project-fusion)
- [Issue Tracker](https://github.com/the99studio/project-fusion/issues)