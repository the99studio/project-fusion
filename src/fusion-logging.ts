// SPDX-License-Identifier: MIT
// Copyright (c) 2025 the99studio
/**
 * Logging helpers for fusion process
 */
import type { Config } from './types.js';
import { formatTimestamp } from './utils.js';

/**
 * Processing statistics for enhanced logging
 */
export interface ProcessingStats {
    binaryFilesSkipped: string[];
    secretsDetected: { file: string; types: string[] }[];
    minifiedFilesDetected: string[];
    validationWarnings: { file: string; warning: string }[];
    validationErrors: { file: string; error: string }[];
    errorPlaceholders: string[];
}

/**
 * Output file info for logging
 */
export interface OutputFileInfo {
    name: string;
    path: string;
    sizeKB: number;
}

/**
 * Performance metrics for logging
 */
export interface PerformanceMetricsInfo {
    duration: string;
    startTime: Date;
    metrics: { memoryUsed: number; throughputMBps: number; filesProcessed: number; duration: number };
    filesCount: number;
    totalSizeBytes: number;
    outputFormats: string;
    outputFilesCount: number;
}

/**
 * Write performance metrics to log
 */
export async function writePerformanceMetrics(
    writeLog: (content: string) => Promise<void>,
    info: PerformanceMetricsInfo
): Promise<void> {
    await writeLog(`\n--- PERFORMANCE METRICS ---`);
    await writeLog(`Duration breakdown:`);
    await writeLog(`  Total execution: ${info.duration}s`);
    await writeLog(`  File discovery: ${((Date.now() - info.startTime.getTime()) / 1000 / Number.parseFloat(info.duration) * 100).toFixed(1)}% of total`);

    await writeLog(`Memory usage:`);
    await writeLog(`  Peak memory: ${info.metrics.memoryUsed.toFixed(2)} MB`);
    await writeLog(`  Memory per file: ${info.filesCount > 0 ? (info.metrics.memoryUsed / info.filesCount * 1024).toFixed(2) : '0'} KB`);

    await writeLog(`Processing speed:`);
    await writeLog(`  Data throughput: ${info.metrics.throughputMBps.toFixed(2)} MB/s`);
    await writeLog(`  File processing rate: ${(info.metrics.filesProcessed / info.metrics.duration).toFixed(2)} files/s`);
    await writeLog(`  Average file size: ${info.filesCount > 0 ? (info.totalSizeBytes / info.filesCount / 1024).toFixed(2) : '0'} KB`);

    await writeLog(`Output generation:`);
    await writeLog(`  Generated formats: ${info.outputFormats}`);
    await writeLog(`  Number of output files: ${info.outputFilesCount}`);
}

/**
 * Write initial session and configuration info to log
 */
export async function writeSessionHeader(
    writeLog: (content: string) => Promise<void>,
    config: Config,
    startTime: Date,
    extensionGroupsFilter?: readonly string[]
): Promise<void> {
    await writeLog(`=== PROJECT FUSION SESSION START ===`);
    await writeLog(`Session ID: ${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`);
    await writeLog(`Start time: ${formatTimestamp(startTime)}`);
    await writeLog(`Working directory: ${config.rootDirectory}`);
    await writeLog(`Generated file name: ${config.generatedFileName}`);

    await writeLog(`\n--- CONFIGURATION ---`);
    await writeLog(`Output formats:`);
    await writeLog(`  - Text (.txt): ${config.generateText}`);
    await writeLog(`  - Markdown (.md): ${config.generateMarkdown}`);
    await writeLog(`  - HTML (.html): ${config.generateHtml}`);

    await writeLog(`Processing limits:`);
    await writeLog(`  - Max file size: ${config.maxFileSizeKB} KB`);
    await writeLog(`  - Max files: ${config.maxFiles}`);
    await writeLog(`  - Max total size: ${config.maxTotalSizeMB} MB`);

    await writeLog(`Directory scanning:`);
    await writeLog(`  - Parse subdirectories: ${config.parseSubDirectories}`);
    await writeLog(`  - Use .gitignore: ${config.useGitIgnoreForExcludes}`);
    await writeLog(`  - Allow symlinks: ${config.allowSymlinks}`);

    if (config.ignorePatterns.length > 0) {
        await writeLog(`Ignore patterns: ${config.ignorePatterns.join(', ')}`);
    }

    await writeLog(`Auto-ignoring generated files: ${config.generatedFileName}.txt, ${config.generatedFileName}.md, ${config.generatedFileName}.html, ${config.generatedFileName}.log, performance-report.json`);

    if (extensionGroupsFilter) {
        await writeLog(`Extension groups filter: ${extensionGroupsFilter.join(', ')}`);
    }
}

/**
 * Write enhanced statistics to the log file
 */
