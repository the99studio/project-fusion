import { diff_match_patch } from 'diff-match-patch';
import fs from 'fs-extra';
import path from 'path';
import {
    Config,
    calculateHash,
    ensureDirectoryExists,
    formatTimestamp,
    logError,
    readFileContent,
    writeFileContent,
    writeLog
} from '../coreutils.js';
import {
    ApplyDiffOptions,
    ApplyDiffResult,
    FileChangeType
} from './coreapplydifftypes.js';

/**
 * Advanced diff parsing utility with improved hunk parsing
 */
function parseDiff(diffContent: string): Array<{
    filePath: string;
    type: FileChangeType;
    hunks: Array<{
        oldStart: number;
        oldCount: number;
        newStart: number;
        newCount: number;
        lines: string[];
    }>;
    newPath?: string;
    hash?: string;
}> {
    const sections = diffContent.split(/^### /m).filter(section => section.trim());

    return sections.map(section => {
        const lines = section.split('\n');
        const headerMatch = lines[0].match(/(.+?)(?:\s+\[([A-Z]+)\](?:\s+(.+?))?)?$/);

        if (!headerMatch) throw new Error('Invalid diff section header');

        const [, filePath, type = 'MODIFY', newPath] = headerMatch;

        // Extract hash if present
        let hash: string | undefined;
        let startIndex = 1;
        if (lines[1]?.startsWith('# Hash:')) {
            hash = lines[1].replace('# Hash:', '').trim();
            startIndex = 2;
        }

        // Skip file path lines
        while (startIndex < lines.length &&
            (lines[startIndex].startsWith('---') || lines[startIndex].startsWith('+++'))) {
            startIndex++;
        }

        const hunks: any[] = [];
        let currentHunk: any = null;

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];

            // Improved hunk header detection with multiple formats
            const hunkInfo = extractHunkHeader(line);
            if (hunkInfo) {
                if (currentHunk) hunks.push(currentHunk);

                currentHunk = {
                    oldStart: hunkInfo.oldStart,
                    oldCount: hunkInfo.oldCount,
                    newStart: hunkInfo.newStart,
                    newCount: hunkInfo.newCount,
                    lines: []
                };
                continue;
            }

            // Hunk content
            if (currentHunk && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
                currentHunk.lines.push(line);
            }
        }

        // Add last hunk
        if (currentHunk) hunks.push(currentHunk);

        return {
            filePath,
            type: type as FileChangeType,
            hunks,
            newPath,
            hash
        };
    });
}

/**
 * Enhanced hunk header extractor that supports multiple formats
 */
function extractHunkHeader(line: string): { oldStart: number, oldCount: number, newStart: number, newCount: number } | null {
    // Standard format: "@@ -101,14 +140,39 @@"
    const standardMatch = line.match(/^@@ -(\d+),(\d+) \+(\d+),(\d+) @@/);
    if (standardMatch) {
        return {
            oldStart: parseInt(standardMatch[1], 10),
            oldCount: parseInt(standardMatch[2], 10),
            newStart: parseInt(standardMatch[3], 10),
            newCount: parseInt(standardMatch[4], 10)
        };
    }

    // Alternative format without counts: "@@ -101 +140 @@"
    const simplifiedMatch = line.match(/^@@ -(\d+) \+(\d+) @@/);
    if (simplifiedMatch) {
        return {
            oldStart: parseInt(simplifiedMatch[1], 10),
            oldCount: 1, // Default to 1 if not specified
            newStart: parseInt(simplifiedMatch[2], 10),
            newCount: 1  // Default to 1 if not specified
        };
    }

    // Format with spaces: "@@ -  101,14 +  140,39  @@"
    const looseSpacesMatch = line.match(/^@@\s+-\s*(\d+),(\d+)\s+\+\s*(\d+),(\d+)\s+@@/);
    if (looseSpacesMatch) {
        return {
            oldStart: parseInt(looseSpacesMatch[1], 10),
            oldCount: parseInt(looseSpacesMatch[2], 10),
            newStart: parseInt(looseSpacesMatch[3], 10),
            newCount: parseInt(looseSpacesMatch[4], 10)
        };
    }

    return null;
}

/**
 * Use diff-match-patch to apply patch to content
 */
