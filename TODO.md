Security Enhancements
- [ ] **HTML link security**: Add rel="noopener noreferrer" to external links (currently has rel="external" in output-strategy.ts:335)
- [ ] **File overwrite protection**: By default, prevent overwriting existing files or write to subfolder (./project-fusion/), add --overwrite flag