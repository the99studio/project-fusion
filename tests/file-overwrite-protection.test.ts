import path from 'node:path';
import fs from 'fs-extra';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runFusionCommand } from '../src/clicommands.js';
import { defaultConfig } from '../src/utils.js';

vi.mock('clipboardy', () => ({
    default: {
        writeSync: vi.fn()
    }
}));

describe('File Overwrite Protection', () => {
    const tempDir = path.join(process.cwd(), 'temp', 'overwrite-test');
    const originalCwd = process.cwd();
    const originalExitCode = process.exitCode;
    
    beforeEach(async () => {
        await fs.ensureDir(tempDir);
        process.chdir(tempDir);
        
        // Create a simple test file
        await fs.writeFile('test.js', 'console.log("test");', 'utf-8');
        
        // Create a minimal config
        const config = {
            ...defaultConfig,
            generateText: true,
            generateMarkdown: true,
            generateHtml: true,
            generatedFileName: 'project-fusioned',
            parsedFileExtensions: { web: ['.js'] }
        };
        await fs.writeJSON('project-fusion.json', config);
        
        // Reset console methods
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    
    afterEach(async () => {
        process.chdir(originalCwd);
        process.exitCode = originalExitCode;
        await fs.remove(tempDir);
        vi.restoreAllMocks();
    });
    
    describe('Default behavior (protection enabled)', () => {
        it('should error when output files already exist', async () => {
            // Create existing output files
            await fs.writeFile('project-fusioned.txt', 'existing content', 'utf-8');
            await fs.writeFile('project-fusioned.md', 'existing content', 'utf-8');
            await fs.writeFile('project-fusioned.html', 'existing content', 'utf-8');
            
            // Run fusion without --overwrite
            await runFusionCommand({});
            
            // Should set exit code to 1
            expect(process.exitCode).toBe(1);
            
            // Should show error messages
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('❌ Error: Output files already exist:')
            );
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('project-fusioned.txt')
            );
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('project-fusioned.md')
            );
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('project-fusioned.html')
            );
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Use --overwrite flag to replace existing files')
            );
            
            // Files should NOT be overwritten
            const txtContent = await fs.readFile('project-fusioned.txt', 'utf-8');
            expect(txtContent).toBe('existing content');
        });
        
        it('should error even if only one output file exists', async () => {
            // Create only one existing file
            await fs.writeFile('project-fusioned.md', 'existing markdown', 'utf-8');
            
            // Run fusion without --overwrite
            await runFusionCommand({});
            
            // Should set exit code to 1
            expect(process.exitCode).toBe(1);
            
            // Should show error for the existing file
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('project-fusioned.md')
            );
            
            // The existing file should not be modified
            const mdContent = await fs.readFile('project-fusioned.md', 'utf-8');
            expect(mdContent).toBe('existing markdown');
            
            // Other files should not be created
            expect(await fs.pathExists('project-fusioned.txt')).toBe(false);
            expect(await fs.pathExists('project-fusioned.html')).toBe(false);
        });
        
        it('should work normally when no output files exist', async () => {
            // Run fusion without existing files
            await runFusionCommand({});
            
            // Should not set error exit code
            expect(process.exitCode).not.toBe(1);
            
            // Should create all output files
            expect(await fs.pathExists('project-fusioned.txt')).toBe(true);
            expect(await fs.pathExists('project-fusioned.md')).toBe(true);
            expect(await fs.pathExists('project-fusioned.html')).toBe(true);
            
            // Should show success message
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('✅')
            );
        });
        
        it('should respect outputDirectory setting', async () => {
            // Create output directory
            await fs.ensureDir('output');
            
            // Update config with outputDirectory
            const config = await fs.readJSON('project-fusion.json');
            config.outputDirectory = './output';
            await fs.writeJSON('project-fusion.json', config);
            
            // Create existing file in output directory
            await fs.writeFile('output/project-fusioned.txt', 'existing', 'utf-8');
            
            // Run fusion without --overwrite
            await runFusionCommand({});
            
            // Should detect the file in output directory
            expect(process.exitCode).toBe(1);
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('project-fusioned.txt')
            );
        });
    });
    
    describe('With --overwrite flag', () => {
        it('should overwrite existing files when --overwrite is used', async () => {
            // Create existing output files with old content
            await fs.writeFile('project-fusioned.txt', 'old content', 'utf-8');
            await fs.writeFile('project-fusioned.md', 'old content', 'utf-8');
            await fs.writeFile('project-fusioned.html', 'old content', 'utf-8');
            
            // Run fusion with --overwrite
            await runFusionCommand({ overwrite: true });
            
            // Should not set error exit code
            expect(process.exitCode).not.toBe(1);
            
            // Files should be overwritten with new content
            const txtContent = await fs.readFile('project-fusioned.txt', 'utf-8');
            expect(txtContent).not.toBe('old content');
            expect(txtContent).toContain('test.js');
            
            // Should show success message
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining('✅')
            );
        });
        
        it('should work with custom output filename', async () => {
            // Update config with custom filename
            const config = await fs.readJSON('project-fusion.json');
            config.generatedFileName = 'my-output';
            await fs.writeJSON('project-fusion.json', config);
            
            // Create existing file with custom name
            await fs.writeFile('my-output.txt', 'existing', 'utf-8');
            
            // Run without --overwrite should error
            await runFusionCommand({});
            expect(process.exitCode).toBe(1);
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('my-output.txt')
            );
            
            // Reset exit code
            process.exitCode = originalExitCode;
            vi.clearAllMocks();
            
            // Run with --overwrite should work
            await runFusionCommand({ overwrite: true });
            expect(process.exitCode).not.toBe(1);
            
            const content = await fs.readFile('my-output.txt', 'utf-8');
            expect(content).not.toBe('existing');
        });
    });
    
    describe('Preview mode interaction', () => {
        it('should not check for existing files in preview mode', async () => {
            // Create existing output files
            await fs.writeFile('project-fusioned.txt', 'existing', 'utf-8');
            await fs.writeFile('project-fusioned.md', 'existing', 'utf-8');
            
            // Run fusion in preview mode
            await runFusionCommand({ preview: true });
            
            // Should not set error exit code
            expect(process.exitCode).not.toBe(1);
            
            // Should not show overwrite errors
            expect(console.error).not.toHaveBeenCalledWith(
                expect.stringContaining('Output files already exist')
            );
            
            // Files should remain unchanged
            const txtContent = await fs.readFile('project-fusioned.txt', 'utf-8');
            expect(txtContent).toBe('existing');
        });
    });
    
    describe('Selective output generation', () => {
        it('should only check for files that will be generated', async () => {
            // Update config to only generate markdown
            const config = await fs.readJSON('project-fusion.json');
            config.generateText = false;
            config.generateMarkdown = true;
            config.generateHtml = false;
            await fs.writeJSON('project-fusion.json', config);
            
            // Create .txt and .html files (which won't be generated)
            await fs.writeFile('project-fusioned.txt', 'existing', 'utf-8');
            await fs.writeFile('project-fusioned.html', 'existing', 'utf-8');
            
            // Run fusion - should succeed since .md doesn't exist
            await runFusionCommand({});
            
            // Should not error
            expect(process.exitCode).not.toBe(1);
            
            // Should create .md file
            expect(await fs.pathExists('project-fusioned.md')).toBe(true);
            
            // Other files should remain unchanged
            const txtContent = await fs.readFile('project-fusioned.txt', 'utf-8');
            expect(txtContent).toBe('existing');
        });
        
        it('should check the correct files based on CLI flags', async () => {
            // Create only .html file
            await fs.writeFile('project-fusioned.html', 'existing', 'utf-8');
            
            // Run with --txt flag only (should override config)
            await runFusionCommand({ txt: true });
            
            // Should succeed since .txt doesn't exist
            expect(process.exitCode).not.toBe(1);
            expect(await fs.pathExists('project-fusioned.txt')).toBe(true);
        });
    });

    describe('Configuration-based overwrite', () => {
        it('should respect overwriteFiles config setting', async () => {
            // Update config to allow overwriting
            const config = await fs.readJSON('project-fusion.json');
            config.overwriteFiles = true;
            await fs.writeJSON('project-fusion.json', config);
            
            // Create existing output files
            await fs.writeFile('project-fusioned.txt', 'old content', 'utf-8');
            await fs.writeFile('project-fusioned.md', 'old content', 'utf-8');
            
            // Run fusion without --overwrite flag (should still work due to config)
            await runFusionCommand({});
            
            // Should not set error exit code
            expect(process.exitCode).not.toBe(1);
            
            // Files should be overwritten with new content
            const txtContent = await fs.readFile('project-fusioned.txt', 'utf-8');
            expect(txtContent).not.toBe('old content');
            expect(txtContent).toContain('test.js');
        });

        it('should allow CLI --overwrite to override config overwriteFiles=false', async () => {
            // Update config to NOT allow overwriting
            const config = await fs.readJSON('project-fusion.json');
            config.overwriteFiles = false;
            await fs.writeJSON('project-fusion.json', config);
            
            // Create existing output files
            await fs.writeFile('project-fusioned.txt', 'existing content', 'utf-8');
            
            // Run with CLI --overwrite should override config
            await runFusionCommand({ overwrite: true });
            
            // Should not set error exit code
            expect(process.exitCode).not.toBe(1);
            
            // File should be overwritten despite config setting
            const txtContent = await fs.readFile('project-fusioned.txt', 'utf-8');
            expect(txtContent).not.toBe('existing content');
            expect(txtContent).toContain('test.js');
        });
    });
});