function applyDiffPatch(
    originalContent: string,
    oldText: string,
    newText: string,
    hunk: {
        oldStart: number,
        oldCount: number,
        newStart: number,
        newCount: number,
        lines: string[]  // Les lignes complètes du hunk
    },
    logFilePath?: string
): { content: string, applied: boolean } {
    // Cas spécial: ajout sans suppression (oldText vide)
    if (!oldText && newText) {
        if (logFilePath) {
            writeLog(logFilePath, `Détecté: ajout sans suppression à la ligne ${hunk.oldStart}`, true, true)
                .catch(err => console.error('Error writing to log:', err));
        }

        // Trouver la ligne précédant l'insertion dans le contexte
        let previousLine = '';
        for (let i = 0; i < hunk.lines.length; i++) {
            const line = hunk.lines[i];
            // Si on trouve une ligne '+', chercher la ligne de contexte juste avant
            if (line.startsWith('+') && i > 0 && hunk.lines[i - 1].startsWith(' ')) {
                previousLine = hunk.lines[i - 1].substring(1);
                break;
            }
        }

        if (previousLine) {
            // Chercher la dernière occurrence de previousLine dans le contenu
            const lines = originalContent.split('\n');
            let insertPosition = -1;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].trim() === previousLine.trim()) {
                    insertPosition = i;
                }
            }

            if (insertPosition !== -1) {
                // Insérer après la ligne trouvée
                if (logFilePath) {
                    writeLog(logFilePath, `Insertion après la ligne "${previousLine}" trouvée à la position ${insertPosition + 1}`, true, true)
                        .catch(err => console.error('Error writing to log:', err));
                }

                lines.splice(insertPosition + 1, 0, newText);
                return { content: lines.join('\n'), applied: true };
            } else if (logFilePath) {
                writeLog(logFilePath, `Ligne précédente "${previousLine}" non trouvée, repli sur la position numérique (${hunk.oldStart})`, true, true)
                    .catch(err => console.error('Error writing to log:', err));
            }
        }

        // Repli sur l'insertion à la position indiquée par le diff
        const lines = originalContent.split('\n');
        if (lines.length >= hunk.oldStart) {
            lines.splice(hunk.oldStart - 1, 0, newText);
            return { content: lines.join('\n'), applied: true };
        }

        return { content: originalContent, applied: false };
    }

    // Cas standard: remplacement
    const dmp = new diff_match_patch();
    let resultContent = originalContent;
    let applied = false;

    try {
        // Find position of oldText in the original content
        const index = originalContent.indexOf(oldText);

        if (index !== -1) {
            // Simple replacement since we have exact position
            resultContent = originalContent.substring(0, index) +
                newText +
                originalContent.substring(index + oldText.length);
            applied = true;

            if (logFilePath) {
                writeLog(logFilePath, `✅ Replaced text at position ${index}`, true, true)
                    .catch(err => console.error('Error writing to log:', err));
            }
        } else {
            // Try fuzzy matching
            const match = dmp.match_main(originalContent, oldText, 0);

            if (match !== -1) {
                // Calculate similarity
                const extractedText = originalContent.substring(match, match + oldText.length);
                const similarity = calculateSimilarity(oldText, extractedText);

                if (similarity > 0.7) {
                    // Close enough match - proceed with replacement
                    resultContent = originalContent.substring(0, match) +
                        newText +
                        originalContent.substring(match + oldText.length);
                    applied = true;

                    if (logFilePath) {
                        writeLog(
                            logFilePath,
                            `✅ Used fuzzy matching to replace text at position ${match} (${Math.round(similarity * 100)}% similar)`,
                            true,
                            true
                        ).catch(err => console.error('Error writing to log:', err));
                    }
                } else if (logFilePath) {
                    writeLog(
                        logFilePath,
                        `❌ Best match at ${match} was only ${Math.round(similarity * 100)}% similar - not replacing`,
                        true,
                        true
                    ).catch(err => console.error('Error writing to log:', err));
                }
            } else if (logFilePath) {
                writeLog(logFilePath, `❌ No match found for text to replace`, true, true)
                    .catch(err => console.error('Error writing to log:', err));
            }
        }
    } catch (error) {
        if (logFilePath) {
            writeLog(
                logFilePath,
                `❌ Error applying patch: ${error}`,
                true,
                true
            ).catch(err => console.error('Error writing to log:', err));
        }
    }

    return { content: resultContent, applied };
}

