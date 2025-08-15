# Project Fusion - Developer Guide for AI Assistants

## Project Overview
Project Fusion is a tool for efficient project file management and sharing with AI assistants. It enables merging multiple files into a single file and applying changes using unified diff format.

## Project Structure
```
project-fusion/
├── packages/                    # Monorepo packages (pnpm workspace)
│   ├── cli/                    # CLI implementation
│   │   ├── src/
│   │   │   ├── cli.ts          # Main CLI entry point
│   │   │   └── clicommands.ts  # Command implementations
│   │   └── package.json
│   └── core/                   # Core functionality
│       ├── src/
│       │   ├── applydiff/      # Apply diff functionality
│       │   │   ├── coreapplydiff.ts
│       │   │   └── coreapplydifftypes.ts
│       │   ├── fusion/         # Fusion functionality
│       │   │   ├── corefusion.ts
│       │   │   └── corefusiontypes.ts
│       │   ├── core.ts         # Main exports
│       │   ├── coreutils.ts    # Utilities
│       │   └── schema.ts       # Configuration schemas
│       └── package.json
├── .project-fusion/            # Generated files (git-ignored)
│   ├── fusion/                 # Fusion output
│   └── applydiff/              # Diff files
├── project-fusion.json         # Configuration file
├── pnpm-workspace.yaml         # Workspace configuration
└── tsconfig.base.json          # Base TypeScript config
```

## Technology Stack
- **Language**: TypeScript (ES2022 target, NodeNext modules)
- **Runtime**: Node.js 18+
- **Package Manager**: pnpm (monorepo with workspaces)
- **Build System**: TypeScript compiler (tsc)
- **CLI Framework**: Commander.js
- **Key Libraries**:
  - `diff` & `diff-match-patch`: For diff operations
  - `fs-extra`: Enhanced file system operations
  - `glob` & `ignore`: File pattern matching
  - `zod`: Schema validation
  - `chalk`: Terminal styling
  - `clipboardy`: Clipboard operations
  - `uuid`: GUID generation for AI attribution

## Available Commands

### Root Level Commands
```bash
pnpm build        # Build all packages
pnpm test         # Run tests (currently placeholder)
pnpm lint         # Lint all packages
pnpm clean        # Clean build artifacts
```

### CLI Commands
```bash
project-fusion init        # Initialize project configuration
project-fusion fusion      # Create fusion file from project
project-fusion applydiff   # Apply diff file to project
project-fusion --help      # Show help
```

## Development Workflow

### Setup
1. Install dependencies: `pnpm install`
2. Build project: `pnpm build`
3. Link CLI globally: `cd packages/cli && pnpm link --global`

### Making Changes
1. Edit code in `packages/core` or `packages/cli`
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

### AI Response Format
When AI assistants respond with changes, they should use unified diff format:

```
### /src/components/Button.tsx
# Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
--- a/src/components/Button.tsx
+++ b/src/components/Button.tsx
@@ -1,5 +1,6 @@
 import React from 'react';
+import { useState } from 'react';
 
-export const Button = () => {
-  return <button>Click me</button>;
+export const Button = ({ onClick }) => {
+  const [clicked, setClicked] = useState(false);
+  return <button onClick={onClick}>Click me</button>;
 };
```

### File Operations
- **Modified**: Use unified diff format as shown above
- **New**: `### /path/to/file.tsx [NEW]` followed by full content
- **Deleted**: `### /path/to/file.tsx [DELETE]`
- **Renamed**: `### /old/path.tsx [RENAME] /new/path.tsx` with diff content

## Configuration Schema
The project uses Zod for schema validation. Configuration is stored in `project-fusion.json`:

