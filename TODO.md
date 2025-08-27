## 5) Tests
- [ ] **CLI smoke tests**: Add `config-check` and `init --force` smoke tests in CI matrix (Linux, macOS, Windows).

## 8) Security Enhancements
- [ ] **Extended default ignore patterns**: Add more sensitive patterns (.ssh/, .aws/, .azure/, .gcloud/, *.p12, *.keystore, .*history, .npmrc, dist/**/*.map)
- [ ] **Safe mode flag**: Add --safe-mode (default true) that enforces strict ignore patterns for secrets
- [ ] **HTML CSP header**: Add Content-Security-Policy meta tag to generated HTML (no scripts, restricted styles)
- [ ] **HTML link security**: Add rel="noopener noreferrer" to external links (currently has rel="external" in output-strategy.ts:335)
- [ ] **File overwrite protection**: By default, prevent overwriting existing files or write to subfolder (./project-fusion/), add --overwrite flag