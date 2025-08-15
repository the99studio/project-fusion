# AICodeSync

## Overview
AICodeSync enables efficient project file management and sharing with AI assistants. It allows merging multiple files into a single file and applying changes using unified diff format.

## Prerequisites
- Node.js 18 or higher
- Git (recommended for version control)
- pnpm (recommended for package management)
```bash
npm install -g pnpm
```

This command requires to be executed as an admin on MacOs:
```bash
sudo -s
```

Setup pnpm:
```bash
pnpm setup
```

## Installation

1. Install it globally with pnpm:
```bash
pnpm add -g ai-code-sync
```

Note: If you want to uninstall AICodeSync at some point:
```bash
pnpm uninstall -g ai-code-sync
```

2. Navigate to your project directory
```bash
cd yourprojectdirectory/
```

3. Initialize AICodeSync in your project
```bash
ai-code-sync init
```

## Project Structure
```
/ai-code-sync
  /packages
    /core                       # Core functionality
    /cli                        # CLI implementation
  /.ai-code-sync
    /fusion                     # Generated fusion files
    /applydiff                  # Generated diff files
  ai-code-sync.json             # Configuration file
  pnpm-workspace.yaml           # Workspace configuration
  tsconfig.base.json            # Base TypeScript configuration
  package.json                  # Root package.json
```

## Configuration
The tool uses a configuration file `ai-code-sync.json`:

```json
{
  "aiAttribution": {
    "commentBegin": "BEGIN - AI Generated @[timestamp] by [AIName] GUID=[Guid]",
    "commentEnd": "END - AI Generated GUID=[Guid]",
    "enabled": true
  },
  "applydiff": {
    "applydiff_log": "apply_diff.log",
    "diff_file": "project_files_diff.txt",
    "directory": "./.ai-code-sync/applydiff"
  },
  "fusion": {
    "directory": "./.ai-code-sync/fusion",
    "fusion_file": "project_files_fusioned.txt",
    "fusion_log": "fusion.log"
  },
  "parsedFileExtensions": {
    "backend": [".cs", ".go", ".java", ".php", ".py", ".rb", ".rs"],
    "config": [".json", ".toml", ".xml", ".yaml", ".yml"],
    "cpp": [".c", ".cc", ".cpp", ".h", ".hpp"],
    "scripts": [".bat", ".cmd", ".ps1", ".sh"],
    "web": [".js", ".jsx", ".svelte", ".ts", ".tsx", ".vue"]
  },
  "parsing": {
    "parseSubDirectories": true,
    "rootDirectory": "."
  },
  "useAICodeSyncIgnoreForExcludes": true,
  "useGitIgnoreForExcludes": true
}
```

## Usage

1. Run fusion to generate a combined file.
```bash
ai-code-sync fusion
```
It should be in the fusion.directory/fusion.fusion_file from ai-code-sync.json.
Ex: ./.ai-code-sync/fusion/project_files_fusioned.txt

2. Share the generated file with the AI using this prompt:
```
I'm going to send you a code file that follows a specific format. It's a merged file containing my entire project, where each file is separated by a special marker.

Rules:
1. Files start with a header:
   ### /path/to/file.ext
   # Hash: [file_hash]

2. When modifying a file, you MUST use the complete unified diff format:
   --- a/path/to/file.ext
   +++ b/path/to/file.ext
   @@ -line,count +line,count @@
   [diff content]

3. Files can be:
   - Modified (using unified diff format as shown above)
   - Renamed: ### /old/path.tsx [RENAME] /new/path.tsx
   - New: ### /path/to/file.tsx [NEW]
   - Deleted: ### /path/to/file.tsx [DELETE]

4. For our exchanges:
   - I will send you my code in this format
   - You must ALWAYS respond using EXACTLY the same format including file hashes
   - All files in your response must be sorted alphabetically by path
   - Never omit the hash line or the unified diff headers (--- and +++)
   - Everything should be generated in english
   - Reply with an artifact

IMPORTANT: The format must be followed precisely or the diff tool will fail to recognize your changes.
```

Example of response:
```
### /components/Button.tsx
# Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
--- a/components/Button.tsx
+++ b/components/Button.tsx
@@ -1,3 +1,3 @@
-old button code
+new button code
 unchanged line
-another old line
+another new line

### /components/Card.tsx [RENAME] /components/NewCard.tsx
# Hash: f8c3bf28b236ed1d3644dd5b66728c3413679c7e6efcb2a79da143e9c6bb19d0
--- a/components/Card.tsx
+++ b/components/NewCard.tsx
@@ -1,2 +1,2 @@
-old card code
+new card code
 unchanged line

### /components/Header.tsx [NEW]
export const Header = () => {
  return <header>New Component</header>;
};
```

3. Place the AI's response in the applydiff.directory/applydiff.diff_file from ai-code-sync.json.
Ex: ./.ai-code-sync/applydiff/project_files_diff.txt