/**
 * Calculate similarity between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
    const dmp = new diff_match_patch();
    const diff = dmp.diff_main(str1, str2);

    let matchedChars = 0;
    let totalChars = 0;

    diff.forEach(([op, text]) => {
        totalChars += text.length;
        if (op === 0) { // DIFF_EQUAL
            matchedChars += text.length;
        }
    });

    return totalChars > 0 ? matchedChars / totalChars : 0;
}

/**
 * Apply diff to original content with enhanced context matching
 */
function applyDiff(
    originalContent: string,
    diffSection: ReturnType<typeof parseDiff>[0],
    options: { fuzzyMatch?: boolean } = { fuzzyMatch: true },
    logFilePath?: string
): { content: string, applied: boolean } {
    let resultContent = originalContent;
    let appliedAny = false;

    if (logFilePath) {
        writeLog(
            logFilePath,
            `Using diff-match-patch for applying changes to ${diffSection.filePath}`,
            true,
            true
        ).catch(err => console.error('Error writing to log:', err));
    }

    // Process hunks in reverse to avoid line number shifting
    for (let i = diffSection.hunks.length - 1; i >= 0; i--) {
        const hunk = diffSection.hunks[i];

        try {
            // Extract deletions and additions from hunk
            const deletions: string[] = [];
            const additions: string[] = [];
            const context: string[] = [];

            hunk.lines.forEach(line => {
                if (line.startsWith('-')) {
                    deletions.push(line.substring(1));
                } else if (line.startsWith('+')) {
                    additions.push(line.substring(1));
                } else if (line.startsWith(' ')) {
                    context.push(line.substring(1));
                }
            });

            const oldText = deletions.join('\n');
            const newText = additions.join('\n');

            if (logFilePath) {
                writeLog(
                    logFilePath,
                    `Processing hunk at line ${hunk.oldStart}:\n` +
                    `Old text (${deletions.length} lines):\n${oldText}\n` +
                    `New text (${additions.length} lines):\n${newText}`,
                    true,
                    true
                ).catch(err => console.error('Error writing to log:', err));
            }

            // Appliquer le diff en passant toutes les informations nécessaires
            const result = applyDiffPatch(
                resultContent,
                oldText,
                newText,
                {
                    oldStart: hunk.oldStart,
                    oldCount: hunk.oldCount,
                    newStart: hunk.newStart,
                    newCount: hunk.newCount,
                    lines: hunk.lines  // Transmettre les lignes complètes du hunk
                },
                logFilePath
            );

            resultContent = result.content;
            if (result.applied) {
                appliedAny = true;
            }
        } catch (error) {
            if (logFilePath) {
                writeLog(
                    logFilePath,
                    `❌ Error processing hunk at line ${hunk.oldStart}: ${error}`,
                    true,
                    true
                ).catch(err => console.error('Error writing to log:', err));
            }
        }
    }

    return {
        content: resultContent,
        applied: appliedAny
    };
}

/**
 * Robust diff application for file changes
 */
async function robustDiffApplication(
    originalContent: string,
    diffContent: string,
    filePath: string,
    options: ApplyDiffOptions,
    logFilePath: string
): Promise<{ content: string, applied: boolean }> {
    try {
        await writeLog(logFilePath, `Applying diff to ${filePath}`, true, true);

        // Set fuzzyMatch option to true by default
        const enhancedOptions = {
            ...options,
            // The fuzzyMatch option will be true by default unless explicitly set to false
            fuzzyMatch: options.fuzzyMatch !== false
        };

        const parsedDiff = parseDiff(diffContent);
        let resultContent = originalContent;
        let anyChangesApplied = false;

        for (const section of parsedDiff) {
            const result = applyDiff(resultContent, section, enhancedOptions, logFilePath);

            resultContent = result.content;

            if (result.applied) {
                anyChangesApplied = true;
                await writeLog(
                    logFilePath,
                    `✅ Applied ${section.type} changes to ${filePath}`,
                    true,
                    true
                );
            } else {
                await writeLog(
                    logFilePath,
                    `❌ Failed to apply changes to ${filePath}`,
                    true,
                    true
                );
            }
        }

        return { content: resultContent, applied: anyChangesApplied };
    } catch (error) {
        await logError(
            logFilePath,
            `Diff application failed for ${filePath}: ${error}`,
            error as Error
        );
        return { content: originalContent, applied: false };
    }
}

