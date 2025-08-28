### Versioning Automatique avec gate
• Installer et configurer `@changesets/cli`  
• Créer `.changeset/config.json`
• Ajouter workflow `.github/workflows/changesets.yml` pour Release PR auto
• **Configurer gate CI: "no changeset, no release"** (échec si pas de changeset sur PR)

### Tests Critiques (minimum vital)
• **1 test de types** avec `expectTypeOf` pour la Fluent API
• **1 smoke test d'import ESM**: `import { projectFusion } from '@the99studio/project-fusion'`

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

### changesets config
```bash
npm install --save-dev @changesets/cli @changesets/changelog-github
npx changeset init
```