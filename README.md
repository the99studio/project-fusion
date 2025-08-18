# Project Fusion

[![CI](https://github.com/the99studio/project-fusion/actions/workflows/ci.yml/badge.svg)](https://github.com/the99studio/project-fusion/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/project-fusion.svg)](https://badge.fury.io/js/project-fusion)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Merge project files into a single file for easy sharing and collaboration.

> 📚 **[Development Guide](./DEVELOPMENT.md)** | 📋 **[AI Context](./CLAUDE.md)**

## Overview

Scans your project directory and creates fusion files containing all source code. Perfect for:
- Code review/collaboration  
- AI assistant context
- Project snapshots
- Documentation

## Installation

```bash
npm install -g project-fusion
```

Requires Node.js 18.0.0+

## Quick Start

```bash
cd your-project
project-fusion
```

Generates:
- `project-fusioned.txt` - Plain text 
- `project-fusioned.md` - Markdown with syntax highlighting  
- `project-fusioned.html` - Interactive HTML with navigation

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

Run `project-fusion init` to create `project-fusion.json`:

```json
{
  "generatedFileName": "my-project-fusion",
  "generateText": true,
  "generateMarkdown": true,
  "generateHtml": false,
  "maxFileSizeKB": 500,
  "ignorePatterns": ["tests/", "*.test.js"],
  "parsedFileExtensions": {
    "web": [".js", ".ts", ".css"],
    "backend": [".py", ".go"]
  }
}
```

## File Types

**Backend**: .cs, .go, .java, .php, .py, .rb, .rs  
**Config**: .json, .yaml, .toml, .xml  
**C/C++**: .c, .cpp, .h, .hpp  
**Docs**: .md, .rst, .adoc  
**Scripts**: .sh, .bat, .ps1  
**Web**: .js, .ts, .jsx, .tsx, .css, .html, .vue, .svelte  

## API

```javascript
import { projectFusion } from 'project-fusion/fluent';

const result = await projectFusion()
  .include(['web'])
  .exclude(['*.test.js'])
  .maxSize('2MB')
  .output(['md', 'html'])
  .generate();
```

See **[Development Guide](./DEVELOPMENT.md#advanced-api-usage)** for complete API reference.

## Security

Built-in protection against path traversal, symlink exploitation, and XSS. All paths validated within project directory.

## Commands

| Command | Description |
|---------|------------|
| `project-fusion` | Create fusion files |
| `project-fusion init` | Initialize config |
| `project-fusion config-check` | Validate config |
| `project-fusion --help` | Show help |

## License

MIT - See [LICENSE](./LICENSE)

## Links

- [GitHub](https://github.com/the99studio/project-fusion)
- [NPM](https://npmjs.com/package/project-fusion)