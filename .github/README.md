# GitHub Actions Configuration

This directory contains the CI/CD workflows for Project Fusion.

## Workflows

### 🔄 `ci.yml` - Continuous Integration
**Triggers:** Push/PR to `main` or `develop`

**What it does:**
- Tests on Node.js 18, 20, 22
- Cross-platform testing (Ubuntu, Windows, macOS)
- TypeScript compilation
- ESLint validation
- Full test suite execution
- Build verification
- CLI functionality testing
- Security audits

### 🚀 `release.yml` - Release Pipeline
**Triggers:** Version tags (v1.0.0, v2.1.0, etc.)

**What it does:**
- Creates GitHub releases
- Publishes to NPM (requires `NPM_TOKEN` secret)
- Runs full test suite before release

### 📝 `pr.yml` - Pull Request Checks
**Triggers:** Pull requests to `main`

**What it does:**
- Quality checks with coverage reporting
- Package integrity validation
- Automated PR comments with results

### 🔧 `dependabot.yml` - Dependency Updates
**Schedule:** Weekly on Mondays

**What it does:**
- Automated dependency updates
- Groups dev dependencies for cleaner PRs
- Updates GitHub Actions versions

## Required Secrets

For full functionality, set these repository secrets:

- `NPM_TOKEN` - For publishing to NPM registry
- `GITHUB_TOKEN` - Automatically provided by GitHub

## Badge URLs

Add these to your README:

```markdown
[![CI](https://github.com/the99studio/project-fusion/actions/workflows/ci.yml/badge.svg)](https://github.com/the99studio/project-fusion/actions/workflows/ci.yml)
```

## Local Testing

Simulate CI locally:

```bash
# Run the same checks as CI
npm run typecheck && npm run lint && npm test && npm run build

# Test CLI functionality
node dist/cli.js --help
mkdir test && cd test
echo 'console.log("test");' > test.js
node ../dist/cli.js --preview
```