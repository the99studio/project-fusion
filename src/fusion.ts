/**
 * Fusion functionality - Optimized single-file-in-memory approach
 */
import fs from 'fs-extra';
import { createWriteStream } from 'fs';
import { glob } from 'glob';
import ignoreLib from 'ignore';
import path from 'path';
import { BenchmarkTracker } from './benchmark.js';
import {
    formatTimestamp,
    formatLocalTimestamp,
    getExtensionsFromGroups,
    getMarkdownLanguage,
    readFileContentWithSizeLimit,
    writeLog,
    logConfigSummary,
    ensureDirectoryExists
} from './utils.js';
import {
    Config,
    FusionOptions,
    FusionResult,
    createFilePath
} from './types.js';

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
        const { parsing } = config;
        const logFilePath = createFilePath(path.resolve('project-fusion.log'));
        const fusionFilePath = createFilePath(path.resolve(`${config.generatedFileName}.txt`));
        const mdFilePath = createFilePath(path.resolve(`${config.generatedFileName}.md`));
        const htmlFilePath = createFilePath(path.resolve(`${config.generatedFileName}.html`));
        const pdfFilePath = createFilePath(path.resolve(`${config.generatedFileName}.pdf`));
        const startTime = new Date();

        await fs.writeFile(logFilePath, '');
        
        // Log configuration summary at the beginning
        await logConfigSummary(logFilePath, config);

        const extensions = getExtensionsFromGroups(config, options.extensionGroups);
        console.log(`Processing ${extensions.length} file extensions from ${Object.keys(config.parsedFileExtensions).length} categories`);
        
        if (extensions.length === 0) {
            const message = 'No file extensions to process.';
            await writeLog(logFilePath, `Status: Fusion failed\nReason: ${message}`, true);
            return { success: false, message, logFilePath };
        }

        const ig = ignoreLib();
        const rootDir = path.resolve(parsing.rootDirectory);

        // Apply .gitignore patterns for filtering if enabled
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

        // Build glob pattern for file discovery
        const allExtensionsPattern = extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
        const pattern = parsing.parseSubDirectories
            ? `${rootDir}/**/*@(${allExtensionsPattern.join('|')})`
            : `${rootDir}/*@(${allExtensionsPattern.join('|')})`;

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

        // Sort files for consistent output
        filePaths.sort((a, b) => path.relative(rootDir, a).localeCompare(path.relative(rootDir, b)));

        // Track which extensions are actually used vs configured vs unknown
        const foundExtensions = new Set<string>();
        const otherExtensions = new Set<string>();

        // Discover all file extensions in the project for reporting
        const allFilesPattern = parsing.parseSubDirectories ? `${rootDir}/**/*.*` : `${rootDir}/*.*`;
        const allFiles = await glob(allFilesPattern, { nodir: true, follow: false });

        const allConfiguredExtensions = Object.values(config.parsedFileExtensions).flat();
        const configuredExtensionSet = new Set(allConfiguredExtensions);
        for (const file of allFiles) {
            const relativePath = path.relative(rootDir, file);
            const ext = path.extname(file).toLowerCase();

            if (ext && !ig.ignores(relativePath) && !configuredExtensionSet.has(ext)) {
                otherExtensions.add(ext);
            }
        }

        // First pass: check file sizes and build list of files to process
        const maxFileSizeKB = parsing.maxFileSizeKB;
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

        // Ensure output directories exist
        if (config.generateText) await ensureDirectoryExists(path.dirname(fusionFilePath));
        if (config.generateMarkdown) await ensureDirectoryExists(path.dirname(mdFilePath));
        if (config.generateHtml) await ensureDirectoryExists(path.dirname(htmlFilePath));
        if (config.generatePdf) await ensureDirectoryExists(path.dirname(pdfFilePath));

        // Create write streams for enabled output files
        const txtStream = config.generateText ? createWriteStream(fusionFilePath) : null;
        const mdStream = config.generateMarkdown ? createWriteStream(mdFilePath) : null;
        const htmlStream = config.generateHtml ? createWriteStream(htmlFilePath) : null;
        
        // For PDF, we'll collect content and generate at the end
        let pdfContent = '';

        // Write headers
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
${filesToProcess.map(fileInfo => `            <li><a href="#${fileInfo.relativePath.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}">${fileInfo.relativePath}</a></li>`).join('\n')}
        </ul>
    </div>`;

        if (txtStream) txtStream.write(txtHeader);
        if (mdStream) mdStream.write(mdHeader);
        if (htmlStream) htmlStream.write(htmlHeader);
        
        // Initialize PDF content
        if (config.generatePdf) {
            pdfContent = `Generated Project Fusion File\n\nProject: ${projectTitle}${versionInfo}\nGenerated: ${formatLocalTimestamp()}\nUTC: ${formatTimestamp()}\nFiles: ${filesToProcess.length}\nGenerated by: project-fusion\n\n`;
        }

        // Write table of contents for markdown (only for files that will be processed)
        if (mdStream) {
            for (const fileInfo of filesToProcess) {
                mdStream.write(`- [${fileInfo.relativePath}](#${fileInfo.relativePath.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()})\n`);
            }
            mdStream.write(`\n---\n\n`);
        }

        // Process files one by one - memory efficient approach
        let processedCount = 0;
        for (const fileInfo of filesToProcess) {
            try {
                // Read file content - only one file in memory at a time
                const content = await fs.readFile(fileInfo.path, 'utf8');
                const fileExt = path.extname(fileInfo.path).toLowerCase();
                const basename = path.basename(fileInfo.path);
                const language = getMarkdownLanguage(fileExt || basename);
                const escapedContent = content
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                
                // Write to text file
                if (txtStream) {
                    txtStream.write(`<!-- ============================================================ -->\n`);
                    txtStream.write(`<!-- FILE: ${fileInfo.relativePath.padEnd(54)} -->\n`);
                    txtStream.write(`<!-- ============================================================ -->\n`);
                    txtStream.write(`${content}\n\n`);
                }

                // Write to markdown file
                if (mdStream) {
                    mdStream.write(`## 📄 ${fileInfo.relativePath}\n\n`);
                    mdStream.write(`\`\`\`${language}\n`);
                    mdStream.write(`${content}\n`);
                    mdStream.write(`\`\`\`\n\n`);
                }

                // Write to HTML file
                if (htmlStream) {
                    const fileAnchor = fileInfo.relativePath.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                    htmlStream.write(`    <div class="file-section" id="${fileAnchor}">\n`);
                    htmlStream.write(`        <div class="file-title">\n`);
                    htmlStream.write(`            <h2>📄 ${fileInfo.relativePath}</h2>\n`);
                    htmlStream.write(`        </div>\n`);
                    htmlStream.write(`        <pre><code class="${language}">${escapedContent}</code></pre>\n`);
                    htmlStream.write(`    </div>\n\n`);
                }

                // Collect content for PDF
                if (config.generatePdf) {
                    pdfContent += `\n${'='.repeat(60)}\nFILE: ${fileInfo.relativePath}\n${'='.repeat(60)}\n\n${content}\n\n`;
                }

                processedCount++;
                benchmark.markFileProcessed(fileInfo.size);
            } catch (error) {
                await writeLog(logFilePath, `Error processing file ${fileInfo.path}: ${error}`, true);
                console.error(`Error processing file ${fileInfo.path}:`, error);
            }
        }

        // Close HTML file
        if (htmlStream) {
            htmlStream.write(`</body>\n</html>`);
        }

        // Generate PDF file (simple text-based implementation for now)
        if (config.generatePdf) {
            await fs.writeFile(pdfFilePath, pdfContent, 'utf8');
        }

        // Close streams
        if (txtStream) {
            await new Promise<void>((resolve, reject) => {
                txtStream.end((err: any) => err ? reject(err) : resolve());
            });
        }
        if (mdStream) {
            await new Promise<void>((resolve, reject) => {
                mdStream.end((err: any) => err ? reject(err) : resolve());
            });
        }
        if (htmlStream) {
            await new Promise<void>((resolve, reject) => {
                htmlStream.end((err: any) => err ? reject(err) : resolve());
            });
        }

        // Generate comprehensive log summary
        const message = `Fusion completed successfully. ${processedCount} files processed${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}.`;
        const endTime = new Date();
        const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);
        const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
        
        await writeLog(logFilePath, `Status: Fusion completed successfully`, true);
        await writeLog(logFilePath, `Start time: ${formatTimestamp(startTime)}`, true);
        await writeLog(logFilePath, `End time: ${formatTimestamp(endTime)}`, true);
        await writeLog(logFilePath, `Duration: ${duration}s`, true);
        await writeLog(logFilePath, `Total data processed: ${totalSizeMB} MB`, true);
        
        // Add benchmark metrics
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
        const foundExtArray = Array.from(foundExtensions).sort();
        for (const ext of foundExtArray) {
            await writeLog(logFilePath, `  ${ext}`, true);
        }
        
        const ignoredExtensions = extensions.filter(ext => !Array.from(foundExtensions).includes(ext));
        if (ignoredExtensions.length > 0) {
            await writeLog(logFilePath, `Configured extensions with no matching files found:`, true);
            for (const ext of ignoredExtensions.sort()) {
                await writeLog(logFilePath, `  ${ext}`, true);
            }
        }
        
        if (otherExtensions.size > 0) {
            await writeLog(logFilePath, `File extensions found in project but not configured for processing:`, true);
            for (const ext of Array.from(otherExtensions).sort()) {
                await writeLog(logFilePath, `  ${ext}`, true);
            }
        }
        
        const generatedFormats = [];
        if (config.generateText) generatedFormats.push('.txt');
        if (config.generateMarkdown) generatedFormats.push('.md');
        if (config.generateHtml) generatedFormats.push('.html');
        if (config.generatePdf) generatedFormats.push('.pdf');
        
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