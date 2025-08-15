# Project Fusion - Developer Guide

## Project Overview
Project Fusion is a tool for efficient project file management. It merges multiple project files into a single file for easy sharing and collaboration.

## Project Structure
```
project-fusion/
├── src/                        # Source code
│   ├── cli.ts                  # Main CLI entry point
│   ├── clicommands.ts          # Command implementations
│   ├── fusion.ts               # Core fusion functionality  
│   ├── index.ts                # Main exports
│   ├── schema.ts               # Configuration schemas (Zod)
│   ├── types.ts                # TypeScript type definitions
│   └── utils.ts                # Utility functions
├── dist/                       # Compiled JavaScript (generated)
├── .project-fusion/            # Generated files (git-ignored)
│   └── fusion/                 # Fusion output
├── project-fusion.json         # Configuration file
├── package.json                # Dependencies and scripts
└── tsconfig.json               # TypeScript configuration
```

## Technology Stack
- **Language**: TypeScript (ES2022 target, NodeNext modules)
- **Runtime**: Node.js 18+
- **Package Manager**: pnpm  
- **Build System**: TypeScript compiler (tsc)
- **CLI Framework**: Commander.js
- **Key Libraries**:
  - `fs-extra`: Enhanced file system operations
  - `glob` & `ignore`: File pattern matching
  - `zod`: Schema validation (v4.0.17)
  - `chalk`: Terminal styling
  - `clipboardy`: Clipboard operations
  - `uuid`: GUID generation for AI attribution

## Available Commands

### Development Commands
```bash
pnpm build        # Build project 
pnpm dev          # Watch mode compilation
pnpm test         # Run tests (currently placeholder)
pnpm clean        # Clean build artifacts
pnpm typecheck    # Type checking without emit
```

### CLI Commands
```bash
project-fusion init        # Initialize project configuration
project-fusion fusion      # Create fusion file from project  
project-fusion --help      # Show help
```

## Development Workflow

### Setup
1. Install dependencies: `pnpm install`
2. Build project: `pnpm build`
3. Link CLI globally: `pnpm link --global`

### Making Changes
1. Edit code in `src/` directory
2. Rebuild: `pnpm build`
3. Test locally with linked CLI

### Testing
- Unit tests: `pnpm test` (placeholder, needs implementation)
- Manual testing: Use linked CLI in test projects

## User Workflow and File Formats

### Fusion File Format
The fusion process creates a single file containing all project files in this format:

```
# Generated Project Fusion File
# Project: your-project-name
# @2025-01-15T10:30:00.000Z
# Files: 5

### /src/components/Button.tsx
# Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
import React from 'react';

export const Button = () => {
  return <button>Click me</button>;
};

### /src/utils/helper.ts
# Hash: f8c3bf28b236ed1d3644dd5b66728c3413679c7e6efcb2a79da143e9c6bb19d0
export const helper = () => {
  console.log('Helper function');
};
```

### Using the Fusion File
The fusion file can be used for:
- Code review and analysis
- Understanding project structure
- Project documentation
- Team collaboration
- Code sharing and onboarding

## Configuration Schema
The project uses Zod for schema validation. Configuration is stored in `project-fusion.json`:

```typescript
{
  schemaVersion: number              // Config version
  fusion: {                          // Fusion settings
    directory: string
    fusion_file: string
    fusion_log: string
    copyToClipboard?: boolean
  }
  parsedFileExtensions: {            // File types to process
    web: string[]
    backend: string[]
    config: string[]
    cpp: string[]
    scripts: string[]
  }
  parsing: {                         // Parsing behavior
    rootDirectory: string
    parseSubDirectories: boolean
  }
  useGitIgnoreForExcludes: boolean
  useProjectFusionIgnoreForExcludes: boolean
}
```

## Key Modules

