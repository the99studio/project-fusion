# TODO Project Fusion

## 🚨 Priorité Haute (Bloquants pour publication npm)

- [ ] **Tester `npm pack --dry-run`** avant publication

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