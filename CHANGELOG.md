# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.4] - 2025-11-26

### Added

#### New Feature: `includeFilenames` Configuration
- Added `includeFilenames` config option to include files without extensions
- Default includes: `.gitignore`, `CODEOWNERS`, `Dockerfile`, `Dockerfile.*`, `Dockerfile-*`, `Gemfile`, `Jenkinsfile`, `LICENSE`, `Makefile`, `Rakefile`, `Vagrantfile`
- Supports wildcard patterns for flexible matching

#### Extended File Support
- Added `.bash` and `.bats` extensions to the `scripts` extension group
- Added `.snap` extension to the `config` extension group for Vitest snapshots

#### Enhanced Logging
- Added SECURITY section to log: shows files with secrets redacted and secret types detected
- Added SPECIAL FILES section to log: shows `includeFilenames` pattern matches
- Added OUTPUT FILES section to log: shows generated file names with sizes
- Added CONTENT ANALYSIS section to log: shows binary files skipped, minified files detected, validation issues
- Sections only appear when relevant information is present

#### CI/CD Improvements
- Added new `security-audit.yml` workflow for scheduled daily security audits with automatic GitHub issue creation
- Added Node.js 20/22 matrix testing in `build-test.yml`
- Added build artifact caching between CI jobs for faster releases

### Changed
- Removed `.vscode/` from default ignore patterns to allow IDE configuration sharing
- Removed Dependabot configuration in favor of dedicated security-audit workflow
- Enabled dotfile scanning by default (`dot: true` in glob) to include `.github/`, `.claude/`, etc.
- Standardized `npm audit --audit-level=high` across all CI workflows

### Fixed
- Fixed clipboard memory issue: now checks file size before reading content
- Fixed plugin security: validation now explicitly happens before dynamic import
- Fixed Windows path comparison in plugin system using normalized separators
- Fixed type casting in Zod error handling using proper typed properties
- Fixed regex state management: use fresh regex instances to avoid lastIndex pollution
- Fixed unbounded binary file cache: added 10K entry limit with LRU-like eviction
- Refactored minification detection logic to `determineMinifiedFileHandling()` for clarity
- Optimized MemoryFS deduplication using path-based approach instead of content hashing

### Dependencies
- Updated `glob` from v11 to v13
- Updated `vitest` from v3 to v4
- Updated `clipboardy` from v4 to v5
- Updated `typescript` to 5.9.3
- Updated `zod` to 4.1.13
- Updated `actions/checkout` from v5 to v6
- Updated `actions/setup-node` from v4 to v6
- Updated `github/codeql-action` from v3 to v4
- Updated all ESLint-related packages to latest versions

## [1.1.3] - 2025-08-31

### Security
- Fixed path traversal vulnerability in `generatedFileName` configuration
- Added validation to prevent directory traversal attacks in output file names

## [1.1.2] - 2025-08-30

### Changed
- Cleaned up release workflow by removing diagnostic debug steps
- Production-ready OIDC publishing workflow

### Fixed
- Resolved npm OIDC authentication issues with Trusted Publishers

## [1.1.1] - 2025-08-30

### Fixed
- Fixed npm OIDC publishing workflow by updating npm to latest version
- Added diagnostic steps for troubleshooting authentication issues

### Changed
- Testing publishing workflow with strict 2FA settings

## [1.1.0] - 2025-08-29

### Added

#### Security Enhancements
- Added aggressive content sanitization for enhanced security
- Added clipboard size guards to prevent memory issues
- Added CodeQL security analysis workflow
- Added comprehensive security fuzzing tests with edge cases
- Added Content Security Policy (CSP) headers for HTML output
- Added dependency review workflow for automated security scanning
- Added file overwrite protection with confirmation prompts
- Added GitHub link security validation and escaping
- Added HTML escaping for all user content to prevent XSS
- Added Markdown protocol validation to prevent malicious links
- Added secret detection for sensitive file patterns (.ssh/, .aws/, .azure/, .gcloud/, *.p12, *.keystore, .*history, .npmrc, dist/**/*.map)
- Added security headers for enhanced protection
- Added version fallback mechanism for secure version reading

#### Core Features  
- Added anchor generation for improved navigation using github-slugger
- Added cancellation support with checkCancellation() for long operations
- Added configuration consistency validation tests
- Added ESM import validation and type safety tests
- Added file system streaming for better memory management
- Added fluent API type validation tests
- Added granular progress reporting for better user feedback
- Added output size limits with configurable thresholds
- Added plugin contract validation system
- Added plugin coverage testing framework
- Added project-fusion version tracking in generated files
- Added proper logger centralization system
- Added TypeScript strict configuration with noImplicitOverride

#### Development and CI/CD
- Added CODEOWNERS file for repository maintenance
- Added comprehensive ESLint configuration with security rules
- Added consistent-type-imports for better code organization
- Added cross-platform compatibility fixes (Windows, macOS, Linux)
- Added Dependabot for automated dependency updates
- Added enhanced test helpers for better test organization
- Added NPM provenance for supply chain security
- Added separate TypeScript configuration for tests

### Changed
- Enhanced CLI validation with proper NaN handling for numeric flags
- Improved configuration validation with better error messages
- Improved coverage reporting and test organization
- Improved Markdown language detection for better syntax highlighting
- Improved symlink handling with configuration warnings
- Optimized ESLint configuration for better performance
- Refactored logger system for centralized logging
- Updated development documentation with comprehensive guides
- Updated package dependencies to latest secure versions
- Updated README with better examples and documentation

