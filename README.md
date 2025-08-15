# Project Fusion

Project Fusion enables efficient project file management and sharing with AI assistants. It allows merging multiple files into a single file and applying changes using unified diff format.

## Installation

Install Project Fusion globally with npm or pnpm:

```bash
# Using npm
npm install -g project-fusion

# Using pnpm
pnpm add -g project-fusion
```

## Quick Start

1. **Initialize** Project Fusion in your project directory:
   ```bash
   cd your-project-directory
   project-fusion init
   ```

2. **Create a fusion file** containing all your project files:
   ```bash
   project-fusion fusion
   ```
   This creates `.project-fusion/fusion/project_files_fusioned.txt`

3. **Share the fusion file** with your AI assistant

4. **Apply changes** from the AI's response:
   ```bash
   project-fusion applydiff
   ```

## Commands

- `project-fusion init` - Initialize Project Fusion in current directory
- `project-fusion fusion` - Create fusion file from project files
- `project-fusion applydiff` - Apply AI-generated changes to project
- `project-fusion --help` - Show help information

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete developer guide and technical documentation
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute to the project
- **[LICENSE](./LICENSE)** - MIT License terms

## AI Assistant Workflow

When sharing your code with an AI assistant:

1. Run `project-fusion fusion` to create a merged file
2. Share the generated file with your AI assistant using this prompt:

```
I'm sharing my project as a fusion file. Please respond with changes using the unified diff format:

### /path/to/file.ext
# Hash: [file_hash]
--- a/path/to/file.ext
+++ b/path/to/file.ext
@@ -line,count +line,count @@
[diff content]
```

3. Copy the AI's response to `.project-fusion/applydiff/project_files_diff.txt`
4. Run `project-fusion applydiff` to apply the changes

## Configuration

Project Fusion creates a `project-fusion.json` configuration file when you run `init`. You can customize:
- File extensions to include
- Directories to scan or ignore  
- AI attribution settings
- Output directories

## Distribution

- **GitHub**: [github.com/the99studio/project-fusion](https://github.com/the99studio/project-fusion)
- **NPM**: [npmjs.com/package/project-fusion](https://www.npmjs.com/package/project-fusion)

## Support the Project

If you find Project Fusion useful, consider supporting its development:

- [GitHub Sponsors](https://github.com/sponsors/the99studio)
- [Open Collective](https://opencollective.com/projectfusion)
- [Patreon](https://www.patreon.com/projectfusion)
- [Buy Me a Coffee](https://www.buymeacoffee.com/projectfusion)

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.