### Source Files (`src/`)
- **cli.ts**: Entry point, command registration with Commander.js
- **clicommands.ts**: Command implementations (init, fusion)
- **fusion.ts**: Core fusion process and file handling
- **types.ts**: TypeScript type definitions with branded types
- **schema.ts**: Zod schemas for configuration validation
- **utils.ts**: Shared utilities (file operations, config management)
- **index.ts**: Main exports and public API

## Architecture Patterns
- **Simple Structure**: Single package with clear module separation
- **TypeScript Modules**: ESM modules with NodeNext resolution
- **Schema Validation**: Zod for runtime type checking
- **Branded Types**: Enhanced type safety with FilePath and FileHash types  
- **Separation of Concerns**: CLI, core logic, and utilities in separate modules
- **Configuration-Driven**: JSON config file with schema validation
- **Async/Await Pattern**: Modern asynchronous programming throughout

## File Processing Flow

### Fusion Process
1. Read configuration from `project-fusion.json`
2. Scan project directory based on file extensions
3. Apply ignore rules (.gitignore, .projectfusionignore)
4. Generate hash for each file
5. Combine files into fusion format
6. Write to `.project-fusion/fusion/project_files_fusioned.txt`
7. Optionally copy to clipboard

## Important Conventions
- Use absolute paths internally
- Preserve file encoding (UTF-8)
- Generate SHA-256 hashes for file tracking
- Handle Windows and Unix path separators

## Error Handling
- Configuration validation with Zod
- File system error handling with fs-extra
- Graceful failures with detailed error messages
- Logging to fusion_log files

## Security Considerations
- Respect .gitignore and .projectfusionignore files
- No automatic handling of sensitive files
- User must manually exclude credentials/secrets
- No binary file support (text files only)

## Testing Approach
When making changes:
1. Build the project: `pnpm build`
2. Test in a sample project
3. Verify fusion output format
4. Test diff application
5. Check AI attribution insertion

## Common Development Tasks

### Adding a New File Extension
1. Update schema in `src/schema.ts`
2. Add to appropriate category in `parsedFileExtensions`
3. Update default config in `src/utils.ts`

### Modifying Fusion Format
1. Edit `src/fusion.ts`
2. Update types in `src/types.ts`
3. Test with sample files

### Adding a New CLI Command
1. Add command in `src/cli.ts`
2. Implement in `src/clicommands.ts`
3. Update help text and documentation

### Modifying Fusion Output Format
1. Edit `src/fusion.ts`
2. Update types in `src/types.ts`
3. Test with sample files

## Dependencies to Note
- **Node.js 18+**: Required for ES2022 features
- **pnpm**: Package management
- **TypeScript 5.9.2**: Latest stable version with modern features
- **Zod 4.0.17**: Latest schema validation library

## Recent Improvements (2025)

### ✅ **State-of-the-Art TypeScript**
- Upgraded to TypeScript 5.9.2 with latest features
- Implemented branded types for FilePath and FileHash
- Added discriminated unions for better type safety
- Used `const assertions` and `satisfies` operator
- Removed all `any` types and improved type coverage to ~95%

### ✅ **Code Quality**
- Eliminated dead code and unused imports
- Unified type definitions and removed redundancy
- Made `loadConfig()` asynchronous for better performance
- Updated all packages to latest versions
- Zero TypeScript warnings or errors

### ✅ **Modern Patterns**
- ESM modules with NodeNext resolution
- Async/await throughout the codebase
- Zod v4 for runtime validation
- Commander.js v14 for CLI interface

## Future Improvements (Planned)
- VS Code extension integration
- Direct AI assistant API integration
- Dependency-based file inclusion
- Conflict resolution mechanisms
- Binary file support
- Web interface

## Development Setup

### Prerequisites for Development
- Node.js 18+
- pnpm (recommended package manager)
- Git

### Setup Development Environment