/**
 * Process apply diff command with path normalization
 */
export async function processApplyDiff(
    config: Config,
    options: ApplyDiffOptions = {}
): Promise<ApplyDiffResult> {
    try {
        const { applydiff } = config;
        const logFilePath = path.join(applydiff.directory, applydiff.applydiff_log);
        const diffFilePath = path.join(applydiff.directory, applydiff.diff_file);

        // Ensure directories exist
        await ensureDirectoryExists(applydiff.directory);

        // Initialize log
        await writeLog(logFilePath, `--- Apply Diff Process Started (${formatTimestamp()}) ---`, false, true);

        // Always enable fuzzy matching by default
        const enhancedOptions = {
            ...options,
            fuzzyMatch: options.fuzzyMatch !== false
        };

        await writeLog(logFilePath, `Using diff-match-patch for enhanced diff handling`, true, true);
        await writeLog(logFilePath, `Options: ${JSON.stringify(enhancedOptions)}`, true, true);

        // Check if diff file exists
        if (!await fs.pathExists(diffFilePath)) {
            const message = `Diff file not found at ${diffFilePath}`;
            await logError(logFilePath, message);
            return { success: false, message, logFilePath };
        }

        // Load diff content
        const diffContent = await readFileContent(diffFilePath);
        await writeLog(logFilePath, `Loaded diff file: ${diffFilePath}`, true, true);

        // Track changed files
        const changedFiles: string[] = [];

        // Resolve root directory
        const rootDir = path.resolve(config.parsing.rootDirectory);

        // Parse diff sections
        const diffSections = parseDiff(diffContent);
        await writeLog(logFilePath, `Extracted ${diffSections.length} patch sections`, true, true);

        // Process each diff section
        for (const section of diffSections) {
            // Normaliser les chemins pour une compatibilité multi-plateformes
            const normalizedFilePath = normalizePath(section.filePath);
            const fullFilePath = path.join(rootDir, normalizedFilePath);

            if (logFilePath) {
                await writeLog(
                    logFilePath,
                    `Processing file: ${section.filePath} (normalized: ${normalizedFilePath})`,
                    true,
                    true
                );
            }

            try {
                switch (section.type) {
                    case FileChangeType.NEW:
                        // Créer le dossier parent si nécessaire
                        const newFileDir = path.dirname(fullFilePath);
                        await ensureDirectoryExists(newFileDir);

                        if (logFilePath) {
                            await writeLog(
                                logFilePath,
                                `Ensuring directory exists: ${newFileDir}`,
                                true,
                                true
                            );
                        }

                        // Extract content for new file
                        const newContent = section.hunks[0]?.lines
                            .filter(line => line.startsWith('+'))
                            .map(line => line.substring(1))
                            .join('\n') || '';

                        await writeFileContent(fullFilePath, newContent);
                        changedFiles.push(section.filePath);
                        await writeLog(logFilePath, `✅ Created new file: ${fullFilePath}`, true, true);
                        break;

                    case FileChangeType.DELETE:
                        // Delete file
                        if (await fs.pathExists(fullFilePath)) {
                            await fs.remove(fullFilePath);
                            changedFiles.push(section.filePath);
                            await writeLog(logFilePath, `✅ Deleted file: ${fullFilePath}`, true, true);
                        }
                        break;

                    case FileChangeType.RENAME:
                        if (!section.newPath) {
                            await logError(logFilePath, `No new path for rename: ${section.filePath}`);
                            continue;
                        }

                        const normalizedNewPath = normalizePath(section.newPath);
                        const newFilePath = path.join(rootDir, normalizedNewPath);

                        // Ensure destination directory exists
                        const newFileParentDir = path.dirname(newFilePath);
                        await ensureDirectoryExists(newFileParentDir);

                        if (logFilePath) {
                            await writeLog(
                                logFilePath,
                                `Ensuring directory exists for rename target: ${newFileParentDir}`,
                                true,
                                true
                            );
                        }

                        if (await fs.pathExists(fullFilePath)) {
                            // Read original content
                            const originalContent = await readFileContent(fullFilePath);

                            // Apply diff if exists
                            let renamedContent = originalContent;
                            if (section.hunks.length > 0) {
                                const result = applyDiff(originalContent, section, enhancedOptions, logFilePath);
                                renamedContent = result.content;
                            }

                            // Write to new file and remove old
                            await writeFileContent(newFilePath, renamedContent);
                            await fs.remove(fullFilePath);

                            changedFiles.push(section.filePath, section.newPath);
                            await writeLog(
                                logFilePath,
                                `✅ Renamed and potentially modified: ${fullFilePath} → ${newFilePath}`,
                                true,
                                true
                            );
                        } else if (section.hunks.length > 0) {
                            // Create new file if original doesn't exist
                            await writeFileContent(
                                newFilePath,
                                section.hunks[0].lines
                                    .filter(line => line.startsWith('+'))
                                    .map(line => line.substring(1))
                                    .join('\n')
                            );
                            changedFiles.push(section.newPath);
                            await writeLog(logFilePath, `✅ Created renamed file: ${newFilePath}`, true, true);
                        }
                        break;

                    case FileChangeType.MODIFY:
                        if (await fs.pathExists(fullFilePath)) {
                            // Read current content
                            const currentContent = await readFileContent(fullFilePath);

                            // Optional hash validation but still continue with fuzzy match
                            if (!enhancedOptions.skipHashValidation && section.hash) {
                                const currentHash = calculateHash(currentContent);
                                if (currentHash !== section.hash) {
                                    await writeLog(
                                        logFilePath,
                                        `⚠️ Hash mismatch for ${normalizedFilePath}. Expected: ${section.hash}, Got: ${currentHash}`,
                                        true,
                                        true
                                    );
                                    await writeLog(
                                        logFilePath,
                                        `Continuing with fuzzy matching despite hash mismatch`,
                                        true,
                                        true
                                    );
                                }
                            }

                            // Apply diff
                            const { content: modifiedContent, applied } = await robustDiffApplication(
                                currentContent,
                                `### ${section.filePath}\n# Hash: ${section.hash || ''}\n${section.hunks.map(hunk =>
                                    `@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@\n${hunk.lines.join('\n')}`
                                ).join('\n')}`,
                                normalizedFilePath,
                                enhancedOptions,
                                logFilePath
                            );

                            // Write modified content if changes were applied
                            if (applied && modifiedContent !== currentContent) {
                                await writeFileContent(fullFilePath, modifiedContent);
                                changedFiles.push(section.filePath);
                                await writeLog(logFilePath, `✅ Modified file: ${fullFilePath}`, true, true);
                            } else if (!applied) {
                                await writeLog(logFilePath, `❌ No changes applied to: ${fullFilePath}`, true, true);
                            }
                        } else {
                            // Create file if it doesn't exist
                            const fileDir = path.dirname(fullFilePath);
                            await ensureDirectoryExists(fileDir);

                            if (logFilePath) {
                                await writeLog(
                                    logFilePath,
                                    `Ensuring directory exists: ${fileDir}`,
                                    true,
                                    true
                                );
                            }

                            // Extract content for the file
                            const newFileContent = section.hunks.length > 0 ?
                                section.hunks[0].lines
                                    .filter(line => line.startsWith('+'))
                                    .map(line => line.substring(1))
                                    .join('\n') :
                                '';

                            await writeFileContent(fullFilePath, newFileContent);
                            changedFiles.push(section.filePath);
                            await writeLog(logFilePath, `✅ Created missing file: ${fullFilePath}`, true, true);
                        }
                        break;
                }
            } catch (error) {
                await logError(
                    logFilePath,
                    `Error processing ${normalizedFilePath}`,
                    error as Error
                );
            }
        }

        // Final logging
        const message = `Apply diff completed. ${changedFiles.length} files changed.`;
        await writeLog(logFilePath, message, true, true);
        await writeLog(logFilePath, `--- Apply Diff Process Completed (${formatTimestamp()}) ---`, true, true);

        return {
            success: true,
            message,
            logFilePath,
            changedFiles
        };
    } catch (error) {
        const errorMessage = `Apply diff process failed: ${error}`;
        console.error(errorMessage);

        try {
            const logFilePath = path.join(config.applydiff.directory, config.applydiff.applydiff_log);
            await logError(logFilePath, errorMessage, error as Error);
            await writeLog(logFilePath, `--- Apply Diff Process Failed (${formatTimestamp()}) ---`, true, true);

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

/**
 * Normalize file path for cross-platform compatibility
 */
function normalizePath(filePath: string): string {
    // Convert Windows backslashes to forward slashes
    return filePath.replace(/\\/g, '/');
}