### Fixed
- Fixed cross-platform file removal using cross-platform packages
- Fixed duplicate timestamp generation in output files
- Fixed file system adapter issues on Windows platforms
- Fixed lint execution on Windows environments
- Fixed macOS-specific test failures
- Fixed multiple logger initialization in test environments
- Fixed NPM badge in README to correctly display package version
- Fixed test isolation issues with memory filesystem

### Security
- Enhanced path traversal protection with comprehensive validation
- Improved binary file detection with null byte analysis
- Strengthened plugin security with external path validation
- Updated secret patterns for broader coverage of sensitive files

## [1.0.0] - 2025-08-23

### Initial Release

Project Fusion is a CLI tool that merges multiple project files into a single file for easy sharing and collaboration. This initial release provides multiple output formats.

### Added

#### Core Features
- **CLI interface** built with Commander.js
  - Command-line options for dynamic configuration overrides
  - Simple command structure: `project-fusion`, `project-fusion init`, `project-fusion config-check`
  - Version and help commands
- **Configuration system** with JSON schema validation using Zod
  - Automatic configuration generation with `init` command
  - Customizable ignore patterns with .gitignore integration
  - File extension support (35+ extensions) organized by category
- **Multi-format output generation** - Supports .txt, .md, and .html formats
  - HTML (.html) with responsive design and navigation
  - Markdown (.md) with syntax highlighting and table of contents
  - Plain text (.txt) with file separators

#### File Extension Support (38 extensions)
- **Backend Languages**: .cs, .go, .java, .php, .py, .rb, .rs
- **C/C++**: .c, .cc, .cpp, .h, .hpp
- **Configuration**: .json, .toml, .xml, .yaml, .yml
- **Documentation**: .adoc, .md, .rst
- **Godot Engine**: .cfg, .cs, .gd, .import, .tscn, .tres
- **Scripts**: .bat, .cmd, .ps1, .sh
- **Web Development**: .css, .html, .js, .jsx, .svelte, .ts, .tsx, .vue

#### APIs and Integration
- **File system adapters** - Abstraction layer with memory and disk implementations
- **Fluent API** - Chainable interface for configuration (`projectFusion().include(['web']).generate()`)
- **Memory management** - Built-in memory usage tracking and limits
- **Output strategies** - Pluggable output format system (Text, Markdown, HTML)
- **Plugin system** - Extensible architecture with hooks for custom processing
- **Programmatic API** - Use Project Fusion in other applications with progress reporting
- **VS Code Extension Support** - Progress callbacks and cancellation tokens for IDE integration

#### Technical Features  
- **Branded types** (FilePath) for type-safe path handling
- **Clipboard integration** with automatic fallback for CI environments
- **Content validation** - Detects base64 blocks >2KB, tokens >2000 chars, lines >5000 chars
- **Discriminated unions** for error handling (FusionResult)
- **Error handling** with FusionError class, error codes, and severity levels
- **Node.js 20.10+ requirement** for enhanced performance and features
- **Performance tracking** - BenchmarkTracker for metrics and optimization
- **Secret redaction** - Automatic detection and masking of sensitive information
- **TypeScript 5.9.2** with strict mode and ESM modules

#### Testing and Quality
- **Comprehensive test coverage** with Vitest - 20+ test suites
- **Error boundaries** and failure handling
- **ESLint v9** flat configuration with strict rules
- **Memory filesystem testing** for isolated unit tests
- **Modular architecture** with separation of concerns
- **Performance benchmarks** - Resource limit and throughput tests
- **Property-based testing** with fast-check for edge cases
- **SPDX license headers** in all source files

#### Configuration Features
- **Custom ignore patterns** with glob support
- **Default values** with fallback configuration
- **gitignore integration** with automatic .gitignore parsing
- **Preview mode** - List files without generating output
- **Resource limits** - File size, file count, and total size limits
- **Schema versioning** for future compatibility
- **Subdirectory parsing** control

### Technical Implementation
- **Architecture** with separation between CLI, fusion logic, and utilities
- **Automatic generated file exclusion** - Prevents including fusion outputs in new fusions
- **Cross-platform compatibility** (Windows, macOS, Linux)
- **File scanning** with glob patterns and ignore filtering
- **File size limits** configurable per project
- **Streaming support** for large file processing
- **Zod validation** for configuration validation with schema versioning

### Security Features
- **Binary file detection** - Automatic detection and skipping of binary files using null byte analysis
- **Comprehensive security testing** - 20+ security tests covering all attack vectors
- **Content validation** - Strict validation for base64, token length, and line length limits
- **Path traversal protection** - All file paths validated to remain within root directory
- **Plugin security** - External plugin loading disabled by default, path validation for plugin files
- **Safe error handling** - Security-related errors logged without exposing sensitive path information
- **Secret exclusion** - Automatic detection and redaction of API keys, tokens, and passwords
- **Symbolic link protection** - Symlinks detected and blocked by default, configurable via `allowSymlinks`
- **XSS prevention** - All HTML output properly escaped to prevent cross-site scripting attacks

### Documentation
- CHANGELOG.md with version history
- CLAUDE.md for AI context
- CONTRIBUTING.md with guidelines
- DEVELOPMENT.md for contributors
- MIT License
- README.md with quick start guide

---

[1.1.4]: https://github.com/the99studio/project-fusion/releases/tag/v1.1.4
[1.1.3]: https://github.com/the99studio/project-fusion/releases/tag/v1.1.3
[1.1.2]: https://github.com/the99studio/project-fusion/releases/tag/v1.1.2
[1.1.1]: https://github.com/the99studio/project-fusion/releases/tag/v1.1.1
[1.1.0]: https://github.com/the99studio/project-fusion/releases/tag/v1.1.0
[1.0.0]: https://github.com/the99studio/project-fusion/releases/tag/v1.0.0