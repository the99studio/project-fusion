# TODO Project Fusion

## 🚨 Priorité Haute (Bloquants pour publication npm)

- [ ] **Tester `npm pack --dry-run`** avant publication

## 🔧 Priorité Moyenne (Qualité & Robustesse)

- [x] **TypeScript renforcé** :
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

**Objectif publication :**
- [ ] 100% couverture sécurité
- [ ] Documentation alignée
- [ ] Tests E2E complets