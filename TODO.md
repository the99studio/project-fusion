# Project Fusion — TODO

## 🔴 PRIORITY 1 — Before 0.1.0 (Publish-Ready)
- [ ] Fix `package.json` to separate lib/CLI (`main`→`dist/index.js`, `types`, `exports`, `sideEffects:false`)
- [ ] Sync CLI version with `package.json` (import JSON in `src/cli.ts`)
- [ ] Harden security: `copyToClipboard === true` only + `glob({ follow:false })`
- [ ] Handle Makefile/Dockerfile without extension for syntax highlighting (`getMarkdownLanguage` via basename)
- [ ] Minimum unit tests (Vitest) for `utils`, `fusion`, `schema` (config OK/KO)
- [ ] `--config-check` command (validate `project-fusion.json` and display active groups/extensions)

## 🟠 PRIORITY 2 — Robustness & Performance
- [ ] **Streaming** (read/write by chunks) for large projects
- [ ] `maxFileSizeKB` option in config + skip/log large files
- [ ] Extend default `ignorePatterns`: `*.zip`, `*.tgz`, `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.pdf`, `*.unitypackage`
- [ ] Extend `ignorePatterns` for Unreal assets as well
- [ ] Basic benchmarks (project size, file count, duration, memory)

## 🟡 PRIORITY 3 — DX/UX
- [ ] Make `[root]` argument optional by default in CLI (implicit `project-fusion .`)
- [ ] More helpful Zod error messages (display path and faulty value)
- [ ] Improve generated file headers (project/package, local date, version)
- [ ] Add `--no-md` / `--no-txt` flag to select output formats

## 🔵 PRIORITY 4 — Quality & Ecosystem
- [ ] Test coverage (report) and README badge
- [ ] `CHANGELOG.md` (Conventional Commits) + `npm version` flow
- [ ] Additional exports (HTML/PDF) as options
- [ ] GitHub issue/PR templates + Code of Conduct
- [ ] Linting/style pass (ESLint + "state of the art" TS config)