4. Apply changes from the AI
```bash
ai-code-sync applydiff
```

## Unified Diff
The tool uses unified diff format for file modifications. Here are complete examples for all operations:

1. File modification with multiple sections:
```
### /path/to/file.tsx
# Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
--- a/path/to/file.tsx
+++ b/path/to/file.tsx
@@ -1,5 +1,7 @@
+// Added at start
+// Another line at start
 existing line
-removed line
+modified line
 unchanged line
-old line
+new line
+// Added at end
+// Another line at end
```

2. File rename with modifications:
```
### /path/to/oldfile.tsx [RENAME] /path/to/newfile.tsx
# Hash: f8c3bf28b236ed1d3644dd5b66728c3413679c7e6efcb2a79da143e9c6bb19d0
--- a/path/to/oldfile.tsx
+++ b/path/to/newfile.tsx
@@ -1,3 +1,3 @@
-old content
+new content
 unchanged line
-another old line
+another new line
```

3. New file:
```
### /path/to/newfile.tsx [NEW]
export const Header = () => {
  return <header>New Component</header>;
};
```

4. File deletion:
```
### /path/to/oldfile.tsx [DELETE]
```

## Performance Considerations

- File size limits: Be aware that AI assistants have limits on the amount of data they can process. Configure your extensions and exclusions appropriately.
- For large projects, consider using more specific extension groups to reduce the total size of the fusion file.
- Use the `--extensions` parameter to focus only on relevant file types for your current task.

## Security Considerations

When using AICodeSync, please be aware of the following security considerations:

- **Sensitive Data**: AICodeSync does not automatically filter out sensitive data. Be cautious about what files you include in your fusion.
- **.aicodesyncignore**: Use a `.aicodesyncignore` file (similar to `.gitignore`) to exclude sensitive files and directories from being processed.
- **API Keys and Credentials**: Never share files containing API keys, passwords, or other credentials with AI assistants.
- **Personal Information**: Be mindful of including files that might contain personal information.

Example `.aicodesyncignore` file:
```
# Credentials and environment variables
.env
.env.*
**/credentials/*

# Secret configuration
**/secrets/*
**/config/secrets.json

# Key files
*.pem
*.key

# Package files
package-lock.json

# Directories to exclude
/.ai-code-sync/
```

To enable this feature, update your configuration:
```json
{
  "useAICodeSyncIgnoreForExcludes": true
}
```

## Distribution

AICodeSync is available through:
- **GitHub**: Source code and issue tracking at [github.com/GagaPlayerOne/ai-code-sync](https://github.com/GagaPlayerOne/ai-code-sync)
- **NPM**: Package distribution at [npmjs.com/package/ai-code-sync](https://www.npmjs.com/package/ai-code-sync)

## Future Improvements

We're planning several enhancements for AICodeSync:

### User Interfaces
- VS Code extension for seamless integration
- Electron desktop application for standalone use
- Web interface for browser-based operation
- Browser extensions for direct integration with AI assistant web interfaces

### IDE Support
- Visual Studio integration with direct sync buttons and diff previews in the editor
- JetBrains IDEs (Rider, IntelliJ) plugin with two-way sync capabilities
- Contextual menu integration for selecting specific files or directories to fusion

### Intelligent File Selection
- Dependency-based file inclusion based on imports/exports
- Identification of core files for specific functionalities
- Logical file grouping suggestions

### Workflow Automation
- End-to-end process automation (fusion → sharing → application)
- Direct integration with AI assistant APIs (Claude, ChatGPT, Mistral)
- Session management for tracking changes

### AI Attribution
- Option to automatically tag AI-generated code with comments
```
# AI BEGIN - Generated @[timestamp] by [AIName]
// Here code generated by AI
# AI END
```
- Trace the origin of code changes for better transparency and governance
- Configurable formats and inclusion/exclusion rules

## Known Limitations
- No automatic conflict resolution
- No binary file support
- No special character handling in file paths
- Maximum file size depends on available memory
- Requires manual copying of diff file to input directory
- No automatic directory creation (directories must exist)

## Support the Project

If you find AICodeSync useful, consider supporting its development through one of these options:

### Sponsorship Options
- [GitHub Sponsors](https://github.com/sponsors/GagaPlayerOne)
- [Open Collective](https://opencollective.com/aicodesync)
- [Patreon](https://www.patreon.com/aicodesync)
- [Buy Me a Coffee](https://www.buymeacoffee.com/aicodesync)

### Why Sponsor?
- Help maintain and improve AICodeSync
- Prioritized feature requests
- Your name/logo in our README
- Recognition in release notes

AICodeSync is and will remain open source under the MIT license. Your sponsorship helps ensure the project's ongoing development and maintenance.

## License

This project is licensed under the MIT License - see the LICENSE file for details.