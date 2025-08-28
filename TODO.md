# TODO: Améliorations TypeScript "State of the Art"

## 🚀 Plan de Sprint (5 jours)

**Jour 1 - Sécurité/Supply Chain**
- CODEOWNERS, branch protection, 2FA, SECURITY.md, CodeQL, publishConfig.provenance

**Jour 2 - Build/TypeScript**  
- Split tsconfig (lib vs tooling), moduleResolution: Bundler, tsup, sourcemaps

**Jour 3 - CI/CD**
- Changesets, Release PR, publish OIDC, tags next/canary

**Jour 4 - Tests Types & Lint**
- tsd/expectTypeOf, eslint-plugin-security, eslint-config-prettier, perfectionist

**Jour 5 - Docs & Benchmarks**
- API Extractor puis TypeDoc, tinybench, documentation limitations

---

## 🚨 Priorité HAUTE - Sécurité & Supply Chain

### Organisation & Repo
- [ ] Créer `.github/CODEOWNERS` pour contrôle des reviews obligatoires
```
# Toute la base nécessite review de l'équipe core
* @the99studio/core

# Workflows protégés  
.github/workflows/* @the99studio/secops
```

- [ ] Créer `SECURITY.md` avec politique de disclosure et contact sécurité
```markdown
# Security Policy

## Supported Versions
We support the latest minor for the current major (MAJOR.x).

## Reporting a Vulnerability
Please email security@the99studio.dev with:
- Affected version(s)
- PoC / Steps to reproduce
- Impact assessment (CVSS if possible)

We aim to acknowledge in 48h and provide a remediation plan within 7 days.

## Disclosure
Coordinated disclosure preferred. We will credit reporters unless anonymity is requested.
```

- [ ] Activer GitHub CodeQL dans `.github/workflows/codeql.yml`
```yaml
name: codeql
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
  schedule: [{ cron: '0 3 * * 1' }]
permissions:
  actions: read
  contents: read
  security-events: write
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: github/codeql-action/init@v3
        with: { languages: javascript-typescript }
      - uses: github/codeql-action/analyze@v3
```

- [ ] Configurer branch protection rules sur `main` (review obligatoire, CI passing)
- [ ] Activer 2FA obligatoire pour l'organisation GitHub
- [ ] Créer templates PR/Issues avec checklist sécurité et tests

### NPM & Provenance  
- [ ] Ajouter `publishConfig.provenance: true` dans package.json
```json
{
  "publishConfig": { "access": "public", "provenance": true }
}
```

- [ ] Configurer OIDC pour npm publish dans GitHub Actions
```yaml
permissions:
  contents: read
  id-token: write  # OIDC
  packages: write

steps:
  - uses: actions/checkout@v4
  - run: npm ci
  - run: npm run build
  - name: Publish with provenance
    run: npm publish --provenance --access public
    env:
      NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Logging Sécurité (from existing TODO)
- [ ] S'assurer que tous les problèmes de sécurité rencontrés lors de la fusion soient bien loggués en warning dans le project-fusion.log
- [ ] Avoir une fonction permettant de récupérer la liste des fichiers ayant un problème de sécurité
- [ ] Créer table d'erreurs documentées (code → message → remédiation)

### Scan ReDoS Concret
- [ ] Installer `eslint-plugin-security` pour détection anti-patterns
- [ ] Ajouter validation avec `safe-regex` en CI
- [ ] Bannir `new RegExp(userInput)`, préférer patterns bornés et documentés

## ⚡ Priorité MOYENNE - TypeScript & Build

### TypeScript Config (avec split tooling)
- [ ] Ajouter `noImplicitOverride: true` dans tsconfig.json
- [ ] Créer `tsconfig.lib.json` pour la build avec moduleResolution Bundler
```json
// tsconfig.lib.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "verbatimModuleSyntax": true,
    "skipLibCheck": false
  }
}
```
- [ ] Créer `tsconfig.tools.json` pour les scripts/outils
```json
// tsconfig.tools.json  
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "skipLibCheck": true
  }
}
```
- [ ] `skipLibCheck: false` en CI uniquement (tsconfig.ci.json)

### Build & Bundle avec tsup
- [ ] Migrer de `tsc` vers `tsup` pour build optimisé
```json
// package.json
{
  "scripts": {
    "build": "tsup src/index.ts --dts --format esm --sourcemap",
    "build:watch": "tsup src/index.ts --dts --format esm --sourcemap --watch"
  },
  "devDependencies": { "tsup": "^8.0.0" }
}
```
- [ ] Générer sourcemaps en production avec chemins relatifs sécurisés
- [ ] Ajouter script `build:watch` pour développement

### Tests de Types
- [ ] Installer et configurer `tsd` ou ajouter tests avec `expectTypeOf` de Vitest
- [ ] Créer tests de types pour API publique (Fluent API, types exportés)
- [ ] Ajouter tests de surface publique (ESM, NodeNext, bundler imports)

## 📦 Priorité MOYENNE - CI/CD & Releases

### Changesets & Versioning
- [ ] Installer et configurer `@changesets/cli`
```bash
npm install --save-dev @changesets/cli @changesets/changelog-github
npx changeset init
```
- [ ] Créer `.changeset/config.json`
```json
{
  "$schema": "https://unpkg.com/@changesets/config/schema.json",
  "changelog": "@changesets/changelog-github",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch"
}
```
- [ ] Ajouter workflow `.github/workflows/changesets.yml`
```yaml
name: changesets
on:
  push: { branches: [main] }
