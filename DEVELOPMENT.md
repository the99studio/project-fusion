# Project Fusion - Development Guide

> 📋 **For AI Context**: See [CLAUDE.md](./CLAUDE.md) for essential project information needed for development assistance.

## 🚀 Development Workflow

### Initial Setup
```bash
git clone <repository>
cd project-fusion
npm install
npm run build
npm link  # Link CLI globally for testing
```

### Development Commands
```bash
npm install        # Install dependencies
npm run build      # Build project (TypeScript → JavaScript)
npm run dev        # Watch mode compilation
npm run typecheck  # Type checking only
npm run clean      # Clean build artifacts
npm link           # Link CLI globally for testing
```

### Testing the CLI
```bash
# After npm link, test anywhere:
project-fusion init
project-fusion fusion
project-fusion --help
```

## 📦 NPM Package Management

### Pre-Publication Testing

**⚠️ Always use the `temp/` directory for testing:**

#### 1. Check Package Contents
```bash
# Preview what will be published
npm pack --dry-run

# Create actual test package
npm pack  # Creates project-fusion-x.x.x.tgz
```

#### 2. Extract and Test Package
```bash
# Extract to temp directory for inspection
mkdir -p temp/package-test
tar -xzf project-fusion-*.tgz -C temp/package-test

# Test the extracted package
cd temp/package-test/package
npm install --production
node dist/cli.js --help

# Test fusion functionality
node dist/cli.js init
node dist/cli.js fusion
```

#### 3. Local Installation Test
```bash
# Install from tarball locally
npm install ./project-fusion-*.tgz -g

# Test globally installed CLI
project-fusion --version
project-fusion --help

# Clean up
npm uninstall -g project-fusion
rm -rf temp/package-test
rm project-fusion-*.tgz
```

#### 4. VS Code Configuration
Use the "Test NPM Package" launch configuration in VS Code to automatically:
- Build the project
- Create test package in `temp/package/`
- Extract and test functionality

### Publication Process

```bash
# 1. Final verification
npm pack --dry-run

# 2. Optional: dry run publish
npm publish --dry-run

# 3. Login to npm (first time only)
npm login

# 4. Publish to npm
npm publish

# 5. Verify publication
npm view project-fusion
```

## 🛠️ Development Patterns

### Adding New File Extensions
1. Update `src/schema.ts` - add to `ParsedFileExtensionsSchema`
2. Update default config in `src/utils.ts` 
3. Test with various projects

### Adding New CLI Commands
1. Register command in `src/cli.ts` (Commander.js)
2. Implement in `src/clicommands.ts`
3. Update help text and documentation

### Modifying Fusion Output
1. Edit `src/fusion.ts` processing logic
2. Update types in `src/types.ts` if needed
3. Test both .txt and .md output formats

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] `npm run build` - clean build
- [ ] `npm run typecheck` - no type errors
- [ ] CLI help works: `project-fusion --help`
- [ ] Init works: `project-fusion init`
- [ ] Fusion works: `project-fusion fusion`
- [ ] Extension filtering works
- [ ] .gitignore integration works
- [ ] Output files are properly formatted
- [ ] Package builds and installs correctly

### Test Projects
Use these types of projects for testing:
- **Node.js/TypeScript** (like this project)
- **Python projects** (test backend extensions)
- **React/Vue projects** (test web extensions)
- **Mixed projects** (multiple extension types)

## 🔧 Troubleshooting

### Common Issues

**Build Errors:**
```bash
npm run clean && npm run build
```

**CLI Not Working After Changes:**
```bash
npm run build && npm link
```

**Package Contains Wrong Files:**
- Check `package.json` `files` field
- Use `npm pack --dry-run` to verify

**TypeScript Errors:**
```bash
npm run typecheck
# Fix errors in src/ files
```

### Performance Optimization
- Large projects: Use specific extension groups
- Memory issues: Configure ignore patterns properly
- Speed: Use `.gitignore` for filtering

## 📁 Directory Structure

```
project-fusion/
├── src/                    # TypeScript source
│   ├── cli.ts             # CLI entry point
│   ├── clicommands.ts     # Command implementations
│   ├── fusion.ts          # Core fusion logic
│   ├── types.ts           # Type definitions
│   ├── schema.ts          # Zod schemas
│   ├── utils.ts           # Utilities
│   └── index.ts           # Main exports
├── dist/                  # Compiled JavaScript (gitignored)
├── temp/                  # Testing directory (gitignored)
├── CLAUDE.md              # AI context (essential info)
├── DEVELOPMENT.md         # This file (human development)
├── package.json           # NPM configuration
└── tsconfig.json          # TypeScript configuration
```

## 🔗 Important Files

- **CLAUDE.md** - Essential project context for AI assistance
- **package.json** - NPM package configuration and scripts
- **tsconfig.json** - TypeScript compilation settings
- **.gitignore** - Git ignore patterns (includes `temp/`)
- **.vscode/launch.json** - VS Code debugging/testing configurations

## 🏗️ Architecture Notes

- **ESM modules** with NodeNext resolution
- **Branded types** for type safety (FilePath)
- **Discriminated unions** for results (success/failure)
- **Zod runtime validation** for configuration
- **Separation of concerns**: CLI ↔ core logic ↔ utilities

---

*For AI assistance, always refer to [CLAUDE.md](./CLAUDE.md) first for project context.*