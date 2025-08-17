// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Fusion functionality - Optimized single-file-in-memory approach
 */
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import fs from 'fs-extra';
import { glob } from 'glob';
import ignoreLib from 'ignore';
import { BenchmarkTracker } from './benchmark.js';
import { createFilePath, type Config, type FusionOptions, type FusionResult } from './types.js';
import {
    ensureDirectoryExists,
    formatLocalTimestamp,
    formatTimestamp,
    getExtensionsFromGroups,
    getMarkdownLanguage,
    logConfigSummary,
    writeLog
} from './utils.js';

/**
 * Process fusion of files - Optimized memory-efficient version
 * @param config Configuration
 * @param options Fusion options
 * @returns Fusion result
 */
export async function processFusion(
    config: Config,
    options: FusionOptions = {}
): Promise<FusionResult> {
    const benchmark = new BenchmarkTracker();
    
    try {
        // Note: parsing properties are now directly in config (flattened structure)
        const logFilePath = createFilePath(path.resolve(config.rootDirectory, 'project-fusion.log'));
        const fusionFilePath = createFilePath(path.resolve(config.rootDirectory, `${config.generatedFileName}.txt`));
        const mdFilePath = createFilePath(path.resolve(config.rootDirectory, `${config.generatedFileName}.md`));
        const htmlFilePath = createFilePath(path.resolve(config.rootDirectory, `${config.generatedFileName}.html`));
        const startTime = new Date();

        await fs.writeFile(logFilePath, '');
        await logConfigSummary(logFilePath, config);

        const extensions = getExtensionsFromGroups(config, options.extensionGroups);
        console.log(`Processing ${extensions.length} file extensions from ${Object.keys(config.parsedFileExtensions).length} categories`);
        
        if (extensions.length === 0) {
            const message = 'No file extensions to process.';
            await writeLog(logFilePath, `Status: Fusion failed\nReason: ${message}`, true);
            return { success: false, message, logFilePath };
        }

        // Initialize ignore handler for filtering files based on patterns
        const ig = ignoreLib();
        const rootDir = path.resolve(config.rootDirectory);

        // Load ignore patterns from .gitignore and custom config
        if (config.useGitIgnoreForExcludes) {
            const gitIgnorePath = path.join(rootDir, '.gitignore');
            if (await fs.pathExists(gitIgnorePath)) {
                const gitIgnoreContent = await fs.readFile(gitIgnorePath, 'utf8');
                ig.add(gitIgnoreContent);
            }
        }

        if (config.ignorePatterns.length > 0) {
            const patterns = config.ignorePatterns
                .filter(pattern => pattern.trim() !== '' && !pattern.startsWith('#'))
                .join('\n');
            ig.add(patterns);
        }

        // Create file discovery pattern based on extensions and subdirectory settings
        // Build glob pattern for file discovery: ensure extensions start with '.' and handle subdirectory option
        const allExtensionsPattern = extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
        const pattern = config.parseSubDirectories
            ? `${rootDir}/**/*@(${allExtensionsPattern.join('|')})` // Recursive pattern
            : `${rootDir}/*@(${allExtensionsPattern.join('|')})`; // Root-only pattern

        let filePaths = await glob(pattern, { 
            nodir: true,
            follow: false
        });
        const originalFileCount = filePaths.length;
        filePaths = filePaths.filter(file => {
            const relativePath = path.relative(rootDir, file);
            return !ig.ignores(relativePath);
        });
        console.log(`Found ${originalFileCount} files, ${filePaths.length} after filtering (${((originalFileCount - filePaths.length) / originalFileCount * 100).toFixed(1)}% filtered)`);

        if (filePaths.length === 0) {
            const message = 'No files found to process.';
            const endTime = new Date();
            await writeLog(logFilePath, `Status: Fusion failed\nReason: ${message}\nStart time: ${formatTimestamp(startTime)}\nEnd time: ${formatTimestamp(endTime)}\nDuration: ${((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)}s`, true);
            return { success: false, message, logFilePath };
        }

        // Extract project metadata for the fusion header
        const projectName = path.basename(process.cwd());
        let packageName = "";
        let projectVersion = "";
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
                if (packageJson.name) {
                    packageName = packageJson.name;
                }
                if (packageJson.version) {
                    projectVersion = packageJson.version;
                }
            } catch (error) {
                console.warn('Error reading package.json:', error);
            }
        }

        // Sort files alphabetically for consistent output across runs
        filePaths.sort((a, b) => path.relative(rootDir, a).localeCompare(path.relative(rootDir, b)));

        // Track extension usage for comprehensive reporting
        const foundExtensions = new Set<string>();
        const otherExtensions = new Set<string>();
        const allFilesPattern = config.parseSubDirectories ? `${rootDir}/**/*.*` : `${rootDir}/*.*`;
        const allFiles = await glob(allFilesPattern, { nodir: true, follow: false });

        const allConfiguredExtensions = Object.values(config.parsedFileExtensions).flat();
        const configuredExtensionSet = new Set(allConfiguredExtensions);
        // Discover unconfigured extensions for comprehensive reporting
        for (const file of allFiles) {
            const relativePath = path.relative(rootDir, file);
            const ext = path.extname(file).toLowerCase();

            // Track extensions found in project but not configured for processing
            if (ext && !ig.ignores(relativePath) && !configuredExtensionSet.has(ext)) {
                otherExtensions.add(ext);
            }
        }

        // Pre-process files: validate sizes and collect metadata
        const maxFileSizeKB = config.maxFileSizeKB;
        const filesToProcess: { path: string; relativePath: string; size: number }[] = [];
        const skippedFiles: string[] = [];
        let skippedCount = 0;
        let totalSizeBytes = 0;

        for (const filePath of filePaths) {
            const relativePath = path.relative(rootDir, filePath);
            const fileExt = path.extname(filePath).toLowerCase();
            foundExtensions.add(fileExt);

            try {
                const stats = await fs.stat(filePath);
                const sizeKB = stats.size / 1024;
                totalSizeBytes += stats.size;

                if (sizeKB > maxFileSizeKB) {
                    skippedCount++;
                    skippedFiles.push(relativePath);
                    await writeLog(logFilePath, `Skipped large file: ${relativePath} (${sizeKB.toFixed(2)} KB)`, true);
                } else {
                    filesToProcess.push({ path: filePath, relativePath, size: stats.size });
                }
            } catch (error) {
                await writeLog(logFilePath, `Error checking file ${filePath}: ${error}`, true);
                console.error(`Error checking file ${filePath}:`, error);
            }
        }

        // Create output directories for enabled formats
        if (config.generateText) await ensureDirectoryExists(path.dirname(fusionFilePath));
        if (config.generateMarkdown) await ensureDirectoryExists(path.dirname(mdFilePath));
        if (config.generateHtml) await ensureDirectoryExists(path.dirname(htmlFilePath));

        // Initialize write streams for concurrent file generation
        const txtStream = config.generateText ? createWriteStream(fusionFilePath) : null;
        const mdStream = config.generateMarkdown ? createWriteStream(mdFilePath) : null;
        const htmlStream = config.generateHtml ? createWriteStream(htmlFilePath) : null;
        

        // Generate format-specific headers with project metadata
        const projectTitle = packageName && packageName.toLowerCase() !== projectName.toLowerCase() 
            ? `${projectName} / ${packageName}` 
            : projectName;
        const versionInfo = projectVersion ? ` v${projectVersion}` : '';
        
        const txtHeader = `# Generated Project Fusion File\n` +
            `# Project: ${projectTitle}${versionInfo}\n` +
            `# Generated: ${formatLocalTimestamp()}\n` +
            `# UTC: ${formatTimestamp()}\n` +
            `# Files: ${filesToProcess.length}\n` +
            `# Generated by: project-fusion\n\n`;

        const mdHeader = `# Generated Project Fusion File\n\n` +
            `**Project:** ${projectTitle}${versionInfo}\n\n` +
            `**Generated:** ${formatLocalTimestamp()}\n\n` +
            `**UTC:** ${formatTimestamp()}\n\n` +
            `**Files:** ${filesToProcess.length}\n\n` +
            `**Generated by:** [project-fusion](https://github.com/the99studio/project-fusion)\n\n` +
            `---\n\n## 📁 Table of Contents\n\n`;

        const htmlHeader = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Fusion - ${projectTitle}${versionInfo}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .file-section { margin-bottom: 40px; border: 1px solid #ddd; border-radius: 8px; padding: 20px; }
        .file-title { background: #f5f5f5; margin: -20px -20px 20px -20px; padding: 15px 20px; border-radius: 8px 8px 0 0; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 6px; overflow-x: auto; }
        code { font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; }
        .toc { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .toc ul { margin: 0; padding-left: 20px; }
        .toc a { text-decoration: none; color: #0366d6; }
        .toc a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Generated Project Fusion File</h1>
        <p><strong>Project:</strong> ${projectTitle}${versionInfo}</p>
        <p><strong>Generated:</strong> ${formatLocalTimestamp()}</p>
        <p><strong>UTC:</strong> ${formatTimestamp()}</p>
        <p><strong>Files:</strong> ${filesToProcess.length}</p>
        <p><strong>Generated by:</strong> <a href="https://github.com/the99studio/project-fusion">project-fusion</a></p>
    </div>
    <div class="toc">
        <h2>📁 Table of Contents</h2>
        <ul>
${filesToProcess.map(fileInfo => `            <li><a href="#${fileInfo.relativePath.replaceAll(/[^\dA-Za-z]/g, '-').toLowerCase()}">${fileInfo.relativePath}</a></li>`).join('\n')}
        </ul>
    </div>`;

        if (txtStream) txtStream.write(txtHeader);
        if (mdStream) mdStream.write(mdHeader);
        if (htmlStream) htmlStream.write(htmlHeader);
        
        // Generate table of contents for markdown format
        if (mdStream) {
            for (const fileInfo of filesToProcess) {
                mdStream.write(`- [${fileInfo.relativePath}](#${fileInfo.relativePath.replaceAll(/[^\dA-Za-z]/g, '-').toLowerCase()})\n`);
            }
            mdStream.write(`\n---\n\n`);
        }

        // Stream-process files to maintain low memory footprint
        let processedCount = 0;
        for (const fileInfo of filesToProcess) {
            try {
                const content = await fs.readFile(fileInfo.path, 'utf8');
                const fileExt = path.extname(fileInfo.path).toLowerCase();
                const basename = path.basename(fileInfo.path);
                const language = getMarkdownLanguage(fileExt || basename);
                // Escape HTML entities for safe HTML output
                const escapedContent = content
                    .replaceAll('&', '&amp;')
                    .replaceAll('<', '&lt;')
                    .replaceAll('>', '&gt;')
                    .replaceAll('"', '&quot;')
                    .replaceAll('\'', '&#39;');
                
                // Generate plain text format with file separators
                if (txtStream) {
                    txtStream.write(`<!-- ============================================================ -->\n`);
                    txtStream.write(`<!-- FILE: ${fileInfo.relativePath.padEnd(54)} -->\n`);
                    txtStream.write(`<!-- ============================================================ -->\n`);
                    txtStream.write(`${content}\n\n`);
                }

                // Generate markdown format with syntax highlighting
                if (mdStream) {
                    mdStream.write(`## 📄 ${fileInfo.relativePath}\n\n`);
                    mdStream.write(`\`\`\`${language}\n`);
                    mdStream.write(`${content}\n`);
                    mdStream.write(`\`\`\`\n\n`);
                }

                // Generate HTML format with styled code blocks
                if (htmlStream) {
                    // Create URL-safe anchor ID for navigation
                    const fileAnchor = fileInfo.relativePath.replaceAll(/[^\dA-Za-z]/g, '-').toLowerCase();
                    htmlStream.write(`    <div class="file-section" id="${fileAnchor}">\n`);
                    htmlStream.write(`        <div class="file-title">\n`);
                    htmlStream.write(`            <h2>📄 ${fileInfo.relativePath}</h2>\n`);
                    htmlStream.write(`        </div>\n`);
                    htmlStream.write(`        <pre><code class="${language}">${escapedContent}</code></pre>\n`);
                    htmlStream.write(`    </div>\n\n`);
                }

                processedCount++;
                benchmark.markFileProcessed(fileInfo.size);
            } catch (error) {
                await writeLog(logFilePath, `Error processing file ${fileInfo.path}: ${error}`, true);
                console.error(`Error processing file ${fileInfo.path}:`, error);
            }
        }

        // Finalize HTML document structure
        if (htmlStream) {
            htmlStream.write(`</body>\n</html>`);
        }

        // Ensure all streams are properly closed before HTML generation
        if (txtStream) {
            await new Promise<void>((resolve, reject) => {
                txtStream.end((err?: Error | null) => err ? reject(err) : resolve());
            });
        }
        if (mdStream) {
            await new Promise<void>((resolve, reject) => {
                mdStream.end((err?: Error | null) => err ? reject(err) : resolve());
            });
        }
        if (htmlStream) {
            await new Promise<void>((resolve, reject) => {
                htmlStream.end((err?: Error | null) => err ? reject(err) : resolve());
            });
        }


        // Generate detailed completion report with metrics
        const message = `Fusion completed successfully. ${processedCount} files processed${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}.`;
        const endTime = new Date();
        const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);
        const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
        
        await writeLog(logFilePath, `Status: Fusion completed successfully`, true);
        await writeLog(logFilePath, `Start time: ${formatTimestamp(startTime)}`, true);
        await writeLog(logFilePath, `End time: ${formatTimestamp(endTime)}`, true);
        await writeLog(logFilePath, `Duration: ${duration}s`, true);
        await writeLog(logFilePath, `Total data processed: ${totalSizeMB} MB`, true);
        
        // Include performance benchmarks in log
        const metrics = benchmark.getMetrics();
        await writeLog(logFilePath, `\nPerformance Metrics:`, true);
        await writeLog(logFilePath, `  Memory Used: ${metrics.memoryUsed.toFixed(2)} MB`, true);
        await writeLog(logFilePath, `  Throughput: ${metrics.throughputMBps.toFixed(2)} MB/s`, true);
        await writeLog(logFilePath, `  Files/second: ${(metrics.filesProcessed / metrics.duration).toFixed(2)}`, true);
        
        await writeLog(logFilePath, `Files found: ${originalFileCount}`, true);
        await writeLog(logFilePath, `Files processed successfully: ${processedCount}`, true);
        await writeLog(logFilePath, `Files skipped (too large): ${skippedCount}`, true);
        await writeLog(logFilePath, `Files filtered out: ${originalFileCount - filePaths.length}`, true);
        
        await writeLog(logFilePath, `Max file size limit: ${maxFileSizeKB} KB`, true);
        
        if (skippedFiles.length > 0) {
            await writeLog(logFilePath, `Skipped files:`, true);
            for (const file of skippedFiles.slice(0, 10)) {
                await writeLog(logFilePath, `  ${file}`, true);
            }
            if (skippedFiles.length > 10) {
                await writeLog(logFilePath, `  ... and ${skippedFiles.length - 10} more`, true);
            }
        }
        
        await writeLog(logFilePath, `File extensions actually processed:`, true);
        const foundExtArray = [...foundExtensions].sort();
        for (const ext of foundExtArray) {
            await writeLog(logFilePath, `  ${ext}`, true);
        }
        
        const ignoredExtensions = extensions.filter(ext => ![...foundExtensions].includes(ext));
        if (ignoredExtensions.length > 0) {
            await writeLog(logFilePath, `Configured extensions with no matching files found:`, true);
            for (const ext of ignoredExtensions.sort()) {
                await writeLog(logFilePath, `  ${ext}`, true);
            }
        }
        
        if (otherExtensions.size > 0) {
            await writeLog(logFilePath, `File extensions found in project but not configured for processing:`, true);
            for (const ext of [...otherExtensions].sort()) {
                await writeLog(logFilePath, `  ${ext}`, true);
            }
        }
        
        const generatedFormats = [];
        if (config.generateText) generatedFormats.push('.txt');
        if (config.generateMarkdown) generatedFormats.push('.md');
        if (config.generateHtml) generatedFormats.push('.html');
        
        return {
            success: true,
            message: `${message} Generated formats: ${generatedFormats.join(', ')}.`,
            fusionFilePath: config.generateText ? fusionFilePath : mdFilePath,
            logFilePath
        };
    } catch (error) {
        const errorMessage = `Fusion process failed: ${error}`;
        console.error(errorMessage);

        try {
            const logFilePath = createFilePath(path.resolve('project-fusion.log'));
            const endTime = new Date();
            await writeLog(logFilePath, `Status: Fusion failed due to error\nError details: ${errorMessage}\nEnd time: ${formatTimestamp(endTime)}`, true);

            return {
                success: false,
                message: errorMessage,
                logFilePath,
                error: error as Error
            };
        } catch (logError) {
            console.error('Could not write to log file:', logError);
            return {
                success: false,
                message: errorMessage,
                error: error as Error
            };
        }
    }
}