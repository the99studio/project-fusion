## Development

This section provides instructions for developers who want to contribute to or modify Project Fusion.

### Setup Development Environment

1. Install pnpm globally if you don't have it yet:
   ```bash
   npm install -g pnpm
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/GagaPlayerOne/project-fusion.git
   ```
   And navigate to it:
   ```bash
   cd project-fusion
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Build the project:
   ```bash
   pnpm build
   ```

5. Ensure to have pnpm global bin folder correctly setup:
   ```bash
   pnpm setup
   ```
   Then close VS Code and reopen it

6. Go into the packages/cli folder with:
   ```bash
   cd packages/cli
   ```
   and link it globally:
   ```bash
   pnpm link --global
   ```

   Note: to remove the link, execute this into the packages/cli folder:
   ```bash
   pnpm unlink --global
   ```

7. It should now be possible to execute the cli:
   ```bash
   project-fusion --help
   ```

### Development Workflow

1. Make changes to the code in the `packages` directory
2. Rebuild the project:
   ```bash
   pnpm build
   ```
3. Test your changes:
   ```bash
   project-fusion --help
   project-fusion init
   project-fusion fusion
   project-fusion applydiff
   ```

### Testing in a Sample Project

To test Project Fusion in a real project:

1. Create or navigate to a test project:
   ```bash
   mkdir test-project
   cd test-project
   ```

2. Initialize Project Fusion in the test project:
   ```bash
   project-fusion init
   ```
   This will create the `project-fusion.json` config file and the `.project-fusion` directory.

3. Test the fusion process:
   ```bash
   project-fusion fusion
   ```

4. Manually modify the generated diff file or create a test diff file

5. Apply the changes:
   ```bash
   project-fusion applydiff
   ```

### Package Organization

- `packages/core`: Core functionality and types
- `packages/cli`: Command-line interface

### Useful Commands

- `pnpm install`: Install all dependencies
- `pnpm build`: Build all packages
- `pnpm --recursive update --latest`: Update dependencies to their latest version in each package.json of the project
- `pnpm link --global`: Link the CLI globally for testing
- `pnpm unlink --global`: Remove the global link