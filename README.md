# Project Fusion

Merge multiple project files into a single file for easy sharing and collaboration.

> 📚 **[Development Guide](./DEVELOPMENT.md)** | 📋 **[AI Context](./CLAUDE.md)**

## What it does

Project Fusion scans your project directory and creates a single file containing all your source code. Perfect for:
- Sharing code for review or collaboration
- Providing context to AI assistants
- Creating project snapshots
- Documentation and archiving

## Installation

```bash
npm install -g project-fusion
```

Requires Node.js 18.0.0 or higher.

## Quick Start

```bash
# Navigate to your project
cd your-project

# Create fusion files
project-fusion
```

This generates three files:
- `project-fusioned.txt` - Plain text for universal compatibility
- `project-fusioned.md` - Markdown with syntax highlighting  
- `project-fusioned.html` - Interactive HTML with navigation

## Basic Usage

### Default: Create fusion files
```bash
project-fusion
```

### Initialize configuration (optional)
```bash
project-fusion init
```
Creates `project-fusion.json` to customize:
- Which file types to include
- Directories to ignore
- Output file names
- File size limits

### Filter by file type
```bash
# Only web files (JS, TS, CSS, HTML)
project-fusion --extensions web

# Multiple categories
project-fusion --extensions web,backend,config
```

## Configuration

After running `project-fusion init`, you can edit `project-fusion.json`:

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

### Supported File Types

**Web**: JS, TS, JSX, TSX, CSS, HTML, Vue, Svelte  
**Backend**: Python, Go, Java, PHP, Ruby, Rust, C#  
**Config**: JSON, YAML, TOML, XML  
**Scripts**: Shell, Batch, PowerShell  
**C/C++**: C, C++, Headers  
**Docs**: Markdown, reStructuredText, AsciiDoc  

## Output Formats

| Format | Best For | Features |
|--------|----------|----------|
| `.txt` | Universal sharing | Plain text, works everywhere |
| `.md` | GitHub/GitLab | Syntax highlighting, table of contents |
| `.html` | Web viewing | Interactive navigation, responsive design |

## Programmatic API

Project Fusion provides TypeScript APIs for integration:

```javascript
import { projectFusion } from 'project-fusion/fluent';

// Fluent API
const result = await projectFusion()
  .include(['web'])
  .generate();
```

For advanced usage, VS Code extensions, CI/CD integration, and complete API reference, see the **[Development Guide](./DEVELOPMENT.md#advanced-api-usage)**.

## Security

Project Fusion includes built-in protection against:
- Path traversal attacks
- Symbolic link exploitation
- Binary file corruption
- XSS in HTML output

All paths are validated to stay within your project directory.

## Commands

| Command | Description |
|---------|------------|
| `project-fusion` | Create fusion files (default) |
| `project-fusion init` | Initialize configuration |
| `project-fusion config-check` | Validate configuration |
| `project-fusion --help` | Show help |
| `project-fusion --version` | Show version |

## Contribution

See **[Contributing](./CONTRIBUTING.md)** for details.

## License

MIT - See [LICENSE](./LICENSE) for details.

## Links

- **GitHub**: [github.com/the99studio/project-fusion](https://github.com/the99studio/project-fusion)
- **NPM**: [npmjs.com/package/project-fusion](https://www.npmjs.com/package/project-fusion)