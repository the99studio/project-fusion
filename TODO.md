## 4) Output Quality
- [ ] **HTML escaping tests**: Add tests for `escapeHtml()` with `<script>`, quotes, and high Unicode (implementation exists in output-strategy.ts:38-45).

## 5) Tests
- [ ] **E2E huge project test**: Generate >3,000 files in a temp dir, verify memory stays below a threshold and that streaming works (post‑refactor).
- [ ] **Security fuzz**: Add tests for pathological lines/token lengths near limits and ensure placeholders are emitted deterministically.
- [ ] **Plugin API contract**: Add contract tests for all hooks (`initialize`, `beforeFileProcessing`, `afterFileProcessing`, etc.).
- [ ] **CLI smoke tests**: Add `config-check` and `init --force` smoke tests in CI matrix (Linux, macOS, Windows).

## 6) Packaging
- [ ] **Add `funding` field** in `package.json` repository metadata.

## 7) Documentation
- [ ] **README: Security knobs** section showing why `--allow-symlinks` and `--allow-external-plugins` are dangerous, with a small code sample (link to tests).

## 8) Security Enhancements
- [ ] **Extended default ignore patterns**: Add more sensitive patterns (.ssh/, .aws/, .azure/, .gcloud/, *.p12, *.keystore, .*history, .npmrc, dist/**/*.map)
- [ ] **Safe mode flag**: Add --safe-mode (default true) that enforces strict ignore patterns for secrets
- [ ] **HTML CSP header**: Add Content-Security-Policy meta tag to generated HTML (no scripts, restricted styles)
- [ ] **HTML link security**: Add rel="noopener noreferrer" to external links (currently has rel="external" in output-strategy.ts:335)
- [ ] **File overwrite protection**: By default, prevent overwriting existing files or write to subfolder (./project-fusion/), add --overwrite flag

@typescript-eslint/promise-function-async