permissions:
  contents: write
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - run: npm ci
      - run: npm run build
      - uses: changesets/action@v1
        with:
          publish: npm publish --access public --provenance
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### CI Améliorations  
- [ ] Ajouter tags `next` et `canary` pour pre-releases NPM
- [ ] Ajouter benchmarks avec tinybench (scénarios petit/moyen/gros repo)
- [ ] Snapshot résultats benchmarks, seuil échec si régression >10%

## 🎨 Priorité BASSE - DX & Documentation

### Linting (ordre important)
- [ ] Ajouter `eslint-config-prettier` pour éviter conflits format
- [ ] Ajouter `eslint-plugin-promise` pour async/await best practices
- [ ] Ajouter `eslint-plugin-perfectionist` APRÈS règles d'import

### Documentation (API Extractor d'abord!)
- [ ] Configurer API Extractor pour verrouiller surface publique
- [ ] Configurer TypeDoc APRÈS API Extractor
- [ ] Ajouter plus d'exemples d'utilisation programmatique dans README
- [ ] Documenter limitations connues et cas d'usage

### Tooling Avancé
- [ ] Créer `create-project-fusion` CLI pour scaffolding projets
- [ ] Ajouter tests E2E avec exemples réels d'intégration

## ✅ Nice to Have (Optionnel)

- [ ] Support Deno/Bun avec conditional exports
```json
{
  "exports": { 
    ".": { 
      "deno": "./deno.ts", 
      "import": "./dist/index.js" 
    }
  }
}
```
- [ ] Dual publishing CJS/ESM si demande utilisateurs
- [ ] Intégration Snyk/OSV-Scanner pour scan vulnérabilités
- [ ] Métriques de performance avec profiling automatisé
- [ ] Dashboard usage avec télémétrie opt-in
- [ ] Refactor `processFusion` (1500 lignes) en sous-modules avec tests property-based
- [ ] Limiter taille de `MemoryFileSystemAdapter` pour éviter OOM

## ❌ Non Applicable

- Migration vers pnpm (projet utilise npm avec package-lock.json existant)

---

## 📊 Score Actuel: 30/35 → Objectif 35/35

### Breakdown après implémentation:
- **Clarté produit**: 5/5 ✅
- **SOTA TypeScript**: 5/5 (avec tests types + flags + bundler moderne)
- **Sécurité**: 5/5 (avec SECURITY.md + provenance + CodeQL)
- **Perf/bundle**: 5/5 (avec tsup + benchmarks)
- **DX**: 5/5 (avec TypeDoc + API Extractor)
- **CI/CD**: 5/5 (avec changesets + provenance + canary)
- **Observabilité**: 5/5 ✅

### Points déjà excellents:
- ✅ TypeScript 5.9 strict avec la plupart des flags recommandés
- ✅ ESLint v9 avec règles ultra-strictes
- ✅ Tests property-based avec fast-check
- ✅ Architecture modulaire propre (CLI, API, Fluent, plugins)
- ✅ Sécurité proactive (path traversal, XSS, secret redaction)
- ✅ Coverage tests > 80%
- ✅ Export maps ESM propres avec `sideEffects: false`

---

## Actions Immédiates Recommandées (Jour 1)

1. **Créer SECURITY.md** avec snippet ci-dessus
2. **Ajouter publishConfig.provenance** dans package.json
3. **Créer CODEOWNERS** avec snippet ci-dessus
4. **Activer CodeQL** avec workflow ci-dessus
5. **Configurer branch protection** sur main

---

*Note: Avec ces ajustements recommandés par le directeur technique, le projet atteindra le score parfait 35/35 tout en restant pragmatique et maintenable.*