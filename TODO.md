# TODO - Project Fusion

### 2. Refactor CLI Command Parsing ✅ COMPLETED
- [x] Remplacer le parsing manuel dans `src/cli.ts` (lignes 45-74)
- [x] Implémenter une vraie **commande par défaut** avec Commander.js
- [x] Supprimer `runDefaultCommand()` et la logique `hasKnownCommand`
- [x] Tester que toutes les options `--extensions`, `--root` fonctionnent

### 7. Sécurité & Robustesse  
- [ ] Vérifier que tous les parcours glob utilisent `follow: false`
- [ ] Désactiver clipboard en environnement non-interactif (CI)

### 8. Tests d'intégration manquants
- [ ] Tests pour `--extensions` (filtrage)
- [ ] Tests pour `.gitignore` + `ignorePatterns` 
- [ ] Tests pour `maxFileSizeKB` (skip gros fichiers)
- [ ] Tests pour parcours non-récursif
- [ ] Tests génération HTML
- [ ] Documentation génération HTML

### 9. Documentation utilisateur
- [ ] Section **"Examples"** dans README avec captures
- [ ] Section **"Programmatic API"** (usage de `processFusion`)
- [ ] Badges CI et coverage dans README
- [ ] Documenter installation locale (`npm install` sans global)

### 10. Fichiers projet standards
- [ ] Créer `SECURITY.md`
- [ ] Créer `CODE_OF_CONDUCT.md` 
- [ ] Créer `SUPPORT.md`
- [ ] Headers SPDX dans les sources (`// SPDX-License-Identifier: MIT`)

## 💡 Priorités BASSES (Améliorations DX)

### 11. Types utilitaires avancés
- [ ] `NonEmptyArray<T>` pour groupes d'extensions
- [ ] `const assertions` sur les extensions par défaut
- [ ] `ExtensionGroup`, `FilePath` validation renforcée
- [ ] Hiérarchie `FusionError` avec codes/severity

### 12. API Fluent (bonus DX)
- [ ] `FusionBuilder` par-dessus `processFusion`
- [ ] Pattern method chaining pour configuration

### 13. Tests avancés
- [ ] Property-based tests avec `fast-check`
- [ ] Snapshot tests pour sortie MD/HTML
- [ ] Mocks typés du filesystem

### 14. Features async modernes
- [ ] `AbortController` pour annuler les runs longs
- [ ] Async generators si streaming nécessaire
- [ ] Web Streams pour pipe vers stdout/fichiers

### 15. Outillage de publication
- [ ] Script `npm pack --dry-run` dans DEVELOPMENT.md
- [ ] Script `npm publish --dry-run` 
- [ ] Guide complet de publication

### 5. Documentation critique manquante
- [ ] Trier par ordre alphabétique un maximum de code et config pouvant être par ordre alphabétique
- [ ] Passer en 1.0.0.0
- [ ] Compléter `CHANGELOG.md` (format Keep a Changelog + SemVer)
- [ ] Finaliser le `package.json` (garder la structure moderne avec `exports`)