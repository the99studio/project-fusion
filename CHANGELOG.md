# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- HTML output generation with responsive design and interactive table of contents
- SPDX license headers in all source files (MIT + the99studio copyright)
- Enhanced error handling with FusionError class including error codes and severity levels
- Branded types for FilePath with validation
- Comprehensive integration tests for all major functionality
- Support for clipboard copying with automatic detection of non-interactive environments (CI)
- Performance metrics logging and benchmark tracking

### Changed
- **BREAKING**: CLI simplified - use `project-fusion` instead of `project-fusion fusion`
- **BREAKING**: Configuration structure flattened - removed nested `parsing` and `fusion` objects
- **BREAKING**: Removed PDF generation support (puppeteer dependency removed)
- File extension arrays now use `as const` assertions for better type safety
- All glob operations now use `follow: false` for security
- Error handling standardized across the codebase
- Alphabetical sorting applied to configuration objects and schemas

### Fixed
- CLI option inheritance between parent and subcommands
- TypeScript strict mode compliance with additional compiler flags
- ESLint configuration updated to v9 flat format
- Test coverage improved to near 100% with comprehensive integration tests

### Removed
- `fusion` subcommand from CLI (use bare `project-fusion` command instead)
- PDF generation functionality and puppeteer dependency
- Unused error codes and type definitions
- Dead code and unused imports/exports

### Security
- All file traversal operations use `follow: false` to prevent symlink attacks
- Clipboard operations disabled in non-interactive environments
- Enhanced input validation with branded types