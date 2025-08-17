# TODO - Project Fusion

Basé sur l'analyse du directeur de programmation, voici les tâches prioritaires pour amener le projet au niveau "state of the art".

## 🔥 Priorités HAUTES (Bloquantes)

### 1. Unification du modèle de configuration
- [x] **Choix définitif** : Structure aplatie (actuelle) vs imbriquée `fusion: {}`
- [x] Mettre à jour `CLAUDE.md` ligne 46 pour correspondre au code réel
- [x] Vérifier cohérence entre `src/types.ts`, `src/schema.ts`, `src/utils.ts`
- [x] Audit complet : chercher toutes les références à l'ancienne structure

### 2. Refactor CLI Command Parsing  
- [ ] Remplacer le parsing manuel dans `src/cli.ts` (lignes 45-74)
- [ ] Implémenter une vraie **commande par défaut** avec Commander.js
- [ ] Supprimer `runDefaultCommand()` et la logique `hasKnownCommand`
- [ ] Tester que toutes les options `--extensions`, `--root` fonctionnent

### 3. Configuration TypeScript stricte
- [ ] Ajouter dans `tsconfig.json` :
  - `"noUncheckedIndexedAccess": true`
  - `"exactOptionalPropertyTypes": true` 
  - `"verbatimModuleSyntax": true`
  - `"useUnknownInCatchVariables": true`
  - `"noPropertyAccessFromIndexSignature": true`
- [ ] Corriger toutes les erreurs TS qui en résultent

### 4. ESLint & Code Quality
- [ ] Créer `.eslintrc.json` avec config TypeScript stricte
- [ ] Ajouter rules : `no-explicit-any`, `prefer-readonly`, etc.
- [ ] Ajouter script `"lint": "eslint src/**/*.ts"`
- [ ] Corriger tous les warnings ESLint

### 5. Documentation critique manquante
- [ ] Compléter `CHANGELOG.md` (format Keep a Changelog + SemVer)
- [ ] Finaliser le `package.json` (garder la structure moderne avec `exports`)

## ⚠️ Priorités MOYENNES (Important)

### 6. Optimisation des dépendances
- [ ] Rendre `puppeteer` optionnel avec import dynamique
- [ ] Message clair si `puppeteer` absent pour génération PDF
- [ ] Test des imports conditionnels

### 7. Sécurité & Robustesse  
- [ ] Vérifier que tous les parcours glob utilisent `follow: false`
- [ ] ~~Corriger logique clipboard~~ ✅ **DÉJÀ CORRECT**
- [ ] Désactiver clipboard en environnement non-interactif (CI)

### 8. Tests d'intégration manquants
- [ ] Tests pour `--extensions` (filtrage)
- [ ] Tests pour `.gitignore` + `ignorePatterns` 
- [ ] Tests pour `maxFileSizeKB` (skip gros fichiers)
- [ ] Tests pour parcours non-récursif
- [ ] Tests génération HTML/PDF (avec/sans puppeteer)

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

---

## 📊 État actuel vs "State of the Art"

| Domaine | État actuel | Cible | Gap |
|---------|-------------|-------|-----|
| **Code TS** | Bon (strict de base) | Excellent | Flags stricts manquants |
| **Architecture** | Très bon | Excellent | Unification config |
| **CLI UX** | Bon | Excellent | Default command |
| **Tests** | Base solide | Excellent | Tests intégration |
| **Docs** | Correct | Excellent | API + Examples |
| **npm ready** | Presque | Excellent | CHANGELOG + lint |

## 🎯 Milestone de release

**v1.0.0** : Compléter toutes les priorités HAUTES + MOYENNES 1-7

**v1.1.0** : Ajouter priorités MOYENNES 8-10 + BASSES sélectionnées

---

*Dernière mise à jour : Analyse du directeur de programmation - 2025-08-17*