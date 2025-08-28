# TODO: Améliorations TypeScript "State of the Art"

## 🚨 Priorité HAUTE - Sécurité & Supply Chain

### Organisation & Repo
- [ ] Créer `.github/CODEOWNERS` pour contrôle des reviews obligatoires
- [ ] Créer `SECURITY.md` avec politique de disclosure et contact sécurité
- [ ] Activer GitHub CodeQL dans `.github/workflows/codeql.yml`
- [ ] Configurer branch protection rules sur `main` (review obligatoire, CI passing)
- [ ] Activer 2FA obligatoire pour l'organisation GitHub

### NPM & Provenance  
- [ ] Ajouter `publishConfig.provenance: true` dans package.json
- [ ] Configurer OIDC pour npm publish dans GitHub Actions
- [ ] Ajouter `packageManager: "npm@10.x.x"` dans package.json pour verrouiller la version

### Logging Sécurité (from existing TODO)
- [ ] S'assurer que tous les problèmes de sécurité rencontrés lors de la fusion soient bien loggués en warning dans le project-fusion.log
- [ ] Avoir une fonction permettant de récupérer la liste des fichiers ayant un problème de sécurité (peut être récupérer également la liste des warnings associés si possible pour utilisation dans un viewer tool?)

## ⚡ Priorité MOYENNE - TypeScript & Build

### TypeScript Config
- [ ] Ajouter `noImplicitOverride: true` dans tsconfig.json
- [ ] Changer `skipLibCheck: true` → `false` pour vérification complète des types
- [ ] Migrer vers `module: "ESNext"` et `moduleResolution: "Bundler"` pour build moderne

### Build & Bundle
- [ ] Migrer de `tsc` vers `tsup` ou `esbuild` pour build optimisé + sourcemaps
- [ ] Générer sourcemaps en production avec chemins relatifs sécurisés
- [ ] Ajouter script `build:watch` pour développement

### Tests de Types
- [ ] Installer et configurer `tsd` ou ajouter tests avec `expectTypeOf` de Vitest
- [ ] Créer tests de types pour API publique (Fluent API, types exportés)
- [ ] Ajouter tests de compatibilité des exports/imports

## 📦 Priorité MOYENNE - CI/CD & Releases

### Changesets & Versioning
- [ ] Installer et configurer `@changesets/cli` pour gestion versions/changelog
- [ ] Créer `.changeset/config.json` avec configuration
- [ ] Ajouter workflow `.github/workflows/changesets.yml` pour Release PR auto
- [ ] Migrer CHANGELOG.md vers format changesets

### CI Améliorations
- [ ] Ajouter tags `next` et `canary` pour pre-releases NPM
- [ ] Configurer cache `pnpm` + `tsbuildinfo` dans workflows
- [ ] Ajouter benchmarks comparatifs entre versions (regression tests)
- [ ] Ajouter scan ReDoS pour détecter regex vulnérables

## 🎨 Priorité BASSE - DX & Documentation

### Linting Additionnel
- [ ] Ajouter `eslint-plugin-promise` pour async/await best practices
- [ ] Ajouter `eslint-plugin-perfectionist` pour tri automatique imports
- [ ] Configurer Prettier avec intégration ESLint

### Documentation
- [ ] Configurer TypeDoc pour génération docs API
- [ ] Créer playground TypeScript interactif
- [ ] Ajouter plus d'exemples d'utilisation programmatique dans README
- [ ] Documenter limitations connues et cas d'usage

### Tooling Avancé
- [ ] Configurer API Extractor pour rapport surface publique
- [ ] Créer `create-project-fusion` CLI pour scaffolding projets
- [ ] Ajouter tests E2E avec exemples réels d'intégration

## ✅ Nice to Have (Optionnel)

- [ ] Support Deno/Bun avec tests de compatibilité
- [ ] Dual publishing CJS/ESM si demande utilisateurs
- [ ] Intégration Snyk/OSV-Scanner pour scan vulnérabilités
- [ ] Métriques de performance avec profiling automatisé
- [ ] Dashboard usage avec télémétrie opt-in
- [ ] Refactor `processFusion` (1500 lignes) en sous-modules
- [ ] Limiter taille de `MemoryFileSystemAdapter` pour éviter OOM

## 📊 Score Actuel: 30/35

### Breakdown:
- **Clarté produit**: 5/5 ✅
- **SOTA TypeScript**: 4/5 (manque tests types, certains flags)
- **Sécurité**: 4/5 (manque SECURITY.md, provenance, CodeQL)
- **Perf/bundle**: 4/5 (tsc au lieu de bundler moderne)
- **DX**: 4.5/5 (excellente base, manque TypeDoc)
- **CI/CD**: 3.5/5 (manque changesets, provenance, canary)
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

## Actions Immédiates Recommandées (Top 5)

1. **Créer SECURITY.md** avec email/process disclosure
2. **Ajouter publishConfig.provenance** dans package.json
3. **Installer changesets** pour versioning automatisé
4. **Activer CodeQL** dans GitHub Actions
5. **Migrer vers tsup** pour build optimisé

---

*Note: Le niveau actuel est déjà excellent (top 1% des projets TS). Ces améliorations visent la perfection absolue.*