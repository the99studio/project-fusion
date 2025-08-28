### Logging Sécurité (from ancien TODO)
• S'assurer que tous les problèmes de sécurité rencontrés lors de la fusion soient bien loggués en warning

---

## 🟡 Priorité MOYENNE (amélioration performance & DX)

### Build Moderne avec tsup
• Migrer de `tsc` vers `tsup` pour build 10x plus rapide
• Ajouter scripts: `"build": "tsup"`
• Mettre à jour CI pour utiliser: `npm ci && npm run build`

### Versioning Automatique avec gate
• Installer et configurer `@changesets/cli`  
• Créer `.changeset/config.json`
• Ajouter workflow `.github/workflows/changesets.yml` pour Release PR auto
• **Configurer gate CI: "no changeset, no release"** (échec si pas de changeset sur PR)

### Tests Critiques (minimum vital)
• **1 test de types** avec `expectTypeOf` pour la Fluent API
• **1 smoke test d'import ESM**: `import { projectFusion } from '@the99studio/project-fusion'`

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

### package.json - prerelease
```json
{
  "scripts": {
    "prerelease": "npm pack && tar -tzf *.tgz && rm -f *.tgz"
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