# Project Fusion - Development Guide

> 📋 **For Claude AI Context**: See [CLAUDE.md](./CLAUDE.md) for essential project information needed for development assistance.

## 🚀 Development Workflow

### Initial Setup
```bash
git clone https://github.com/the99studio/project-fusion.git
cd project-fusion
npm install
npm run build
```

### Testing the CLI
Use VS Code launch configurations (F5) for easy testing:
- **"Fusion (Default)"** - Default behavior (runs fusion)
- **"Fusion (Web)"** - Test web extensions only
- **"Help"** - Test CLI help
- **"Init"** - Test project initialization

### Testing with Real Package
For testing as if it were the real published package, see the [NPM Package Testing](#-npm-package-management) section below.

## 📦 NPM Package Management

### Pre-Publication Testing

Use the **"Test NPM Package"** launch configuration in VS Code (F5) which automatically:
- Builds the project
- Creates and extracts test package to `temp/package/`
- Installs dependencies and tests CLI functionality

#### Manual Package Verification
```bash
# Preview what will be published
npm pack --dry-run

# Create test package (if not using VS Code)
npm pack  # Creates project-fusion-x.x.x.tgz
```

#### Testing with Real Package Installation
```bash
# Install the test package globally
npm install -g ./temp/package/ # start line with sudo if you need admin rights

# Test commands (acts like real published package)
project-fusion --help
project-fusion --version
project-fusion init
project-fusion # Default: runs fusion

# Uninstall when done testing
npm uninstall -g project-fusion # start line with sudo if you need admin rights
```

### Publication Process

```bash
# 1. Final verification
npm pack --dry-run

# 2. Simulate publication (verifies authentication, package validity)
npm publish --dry-run

# 3. Create npm account and login (first time only)
# Visit https://www.npmjs.com/signup to create account
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