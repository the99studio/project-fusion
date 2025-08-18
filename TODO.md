# TODO — Project Fusion (Prioritized Review)

## 🟡 MEDIUM - Developer Experience

### ❤️ CLI Enhancements
- [ ] **Output format flags**: `--html`, `--md`, `--txt` (override config)
- [ ] **Naming flags**: `--name <filename>`, `--out <directory>`
- [ ] **Control flags**: `--no-clipboard`, `--groups <csv>`
- [ ] **Preview mode**: `--preview` to list files without generating output
- [ ] **Summary on empty**: Show helpful message when no files match

## 🧪 TESTING - Quality Assurance

### ❤️ End-to-End Testing
- [ ] **CLI E2E test suite**: Spawn actual binary with fixtures
  - Test exit codes, file generation, error messages
  - Test all CLI flags and combinations
  - Validate output file integrity

### ❤️ Performance Testing
- [ ] **Stress tests**: Generate thousands of files to validate caps
- [ ] **Memory leak tests**: Ensure proper cleanup in watch mode
- [ ] **Benchmark suite**: Track performance regressions

### Security Testing
- [ ] **Fuzzing**: Test with malformed inputs, special characters
- [ ] **Permission tests**: Verify behavior with read-only files/dirs

## 🔵 LOW - Nice to Have

### Documentation
- [ ] **Comparison table**: vs Repomix, code2prompt, repo2txt
- [ ] **Security guide**: Best practices for safe usage
- [ ] **API docs**: Generate from TSDoc comments

### HTML Output
- [ ] **Accessibility**: Add ARIA labels, skip links, keyboard navigation
- [ ] **Sticky TOC**: Make sidebar sticky with scroll spy
- [ ] **Line numbers**: Optional toggle for code blocks

### Build & CI
- [ ] **GitHub Action**: Automated test/build/publish workflow
- [ ] **Release automation**: Semantic versioning with conventional commits
- [ ] **Bundle optimization**: Consider tsup/rolldown for faster CLI starts

### Future Features
- [ ] **Watch mode**: Auto-regenerate on file changes
- [ ] **VS Code extension**: Quick preview and generation
- [ ] **Config profiles**: Named presets for different use cases
- [ ] **Plugin marketplace**: Community plugin discovery

---

## Implementation Notes

### Path.relative Implementation (High Priority)
```typescript
export function validateSecurePath(filePath: string, rootDirectory: string): string {
  const resolvedRoot = path.resolve(rootDirectory);
  const resolvedFile = path.resolve(filePath);
  const rel = path.relative(resolvedRoot, resolvedFile);
  
  // More robust than startsWith
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new FusionError(
      `Path traversal detected: '${filePath}' escapes root directory`,
      'PATH_TRAVERSAL',
      'error',
      { filePath, rootDirectory, resolvedFile, resolvedRoot, rel }
    );
  }
  return resolvedFile;
}
```
