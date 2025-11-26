// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Fusion functionality - Refactored with new architecture patterns
 */
import path from 'node:path';
import ignoreLib from 'ignore';
import { DefaultFileSystemAdapter } from './adapters/file-system.js';
import type { FusionProgress, CancellationToken } from './api.js';
import { BenchmarkTracker } from './benchmark.js';
import {
    type OutputFileInfo,
    type ProcessingStats,
    writeEnhancedStatistics,
    writePerformanceMetrics,
    writeSessionHeader
} from './fusion-logging.js';
import { PluginManager } from './plugins/plugin-system.js';
import {
    type FileInfo,
    type OutputContext,
    OutputStrategyManager
} from './strategies/output-strategy.js';
import { type Config, type FilePath, type FusionOptions, type FusionResult, createFilePath } from './types.js';
import { logger } from './utils/logger.js';
import {
    formatTimestamp,
    generateHelpfulEmptyMessage,
    getExtensionsFromGroups,
    isBinaryFile,
    isMinifiedContent,
    redactSecrets,
    validateFileContent,
    validateNoSymlinks,
    validateSecurePath
} from './utils.js';
import { getVersionSync } from './version.js';

/**
 * Create an error placeholder for rejected files
 */
function createErrorPlaceholder(filePath: string, errorDetails: string): string {
    return `[ERROR: Content validation failed for ${filePath}]
---
This file was rejected due to content validation rules.
Reason: ${errorDetails}

To include this file anyway, adjust validation limits in your config.
---`;
}

/**
 * Determines if a file should be skipped based on minification status and validation results.
 * Extracted for clarity and maintainability.
 *
 * @returns Object containing processing decision:
 *   - shouldSkip: true if file should be entirely skipped
 *   - shouldCreatePlaceholder: true if error placeholder should be created
 */
function determineMinifiedFileHandling(
    isMinified: boolean,
    validationResult: { valid: boolean; issues: { hasLargeBase64?: boolean; hasLongTokens?: boolean; hasLongLines?: boolean }; errors: string[] }
): { shouldSkip: boolean; shouldCreatePlaceholder: boolean; errorDetails?: string } {
    // If validation passed, no special handling needed
    if (validationResult.valid) {
        return { shouldSkip: false, shouldCreatePlaceholder: false };
    }

    const { hasLargeBase64, hasLongTokens, hasLongLines } = validationResult.issues;
    const hasOnlyLongLineIssues = hasLongLines && !hasLargeBase64 && !hasLongTokens;

    // For minified content with ONLY long line issues (no base64 or token problems):
    // Skip entirely - this is pure minification, not problematic content
    if (isMinified && hasOnlyLongLineIssues) {
        return { shouldSkip: true, shouldCreatePlaceholder: false };
    }

    // For all other validation failures (base64 issues, token issues, or non-minified with long lines):
    // Create an error placeholder to inform the user
    return {
        shouldSkip: false,
        shouldCreatePlaceholder: true,
        errorDetails: validationResult.errors.join('\n')
    };
}

/**
 * Result of globbing include filenames
 */
interface GlobIncludeFilenamesResult {
    filePaths: FilePath[];
    matchedFiles: { pattern: string; files: string[] }[];
}

/**
 * Glob for special filenames without extensions (Dockerfile, Makefile, etc.)
 */
async function globIncludeFilenames(
    config: Config,
    rootDir: string,
    fsAdapter: { glob: (pattern: string, options?: { nodir?: boolean; follow?: boolean; dot?: boolean }) => Promise<FilePath[]> },
    existingFilePaths: FilePath[]
): Promise<GlobIncludeFilenamesResult> {
    const matchedFiles: { pattern: string; files: string[] }[] = [];

    if (!config.includeFilenames || config.includeFilenames.length === 0) {
        return { filePaths: existingFilePaths, matchedFiles };
    }

    const filePaths = [...existingFilePaths];
    const existingSet = new Set<string>(filePaths);

    for (const filenamePattern of config.includeFilenames) {
        const filenameGlob = config.parseSubDirectories
            ? `${rootDir}/**/${filenamePattern}`
            : `${rootDir}/${filenamePattern}`;
        const additionalFiles = await fsAdapter.glob(filenameGlob, {
            nodir: true,
            follow: false
        });
        const newlyMatched: string[] = [];
        for (const file of additionalFiles) {
            if (!existingSet.has(file)) {
                filePaths.push(file);
                existingSet.add(file);
                newlyMatched.push(path.relative(rootDir, file));
            }
        }
        if (newlyMatched.length > 0) {
            matchedFiles.push({ pattern: filenamePattern, files: newlyMatched });
        }
    }

    return { filePaths, matchedFiles };
}

