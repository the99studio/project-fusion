# TODO — Project Fusion (reviewed)

> Prioritized checklist based on a deep review of the repo. ✅ = done, ⏭️ = optional/nice-to-have.

## 🔴 High priority (security & correctness)

- [ ] **Harden path validation**: switch `validateSecurePath` to a `path.relative` check to avoid edge cases on Windows/case-insensitive FS. Add unit tests for prefix-collision paths (e.g., `C:\foo` vs `C:\foobar`).  
- [ ] **Cap work**: add `maxFiles` and `maxTotalSizeMB` safeguards to avoid huge scans in large monorepos. Fail gracefully with a helpful message and a `--include` tip.
- [ ] **Symlink policy surfaced in config**: expose `allowSymlinks` in `project-fusion.json` with defaults and CLI flag; document risks.
- [ ] **Ignore patterns**: add a test that validates each default ignore glob compiles and does not over-match common source files (e.g., `*.svg` might be useful when documenting icons). Consider moving image/doc/media globs to `suggestedIgnores` and keeping the default set leaner.

## 🟡 Medium priority (DX & UX)

- [ ] **Subpath exports**: in `package.json`, add exports for `./api`, `./fluent`, `./adapters`, `./plugins`, `./strategies` to support `import { projectFusion } from "project-fusion/fluent"`.
- [ ] **CLI polish**: add flags `--html/--md/--txt`, `--name <file>`, `--out <dir>`, `--no-clipboard`, `--groups <csv>`, mirroring the programmatic API. Show a short summary when no files matched.
- [ ] **Preview/dry-run**: `project-fusion --preview` to print the file list without writing output (use the existing “config-check preview” helper internally).
- [ ] **Line numbers toggle**: optional line numbers in text/markdown output for easier referencing in code reviews.
- [ ] **HTML accessibility**: add skip links and `aria-label`s; consider a sticky sidebar TOC.

## 🧪 Testing

- [ ] **CLI E2E test**: spawn the built binary with temporary fixtures; assert exit codes and generated files.
- [ ] **Path traversal tests**: add unicode/normalization edge cases (NFKC/NFD), long path segments, and dot-dot segments split across components.
- [ ] **Performance tests**: generate thousands of tiny files and a few huge files to verify caps & throughput reporting.
- [ ] **Plugin system tests**: fixture plugin that registers output strategies and extra extensions; assert life-cycle hooks ordering.

## 🧰 TypeScript & Build

- [ ] **Types**: keep `tsconfig.json` strict; consider marking public API with `/** @public */` and generating API docs (TS docgen).
- [ ] **Emit bundles**: publish both ESM `.js` + `.d.ts` and optionally a minified CLI bundle via `tsup` or `rolldown` for faster cold starts.
- [ ] **Runtime guards**: narrow some `unknown` catch blocks to preserve stack plus code (`FusionError` factory helpers).

## 📦 Distribution & CI

- [ ] **GitHub Action**: job to run tests, typecheck, lint, build, and upload artifacts; on release, `npm publish --provenance`.
- [ ] **Ignore files**: ensure `.npmignore` (or `files` field) excludes examples/fixtures; keep `dist/` only.
- [ ] **Smoke test**: postpublish script that `npx project-fusion --version` and `node -e "require('project-fusion')"` in a throwaway temp project.

## 📚 Docs

- [ ] **README**: add quickstart (CLI + API + Fluent), security notes (path traversal & symlinks), config reference table, and comparison with alternatives.
- [ ] **Examples**: include 2–3 tiny example projects and the resulting outputs (txt/md/html).

---

## Suggested code patch — safer path validation

```ts
// utils.ts
import path from "node:path";

export function validateSecurePath(filePath: string, rootDirectory: string): string {
  try {
    const resolvedRoot = path.resolve(rootDirectory);
    const resolvedFile = path.resolve(filePath);
    const rel = path.relative(resolvedRoot, resolvedFile);

    // If rel starts with '..' or is absolute, the file escapes the root.
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw new FusionError(
        `Path traversal detected: '${filePath}' escapes root directory '${rootDirectory}'`,
        'PATH_TRAVERSAL',
        'error',
        { filePath, rootDirectory, resolvedFile, resolvedRoot, rel }
      );
    }
    return resolvedFile;
  } catch (error) {
    if (error instanceof FusionError) throw error;
    throw new FusionError(`Invalid path: '${filePath}'`, 'INVALID_PATH', 'error', {
      filePath, rootDirectory, originalError: error
    });
  }
}
```

## Sample `exports` map

```jsonc
// package.json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./api": {
      "types": "./dist/api.d.ts",
      "import": "./dist/api.js"
    },
    "./fluent": {
      "types": "./dist/fluent.d.ts",
      "import": "./dist/fluent.js"
    },
    "./adapters": {
      "types": "./dist/adapters/file-system.d.ts",
      "import": "./dist/adapters/file-system.js"
    },
    "./plugins": {
      "types": "./dist/plugins/plugin-system.d.ts",
      "import": "./dist/plugins/plugin-system.js"
    },
    "./strategies": {
      "types": "./dist/strategies/output-strategy.d.ts",
      "import": "./dist/strategies/output-strategy.js"
    }
  }
}
```

