## 4) Output Quality
- [ ] **HTML escaping audit**: Keep `escapeHtml()` coverage; add tests for `<script>`, quotes, and high Unicode.

## 5) Tests
- [ ] **E2E huge project test**: Generate >3,000 files in a temp dir, verify memory stays below a threshold and that streaming works (post‑refactor).
- [ ] **Security fuzz**: Add tests for pathological lines/token lengths near limits and ensure placeholders are emitted deterministically.
- [ ] **Plugin API contract**: Add contract tests for all hooks (`initialize`, `beforeFileProcessing`, `afterFileProcessing`, etc.).
- [ ] **CLI smoke tests**: Add `config-check` and `init --force` smoke tests in CI matrix (Linux, macOS, Windows).

## 6) Packaging
- [ ] **Add `funding` field** in `package.json` and repository directory metadata. Ensure `LICENSE` is included in `files`.
- [ ] **`engines` + `package.json` import**: Confirm Node 20+ can import JSON with `with { type: 'json' }` (ok). Add fallback path to read version if import fails.
- [ ] **Binary size**: Consider `exports` for subpaths only; keep `sideEffects: false`. Verify type generation for all sub‑exports.

## 7) Documentation
- [ ] **README: Security knobs** section showing why `--allow-symlinks` and `--allow-external-plugins` are dangerous, with a small code sample (link to tests).
- [ ] **DEVELOPMENT.md**: Add "Local plugin dev" example and notes on sandboxing expectations.
- [ ] **SECURITY.md**: Create security policy with vulnerability reporting process and contact information.

## 8) Security Enhancements
- [ ] **Extended default ignore patterns**: Add more sensitive patterns (.ssh/, .aws/, .azure/, .gcloud/, *.p12, *.keystore, .*history, .npmrc, dist/**/*.map)
- [ ] **Safe mode flag**: Add --safe-mode (default true) that enforces strict ignore patterns for secrets
- [ ] **HTML CSP header**: Add Content-Security-Policy meta tag to generated HTML (no scripts, restricted styles)
- [ ] **HTML link security**: Add rel="noopener noreferrer" to all external links (currently only has rel="external")
- [ ] **File overwrite protection**: By default, prevent overwriting existing files or write to subfolder (./project-fusion/), add --overwrite flag

## 9) Potential Improvements
- [ ] **RGPD/PII warning**: Add documentation note about not merging personal data without consent
- [ ] **Dependabot**: Enable security updates automation on GitHub repo
- [ ] **Node CI matrix**: Test on multiple Node versions (LTS-1, LTS, Current) instead of just 20.x and 22.x