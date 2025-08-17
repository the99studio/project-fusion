# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-17

### Initial Release

Project Fusion is a CLI tool that merges multiple project files into a single file for easy sharing and collaboration. This initial release provides multiple output formats.

### Added

#### Core Features
- **Multi-format output generation** - Supports .txt, .md, and .html formats
  - Plain text (.txt) with file separators
  - Markdown (.md) with syntax highlighting and table of contents
  - HTML (.html) with responsive design and navigation
- **Configuration system** with JSON schema validation using Zod
  - Automatic configuration generation with `init` command
  - File extension support (35+ extensions) organized by category
  - Customizable ignore patterns with .gitignore integration
- **CLI interface** built with Commander.js
  - Simple command structure: `project-fusion`, `project-fusion init`, `project-fusion config-check`
  - Command-line options for dynamic configuration overrides
  - Version and help commands

#### File Extension Support (38 extensions)
- **Web Development**: .css, .html, .js, .jsx, .svelte, .ts, .tsx, .vue
- **Backend Languages**: .cs, .go, .java, .php, .py, .rb, .rs  
- **Configuration**: .json, .toml, .xml, .yaml, .yml
- **C/C++**: .c, .cc, .cpp, .h, .hpp
- **Scripts**: .bat, .cmd, .ps1, .sh
- **Godot Engine**: .cfg, .cs, .gd, .import, .tscn, .tres
- **Documentation**: .adoc, .md, .rst

#### Technical Features
- **TypeScript 5.9.2** with strict mode and ESM modules
- **Branded types** (FilePath) for type-safe path handling
- **Discriminated unions** for error handling (FusionResult)
- **Error handling** with FusionError class, error codes, and severity levels
- **Performance metrics** logging
- **Clipboard integration** with automatic fallback for CI environments

#### Testing and Quality
- **Test coverage** with Vitest integration tests
- **ESLint v9** flat configuration
- **SPDX license headers** in all source files
- **Modular architecture** with separation of concerns
- **Error boundaries** and failure handling

#### Configuration Features
- **Schema versioning** for future compatibility
- **Default values** with fallback configuration
- **gitignore integration**
- **Custom ignore patterns** with glob support
- **File size limits** to prevent memory issues
- **Subdirectory parsing** control

### Technical Implementation
- **Architecture** with separation between CLI, fusion logic, and utilities
- **Zod validation** for configuration validation
- **File scanning** with glob patterns and ignore filtering
- **File size limits** configurable per project
- **Cross-platform compatibility** (Windows, macOS, Linux)
- **Node.js 18+** requirement

### Security Features
- **Path traversal protection** - All file paths validated to remain within root directory
- **Symbolic link protection** - Symlinks detected and blocked by default with `follow: false` in glob operations
- **Binary file detection** - Automatic detection and skipping of binary files using null byte and non-printable character analysis
- **XSS prevention** - All HTML output properly escaped to prevent cross-site scripting attacks
- **Safe error handling** - Security-related errors logged without exposing sensitive path information
- **Comprehensive security testing** - 17 security tests covering path traversal, symlink attacks, and binary file handling

### Documentation
- README with quick start guide
- CLAUDE.md for AI context
- DEVELOPMENT.md for contributors
- CONTRIBUTING.md with guidelines
- MIT License

---

[1.0.0]: https://github.com/the99studio/project-fusion/releases/tag/v1.0.0