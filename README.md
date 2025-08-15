# Project Fusion

Project Fusion enables efficient project file management by merging multiple project files into a single file for easy sharing and collaboration.

## Installation

Install Project Fusion globally with npm or pnpm:

```bash
# Using npm
npm install -g project-fusion

# Using pnpm
npm install -g pnpm
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

3. **Share the fusion file** for collaboration or analysis

## Commands

- `project-fusion init` - Initialize Project Fusion in current directory
- `project-fusion fusion` - Create fusion file from project files
- `project-fusion --help` - Show help information

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Complete developer guide and technical documentation
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute to the project
- **[LICENSE](./LICENSE)** - MIT License terms

## Usage Workflow

When sharing your code:

1. Run `project-fusion fusion` to create a merged file
2. Share the generated fusion file with colleagues or collaborators
3. Use the fusion file for code review, analysis, or project overview

The fusion file contains all your project files in a single, organized format that's easy to understand and work with.

## Configuration

Project Fusion creates a `project-fusion.json` configuration file when you run `init`. You can customize:
- File extensions to include
- Directories to scan or ignore  
- Output directories

## Distribution

- **GitHub**: [github.com/the99studio/project-fusion](https://github.com/the99studio/project-fusion)
- **NPM**: [npmjs.com/package/project-fusion](https://www.npmjs.com/package/project-fusion)

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.