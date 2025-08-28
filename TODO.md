# TODO: Améliorations Essentielles Project Fusion

## 🔴 Priorité HAUTE (à faire en premier)

### Sécurité & Trust
• Créer `SECURITY.md` avec politique de disclosure
• Ajouter `publishConfig.provenance: true` dans package.json
• Créer `.github/CODEOWNERS` pour contrôle des reviews
• Activer GitHub CodeQL dans `.github/workflows/codeql.yml`

### Logging Sécurité (from ancien TODO)
• S'assurer que tous les problèmes de sécurité rencontrés lors de la fusion soient bien loggués en warning
• Avoir une fonction permettant de récupérer la liste des fichiers ayant un problème de sécurité

---

## 🟡 Priorité MOYENNE (amélioration performance & DX)

### Build Moderne
• Migrer de `tsc` vers `tsup` pour build 10x plus rapide
• Ajouter `noImplicitOverride: true` dans tsconfig.json
• Ajouter script `build:watch` pour développement

### Versioning Automatique
• Installer et configurer `@changesets/cli`
• Créer `.changeset/config.json`
• Ajouter workflow `.github/workflows/changesets.yml` pour Release PR auto

### Tests de Types
• Ajouter tests avec `expectTypeOf` de Vitest pour l'API publique
• Tester Fluent API et types exportés

---

## 🟢 Priorité BASSE (nice to have)

### CI/CD
• Configurer OIDC pour npm publish dans GitHub Actions
• Ajouter tags `next` et `canary` pour pre-releases NPM
• Ajouter benchmarks avec tinybench

### Documentation
• Créer table d'erreurs documentées (code → message → remédiation)
• Ajouter plus d'exemples d'utilisation programmatique dans README
• Documenter limitations connues

### Linting
• Ajouter `eslint-config-prettier` pour éviter conflits format
• Installer `eslint-plugin-security` pour détection anti-patterns

---

## 📝 Snippets Prêts à Copier

### SECURITY.md
```markdown
# Security Policy

## Reporting a Vulnerability
Please email security@the99studio.dev with details.
We aim to respond within 7 days.
```

### package.json - publishConfig
```json
{
  "publishConfig": { 
    "access": "public", 
    "provenance": true 
  }
}
```

### tsup dans package.json
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

### .github/CODEOWNERS
```
# Toute la base nécessite review
* @the99studio/core

# Workflows protégés  
.github/workflows/* @the99studio/secops
```

### .github/workflows/codeql.yml
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

### changesets config
```bash
npm install --save-dev @changesets/cli @changesets/changelog-github
npx changeset init
```

---

*Temps estimé total: ~4-5 heures de travail pour tout implémenter*