export async function processFusion(
    config: Config,
    options: FusionOptions & {
        onProgress?: (progress: FusionProgress) => void;
        cancellationToken?: CancellationToken;
    } = {}
): Promise<FusionResult> {
    const benchmark = new BenchmarkTracker();
    const fs = options.fs ?? new DefaultFileSystemAdapter();
    const outputManager = new OutputStrategyManager();
    const pluginManager = new PluginManager(fs);
    
    // Progress tracking state
    const progressState = {
        lastProgressEmit: 0,
        filesProcessedSinceLastEmit: 0,
        totalBytesProcessed: 0,
        startTime: Date.now(),
        phaseStartTime: Date.now(),
        currentPhase: 'scanning' as FusionProgress['step']
    };
    
    // Configure progress granularity (emit every N files or on phase change)
    const PROGRESS_EMIT_INTERVAL = 10; // Emit progress every 10 files
    
    // Pre-compute frequently used values
    const rootDir = path.resolve(config.rootDirectory);
    const maxFileSizeKB = config.maxFileSizeKB;
    const maxTotalSizeBytes = config.maxTotalSizeMB * 1024 * 1024;

    // Helper function to write logs using the FileSystemAdapter
    const writeLogWithFs = async (logFilePath: string, content: string, append = false, consoleOutput = false): Promise<void> => {
        try {
            await fs.ensureDir(path.dirname(logFilePath));
            const filePath = createFilePath(logFilePath);
            await (append ? fs.appendFile(filePath, `${content  }\n`) : fs.writeFile(filePath, `${content  }\n`));
            if (consoleOutput) {
                logger.info(content);
            }
        } catch (error) {
            console.error('Error writing log:', error);
        }
    };

    // Helper function to check cancellation
    const checkCancellation = (): void => {
        if (options.cancellationToken?.isCancellationRequested) {
            throw new Error('Operation was cancelled');
        }
    };

    // Helper function to report progress with ETA and throughput
    const reportProgress = (
        step: FusionProgress['step'], 
        message: string, 
        filesProcessed = 0, 
        totalFiles = 0, 
        currentFile?: string  ,
        forceEmit = false
    ): void => {
        if (!options.onProgress) { return; }
        
        const phaseChanged = step !== progressState.currentPhase;
        progressState.filesProcessedSinceLastEmit++;
        
        // Always emit for first file in processing, small file sets, or when forced
        const isFirstFileInProcessing = step === 'processing' && filesProcessed === 1;
        const isSmallFileSet = totalFiles <= PROGRESS_EMIT_INTERVAL;
        
        const shouldEmit = forceEmit || 
                          phaseChanged || 
                          isFirstFileInProcessing ||
                          isSmallFileSet || // Always emit for small file sets
                          progressState.filesProcessedSinceLastEmit >= PROGRESS_EMIT_INTERVAL ||
                          filesProcessed === totalFiles; // Always emit on completion
        
        if (!shouldEmit && !phaseChanged) { return; }
        
        // Reset counter and update phase
        if (phaseChanged) {
            progressState.currentPhase = step;
            progressState.phaseStartTime = Date.now();
        }
        progressState.filesProcessedSinceLastEmit = 0;
        progressState.lastProgressEmit = Date.now();
        
        const percentage = totalFiles > 0 ? Math.round((filesProcessed / totalFiles) * 100) : 0;
        const elapsedSeconds = (Date.now() - progressState.startTime) / 1000;
        
        // Calculate ETA based on current progress
        let etaSeconds: number | undefined;
        if (filesProcessed > 0 && totalFiles > 0 && filesProcessed < totalFiles) {
            const averageTimePerFile = elapsedSeconds / filesProcessed;
            const remainingFiles = totalFiles - filesProcessed;
            etaSeconds = Math.round(averageTimePerFile * remainingFiles);
        }
        
        const metrics = benchmark.getMetrics();
        const mbProcessed = metrics.totalSizeMB;
        const throughputMBps = metrics.throughputMBps;
        
        options.onProgress({
            step,
            message,
            filesProcessed,
            totalFiles,
            percentage,
            currentFile,
            ...(etaSeconds !== undefined && { etaSeconds }),
            ...(mbProcessed !== undefined && { mbProcessed }),
            ...(throughputMBps !== undefined && { throughputMBps })
        });
    };

    try {
        checkCancellation();
        reportProgress('scanning', 'Initializing fusion process...', 0, 0, undefined, true);
        const outputDir = config.outputDirectory ?? config.rootDirectory;
        const logFilePath = createFilePath(path.resolve(outputDir, `${config.generatedFileName}.log`));
        const startTime = new Date();

        await fs.ensureDir(path.dirname(logFilePath));
        await fs.writeFile(logFilePath, '');

        // Write session header using helper function
        // NOTE: TOCTOU (Time-of-Check-Time-of-Use) considerations:
        // File system operations are inherently subject to race conditions. Files may change
        // between validation and processing. This is mitigated by:
        // 1. Using file handles where possible (isBinaryFile uses open() to avoid TOCTOU)
        // 2. Accepting that in concurrent environments, some edge cases may occur
        // 3. Focusing security controls on path validation (which is checked at access time)
        const writeLog = (content: string): Promise<void> => writeLogWithFs(logFilePath, content, true);
        await writeSessionHeader(writeLog, config, startTime, options.extensionGroups);

        if (options.pluginsDir) {
            await pluginManager.loadPluginsFromDirectory(options.pluginsDir, config);
        }

        if (options.enabledPlugins) {
            for (const pluginName of options.enabledPlugins) {
                pluginManager.configurePlugin(pluginName, { name: pluginName, enabled: true });
            }
        }

        await pluginManager.initializePlugins(config);
        
        // Log plugin information
        const loadedPlugins = pluginManager.listPlugins();
        const enabledPlugins = pluginManager.getEnabledPlugins();
        
        if (options.pluginsDir || options.enabledPlugins) {
            await writeLogWithFs(logFilePath, `\n--- PLUGINS ---`, true);
            if (options.pluginsDir) {
                await writeLogWithFs(logFilePath, `Plugin directory: ${options.pluginsDir}`, true);
            }
            if (loadedPlugins.length > 0) {
                await writeLogWithFs(logFilePath, `Loaded plugins: ${loadedPlugins.length}`, true);
                for (const plugin of loadedPlugins) {
                    const isEnabled = enabledPlugins.some(p => p.metadata.name === plugin.name);
                    await writeLogWithFs(logFilePath, `  - ${plugin.name} v${plugin.version} (${isEnabled ? 'enabled' : 'disabled'})`, true);
                }
            } else {
                await writeLogWithFs(logFilePath, `No plugins loaded`, true);
            }
        }

        const additionalStrategies = pluginManager.getAdditionalOutputStrategies();
        for (const strategy of additionalStrategies) {
            outputManager.registerStrategy(strategy);
        }

        const additionalExtensions = pluginManager.getAdditionalFileExtensions();
        const mergedConfig = {
            ...config,
            parsedFileExtensions: {
                ...config.parsedFileExtensions,
                ...additionalExtensions
            }
        };

        const extensions = getExtensionsFromGroups(mergedConfig, options.extensionGroups);
        
        // Log processing information
        await writeLogWithFs(logFilePath, `\n--- PROCESSING ---`, true);
        logger.info(`Processing ${extensions.length} file extensions from ${Object.keys(mergedConfig.parsedFileExtensions).length} categories`);
        await writeLogWithFs(logFilePath, `File extensions to process: ${extensions.length}`, true);
        await writeLogWithFs(logFilePath, `Available extension categories: ${Object.keys(mergedConfig.parsedFileExtensions).length}`, true);
        
        if (additionalExtensions && Object.keys(additionalExtensions).length > 0) {
            await writeLogWithFs(logFilePath, `Additional extensions from plugins: ${Object.keys(additionalExtensions).join(', ')}`, true);
        }
        
        if (additionalStrategies.length > 0) {
            await writeLogWithFs(logFilePath, `Additional output strategies from plugins: ${additionalStrategies.map(s => s.name).join(', ')}`, true);
        }
        
        if (extensions.length === 0) {
            const message = 'No file extensions to process.';
            await writeLogWithFs(logFilePath, `Status: Fusion failed\nReason: ${message}`, true);
            return { success: false, message, logFilePath, filesProcessed: 0 };
        }

        const ig = ignoreLib();

        if (config.useGitIgnoreForExcludes) {
            const gitIgnorePath = path.join(rootDir, '.gitignore');
            if (await fs.exists(createFilePath(gitIgnorePath))) {
                const gitIgnoreContent = await fs.readFile(createFilePath(gitIgnorePath));
                ig.add(gitIgnoreContent);
            }
        }

        if (config.ignorePatterns.length > 0) {
            const patterns = config.ignorePatterns
                .filter(pattern => pattern.trim() !== '' && !pattern.startsWith('#'))
                .join('\n');
            ig.add(patterns);
        }

        // Auto-ignore generated files based on generatedFileName
        const generatedFilePatterns = [
            `${config.generatedFileName}.txt`,
            `${config.generatedFileName}.md`,
            `${config.generatedFileName}.html`,
            `${config.generatedFileName}.log`,
            `performance-report.json` // Also ignore performance report
        ];
        ig.add(generatedFilePatterns.join('\n'));

        const allExtensionsPattern = extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
        const pattern = config.parseSubDirectories
            ? `${rootDir}/**/*@(${allExtensionsPattern.join('|')})`
            : `${rootDir}/*@(${allExtensionsPattern.join('|')})`;

        checkCancellation();
        reportProgress('scanning', 'Scanning for files...', 0, 0, undefined, true);

        let filePaths = await fs.glob(pattern, {
            nodir: true,
            follow: false
        });

        // Also glob for special filenames without extensions (Dockerfile, Makefile, etc.)
        const includeFilenamesResult = await globIncludeFilenames(config, rootDir, fs, filePaths);
        filePaths = includeFilenamesResult.filePaths;
        const includeFilenamesMatched = includeFilenamesResult.matchedFiles;

        const originalFileCount = filePaths.length;
        filePaths = filePaths.filter(file => {
            const relativePath = path.relative(rootDir, file);
            return !ig.ignores(relativePath);
        });

        reportProgress('scanning', `Found ${filePaths.length} files after filtering`, 0, filePaths.length, undefined, true);
        logger.info(`Found ${originalFileCount} files, ${filePaths.length} after filtering (${((originalFileCount - filePaths.length) / originalFileCount * 100).toFixed(1)}% filtered)`);

        if (filePaths.length === 0) {
            const message = 'No files found to process.';
            const helpMessage = generateHelpfulEmptyMessage(extensions, mergedConfig);
            const endTime = new Date();
            await writeLogWithFs(logFilePath, `Status: Fusion failed\nReason: ${message}\nStart time: ${formatTimestamp(startTime)}\nEnd time: ${formatTimestamp(endTime)}\nDuration: ${((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)}s`, true);
            return { 
                success: false, 
                message: `${message}\n\n${helpMessage}`, 
                logFilePath 
            };
        }

        const projectName = path.basename(process.cwd());
        let packageName = "";
        let projectVersion = "";
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        if (await fs.exists(createFilePath(packageJsonPath))) {
            try {
                const packageJsonContent = await fs.readFile(createFilePath(packageJsonPath));
                const packageJson = JSON.parse(packageJsonContent) as Record<string, unknown>;
                if (typeof packageJson['name'] === 'string') {
                    packageName = packageJson['name'];
                }
                if (typeof packageJson['version'] === 'string') {
                    projectVersion = packageJson['version'];
                }
            } catch (error) {
                console.warn('Error reading package.json:', error);
            }
        }

        filePaths.sort((a, b) => path.relative(rootDir, a).localeCompare(path.relative(rootDir, b)));

        // Initial memory check
        // await logMemoryUsageIfNeeded(logFilePath, 'Initial memory check');

        // Check resource limits early
        if (filePaths.length > config.maxFiles) {
            const message = `Too many files found (${filePaths.length} > ${config.maxFiles}). ` +
                `Consider using more specific --include patterns or increasing maxFiles in config.`;
            await writeLogWithFs(logFilePath, message, true);
            return {
                success: false,
                error: message,
                message,
                code: 'TOO_MANY_FILES' as const,
                details: {
                    filesFound: filePaths.length,
                    maxFiles: config.maxFiles,
                    suggestion: 'Use --include patterns to filter files or increase maxFiles limit'
                }
            };
        }

        const filesToProcess: FileInfo[] = [];
        const skippedFiles: string[] = [];
        let skippedCount = 0;
        let totalSizeBytes = 0;

        // Enhanced tracking for detailed logging
        const processingStats: ProcessingStats = {
            binaryFilesSkipped: [],
            secretsDetected: [],
            minifiedFilesDetected: [],
            validationWarnings: [],
            validationErrors: [],
            errorPlaceholders: []
        };

        reportProgress('processing', 'Processing files...', 0, filePaths.length, undefined, true);
        
        for (let i = 0; i < filePaths.length; i++) {
            const filePath = filePaths[i];
            if (!filePath) { continue; }
            const relativePath = path.relative(rootDir, filePath);

            checkCancellation();
            
            // Batch update bytes processed for better throughput calculation
            if (i > 0 && i % 5 === 0) {
                // Update every 5 files for better performance
                const lastFiles = filesToProcess.slice(-5);
                const batchSize = lastFiles.reduce((sum, file) => sum + file.size, 0);
                progressState.totalBytesProcessed += batchSize;
                benchmark.markFileProcessed(batchSize);
            }
            
            reportProgress('processing', `Processing ${relativePath}`, i + 1, filePaths.length, relativePath);

            try {
                const stats = await fs.stat(filePath);
                const sizeKB = stats.size / 1024;
                
                if (totalSizeBytes + stats.size > maxTotalSizeBytes) {
                    const totalSizeMB = (totalSizeBytes + stats.size) / (1024 * 1024);
                    const message = `Total size limit exceeded (${totalSizeMB.toFixed(2)} MB > ${config.maxTotalSizeMB} MB). ` +
                        `Consider using more specific --include patterns or increasing maxTotalSizeMB in config.`;
                    await writeLogWithFs(logFilePath, message, true);
                    return {
                        success: false,
                        error: message,
                        message,
                        code: 'SIZE_LIMIT_EXCEEDED' as const,
                        details: {
                            totalSizeMB,
                            maxTotalSizeMB: config.maxTotalSizeMB,
                            filesProcessed: filesToProcess.length,
                            suggestion: 'Use --include patterns to filter files or increase maxTotalSizeMB limit'
                        }
                    };
                }
                
                totalSizeBytes += stats.size;

                if (sizeKB > maxFileSizeKB) {
                    skippedCount++;
                    skippedFiles.push(relativePath);
                    const warningMsg = `Large file skipped: ${relativePath} (${sizeKB.toFixed(2)} KB > ${maxFileSizeKB} KB)`;
                    logger.consoleWarn(warningMsg);
                    await writeLogWithFs(logFilePath, `Skipped large file: ${relativePath} (${sizeKB.toFixed(2)} KB)`, true);
                } else {
                    const safePath = validateSecurePath(filePath, config.rootDirectory);
                    await validateNoSymlinks(createFilePath(safePath), config.allowSymlinks, config);
                    
                    // Batch operations to reduce async overhead
                    const [isBinary, rawFileContent] = await Promise.all([
                        isBinaryFile(safePath),
                        fs.readFile(createFilePath(safePath))
                    ]);
                    
                    if (isBinary) {
                        processingStats.binaryFilesSkipped.push(relativePath);
                        await writeLogWithFs(logFilePath, `Skipping binary file: ${relativePath}`, true);
                        logger.consoleWarn(`Binary file skipped: ${relativePath}`);
                        continue;
                    }
                    
                    checkCancellation();
                    let content = rawFileContent;
                    
                    // Redact secrets if enabled
                    if (config.excludeSecrets) {
                        const { redactedContent, detectedSecrets } = redactSecrets(content);
                        if (detectedSecrets.length > 0) {
                            content = redactedContent;
                            processingStats.secretsDetected.push({
                                file: relativePath,
                                types: detectedSecrets
                            });
                        }
                    }
                    
                    const validationResult = validateFileContent(content, relativePath, config);
                    
                    // Log warnings and errors
                    for (const warning of validationResult.warnings) {
                        processingStats.validationWarnings.push({ file: relativePath, warning });
                        await writeLogWithFs(logFilePath, `Content validation warning: ${warning}`, true);
                        logger.consoleWarn(warning);
                    }

                    for (const error of validationResult.errors) {
                        processingStats.validationErrors.push({ file: relativePath, error });
                        await writeLogWithFs(logFilePath, `Content validation error: ${error}`, true);
                        console.error(`❌ ${error}`);
                    }
                    
                    // Check for minified content and determine handling strategy
                    const isMinified = isMinifiedContent(content, relativePath);
                    if (isMinified) {
                        processingStats.minifiedFilesDetected.push(relativePath);
                        await writeLogWithFs(logFilePath, `Detected minified content in: ${relativePath}`, true);
                    }

                    // Use extracted function for clearer minification handling logic
                    const handling = determineMinifiedFileHandling(isMinified, validationResult);

                    if (handling.shouldSkip) {
                        await writeLogWithFs(logFilePath, `Rejecting minified file: ${relativePath}`, true);
                        continue;
                    }

                    let processedFileContent = content;
                    let isErrorPlaceholder = false;

                    if (handling.shouldCreatePlaceholder) {
                        processingStats.errorPlaceholders.push(relativePath);
                        await writeLogWithFs(logFilePath, `Content validation failed for: ${relativePath}`, true);
                        processedFileContent = createErrorPlaceholder(relativePath, handling.errorDetails ?? 'Unknown error');
                        isErrorPlaceholder = true;
                    }
                    
                    let fileInfo: FileInfo = {
                        content: processedFileContent,
                        relativePath,
                        path: filePath,
                        size: stats.size,
                        isErrorPlaceholder // Track if this is an error placeholder
                    };

                    checkCancellation();
                    fileInfo = await pluginManager.executeBeforeFileProcessing(fileInfo, config, options.cancellationToken) ?? fileInfo;
                    
                    if (fileInfo) {
                        filesToProcess.push(fileInfo);
                    }
                }
            } catch (error) {
                await writeLogWithFs(logFilePath, `Error checking file ${filePath}: ${String(error)}`, true);
                console.error(`Error checking file ${filePath}:`, error);
            }
        }

        // Memory check after file processing
        // await logMemoryUsageIfNeeded(logFilePath, 'After file processing');

        checkCancellation();
        const beforeFusionResult = await pluginManager.executeBeforeFusion(mergedConfig, filesToProcess, options.cancellationToken);
        const finalConfig = beforeFusionResult.config;
        const finalFilesToProcess = beforeFusionResult.filesToProcess;

        if (options.previewMode) {
            const endTime = new Date();
            const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);
            
            await writeLogWithFs(logFilePath, `\n--- PREVIEW MODE RESULTS ---`, true);
            await writeLogWithFs(logFilePath, `Files that would be processed: ${finalFilesToProcess.length}`, true);
            
            if (finalFilesToProcess.length === 0) {
                await writeLogWithFs(logFilePath, `No files found matching the criteria.`, true);
                const message = `Preview completed: No files found matching your criteria.`;
                await writeLogWithFs(logFilePath, `Status: ${message}`, true);
                await writeLogWithFs(logFilePath, `Duration: ${duration}s`, true);
                return { 
                    success: false, 
                    message: `${message}\n\n${generateHelpfulEmptyMessage(extensions, mergedConfig)}`, 
                    logFilePath 
                };
            }
            
            // Group files by extension for better display
            const filesByExtension: Record<string, string[]> = {};
            for (const file of finalFilesToProcess) {
                const ext = path.extname(file.path).toLowerCase() || 'no extension';
                filesByExtension[ext] ??= [];
                filesByExtension[ext].push(file.relativePath);
            }
            
            for (const [ext, files] of Object.entries(filesByExtension)) {
                await writeLogWithFs(logFilePath, `  ${ext}: ${files.length} files`, true);
                for (const file of files.slice(0, 5)) { // Show first 5 files
                    await writeLogWithFs(logFilePath, `    - ${file}`, true);
                }
                if (files.length > 5) {
                    await writeLogWithFs(logFilePath, `    ... and ${files.length - 5} more`, true);
                }
            }
            
            const message = `Preview completed: ${finalFilesToProcess.length} files would be processed.`;
            await writeLogWithFs(logFilePath, `Status: ${message}`, true);
            await writeLogWithFs(logFilePath, `Duration: ${duration}s`, true);
            
            return { 
                success: true, 
                message, 
                logFilePath,
                fusionFilePath: logFilePath,
                filesProcessed: 0
            };
        }

        if (finalFilesToProcess.length === 0) {
            const endTime = new Date();
            const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);
            
            // If we found files initially but all were skipped (due to size/binary/etc), 
            // this is a successful operation with 0 files processed
            if (filePaths.length > 0) {
                const message = `Fusion completed successfully. 0 files processed${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}.`;
                await writeLogWithFs(logFilePath, `Status: Fusion completed successfully\nFiles processed: 0\nFiles skipped: ${skippedCount}\nStart time: ${formatTimestamp(startTime)}\nEnd time: ${formatTimestamp(endTime)}\nDuration: ${duration}s`, true);
                
                return { 
                    success: true, 
                    message, 
                    logFilePath,
                    fusionFilePath: logFilePath,
                    filesProcessed: 0
                };
            }
            // No files found at all - this is a failure
            const message = 'No files found matching your criteria.';
            const helpMessage = generateHelpfulEmptyMessage(extensions, mergedConfig);
            await writeLogWithFs(logFilePath, `Status: Fusion failed\nReason: ${message}\nStart time: ${formatTimestamp(startTime)}\nEnd time: ${formatTimestamp(endTime)}\nDuration: ${duration}s`, true);
            return { 
                success: false, 
                message: `${message}\n\n${helpMessage}`, 
                logFilePath 
            };
        }

        const projectTitle = packageName && packageName.toLowerCase() !== projectName.toLowerCase() 
            ? `${projectName} / ${packageName}` 
            : projectName;
        const versionInfo = projectVersion ? ` v${projectVersion}` : '';

        const outputContext: OutputContext = {
            projectTitle,
            versionInfo,
            filesToProcess: finalFilesToProcess,
            config: finalConfig,
            toolVersion: getVersionSync()
        };

        checkCancellation();
        reportProgress('generating', 'Generating output files...', finalFilesToProcess.length, finalFilesToProcess.length, undefined, true);
        
        const enabledStrategies = outputManager.getEnabledStrategies(finalConfig);
        const generatedPaths: FilePath[] = [];
        const outputFilesInfo: OutputFileInfo[] = [];

        for (const strategy of enabledStrategies) {
            checkCancellation();
            reportProgress('generating', `Generating ${strategy.name} output...`, 0, finalFilesToProcess.length, undefined, true);

            try {
                // Use the streaming version with progress callback
                const outputPath = await outputManager.generateOutput(
                    strategy,
                    outputContext,
                    fs,
                    (fileInfo, index, total) => {
                        checkCancellation();
                        reportProgress(
                            'generating',
                            `Generating ${strategy.name} output - processing ${fileInfo.relativePath}`,
                            index + 1,
                            total,
                            fileInfo.relativePath,
                            false // Use normal granularity
                        );
                    },
                    options.cancellationToken
                );
                generatedPaths.push(outputPath);

                // Track output file size
                try {
                    const outputStats = await fs.stat(outputPath);
                    outputFilesInfo.push({
                        name: strategy.name,
                        path: path.basename(outputPath),
                        sizeKB: outputStats.size / 1024
                    });
                } catch {
                    // If we can't get the size, still track the file without size
                    outputFilesInfo.push({
                        name: strategy.name,
                        path: path.basename(outputPath),
                        sizeKB: 0
                    });
                }

                benchmark.markFileProcessed(0);
            } catch (error) {
                await writeLogWithFs(logFilePath, `Error generating ${strategy.name} output: ${String(error)}`, true);
                console.error(`Error generating ${strategy.name} output:`, error);
            }
        }

        // Final memory check
        // await logMemoryUsageIfNeeded(logFilePath, 'Final memory check');

        reportProgress('writing', 'Finalizing...', finalFilesToProcess.length, finalFilesToProcess.length, undefined, true);
        
        const message = `Fusion completed successfully. ${finalFilesToProcess.length} files processed${skippedCount > 0 ? `, ${skippedCount} skipped` : ''}.`;
        const endTime = new Date();
        const duration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2);
        const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
        
        await writeLogWithFs(logFilePath, `Status: Fusion completed successfully`, true);
        await writeLogWithFs(logFilePath, `Start time: ${formatTimestamp(startTime)}`, true);
        await writeLogWithFs(logFilePath, `End time: ${formatTimestamp(endTime)}`, true);
        await writeLogWithFs(logFilePath, `Duration: ${duration}s`, true);
        await writeLogWithFs(logFilePath, `Total data processed: ${totalSizeMB} MB`, true);
        
        // File type statistics - optimized with Map for better performance
        const fileTypeStats = new Map<string, { count: number; sizeKB: number }>();
        const BYTES_TO_KB = 1 / 1024;
        
        for (const fileInfo of finalFilesToProcess) {
            const ext = path.extname(fileInfo.path).toLowerCase();
            const displayExt = ext || 'no extension';
            
            const existing = fileTypeStats.get(displayExt);
            if (existing) {
                existing.count++;
                existing.sizeKB += fileInfo.size * BYTES_TO_KB;
            } else {
                fileTypeStats.set(displayExt, { count: 1, sizeKB: fileInfo.size * BYTES_TO_KB });
            }
        }
        
        await writeLogWithFs(logFilePath, `\n--- FILE TYPE STATISTICS ---`, true);
        await writeLogWithFs(logFilePath, `Files found: ${originalFileCount}`, true);
        await writeLogWithFs(logFilePath, `Files processed successfully: ${finalFilesToProcess.length}`, true);
        await writeLogWithFs(logFilePath, `Files skipped (too large): ${skippedCount}`, true);
        await writeLogWithFs(logFilePath, `Files filtered out: ${originalFileCount - filePaths.length}`, true);
        
        if (fileTypeStats.size > 0) {
            await writeLogWithFs(logFilePath, `\nFile types processed:`, true);
            const sortedStats = [...fileTypeStats.entries()]
                .sort(([,a], [,b]) => b.count - a.count);
                
            for (const [ext, stats] of sortedStats) {
                await writeLogWithFs(logFilePath, `  ${ext}: ${stats.count} files (${stats.sizeKB.toFixed(2)} KB)`, true);
            }
        }
        
        if (skippedFiles.length > 0) {
            await writeLogWithFs(logFilePath, `\nSkipped files (too large):`, true);
            for (const file of skippedFiles.slice(0, 10)) { // Limit to first 10
                await writeLogWithFs(logFilePath, `  - ${file}`, true);
            }
            if (skippedFiles.length > 10) {
                await writeLogWithFs(logFilePath, `  ... and ${skippedFiles.length - 10} more`, true);
            }
        }

        // Write enhanced statistics (content analysis, security, special files, output files)
        await writeEnhancedStatistics(writeLog, processingStats, includeFilenamesMatched, outputFilesInfo);

        // Write performance metrics
        const metrics = benchmark.getMetrics();
        await writePerformanceMetrics(writeLog, {
            duration,
            startTime,
            metrics,
            filesCount: finalFilesToProcess.length,
            totalSizeBytes,
            outputFormats: enabledStrategies.map(s => s.name).join(', '),
            outputFilesCount: enabledStrategies.length
        });

        const generatedFormats = enabledStrategies.map(s => s.extension);
        
        const result = {
            success: true as const,
            message: `${message} Generated formats: ${generatedFormats.join(', ')}.`,
            fusionFilePath: generatedPaths[0] ?? logFilePath,
            logFilePath,
            filesProcessed: filesToProcess.length
        };

        const finalResult = await pluginManager.executeAfterFusion(result, finalConfig);
        
        await pluginManager.cleanupPlugins();
        
        return finalResult;

    } catch (error) {
        const errorMessage = `Fusion process failed: ${String(error)}`;
        console.error(errorMessage);

        try {
            await pluginManager.cleanupPlugins();
        } catch (cleanupError) {
            console.error('Error during plugin cleanup:', cleanupError);
        }

        try {
            let logFilePath: FilePath;
            try {
                const outputDir = config.outputDirectory ?? config.rootDirectory;
                logFilePath = createFilePath(path.resolve(outputDir, `${config.generatedFileName}.log`));
                const endTime = new Date();
                await writeLogWithFs(logFilePath, `Status: Fusion failed due to error\nError details: ${errorMessage}\nEnd time: ${formatTimestamp(endTime)}`, true);
            } catch {
                logFilePath = createFilePath(path.resolve(`${config.generatedFileName}.log`));
                const endTime = new Date();
                await writeLogWithFs(logFilePath, `Status: Fusion failed due to error\nError details: ${errorMessage}\nEnd time: ${formatTimestamp(endTime)}`, true);
            }

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