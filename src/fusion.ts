/**
 * Fusion functionality
 */
import fs from 'fs-extra';
import { glob } from 'glob';
import ignoreLib from 'ignore';
import path from 'path';
import {
    formatTimestamp,
    getExtensionsFromGroups,
    getMarkdownLanguage,
    readFileContent,
    writeFileContent,
    writeLog
} from './utils.js';
import {
    Config,
    FileInfo,
    FusionOptions,
    FusionResult,
    createFilePath
} from './types.js';

/**
 * Process fusion of files
 * @param config Configuration
 * @param options Fusion options
 * @returns Fusion result
 */
export async function processFusion(
    config: Config,
    options: FusionOptions = {}
): Promise<FusionResult> {
    try {
        const { fusion, parsing } = config;
        const logFilePath = createFilePath(path.resolve(fusion.fusion_log));
        const fusionFilePath = createFilePath(path.resolve(fusion.fusion_file));
        const startTime = new Date();

        await fs.writeFile(logFilePath, '');

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

        if (config.ignorePatterns && config.ignorePatterns.length > 0) {
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
            nodir: true
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
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
                if (packageJson.name) {
                    packageName = packageJson.name;
                }
            } catch (error) {
                console.warn('Error reading package.json:', error);
            }
        }

        // Track which extensions are actually used vs configured vs unknown
        const foundExtensions = new Set<string>();
        const otherExtensions = new Set<string>();

        // Discover all file extensions in the project for reporting
        const allFilesPattern = parsing.parseSubDirectories ? `${rootDir}/**/*.*` : `${rootDir}/*.*`;
        const allFiles = await glob(allFilesPattern, { nodir: true });

        const allConfiguredExtensions = Object.values(config.parsedFileExtensions).flat();
        const configuredExtensionSet = new Set(allConfiguredExtensions);
        for (const file of allFiles) {
            const relativePath = path.relative(rootDir, file);
            const ext = path.extname(file).toLowerCase();

            if (ext && !ig.ignores(relativePath) && !configuredExtensionSet.has(ext)) {
                otherExtensions.add(ext);
            }
        }

        const fileInfos: FileInfo[] = [];
        for (const filePath of filePaths) {
            try {
                const content = await readFileContent(filePath);
                const relativePath = path.relative(rootDir, filePath);

                const fileExt = path.extname(filePath).toLowerCase();
                foundExtensions.add(fileExt);

                fileInfos.push({
                    path: createFilePath(relativePath),
                    content
                });
            } catch (error) {
                await writeLog(logFilePath, `Error processing file ${filePath}: ${error}`, true);
                console.error(`Error processing file ${filePath}:`, error);
            }
        }

        fileInfos.sort((a, b) => a.path.localeCompare(b.path));

        // Generate plain text fusion file (.txt)
        let fusionContent = `# Generated Project Fusion File\n`;
        if (packageName && packageName.toLowerCase() !== projectName.toLowerCase()) {
            fusionContent += `# Project: ${projectName} / ${packageName}\n`;
        } else {
            fusionContent += `# Project: ${projectName}\n`;
        }
        fusionContent += `# @${formatTimestamp()}\n`;
        fusionContent += `# Files: ${fileInfos.length}\n\n`;

        for (const fileInfo of fileInfos) {
            fusionContent += `<!-- ============================================================ -->\n`;
            fusionContent += `<!-- FILE: ${fileInfo.path.padEnd(54)} -->\n`;
            fusionContent += `<!-- ============================================================ -->\n`;
            fusionContent += `${fileInfo.content}\n\n`;
        }

        await writeFileContent(fusionFilePath, fusionContent);
        
        // Generate enhanced markdown version with syntax highlighting
        const mdFilePath = createFilePath(fusionFilePath.replace('.txt', '.md'));
        let mdContent = `# Generated Project Fusion File\n`;
        if (packageName && packageName.toLowerCase() !== projectName.toLowerCase()) {
            mdContent += `**Project:** ${projectName} / ${packageName}\n\n`;
        } else {
            mdContent += `**Project:** ${projectName}\n\n`;
        }
        mdContent += `**Generated:** ${formatTimestamp()}\n\n`;
        mdContent += `**Files:** ${fileInfos.length}\n\n`;
        mdContent += `---\n\n`;
        
        mdContent += `## 📁 Table of Contents\n\n`;
        for (const fileInfo of fileInfos) {
            mdContent += `- [${fileInfo.path}](#${fileInfo.path.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()})\n`;
        }
        mdContent += `\n---\n\n`;
        
        for (const fileInfo of fileInfos) {
            const fileExt = path.extname(fileInfo.path).toLowerCase();
            const language = getMarkdownLanguage(fileExt);
            
            mdContent += `## 📄 ${fileInfo.path}\n\n`;
            mdContent += `\`\`\`${language}\n`;
            mdContent += `${fileInfo.content}\n`;
            mdContent += `\`\`\`\n\n`;
        }
        
        await writeFileContent(mdFilePath, mdContent);

        // Prepare success message and calculate processing metrics
        const message = `Fusion completed successfully. ${fileInfos.length} files processed.`;
        const endTime = new Date();
        const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);
        
        // Generate comprehensive log summary
        
        const ignoredExtensions = extensions.filter(ext => !Array.from(foundExtensions).includes(ext));
        
        await writeLog(logFilePath, `Status: Fusion completed successfully`, true);
        await writeLog(logFilePath, `Start time: ${formatTimestamp(startTime)}`, true);
        await writeLog(logFilePath, `End time: ${formatTimestamp(endTime)}`, true);
        await writeLog(logFilePath, `Duration: ${duration}s`, true);
        
        await writeLog(logFilePath, `Files found: ${originalFileCount}`, true);
        await writeLog(logFilePath, `Files processed successfully: ${fileInfos.length} (${((fileInfos.length / originalFileCount) * 100).toFixed(1)}% of total files)`, true);
        await writeLog(logFilePath, `Files found but filtered out: ${originalFileCount - fileInfos.length} (${((originalFileCount - fileInfos.length) / originalFileCount * 100).toFixed(1)}% of total files)`, true);
        
        await writeLog(logFilePath, `File extensions actually processed:`, true);
        const foundExtArray = Array.from(foundExtensions).sort();
        for (const ext of foundExtArray) {
            await writeLog(logFilePath, `  ${ext}`, true);
        }
        
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
        
        await writeLog(logFilePath, `Configuration used:`, true);
        await writeLog(logFilePath, `  Root directory: ${parsing.rootDirectory}`, true);
        await writeLog(logFilePath, `  Scan subdirectories: ${parsing.parseSubDirectories ? 'Yes' : 'No'}`, true);
        await writeLog(logFilePath, `  Apply .gitignore rules: ${config.useGitIgnoreForExcludes ? 'Yes' : 'No'}`, true);
        await writeLog(logFilePath, `  Custom ignore patterns defined: ${config.ignorePatterns.length} pattern${config.ignorePatterns.length !== 1 ? 's' : ''}`, true);
        
        await writeLog(logFilePath, `Output files generated:`, true);
        await writeLog(logFilePath, `  Plain text format: ${path.join(parsing.rootDirectory, path.basename(fusionFilePath))}`, true);
        await writeLog(logFilePath, `  Markdown format: ${path.join(parsing.rootDirectory, path.basename(fusionFilePath).replace('.txt', '.md'))}`, true);

        return {
            success: true,
            message: `${message} Created both .txt and .md versions.`,
            fusionFilePath,
            logFilePath
        };
    } catch (error) {
        const errorMessage = `Fusion process failed: ${error}`;
        console.error(errorMessage);

        try {
            const logFilePath = createFilePath(path.resolve(config.fusion.fusion_log));
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