Security Enhancements
- [x] **Extended default ignore patterns**: Add more sensitive patterns (.ssh/, .aws/, .azure/, .gcloud/, *.p12, *.keystore, .*history, .npmrc, dist/**/*.map)
- [x] **HTML CSP header**: Add Content-Security-Policy meta tag to generated HTML (no scripts, restricted styles)
- [ ] **HTML link security**: Add rel="noopener noreferrer" to external links (currently has rel="external" in output-strategy.ts:335)
- [ ] **File overwrite protection**: By default, prevent overwriting existing files or write to subfolder (./project-fusion/), add --overwrite flag

## Additional Security Enhancements

### HTML Security (High Priority)
- [ ] **Additional security headers**: Add X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: no-referrer meta tags
- [ ] **Enhanced CSP**: Add base-uri 'none' to Content-Security-Policy for base URI attack prevention
- [ ] **Link validation**: Validate internal href="#slug" links to prevent injection in table of contents

### Markdown Security (Medium Priority)  
- [ ] **Markdown escaping**: Escape special Markdown characters ([, ], (, )) in filenames to prevent malicious link injection
- [ ] **Protocol detection**: Detect and handle javascript:, data:, vbscript: protocols in markdown content

### Cross-Format Security (Low Priority)
- [ ] **Malicious pattern detection**: Detect and log suspicious patterns (javascript:, data: URLs, script tags) in file content
- [ ] **Output size limits**: Add configurable limits on generated file sizes to prevent DoS attacks on browsers/viewers
- [ ] **Content sanitization**: Add optional aggressive content sanitization mode for highly sensitive environments