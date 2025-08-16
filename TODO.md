# Project Fusion — TODO

## 🔴 PRIORITÉ 1 — Avant la 0.1.0 (Publish-Ready)
- [x] ✅ Corriger `package.json` pour séparer lib/CLI (`main`→`dist/index.js`, `types`, `exports`, `sideEffects:false`)
- [x] ✅ Synchroniser la version CLI avec `package.json` (import JSON dans `src/cli.ts`)
- [x] ✅ Ajouter `LICENSE` (MIT) et `CONTRIBUTING.md` + vérifier que README ne référence pas de fichiers manquants
- [x] ✅ Durcir sécurité: `copyToClipboard === true` only + `glob({ follow:false })`
- [x] ✅ Gérer Makefile/Dockerfile sans extension pour la coloration (`getMarkdownLanguage` via basename)
- [ ] ⏳ Tests unitaires minimum (Vitest) pour `utils`, `fusion`, `schema` (config OK/KO) - **PARTIELLEMENT FAIT** (tests de base présents mais à compléter)
- [x] ✅ Commande `--config-check` (valide `project-fusion.json` et affiche les groupes/extensions actifs)

## 🟠 PRIORITÉ 2 — Robustesse & perfs
- [ ] ❌ **Streaming** (lecture/écriture par chunks) pour gros projets
- [ ] ❌ Option `maxFileSizeKB` dans la config + skip/log des gros fichiers
- [ ] ❌ Étendre `ignorePatterns` par défaut: `*.zip`, `*.tgz`, `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.pdf`, `*.unitypackage`
- [ ] ⏳ Benchmarks de base (taille projet, nombre fichiers, durée, mémoire) - **PARTIELLEMENT FAIT** (métriques de base loggées)

## 🟡 PRIORITÉ 3 — DX/UX
- [ ] ❌ Rendre l'argument `[root]` optionnel par défaut dans la CLI (`project-fusion .` implicite)
- [ ] ❌ Messages d'erreur Zod plus pédagogiques (afficher le chemin et la valeur fautive) 
- [ ] ❌ Améliorer l'entête des fichiers générés (projet/package, date locale, version)
- [ ] ❌ Ajouter un flag `--no-md` / `--no-txt` pour sélectionner les formats de sortie

## 🔵 PRIORITÉ 4 — Qualité & écosystème
- [ ] ❌ Couverture de tests (report) et badge README
- [x] ✅ `CHANGELOG.md` (Conventional Commits) + `npm version` flow
- [ ] ❌ Exports additionnels (HTML/PDF) en option
- [ ] ❌ Templates de tickets/PR GitHub + Code of Conduct

---

## 📊 Statut détaillé des améliorations du directeur technique

### ✅ COMPLÉTÉ

1. **`package.json` NPM readiness**
   - Main pointe maintenant vers `dist/index.js`
   - Types, exports et sideEffects configurés
   - Files inclut LICENSE et CHANGELOG.md

2. **Version synchronisée**
   - Import de `package.json` dans `cli.ts` avec `assert { type: 'json' }`
   - Version automatiquement synchronisée

3. **Sécurité durcie**
   - `copyToClipboard === true` strict (pas de copie par défaut)
   - `glob({ follow: false })` pour éviter les symlinks

4. **Support Makefile/Dockerfile**
   - `getMarkdownLanguage` gère maintenant basename pour fichiers sans extension

5. **Commande `config-check`**
   - Validation complète du fichier de config
   - Affichage détaillé des groupes et extensions
   - Preview des fichiers qui seront découverts

6. **Fichiers ajoutés**
   - LICENSE (MIT)
   - CONTRIBUTING.md
   - CHANGELOG.md

### ⏳ EN COURS / PARTIELLEMENT FAIT

1. **Tests unitaires**
   - Tests de base présents pour schema, utils et integration
   - À compléter pour une couverture plus complète

2. **Métriques de performance**
   - Logging basique de durée et statistiques
   - Benchmarks formels à ajouter

### ❌ NON IMPLÉMENTÉ

1. **Mode streaming**
   - Toujours en lecture complète en mémoire
   - Nécessaire pour gros projets

2. **Option `maxFileSizeKB`**
   - Pas encore ajoutée au schema
   - Pas de skip des gros fichiers

3. **Patterns binaires supplémentaires**
   - Images, archives, PDFs pas encore dans ignorePatterns par défaut

4. **Argument `[root]` optionnel avec mode par défaut Commander**
   - Le mode par défaut existe mais pourrait utiliser l'API native de Commander

5. **Messages Zod améliorés**
   - Messages d'erreur basiques, pas de contexte enrichi

6. **Headers de fichiers améliorés**
   - Headers basiques, pas de version ni date locale

7. **Flags de format de sortie**
   - Génère toujours les deux formats (txt et md)

8. **Exports HTML/PDF**
   - Non implémenté

9. **Templates GitHub et badges**
   - Non créés

---

## 📝 Notes d'implémentation

- Le projet utilise bien TypeScript 5.9.2 strict, ESM, Commander.js, Zod
- Architecture clean avec types branded et unions discriminées
- Configuration avec fallbacks sur défaut si invalide
- Support .gitignore + patterns custom
- CLI ergonomique avec mode par défaut (sans sous-commande)