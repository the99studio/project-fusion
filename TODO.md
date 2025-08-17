# TODO Project Fusion

## 🚨 Priorité Haute (Bloquants pour publication npm)

- [x] **Vérifier l'échappement HTML** dans `fusion.ts:259-264` - s'assurer que tout contenu injecté est sécurisé
- [ ] **Ajouter `publishConfig`** dans package.json : `"publishConfig": { "access": "public" }`
- [ ] **Tester `npm pack --dry-run`** avant publication
- [ ] **Créer SECURITY.md** avec politique de divulgation des vulnérabilités

## 🔧 Priorité Moyenne (Qualité & Robustesse)

- [ ] **ESLint améliorations** :
  - Activer `@typescript-eslint/recommended-type-checked`
  - Configurer resolver TypeScript pour `eslint-plugin-import`
  - Ajouter `.allowUnknownOption(false)` et `.showHelpAfterError(true)` au CLI

- [ ] **TypeScript renforcé** :
  - Ajouter `"moduleDetection": "force"` dans tsconfig.json
  - Créer types utilitaires `NonEmptyArray<T>` et `ExtensionGroup`

- [ ] **Sécurité fichiers** :
  - Vérifier que `follow: false` est bien utilisé dans glob
  - Ajouter validation que tous les chemins restent sous `rootDirectory`
  - Tests de sécurité : fichiers binaires, symlinks, chemins relatifs

## 📚 Documentation

- [ ] **Aligner la documentation** sur les 3 formats : `.txt`, `.md`, `.html`
- [ ] **Vérifier cohérence** entre README.md, CHANGELOG.md et code
- [ ] **Ajouter exemples** d'utilisation API programmatique

## 🧪 Tests

- [ ] **Tests E2E CLI** :
  - Test de la commande par défaut
  - Test `config-check`
  - Test clipboard en environnement non-TTY

- [ ] **Tests de sécurité** :
  - Injection HTML/XSS
  - Fichiers volumineux (>maxFileSizeKB)
  - Chemins hors arborescence

- [ ] **Property-based testing** avec `fast-check` pour filtres d'extensions
- [ ] **Snapshots** pour vérifier format MD/HTML généré

## ⚡ Optimisations (Priorité Basse)

- [ ] **Async generators** pour traitement de gros projets
- [ ] **AbortController** pour annulation gracieuse
- [ ] **API Fluent** pour meilleure DX

```javascript
// API Fluent proposée
projectFusion()
  .include(['web', 'backend'])
  .exclude(['*.test.ts'])
  .maxSize('2MB')
  .output(['md', 'html'])
  .generate()
```

## 🏗️ Architecture (Opportunités)

- [ ] **FileSystemAdapter** pour abstraction I/O
- [ ] **OutputStrategy** pattern pour formats
- [ ] **Plugin system** pour extensions custom

---

## ✅ Déjà fait (nettoyage récent)

- ✅ Dead code supprimé (`logConfigSummary`, `recordFile`)
- ✅ Imports alphabétiques
- ✅ TypeScript strict avec `noImplicitReturns`
- ✅ Nom de fichier log cohérent (`project-fusioned.log`)
- ✅ Configuration unifiée (forme aplatie)
- ✅ Tests benchmark corrigés
- ✅ ESM pur avec `"type": "module"`
- ✅ Gestion d'erreurs typées (`FusionError`)
- ✅ Sécurité clipboard (opt-in + skip CI/TTY)

---

## 📊 Métriques Qualité

**État actuel :**
- ✅ 94/94 tests passent
- ✅ TypeScript strict activé
- ✅ Zéro dead code
- ✅ Configuration Zod validée
- ✅ CLI robuste avec Commander.js

**Objectif publication :**
- [ ] 100% couverture sécurité
- [ ] Documentation alignée
- [ ] Tests E2E complets