1. Install pnpm globally if you don't have it yet:
   ```bash
   npm install -g pnpm
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/the99studio/project-fusion.git
   cd project-fusion
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Build the project:
   ```bash
   pnpm build
   ```

5. Setup pnpm global bin folder:
   ```bash
   pnpm setup
   ```
   Then close VS Code and reopen it

6. Link CLI globally for testing:
   ```bash
   pnpm link --global
   ```

   To remove the link later:
   ```bash
   pnpm unlink --global
   ```

7. Test the CLI:
   ```bash
   project-fusion --help
   ```

### Development Workflow

1. Make changes to the code in the `src/` directory
2. Rebuild the project:
   ```bash
   pnpm build
   ```
3. Test your changes:
   ```bash
   project-fusion --help
   project-fusion init
   project-fusion fusion
   ```

### Testing in a Sample Project

1. Create or navigate to a test project:
   ```bash
   mkdir test-project
   cd test-project
   ```

2. Initialize Project Fusion in the test project:
   ```bash
   project-fusion init
   ```

3. Test the fusion process:
   ```bash
   project-fusion fusion
   ```

4. Verify the generated fusion file in `.project-fusion/fusion/`

### Useful Development Commands

- `pnpm install`: Install all dependencies
- `pnpm build`: Build all packages
- `pnpm --recursive update --latest`: Update dependencies to their latest version in each package.json of the project
- `pnpm link --global`: Link the CLI globally for testing
- `pnpm unlink --global`: Remove the global link

## NPM Publication

### Publishing to NPM

When ready to publish a new version:

1. **Update version numbers** in `package.json`

2. **Build the project**:
   ```bash
   pnpm build
   ```

3. **Test the package locally**:
   ```bash
   npm pack --dry-run
   ```

4. **Publish to NPM**:
   ```bash
   npm publish
   ```

### Publication Notes

- The entire `dist/` directory is published to NPM as `project-fusion`
- All functionality is bundled in the single package
- All dependencies are resolved and included in the published package
- The `files` field in package.json controls what gets published

### Pre-publication Checklist

- [ ] Version number updated
- [ ] Build successful (`pnpm build`)
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if exists)
- [ ] Git commit and tag created

## Security Considerations
- Respect .gitignore and .projectfusionignore files
- No automatic handling of sensitive files
- User must manually exclude credentials/secrets
- No binary file support (text files only)

### Security Best Practices
- **Sensitive Data**: Project Fusion does not automatically filter out sensitive data. Be cautious about what files you include in your fusion.
- **.projectfusionignore**: Use a `.projectfusionignore` file (similar to `.gitignore`) to exclude sensitive files and directories from being processed.
- **API Keys and Credentials**: Never share files containing API keys, passwords, or other credentials.
- **Personal Information**: Be mindful of including files that might contain personal information.

Example `.projectfusionignore` file:
```
# Credentials and environment variables
.env
.env.*
**/credentials/*

# Secret configuration
**/secrets/*
**/config/secrets.json

# Key files
*.pem
*.key

# Package files
package-lock.json

# Directories to exclude
/.project-fusion/
```

To enable this feature, update your configuration:
```json
{
  "useProjectFusionIgnoreForExcludes": true
}
```

## Performance Considerations

- **File size limits**: Be aware that large fusion files can be difficult to process. Configure your extensions and exclusions appropriately.
- **For large projects**: Consider using more specific extension groups to reduce the total size of the fusion file.
- **Use the `--extensions` parameter**: Focus only on relevant file types for your current task.

## Known Limitations
- No binary file support
- No special character handling in file paths
- Maximum file size depends on available memory
- No automatic directory creation (directories must exist)

## Future Improvements (Planned)
- Dependency-based file inclusion
- Binary file support
- Enhanced fusion formats (JSON, XML)

## Debugging Tips
- Check logs in `.project-fusion/fusion/fusion.log`
- Verify configuration with schema validation
- Use `--verbose` flag (when implemented)
- Test with small file sets first
- Verify fusion file output format