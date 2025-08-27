Security Enhancements
- [ ] **HTML link security**: Add rel="noopener noreferrer" to external links (currently has rel="external" in output-strategy.ts:335)
- [ ] **File overwrite protection**: By default, prevent overwriting existing files or write to subfolder (./project-fusion/), add --overwrite flag

## Additional Security Enhancements

### HTML Security (High Priority)
- [ ] **Additional security headers**: Add X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: no-referrer meta tags
- [ ] **Enhanced CSP**: Add base-uri 'none' to Content-Security-Policy for base URI attack prevention
- [ ] **Link validation**: Validate internal href="#slug" links to prevent injection in table of contents

### Cross-Format Security (Low Priority)
- [ ] **Malicious pattern detection**: Detect and log suspicious patterns (javascript:, data: URLs, script tags) in file content
- [ ] **Output size limits**: Add configurable limits on generated file sizes to prevent DoS attacks on browsers/viewers
- [ ] **Content sanitization**: Add optional aggressive content sanitization mode for highly sensitive environments

### Bonus
 [ ] S'assurer que tous les problèmes de sécurité rencontrés lors du parsing des fichiers soient loggués en warning dans le project-fusion.log
 [ ] Avoir une fonction permettant de récupérer la liste des fichiers ayant un probleme de sécurité (peut être récupérer également la liste des warnings associés si possible pour utilisation dans un viewer tool?)