```typescript
{
  schemaVersion: number              // Config version
  aiAttribution: {                   // AI code attribution
    enabled: boolean
    commentBegin: string
    commentEnd: string
  }
  fusion: {                          // Fusion settings
    directory: string
    fusion_file: string
    fusion_log: string
    copyToClipboard?: boolean
  }
  applydiff: {                       // Apply diff settings
    directory: string
    diff_file: string
    applydiff_log: string
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

### Core Module (`packages/core`)
- **corefusion.ts**: Handles file fusion process
- **coreapplydiff.ts**: Applies unified diffs to files
- **coreutils.ts**: Shared utilities (file operations, config management)
- **schema.ts**: Zod schemas for configuration validation

### CLI Module (`packages/cli`)
- **cli.ts**: Entry point, command registration
- **clicommands.ts**: Command implementations (init, fusion, applydiff)

## Architecture Patterns
- **Monorepo Structure**: Using pnpm workspaces for package management
- **TypeScript Modules**: ESM modules with NodeNext resolution
- **Schema Validation**: Zod for runtime type checking
- **Separation of Concerns**: Core logic separate from CLI interface
- **Configuration-Driven**: JSON config file with schema validation

## File Processing Flow

### Fusion Process
1. Read configuration from `project-fusion.json`
2. Scan project directory based on file extensions
3. Apply ignore rules (.gitignore, .projectfusionignore)
4. Generate hash for each file
5. Combine files into fusion format
6. Write to `.project-fusion/fusion/project_files_fusioned.txt`
7. Optionally copy to clipboard

### Apply Diff Process
1. Read diff file from `.project-fusion/applydiff/project_files_diff.txt`
2. Parse unified diff format
3. Handle operations: NEW, DELETE, RENAME, MODIFY
4. Apply AI attribution if enabled
5. Write changes to project files
6. Log results to apply_diff.log

## Important Conventions
- Use absolute paths internally
- Preserve file encoding (UTF-8)
- Generate SHA-256 hashes for file tracking
- Support unified diff format (git-style)
- Handle Windows and Unix path separators

## Error Handling
- Configuration validation with Zod
- File system error handling with fs-extra
- Graceful failures with detailed error messages
- Logging to fusion_log and applydiff_log files

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
1. Update schema in `packages/core/src/schema.ts`
2. Add to appropriate category in `parsedFileExtensions`
3. Update default config in CLI init command

### Modifying Fusion Format
1. Edit `packages/core/src/fusion/corefusion.ts`
2. Update types in `corefusiontypes.ts`
3. Test with sample files

### Adding a New CLI Command
1. Add command in `packages/cli/src/cli.ts`
2. Implement in `packages/cli/src/clicommands.ts`
3. Update help text and documentation

## Dependencies to Note
- **Node.js 18+**: Required for ES2022 features
- **pnpm**: Workspace management
- **TypeScript 5.7+**: Latest type features
- **Zod 3.22+**: Schema validation

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
   cd packages/cli
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

1. Make changes to the code in the `packages` directory
2. Rebuild the project:
   ```bash
   pnpm build
   ```
3. Test your changes:
   ```bash
   project-fusion --help
   project-fusion init
   project-fusion fusion
   project-fusion applydiff
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

4. Manually modify the generated diff file or create a test diff file

5. Apply the changes:
   ```bash
   project-fusion applydiff
   ```

### Useful Development Commands

- `pnpm install`: Install all dependencies
- `pnpm build`: Build all packages
- `pnpm --recursive update --latest`: Update dependencies to their latest version in each package.json of the project
- `pnpm link --global`: Link the CLI globally for testing
- `pnpm unlink --global`: Remove the global link

## NPM Publication

### Publishing to NPM

When ready to publish a new version:

1. **Update version numbers** in `packages/cli/package.json`

2. **Build the project**:
   ```bash
   pnpm build
   ```

3. **Test the package locally**:
   ```bash
   cd packages/cli
   npm pack --dry-run
   ```

4. **Publish to NPM**:
   ```bash
   cd packages/cli
   npm publish
   ```

### Publication Notes

- Only the `packages/cli` directory is published to NPM as `project-fusion`
- The core functionality is bundled directly into the CLI package
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
- **API Keys and Credentials**: Never share files containing API keys, passwords, or other credentials with AI assistants.
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

- **File size limits**: Be aware that AI assistants have limits on the amount of data they can process. Configure your extensions and exclusions appropriately.
- **For large projects**: Consider using more specific extension groups to reduce the total size of the fusion file.
- **Use the `--extensions` parameter**: Focus only on relevant file types for your current task.

## Known Limitations
- No automatic conflict resolution
- No binary file support
- No special character handling in file paths
- Maximum file size depends on available memory
- Requires manual copying of diff file to input directory
- No automatic directory creation (directories must exist)

## Future Improvements (Planned)
- VS Code extension integration
- Direct AI assistant API integration
- Dependency-based file inclusion
- Conflict resolution mechanisms
- Binary file support
- Web interface

## Debugging Tips
- Check logs in `.project-fusion/fusion/fusion.log`
- Verify configuration with schema validation
- Use `--verbose` flag (when implemented)
- Test with small file sets first
- Validate diff format before applying