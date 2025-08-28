# TODO: Améliorations TypeScript "State of the Art"

## 🚀 Plan de Sprint (5 jours)

• **Jour 1 - Sécurité/Supply Chain**
  - CODEOWNERS, branch protection, 2FA, SECURITY.md, CodeQL, publishConfig.provenance

• **Jour 2 - Build/TypeScript**  
  - Split tsconfig (lib vs tooling), moduleResolution: Bundler, tsup, sourcemaps

• **Jour 3 - CI/CD**
  - Changesets, Release PR, publish OIDC, tags next/canary

• **Jour 4 - Tests Types & Lint**
  - tsd/expectTypeOf, eslint-plugin-security, eslint-config-prettier

• **Jour 5 - Docs & Benchmarks**
  - API Extractor puis TypeDoc, tinybench, documentation limitations

---

## 🚨 Priorité HAUTE - Sécurité & Supply Chain

### Organisation & Repo
• Créer `.github/CODEOWNERS` pour contrôle des reviews obligatoires
• Créer `SECURITY.md` avec politique de disclosure et contact sécurité
• Activer GitHub CodeQL dans `.github/workflows/codeql.yml`
• Configurer branch protection rules sur `main` (review obligatoire, CI passing)
• Activer 2FA obligatoire pour l'organisation GitHub
• Créer templates PR/Issues avec checklist sécurité et tests

### NPM & Provenance  
• Ajouter `publishConfig.provenance: true` dans package.json
• Configurer OIDC pour npm publish dans GitHub Actions
• ~~Ajouter `packageManager: "npm@10.x.x"` dans package.json~~ (garder npm sans version fixée)

### Logging Sécurité (from existing TODO)
• S'assurer que tous les problèmes de sécurité rencontrés lors de la fusion soient bien loggués en warning
• Avoir une fonction permettant de récupérer la liste des fichiers ayant un problème de sécurité
• Créer table d'erreurs documentées (code → message → remédiation)

### Scan ReDoS Concret
• Installer `eslint-plugin-security` pour détection anti-patterns
• Ajouter validation avec `safe-regex` en CI
• Bannir `new RegExp(userInput)`, préférer patterns bornés et documentés

### ✅ Déjà fait
• Dependabot configuré (excellent setup avec groupes et stratégies)

---

## ⚡ Priorité MOYENNE - TypeScript & Build

### TypeScript Config (avec split tooling)
• Ajouter `noImplicitOverride: true` dans tsconfig.json
• Créer `tsconfig.lib.json` pour la build avec moduleResolution: Bundler
• Créer `tsconfig.tools.json` pour les scripts/outils avec NodeNext
• `skipLibCheck: false` en CI uniquement via tsconfig.ci.json

### Build & Bundle avec tsup
• Migrer de `tsc` vers `tsup` pour build optimisé
• Générer sourcemaps en production avec chemins relatifs sécurisés
• Ajouter script `build:watch` pour développement

### Tests de Types
• Installer et configurer `tsd` ou ajouter tests avec `expectTypeOf` de Vitest
• Créer tests de types pour API publique (Fluent API, types exportés)
• Ajouter tests de surface publique (ESM, NodeNext, bundler imports)

---

## 📦 Priorité MOYENNE - CI/CD & Releases

### Changesets & Versioning
• Installer et configurer `@changesets/cli`
• Créer `.changeset/config.json` avec configuration
• Ajouter workflow `.github/workflows/changesets.yml` pour Release PR auto
• Migrer CHANGELOG.md vers format changesets

### CI Améliorations  
• Ajouter tags `next` et `canary` pour pre-releases NPM
• Ajouter benchmarks avec tinybench (scénarios petit/moyen/gros repo)
• Snapshot résultats benchmarks, seuil échec si régression >10%

---

## 🎨 Priorité BASSE - DX & Documentation

