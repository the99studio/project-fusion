## 3) CLI/UX
- [ ] **Option validation**: Validate numeric flags and show friendly errors when NaN (e.g., `--max-files=abc`).
- [ ] **`config-check` improvements**: Print effective groups/extensions table and highlight diffs from defaults. (Partially implemented; ensure coverage test exists.)

## 4) Output Quality
- [ ] **Markdown TOC anchors**: Use a stable slugger (e.g., GitHub‑style) rather than regex replace for headers; ensure duplicates are de‑duped.
- [ ] **HTML escaping audit**: Keep `escapeHtml()` coverage; add tests for `<script>`, quotes, and high Unicode.
- [ ] **Language hints**: Improve `getMarkdownLanguage()` mapping for uncommon extensions (e.g., `.gd`, `.tres`, `.tscn`). Add tests.
- [ ] **Version**: Add project-fusion version used to generate files

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