export async function writeEnhancedStatistics(
    writeLog: (content: string) => Promise<void>,
    processingStats: ProcessingStats,
    includeFilenamesMatched: { pattern: string; files: string[] }[],
    outputFilesInfo: OutputFileInfo[]
): Promise<void> {
    // Content Analysis section
    const hasContentAnalysisInfo = processingStats.binaryFilesSkipped.length > 0 ||
        processingStats.minifiedFilesDetected.length > 0 ||
        processingStats.validationWarnings.length > 0 ||
        processingStats.validationErrors.length > 0 ||
        processingStats.errorPlaceholders.length > 0;

    if (hasContentAnalysisInfo) {
        await writeLog(`\n--- CONTENT ANALYSIS ---`);

        if (processingStats.binaryFilesSkipped.length > 0) {
            await writeLog(`Binary files skipped: ${processingStats.binaryFilesSkipped.length}`);
            for (const file of processingStats.binaryFilesSkipped.slice(0, 5)) {
                await writeLog(`  - ${file}`);
            }
            if (processingStats.binaryFilesSkipped.length > 5) {
                await writeLog(`  ... and ${processingStats.binaryFilesSkipped.length - 5} more`);
            }
        }

        if (processingStats.minifiedFilesDetected.length > 0) {
            await writeLog(`Minified files detected: ${processingStats.minifiedFilesDetected.length}`);
            for (const file of processingStats.minifiedFilesDetected.slice(0, 5)) {
                await writeLog(`  - ${file}`);
            }
            if (processingStats.minifiedFilesDetected.length > 5) {
                await writeLog(`  ... and ${processingStats.minifiedFilesDetected.length - 5} more`);
            }
        }

        if (processingStats.validationWarnings.length > 0) {
            await writeLog(`Content validation warnings: ${processingStats.validationWarnings.length}`);
        }

        if (processingStats.validationErrors.length > 0) {
            await writeLog(`Content validation errors: ${processingStats.validationErrors.length}`);
        }

        if (processingStats.errorPlaceholders.length > 0) {
            await writeLog(`Files replaced with error placeholders: ${processingStats.errorPlaceholders.length}`);
            for (const file of processingStats.errorPlaceholders.slice(0, 5)) {
                await writeLog(`  - ${file}`);
            }
            if (processingStats.errorPlaceholders.length > 5) {
                await writeLog(`  ... and ${processingStats.errorPlaceholders.length - 5} more`);
            }
        }
    }

    // Security section
    if (processingStats.secretsDetected.length > 0) {
        await writeLog(`\n--- SECURITY ---`);
        await writeLog(`Files with secrets redacted: ${processingStats.secretsDetected.length}`);

        // Count secret types
        const secretTypeCounts = new Map<string, number>();
        for (const { types } of processingStats.secretsDetected) {
            for (const type of types) {
                secretTypeCounts.set(type, (secretTypeCounts.get(type) ?? 0) + 1);
            }
        }

        if (secretTypeCounts.size > 0) {
            await writeLog(`Secret types found:`);
            const sortedTypes = [...secretTypeCounts.entries()].sort(([,a], [,b]) => b - a);
            for (const [type, count] of sortedTypes) {
                await writeLog(`  - ${type}: ${count} occurrence(s)`);
            }
        }

        await writeLog(`Files affected:`);
        for (const { file } of processingStats.secretsDetected.slice(0, 10)) {
            await writeLog(`  - ${file}`);
        }
        if (processingStats.secretsDetected.length > 10) {
            await writeLog(`  ... and ${processingStats.secretsDetected.length - 10} more`);
        }
    }

    // Special files section (includeFilenames matches)
    if (includeFilenamesMatched.length > 0) {
        await writeLog(`\n--- SPECIAL FILES (includeFilenames) ---`);
        let totalMatched = 0;
        for (const { pattern, files } of includeFilenamesMatched) {
            totalMatched += files.length;
            await writeLog(`Pattern "${pattern}": ${files.length} file(s)`);
            for (const file of files.slice(0, 3)) {
                await writeLog(`  - ${file}`);
            }
            if (files.length > 3) {
                await writeLog(`  ... and ${files.length - 3} more`);
            }
        }
        await writeLog(`Total special files matched: ${totalMatched}`);
    }

    // Output files with sizes
    if (outputFilesInfo.length > 0) {
        const totalOutputSizeKB = outputFilesInfo.reduce((sum, f) => sum + f.sizeKB, 0);
        await writeLog(`\n--- OUTPUT FILES ---`);
        for (const file of outputFilesInfo) {
            const sizeStr = file.sizeKB > 1024
                ? `${(file.sizeKB / 1024).toFixed(2)} MB`
                : `${file.sizeKB.toFixed(2)} KB`;
            await writeLog(`  ${file.path} (${sizeStr})`);
        }
        const totalStr = totalOutputSizeKB > 1024
            ? `${(totalOutputSizeKB / 1024).toFixed(2)} MB`
            : `${totalOutputSizeKB.toFixed(2)} KB`;
        await writeLog(`Total output size: ${totalStr}`);
    }
}
