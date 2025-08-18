# Development Guide

> 📋 **For AI**: See [CLAUDE.md](./CLAUDE.md) | 📖 **For Users**: See [README.md](./README.md)

## Setup

```bash
git clone https://github.com/the99studio/project-fusion.git
cd project-fusion
npm install
npm run build
```

## Testing

VS Code launch configs (F5):
- **Fusion (Default)** - Default behavior
- **Fusion (Web)** - Web extensions only  
- **Help** - CLI help
- **Init** - Project initialization

## Package Testing

```bash
npm pack
npm install -g ./project-fusion-*.tgz
project-fusion --help
npm uninstall -g project-fusion
```

## Publication

```bash
npm login
npm publish
```

## Plugin Development

Basic plugin structure:
```javascript
export const plugin = {
    metadata: {
        name: 'my-plugin',
        version: '1.0.0',
        description: 'Plugin description'
    },
    
    async beforeFileProcessing(fileInfo, config) {
        return fileInfo; // or null to skip
    },
    
    async afterFileProcessing(fileInfo, content, config) {
        return content; // transformed content
    },
    
    registerFileExtensions() {
        return { custom: ['.xyz'] };
    },
    
    registerOutputStrategies() {
        return [{ name: 'json', extension: '.json', async generate() {} }];
    }
};
```

## API Usage

```javascript
import { projectFusion } from 'project-fusion/fluent';

const result = await projectFusion()
  .include(['web'])
  .exclude(['*.test.js'])
  .maxSize('2MB')
  .output(['md', 'html'])
  .generate();
```

## Architecture

- **Core**: `fusion.ts` - main processing
- **CLI**: `cli.ts`, `clicommands.ts` - command interface
- **Types**: `types.ts` - TypeScript definitions
- **Config**: `schema.ts` - Zod validation
- **Utils**: `utils.ts` - helper functions
- **Plugins**: `plugins/` - extensibility system
- **Strategies**: `strategies/` - output formats
- **Adapters**: `adapters/` - file system abstraction