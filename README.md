# Project Fusion

Project Fusion enables efficient project file management by merging multiple project files into a single file for easy sharing and collaboration. It generates both plain text (.txt) and markdown (.md) versions with syntax highlighting for better readability.

## Installation

Install Project Fusion globally with npm:

```bash
npm install -g project-fusion
```

## Quick Start

1. **Initialize** Project Fusion in your project directory:
   ```bash
   cd your-project-directory
   project-fusion init
   ```

2. **Create fusion files** containing all your project files:
   ```bash
   project-fusion fusion
   ```
   This creates two files:
   - `project-fusioned.txt` - Plain text format with clear file separators
   - `project-fusioned.md` - Markdown format with syntax highlighting and table of contents

3. **Share the fusion files** for collaboration or analysis (choose .txt for universal compatibility or .md for enhanced readability)

## Commands

- `project-fusion init` - Initialize Project Fusion in current directory
- `project-fusion fusion` - Create fusion file from project files
- `project-fusion --help` - Show help information

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - AI context and technical documentation for Claude AI
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development workflows, testing, and npm publication guide
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute to the project
- **[LICENSE](./LICENSE)** - MIT License terms

## Usage Workflow

When sharing your code:

1. Run `project-fusion fusion` to create merged files
2. Choose the appropriate format:
   - **`.txt`** - Universal compatibility with clear HTML-style separators
   - **`.md`** - Enhanced readability with syntax highlighting, clickable table of contents
3. Share the fusion file with colleagues or collaborators
4. Use for code review, AI analysis, documentation, or project overview

The fusion files contain all your project files in a single, organized format that's easy to understand and work with.

## Configuration

Project Fusion creates a `project-fusion.json` configuration file when you run `init`. You can customize:
- File extensions to include (organized by category: web, backend, config, etc.)
- Directories to scan or ignore
- Output file names and locations
- Use of .gitignore patterns
- Clipboard copying behavior

### Supported File Extensions

Project Fusion supports 35+ file extensions organized by category:
- **Web**: .js, .jsx, .ts, .tsx, .html, .css, .vue, .svelte
- **Backend**: .py, .rb, .java, .cs, .go, .rs, .php
- **Config**: .json, .yaml, .yml, .toml, .xml
- **Scripts**: .sh, .bat, .ps1, .cmd
- **C/C++**: .c, .cpp, .h, .hpp
- **Godot**: .gd, .tscn, .tres, .cfg

The markdown output automatically applies appropriate syntax highlighting for each file type.

## Distribution

- **GitHub**: [github.com/the99studio/project-fusion](https://github.com/the99studio/project-fusion)
- **NPM**: [npmjs.com/package/project-fusion](https://www.npmjs.com/package/project-fusion)

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.