### Linting (ordre important)
• Ajouter `eslint-config-prettier` pour éviter conflits format
• Ajouter `eslint-plugin-promise` pour async/await best practices
• ~~Ajouter `eslint-plugin-perfectionist`~~ (optionnel, peut créer des conflits)

### Documentation (API Extractor d'abord!)
• Configurer API Extractor pour verrouiller surface publique
• Configurer TypeDoc APRÈS API Extractor
• Ajouter plus d'exemples d'utilisation programmatique dans README
• Documenter limitations connues et cas d'usage

### Tooling Avancé
• Créer `create-project-fusion` CLI pour scaffolding projets
• Ajouter tests E2E avec exemples réels d'intégration

---

## ✅ Nice to Have (Optionnel)

• Support Deno/Bun avec conditional exports (quand marché mature)
• Dual publishing CJS/ESM si demande utilisateurs
• Intégration Snyk/OSV-Scanner pour scan vulnérabilités
• Métriques de performance avec profiling automatisé
• Dashboard usage avec télémétrie opt-in
• Refactor `processFusion` (1500 lignes) en sous-modules avec tests property-based
• Limiter taille de `MemoryFileSystemAdapter` pour éviter OOM

---

## ❌ Non Applicable / Overkill

• Migration vers pnpm (projet utilise npm avec package-lock.json)
• eslint-plugin-regexp (les règles actuelles suffisent)
• eslint-plugin-n (trop de friction pour peu de valeur)
• Commits signés obligatoires (friction inutile)
• Tests dans 3 contextes différents (overkill pour un CLI)

---

## 📊 Score Actuel: 30/35 → Objectif réaliste 33/35

### Breakdown après implémentation pragmatique:
• **Clarté produit**: 5/5 ✅
• **SOTA TypeScript**: 4.5/5 (avec tsup + tests types basiques)
• **Sécurité**: 4.5/5 (avec SECURITY.md + provenance + CodeQL)
• **Perf/bundle**: 4.5/5 (avec tsup + benchmarks simples)
• **DX**: 4.5/5 (README excellent, pas besoin de TypeDoc)
• **CI/CD**: 4.5/5 (avec changesets + provenance)
• **Observabilité**: 5/5 ✅

### Points déjà excellents:
• ✅ TypeScript 5.9 strict avec la plupart des flags recommandés
• ✅ ESLint v9 avec règles ultra-strictes
• ✅ Tests property-based avec fast-check
• ✅ Architecture modulaire propre (CLI, API, Fluent, plugins)
• ✅ Sécurité proactive (path traversal, XSS, secret redaction)
• ✅ Coverage tests > 80%
• ✅ Export maps ESM propres avec `sideEffects: false`
• ✅ Dependabot déjà configuré avec groupes intelligents

---

## Actions Immédiates Recommandées (Top 5)

1. **Créer SECURITY.md** avec politique de disclosure simple
2. **Ajouter publishConfig.provenance** dans package.json
3. **Installer changesets** pour versioning automatisé
4. **Migrer vers tsup** pour build 10x plus rapide
5. **Activer CodeQL** pour analyse sécurité automatique

---

## Snippets Prêts à l'Emploi

### SECURITY.md (minimal)
```markdown
# Security Policy

## Reporting a Vulnerability
Please email security@the99studio.dev with details.
We aim to respond within 7 days.
```

### publishConfig dans package.json
```json
{
  "publishConfig": { 
    "access": "public", 
    "provenance": true 
  }
}
```

### tsup build script
```json
{
  "scripts": {
    "build": "tsup src/index.ts --dts --format esm --sourcemap",
    "build:watch": "tsup src/index.ts --dts --format esm --sourcemap --watch"
  },
  "devDependencies": { 
    "tsup": "^8.0.0" 
  }
}
```

### CodeQL workflow minimal
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
      - uses: github/codeql-action/init@v3
        with: { languages: javascript-typescript }
      - uses: github/codeql-action/analyze@v3
```

---

*Note: Plan équilibré entre ambition technique et pragmatisme. Le projet atteindra un excellent niveau sans over-engineering.*